import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  handleAuthError: vi.fn((error: unknown) => {
    if (error instanceof Error && error.message === "Não autenticado") {
      return Response.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message === "Sem permissão") {
      return Response.json({ error: error.message }, { status: 403 });
    }

    return Response.json({ error: "Erro interno" }, { status: 500 });
  }),
}));

const serviceMocks = vi.hoisted(() => ({
  broadcast: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => authMocks);
vi.mock("@/services/admin-notification.service", () => ({
  adminNotificationService: serviceMocks,
}));

import { InvalidNotificationUrlError } from "../../../../lib/push/url";
import { POST, runtime } from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/admin/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest() {
  return new Request("http://localhost/api/admin/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });
}

describe("admin notifications API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireRole.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    serviceMocks.broadcast.mockResolvedValue({
      id: "broadcast-1",
      status: "COMPLETED",
      targetCount: 2,
      inAppCount: 2,
      pushAttemptCount: 3,
      pushFailureCount: 1,
      idempotent: false,
    });
  });

  it("runs in the nodejs runtime", () => {
    expect(runtime).toBe("nodejs");
  });

  it("rejects unauthenticated requests", async () => {
    authMocks.requireRole.mockRejectedValue(new Error("Não autenticado"));

    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(401);
    expect(serviceMocks.broadcast).not.toHaveBeenCalled();
  });

  it("rejects non-admin requests", async () => {
    authMocks.requireRole.mockRejectedValue(new Error("Sem permissão"));

    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(403);
    expect(serviceMocks.broadcast).not.toHaveBeenCalled();
  });

  it("rejects invalid URL errors from the service", async () => {
    serviceMocks.broadcast.mockRejectedValue(new InvalidNotificationUrlError());

    const response = await POST(
      jsonRequest({
        idempotencyKey: "request-1",
        title: "Aviso",
        body: "Mensagem",
        linkUrl: "https://evil.example",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Link inválido" });
  });

  it("requires an idempotency key", async () => {
    const response = await POST(jsonRequest({ title: "Aviso", body: "Mensagem" }));

    expect(response.status).toBe(400);
    expect(serviceMocks.broadcast).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON requests with 400", async () => {
    const response = await POST(malformedJsonRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "JSON inválido" });
    expect(serviceMocks.broadcast).not.toHaveBeenCalled();
  });

  it("returns duplicate idempotency key results without treating them as new sends", async () => {
    serviceMocks.broadcast.mockResolvedValue({
      id: "broadcast-existing",
      status: "COMPLETED",
      targetCount: 5,
      inAppCount: 5,
      pushAttemptCount: 4,
      pushFailureCount: 0,
      idempotent: true,
    });

    const response = await POST(
      jsonRequest({ idempotencyKey: "request-2", title: "Aviso", body: "Mensagem", linkUrl: "" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "broadcast-existing",
      status: "COMPLETED",
      targetCount: 5,
      inAppCount: 5,
      pushAttemptCount: 4,
      pushFailureCount: 0,
      idempotent: true,
    });
  });

  it("sends a valid admin broadcast request", async () => {
    const response = await POST(
      jsonRequest({
        idempotencyKey: "request-3",
        title: "Aviso",
        body: "Mensagem",
        linkUrl: "/inicio",
      })
    );

    expect(response.status).toBe(200);
    expect(authMocks.requireRole).toHaveBeenCalledWith("ADMIN");
    expect(serviceMocks.broadcast).toHaveBeenCalledWith({
      createdByUserId: "admin-1",
      idempotencyKey: "request-3",
      title: "Aviso",
      body: "Mensagem",
      linkUrl: "/inicio",
    });
    await expect(response.json()).resolves.toEqual({
      id: "broadcast-1",
      status: "COMPLETED",
      targetCount: 2,
      inAppCount: 2,
      pushAttemptCount: 3,
      pushFailureCount: 1,
      idempotent: false,
    });
  });
});
