import { beforeEach, describe, expect, it, vi } from "vitest";

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
}));

const vapidMocks = vi.hoisted(() => ({
  getVapidPublicKey: vi.fn(),
  getVapidConfigStatus: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => authMocks);
vi.mock("@/repositories/push-subscription.repository", () => ({
  pushSubscriptionRepository: repositoryMocks,
}));
vi.mock("@/lib/push/vapid", () => vapidMocks);

import { DELETE, POST } from "./route";
import { GET } from "../vapid-public-key/route";

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
          endpoint: "https://push.example/device-1",
          keys: { p256dh: "p256dh-key", auth: "auth-secret" },
          expirationTime: 1772323200000,
        },
        { "user-agent": "Firefox" }
      )
    );

    expect(response.status).toBe(201);
    expect(repositoryMocks.upsertForUser).toHaveBeenCalledWith("user-1", {
      endpoint: "https://push.example/device-1",
      p256dh: "p256dh-key",
      auth: "auth-secret",
      expirationTime: new Date(1772323200000),
      userAgent: "Firefox",
    });
  });

  it("rejects malformed subscription bodies", async () => {
    const response = await POST(
      jsonRequest("POST", {
        endpoint: "https://push.example/device-1",
        keys: { p256dh: "p256dh-key" },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid push subscription" });
    expect(repositoryMocks.upsertForUser).not.toHaveBeenCalled();
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
