import { beforeEach, describe, expect, it, vi } from "vitest";
import { createECDH } from "node:crypto";

const authMocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  handleAuthError: vi.fn((error: unknown) => {
    if (error instanceof Error && error.message === "Não autenticado") {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({ error: "Erro interno" }, { status: 500 });
  }),
}));

const repositoryMocks = vi.hoisted(() => ({
  upsertForUser: vi.fn(),
  deleteForUser: vi.fn(),
  hasActiveEndpoint: vi.fn(),
}));

const vapidMocks = vi.hoisted(() => ({
  getVapidPublicKey: vi.fn(),
  getVapidConfigStatus: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => authMocks);
vi.mock("@/repositories/push-subscription.repository", () => ({
  PushSubscriptionConflictError: class PushSubscriptionConflictError extends Error {},
  pushSubscriptionRepository: repositoryMocks,
}));
vi.mock("@/lib/push/vapid", () => vapidMocks);

import { DELETE, GET as getSubscription, POST } from "./route";
import { GET } from "../vapid-public-key/route";

const endpoint = "https://fcm.googleapis.com/wp/device-1";
const keys = {
  p256dh: createECDH("prime256v1").generateKeys().toString("base64url"),
  auth: Buffer.alloc(16).toString("base64url"),
};

function jsonRequest(method: string, body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/push/subscriptions", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("push subscription API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAuth.mockResolvedValue({ id: "user-1" });
    repositoryMocks.upsertForUser.mockResolvedValue({ id: "subscription-1" });
    repositoryMocks.deleteForUser.mockResolvedValue({ count: 1 });
    vapidMocks.getVapidPublicKey.mockReturnValue("public-key");
    vapidMocks.getVapidConfigStatus.mockReturnValue({ enabled: true, missing: [], message: null });
  });

  it("rejects unauthenticated subscription requests", async () => {
    authMocks.requireAuth.mockRejectedValue(new Error("Não autenticado"));

    const response = await POST(jsonRequest("POST", {}));

    expect(response.status).toBe(401);
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
  });

  it("returns only the current user's subscription status", async () => {
    repositoryMocks.hasActiveEndpoint.mockResolvedValue(false);
    const response = await getSubscription(new Request("http://localhost/api/push/subscriptions", {
      headers: { "X-Crown-Push-Endpoint": endpoint },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: false });
    expect(repositoryMocks.hasActiveEndpoint).toHaveBeenCalledWith("user-1", endpoint);
  });

  it("requires authentication before checking subscription status", async () => {
    authMocks.requireAuth.mockRejectedValue(new Error("Não autenticado"));
    const response = await getSubscription(new Request("http://localhost/api/push/subscriptions", {
      headers: { "X-Crown-Push-Endpoint": endpoint },
    }));

    expect(response.status).toBe(401);
    expect(repositoryMocks.hasActiveEndpoint).not.toHaveBeenCalled();
  });

  it("rejects an arbitrary HTTPS destination before saving a subscription", async () => {
    const response = await POST(jsonRequest("POST", {
      endpoint: "https://push.example/device-1",
      keys,
    }));

    expect(response.status).toBe(400);
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
  });

  it("rejects endpoints beyond the database column length", async () => {
    const longEndpoint = `https://fcm.googleapis.com/wp/${"x".repeat(2048)}`;
    const registered = await POST(jsonRequest("POST", { endpoint: longEndpoint, keys }));
    const removed = await DELETE(jsonRequest("DELETE", { endpoint: longEndpoint }));

    expect(registered.status).toBe(400);
    expect(removed.status).toBe(400);
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
    expect(repositoryMocks.deleteForUser).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated delete requests without deleting a subscription", async () => {
    authMocks.requireAuth.mockRejectedValue(new Error("Não autenticado"));

    const response = await DELETE(
      jsonRequest("DELETE", { endpoint: "https://push.example/device-1" })
    );

    expect(response.status).toBe(401);
    expect(repositoryMocks.deleteForUser).not.toHaveBeenCalled();
  });

  it("delegates explicit authenticated subscribe requests to repository-owned transfer validation", async () => {
    const response = await POST(
      jsonRequest(
        "POST",
        {
          endpoint,
          keys,
          expirationTime: 1772323200000,
        },
        { "user-agent": "Firefox" }
      )
    );

    expect(response.status).toBe(201);
    expect(repositoryMocks.upsertForUser).toHaveBeenCalledWith("user-1", {
      endpoint,
      ...keys,
      expirationTime: new Date(1772323200000),
      userAgent: "Firefox",
    });
  });

  it("rejects malformed subscription bodies", async () => {
    const response = await POST(
      jsonRequest("POST", {
        endpoint,
        keys: { p256dh: "p256dh-key" },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid push subscription" });
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
  });

  it.each([
    "https://updates.push.services.mozilla.com/wpush/v2/device-1",
    "https://web.push.apple.com/device-1",
    "https://wns2-by3p.notify.windows.com/?channel=device-1",
  ])("accepts a browser subscription from %s", async (providerEndpoint) => {
    const response = await POST(jsonRequest("POST", { endpoint: providerEndpoint, keys }));
    expect(response.status).toBe(201);
  });

  it("rejects a subscription operation if the authenticated user changed", async () => {
    const body = { endpoint, keys, expectedUserId: "user-previous" };
    const registered = await POST(jsonRequest("POST", body));
    const removed = await DELETE(jsonRequest("DELETE", body));

    expect(registered.status).toBe(409);
    expect(removed.status).toBe(409);
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
    expect(repositoryMocks.deleteForUser).not.toHaveBeenCalled();
  });

  it("rejects non-HTTPS push endpoints", async () => {
    const response = await POST(
      jsonRequest("POST", {
        endpoint: "http://push.example/device-1",
        keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid push subscription" });
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
  });

  it("deletes only the current user's endpoint", async () => {
    const response = await DELETE(
      jsonRequest("DELETE", { endpoint: "https://push.example/device-1" })
    );

    expect(response.status).toBe(200);
    expect(repositoryMocks.deleteForUser).toHaveBeenCalledWith(
      "user-1",
      "https://push.example/device-1"
    );
  });

  it("requires auth before returning the VAPID public key", async () => {
    authMocks.requireAuth.mockRejectedValue(new Error("Não autenticado"));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(vapidMocks.getVapidPublicKey).not.toHaveBeenCalled();
  });

  it("returns a disabled response when the VAPID public key is missing", async () => {
    vapidMocks.getVapidPublicKey.mockReturnValue(null);
    vapidMocks.getVapidConfigStatus.mockReturnValue({
      enabled: false,
      missing: ["VAPID_PUBLIC_KEY"],
      message: "Web Push is disabled: missing VAPID_PUBLIC_KEY",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: false,
      publicKey: null,
      message: "Web Push is disabled: missing VAPID_PUBLIC_KEY",
      missing: ["VAPID_PUBLIC_KEY"],
    });
  });
});
