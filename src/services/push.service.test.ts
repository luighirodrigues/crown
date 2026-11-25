import { beforeEach, describe, expect, it, vi } from "vitest";
import { createECDH } from "node:crypto";

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  getVapidConfig: vi.fn(),
  findByUser: vi.fn(),
  findByUsers: vi.fn(),
  deleteByEndpoints: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: {
    sendNotification: mocks.sendNotification,
    setVapidDetails: mocks.setVapidDetails,
  },
}));

vi.mock("../lib/push/vapid", () => ({
  getVapidConfig: mocks.getVapidConfig,
}));

vi.mock("../repositories/push-subscription.repository", () => ({
  pushSubscriptionRepository: {
    findByUser: mocks.findByUser,
    findByUsers: mocks.findByUsers,
    deleteByEndpoints: mocks.deleteByEndpoints,
  },
}));

import { sendToUser, sendToUsers } from "./push.service";

const vapidConfig = {
  publicKey: "public-key",
  privateKey: "private-key",
  subject: "mailto:admin@crown.test",
};
const publicKey = createECDH("prime256v1").generateKeys().toString("base64url");
const authSecret = Buffer.alloc(16).toString("base64url");
const pushOrigin = "https://fcm.googleapis.com/wp";

function subscription(overrides: Partial<{ userId: string; endpoint: string; p256dh: string; auth: string }> = {}) {
  return {
    id: `subscription-${overrides.endpoint ?? "1"}`,
    userId: overrides.userId ?? "user-1",
    endpoint: overrides.endpoint ?? `${pushOrigin}/subscription-1`,
    p256dh: overrides.p256dh ?? publicKey,
    auth: overrides.auth ?? authSecret,
    userAgent: null,
    expirationTime: null,
    lastSeenAt: new Date("2026-05-09T00:00:00.000Z"),
    createdAt: new Date("2026-05-09T00:00:00.000Z"),
    updatedAt: new Date("2026-05-09T00:00:00.000Z"),
  };
}

describe("push service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.crown.test";
    mocks.getVapidConfig.mockReturnValue(vapidConfig);
    mocks.sendNotification.mockResolvedValue(undefined);
    mocks.deleteByEndpoints.mockResolvedValue({ count: 0 });
  });

  it("sends a normalized payload to every subscription for one user", async () => {
    mocks.findByUser.mockResolvedValue([subscription()]);

    const result = await sendToUser("user-1", {
      title: "Novo comentario",
      body: "Alguem comentou no seu post",
      url: "https://app.crown.test/posts/1?tab=comments",
      notificationId: "notification-1",
    });

    expect(mocks.setVapidDetails).toHaveBeenCalledWith(
      vapidConfig.subject,
      vapidConfig.publicKey,
      vapidConfig.privateKey
    );
    expect(mocks.findByUser).toHaveBeenCalledWith("user-1");
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: `${pushOrigin}/subscription-1`,
        keys: {
          p256dh: publicKey,
          auth: authSecret,
        },
      },
      JSON.stringify({
        title: "Novo comentario",
        body: "Alguem comentou no seu post",
        url: "/posts/1?tab=comments",
        notificationId: "notification-1",
      }),
      { timeout: 5000 }
    );
    expect(result).toEqual({ attempted: 1, sent: 1, failed: 0, removed: 0 });
  });

  it("does not throw or query subscriptions when VAPID is disabled", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.getVapidConfig.mockReturnValue(null);

    const result = await sendToUser("user-1", { title: "Titulo", body: "Mensagem" });

    expect(result).toEqual({ attempted: 0, sent: 0, failed: 0, removed: 0 });
    expect(mocks.findByUser).not.toHaveBeenCalled();
    expect(mocks.sendNotification).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("Web Push delivery disabled: VAPID config is missing or invalid");
    warn.mockRestore();
  });

  it("removes subscriptions after permanent 404 or 410 delivery failures", async () => {
    mocks.findByUser.mockResolvedValue([
      subscription({ endpoint: `${pushOrigin}/gone` }),
      subscription({ endpoint: `${pushOrigin}/not-found` }),
    ]);
    mocks.sendNotification
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 404 });
    mocks.deleteByEndpoints.mockResolvedValue({ count: 2 });

    const result = await sendToUser("user-1", { title: "Titulo", body: "Mensagem" });

    expect(mocks.deleteByEndpoints).toHaveBeenCalledWith([
      `${pushOrigin}/gone`,
      `${pushOrigin}/not-found`,
    ]);
    expect(result).toEqual({ attempted: 2, sent: 0, failed: 2, removed: 2 });
  });

  it("filters invalid stored subscriptions before making an outbound request", async () => {
    const untrusted = subscription({ endpoint: "https://push.example/invalid" });
    const invalidKeys = subscription({ p256dh: "invalid-key" });
    mocks.findByUser.mockResolvedValue([untrusted, invalidKeys]);
    mocks.deleteByEndpoints.mockResolvedValue({ count: 2 });

    const result = await sendToUser("user-1", { title: "Titulo", body: "Mensagem" });

    expect(mocks.sendNotification).not.toHaveBeenCalled();
    expect(mocks.deleteByEndpoints).toHaveBeenCalledWith([untrusted.endpoint, invalidKeys.endpoint]);
    expect(result).toEqual({ attempted: 0, sent: 0, failed: 0, removed: 2 });
  });

  it("keeps subscriptions after transient delivery failures", async () => {
    const error = new Error("network timeout");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.findByUser.mockResolvedValue([subscription()]);
    mocks.sendNotification.mockRejectedValueOnce(error);

    const result = await sendToUser("user-1", { title: "Titulo", body: "Mensagem" });

    expect(mocks.deleteByEndpoints).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("Web Push delivery failed", error);
    expect(result).toEqual({ attempted: 1, sent: 0, failed: 1, removed: 0 });
    errorSpy.mockRestore();
  });

  it("sends to multiple users with bounded concurrency and aggregated counts", async () => {
    const subscriptions = Array.from({ length: 12 }, (_, index) =>
      subscription({
        userId: index % 2 === 0 ? "user-1" : "user-2",
        endpoint: `${pushOrigin}/subscription-${index}`,
      })
    );
    let inFlight = 0;
    let maxInFlight = 0;

    mocks.findByUsers.mockResolvedValue(subscriptions);
    mocks.sendNotification.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
    });

    const result = await sendToUsers(["user-1", "user-2"], { title: "Titulo", body: "Mensagem" });

    expect(mocks.findByUsers).toHaveBeenCalledWith(["user-1", "user-2"]);
    expect(mocks.sendNotification).toHaveBeenCalledTimes(12);
    expect(maxInFlight).toBeLessThanOrEqual(10);
    expect(result).toEqual({ attempted: 12, sent: 12, failed: 0, removed: 0 });
  });
});
