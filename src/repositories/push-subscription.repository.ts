import { prisma } from "@/lib/prisma";

type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  expirationTime?: Date | null;
};

export const pushSubscriptionRepository = {
  async upsertForUser(userId: string, data: PushSubscriptionInput) {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: data.endpoint },
      select: { userId: true, p256dh: true, auth: true },
    });

    if (
      existing &&
      existing.userId !== userId &&
      (existing.p256dh !== data.p256dh || existing.auth !== data.auth)
    ) {
      throw new Error("Push subscription endpoint is already registered to another user");
    }

    return prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        userId,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
        expirationTime: data.expirationTime ?? null,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
        expirationTime: data.expirationTime ?? null,
      },
    });
  },

  deleteForUser(userId: string, endpoint: string) {
    return prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  },

  findByUser(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
    });
  },

  findByUsers(userIds: string[]) {
    return prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      orderBy: { lastSeenAt: "desc" },
    });
  },

  deleteByEndpoints(endpoints: string[]) {
    if (endpoints.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: endpoints } },
    });
  },
};
