import { notificationRepository } from "@/repositories/notification.repository";
import { prisma } from "@/lib/prisma";
import { sendToUser, sendToUsers, type PushPayload } from "./push.service";

const DEFAULT_NOTIFICATION_URL = "/inicio";
const COMMUNITY_NOTIFICATION_URL = "/comunidade";

function logPushFailure(error: unknown) {
  console.error("Notification push delivery failed", error);
}

async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    await sendToUser(userId, payload);
  } catch (error) {
    logPushFailure(error);
  }
}

async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  try {
    await sendToUsers(userIds, payload);
  } catch (error) {
    logPushFailure(error);
  }
}

/**
 * Automatic notification generator.
 * Creates in-app notifications when events occur in the system.
 */
export const notificationTriggerService = {
  /** Notify post author when someone likes their post */
  async onPostLiked(postAuthorId: string, likerName: string, postTitle: string) {
    // Don't notify self
    return notificationRepository.create({
      userId: postAuthorId,
      type: "LIKE",
      title: "Nova curtida",
      body: `${likerName} curtiu seu post "${postTitle}"`,
    });
  },

  /** Notify post author when someone comments on their post */
  async onPostCommented(postAuthorId: string, commenterName: string, postTitle: string) {
    const title = "Novo comentário";
    const body = `${commenterName} comentou no seu post "${postTitle}"`;
    const notification = await notificationRepository.create({
      userId: postAuthorId,
      type: "COMMENT",
      title,
      body,
      linkUrl: COMMUNITY_NOTIFICATION_URL,
    });

    await sendPushToUser(postAuthorId, {
      title,
      body: "Você recebeu um comentário em uma publicação.",
      url: COMMUNITY_NOTIFICATION_URL,
      notificationId: notification.id,
    });

    return notification;
  },

  /** Notify parent comment author when someone replies */
  async onCommentReplied(parentAuthorId: string, replierName: string, postTitle: string) {
    const title = "Nova resposta";
    const body = `${replierName} respondeu seu comentário em "${postTitle}"`;
    const notification = await notificationRepository.create({
      userId: parentAuthorId,
      type: "REPLY",
      title,
      body,
      linkUrl: COMMUNITY_NOTIFICATION_URL,
    });

    await sendPushToUser(parentAuthorId, {
      title,
      body: "Você recebeu uma resposta a um comentário.",
      url: COMMUNITY_NOTIFICATION_URL,
      notificationId: notification.id,
    });

    return notification;
  },

  /** Notify user about approval/rejection of their item */
  async onApprovalStatusChanged(
    userId: string,
    itemType: string, // "check-in" or "missão"
    status: "APPROVED" | "REJECTED",
    reviewNote?: string
  ) {
    const isApproved = status === "APPROVED";
    const title = isApproved
      ? `${itemType} aprovado(a)`
      : `${itemType} reprovado(a)`;
    const pushBody = isApproved
      ? `Seu ${itemType} foi aprovado! Tributos e presenças foram contabilizados.`
      : `Seu ${itemType} foi reprovado.`;
    const body = !isApproved && reviewNote ? `${pushBody} Motivo: ${reviewNote}` : pushBody;
    const linkUrl = itemType.toLowerCase() === "check-in" ? "/rituais" : DEFAULT_NOTIFICATION_URL;
    const notification = await notificationRepository.create({
      userId,
      type: "APPROVAL",
      title,
      body,
      linkUrl,
    });

    await sendPushToUser(userId, {
      title,
      body: pushBody,
      url: linkUrl,
      notificationId: notification.id,
    });

    return notification;
  },

  /** Notify all active users about a new event */
  async onEventCreated(eventTitle: string, eventDatetime: string) {
    void eventDatetime;

    const users = await prisma.user.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      select: { id: true },
    });

    const title = "Novo evento";
    const body = `"${eventTitle}" foi adicionado à agenda.`;
    const notifications = users.map((u) => ({
      userId: u.id,
      type: "EVENT" as const,
      title,
      body,
      linkUrl: DEFAULT_NOTIFICATION_URL,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      await sendPushToUsers(
        users.map((u) => u.id),
        {
          title,
          body,
          url: DEFAULT_NOTIFICATION_URL,
        }
      );
    }
  },

  /** System notification (welcome, updates, etc.) */
  async sendSystem(userId: string, title: string, body: string) {
    return notificationRepository.create({
      userId,
      type: "SYSTEM",
      title,
      body,
    });
  },
};
