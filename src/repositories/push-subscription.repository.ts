import { prisma } from "@/lib/prisma";

type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  expirationTime?: Date | null;
};

export class PushSubscriptionConflictError extends Error {
  constructor() {
    super("Push subscription endpoint is already registered to another user");
    this.name = "PushSubscriptionConflictError";
  }
}

export const pushSubscriptionRepository = {
  async upsertForUser(userId: string, data: PushSubscriptionInput) {
    const values = {
      userId,
      p256dh: data.p256dh,
      auth: data.auth,
      userAgent: data.userAgent ?? null,
      expirationTime: data.expirationTime ?? null,
      lastSeenAt: new Date(),
    };
    const updateOwnedOrMatching = () => prisma.pushSubscription.updateMany({
      where: {
        endpoint: data.endpoint,
        OR: [{ userId }, { p256dh: data.p256dh, auth: data.auth }],
      },
      data: values,
    });

    if ((await updateOwnedOrMatching()).count > 0) {
      return;
    }

    try {
      await prisma.pushSubscription.create({ data: { ...values, endpoint: data.endpoint } });
    } catch (error) {
      if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
        throw error;
      }

      if ((await updateOwnedOrMatching()).count === 0) {
        throw new PushSubscriptionConflictError();
      }
    }
  },

  async hasActiveEndpoint(userId: string, endpoint: string) {
    const subscription = await prisma.pushSubscription.findUnique({
      where: {
        endpoint,
        userId,
        OR: [{ expirationTime: null }, { expirationTime: { gt: new Date() } }],
      },
      select: { id: true },
    });
    return subscription !== null;
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
