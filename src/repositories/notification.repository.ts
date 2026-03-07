import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  findByUser(userId: string, opts: { take?: number; unreadOnly?: boolean } = {}) {
    const { take = 50, unreadOnly = false } = opts;
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  },

  markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  create(data: {
    userId: string;
    type: "LIKE" | "COMMENT" | "REPLY" | "APPROVAL" | "EVENT" | "SYSTEM";
    title: string;
    body: string;
  }) {
    return prisma.notification.create({ data });
  },
};
