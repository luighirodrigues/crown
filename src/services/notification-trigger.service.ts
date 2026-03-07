import { notificationRepository } from "@/repositories/notification.repository";
import { prisma } from "@/lib/prisma";

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
    return notificationRepository.create({
      userId: postAuthorId,
      type: "COMMENT",
      title: "Novo comentário",
      body: `${commenterName} comentou no seu post "${postTitle}"`,
    });
  },

  /** Notify parent comment author when someone replies */
  async onCommentReplied(parentAuthorId: string, replierName: string, postTitle: string) {
    return notificationRepository.create({
      userId: parentAuthorId,
      type: "REPLY",
      title: "Nova resposta",
      body: `${replierName} respondeu seu comentário em "${postTitle}"`,
    });
  },

  /** Notify user about approval/rejection of their item */
  async onApprovalStatusChanged(
    userId: string,
    itemType: string, // "check-in" or "missão"
    status: "APPROVED" | "REJECTED",
    reviewNote?: string
  ) {
    const isApproved = status === "APPROVED";
    return notificationRepository.create({
      userId,
      type: "APPROVAL",
      title: isApproved
        ? `${itemType} aprovado(a)`
        : `${itemType} reprovado(a)`,
      body: isApproved
        ? `Seu ${itemType} foi aprovado! Tributos e presenças foram contabilizados.`
        : `Seu ${itemType} foi reprovado.${reviewNote ? ` Motivo: ${reviewNote}` : ""}`,
    });
  },

  /** Notify all active users about a new event */
  async onEventCreated(eventTitle: string, eventDatetime: string) {
    const users = await prisma.user.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      select: { id: true },
    });

    const notifications = users.map((u) => ({
      userId: u.id,
      type: "EVENT" as const,
      title: "Novo evento",
      body: `"${eventTitle}" foi adicionado à agenda.`,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
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
