import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pushSubscription: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { pushSubscriptionRepository } from "./push-subscription.repository";

const pushSubscription = vi.mocked(prisma.pushSubscription);
const subscriptionRecord = {
  id: "subscription-1",
  userId: "user-1",
  endpoint: "https://push.example/subscription",
  p256dh: "p256dh-key",
  auth: "auth-secret",
  userAgent: "Firefox",
  expirationTime: new Date("2026-06-01T00:00:00.000Z"),
  lastSeenAt: new Date("2026-05-09T00:00:00.000Z"),
  createdAt: new Date("2026-05-09T00:00:00.000Z"),
  updatedAt: new Date("2026-05-09T00:00:00.000Z"),
};

describe("pushSubscriptionRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("upserts a subscription by endpoint for the same user", async () => {
    pushSubscription.updateMany.mockResolvedValue({ count: 1 });

    await pushSubscriptionRepository.upsertForUser("user-1", {
      endpoint: "https://push.example/subscription",
      p256dh: "p256dh-key",
      auth: "auth-secret",
      userAgent: "Firefox",
      expirationTime: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(pushSubscription.updateMany).toHaveBeenCalledWith({
      where: {
        endpoint: "https://push.example/subscription",
        OR: [{ userId: "user-1" }, { p256dh: "p256dh-key", auth: "auth-secret" }],
      },
      data: {
        userId: "user-1",
        p256dh: "p256dh-key",
        auth: "auth-secret",
        userAgent: "Firefox",
        expirationTime: new Date("2026-06-01T00:00:00.000Z"),
        lastSeenAt: expect.any(Date),
      },
    });
    expect(pushSubscription.create).not.toHaveBeenCalled();
  });

  it("allows transferring an endpoint to another user when submitted keys match", async () => {
    pushSubscription.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    pushSubscription.create.mockRejectedValue({ code: "P2002" });

    await pushSubscriptionRepository.upsertForUser("user-current", {
      endpoint: "https://push.example/subscription",
      p256dh: "p256dh-key",
      auth: "auth-secret",
    });

    expect(pushSubscription.updateMany).toHaveBeenCalledTimes(2);
    expect(pushSubscription.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: {
        endpoint: "https://push.example/subscription",
        OR: [{ userId: "user-current" }, { p256dh: "p256dh-key", auth: "auth-secret" }],
      },
      data: expect.objectContaining({ userId: "user-current" }),
    }));
  });

  it("rejects transferring an endpoint to another user when submitted keys differ", async () => {
    pushSubscription.updateMany.mockResolvedValue({ count: 0 });
    pushSubscription.create.mockRejectedValue({ code: "P2002" });

    await expect(
      pushSubscriptionRepository.upsertForUser("user-current", {
        endpoint: "https://push.example/subscription",
        p256dh: "new-p256dh-key",
        auth: "new-auth-secret",
      })
    ).rejects.toThrow("Push subscription endpoint is already registered to another user");

    expect(pushSubscription.updateMany).toHaveBeenCalledTimes(2);
  });

  it("creates a new endpoint when no existing row can be updated", async () => {
    pushSubscription.updateMany.mockResolvedValue({ count: 0 });
    pushSubscription.create.mockResolvedValue(subscriptionRecord);

    await pushSubscriptionRepository.upsertForUser("user-1", subscriptionRecord);

    expect(pushSubscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ endpoint: subscriptionRecord.endpoint, userId: "user-1" }),
    });
  });

  it("checks status for the current user and ignores expired subscriptions", async () => {
    pushSubscription.findUnique.mockResolvedValue(null);

    await expect(pushSubscriptionRepository.hasActiveEndpoint("user-1", subscriptionRecord.endpoint)).resolves.toBe(false);
    expect(pushSubscription.findUnique).toHaveBeenCalledWith({
      where: {
        endpoint: subscriptionRecord.endpoint,
        userId: "user-1",
        OR: [{ expirationTime: null }, { expirationTime: { gt: expect.any(Date) } }],
      },
      select: { id: true },
    });
  });

  it("deletes only the subscription matching both endpoint and user", async () => {
    pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

    await pushSubscriptionRepository.deleteForUser("user-1", "https://push.example/subscription");

    expect(pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        endpoint: "https://push.example/subscription",
      },
    });
  });

  it("finds subscriptions for one user by most recent activity", async () => {
    pushSubscription.findMany.mockResolvedValue([]);

    await pushSubscriptionRepository.findByUser("user-1");

    expect(pushSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { lastSeenAt: "desc" },
    });
  });

  it("finds subscriptions for multiple users", async () => {
    pushSubscription.findMany.mockResolvedValue([]);

    await pushSubscriptionRepository.findByUsers(["user-1", "user-2"]);

    expect(pushSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: { in: ["user-1", "user-2"] } },
      orderBy: { lastSeenAt: "desc" },
    });
  });

  it("deletes invalid subscriptions by endpoint", async () => {
    pushSubscription.deleteMany.mockResolvedValue({ count: 2 });

    await pushSubscriptionRepository.deleteByEndpoints(["endpoint-1", "endpoint-2"]);

    expect(pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: { in: ["endpoint-1", "endpoint-2"] } },
    });
  });

  it("does not call Prisma when deleting an empty endpoint list", async () => {
    await expect(pushSubscriptionRepository.deleteByEndpoints([])).resolves.toEqual({ count: 0 });

    expect(pushSubscription.deleteMany).not.toHaveBeenCalled();
  });
});
