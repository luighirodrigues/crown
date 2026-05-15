import { notificationRepository } from "@/repositories/notification.repository";
import { prisma } from "@/lib/prisma";
import { sendToUser, sendToUsers, type PushPayload } from "./push.service";

const DEFAULT_NOTIFICATION_URL = "/inicio";

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
      linkUrl: DEFAULT_NOTIFICATION_URL,
    });

    await sendPushToUser(postAuthorId, {
      title,
      body,
      url: DEFAULT_NOTIFICATION_URL,
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
      linkUrl: DEFAULT_NOTIFICATION_URL,
    });

    await sendPushToUser(parentAuthorId, {
      title,
      body,
      url: DEFAULT_NOTIFICATION_URL,
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
    const body = isApproved
      ? `Seu ${itemType} foi aprovado! Tributos e presenças foram contabilizados.`
      : `Seu ${itemType} foi reprovado.${reviewNote ? ` Motivo: ${reviewNote}` : ""}`;
    const notification = await notificationRepository.create({
      userId,
      type: "APPROVAL",
      title,
      body,
      linkUrl: DEFAULT_NOTIFICATION_URL,
    });

    await sendPushToUser(userId, {
      title,
      body,
      url: DEFAULT_NOTIFICATION_URL,
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
