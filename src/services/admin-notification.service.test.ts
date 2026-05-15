import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  broadcastCreate: vi.fn(),
  broadcastFindUnique: vi.fn(),
  broadcastUpdate: vi.fn(),
  transaction: vi.fn(),
  userFindMany: vi.fn(),
  notificationCreateMany: vi.fn(),
  sendToUsers: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminNotificationBroadcast: {
      create: mocks.broadcastCreate,
      findUnique: mocks.broadcastFindUnique,
      update: mocks.broadcastUpdate,
    },
    $transaction: mocks.transaction,
    user: {
      findMany: mocks.userFindMany,
    },
    notification: {
      createMany: mocks.notificationCreateMany,
    },
  },
}));

vi.mock("@/repositories/notification.repository", () => ({
  notificationRepository: {
    createMany: mocks.notificationCreateMany,
  },
}));

vi.mock("./push.service", () => ({
  sendToUsers: mocks.sendToUsers,
}));

import { InvalidNotificationUrlError } from "../lib/push/url";
import { adminNotificationService } from "./admin-notification.service";

describe("admin notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_URL = "https://crown.local";
    mocks.broadcastFindUnique.mockResolvedValue(null);
    mocks.broadcastCreate.mockResolvedValue({ id: "broadcast-1" });
    mocks.broadcastUpdate.mockImplementation(async ({ data }) => ({ id: "broadcast-1", ...data }));
    mocks.transaction.mockImplementation(async (callback) => callback({
      adminNotificationBroadcast: { update: mocks.broadcastUpdate },
      notification: { createMany: mocks.notificationCreateMany },
    }));
    mocks.userFindMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
    mocks.notificationCreateMany.mockResolvedValue({ count: 2 });
    mocks.sendToUsers.mockResolvedValue({ attempted: 3, sent: 2, failed: 1, removed: 0 });
  });

  it("targets active users, atomically creates in-app notifications with audit counts, and records partial push failures", async () => {
    const result = await adminNotificationService.broadcast({
      createdByUserId: "admin-1",
      idempotencyKey: "request-1",
      title: "Aviso importante",
      body: "Mensagem para todas as integrantes",
      linkUrl: "https://crown.local/admin/events?tab=next#top",
    });

    expect(mocks.broadcastFindUnique).toHaveBeenCalledWith({ where: { idempotencyKey: "request-1" } });
    expect(mocks.broadcastCreate).toHaveBeenCalledWith({
      data: {
        createdByUserId: "admin-1",
        idempotencyKey: "request-1",
        title: "Aviso importante",
        body: "Mensagem para todas as integrantes",
        linkUrl: "/admin/events?tab=next#top",
        status: "PROCESSING",
      },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { subscriptionStatus: "ACTIVE" },
      select: { id: true },
    });
    expect(mocks.notificationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          type: "SYSTEM",
          title: "Aviso importante",
          body: "Mensagem para todas as integrantes",
          linkUrl: "/admin/events?tab=next#top",
        },
        {
          userId: "user-2",
          type: "SYSTEM",
          title: "Aviso importante",
          body: "Mensagem para todas as integrantes",
          linkUrl: "/admin/events?tab=next#top",
        },
      ],
    });
    expect(mocks.sendToUsers).toHaveBeenCalledWith(["user-1", "user-2"], {
      title: "Aviso importante",
      body: "Mensagem para todas as integrantes",
      url: "/admin/events?tab=next#top",
    });
    expect(mocks.broadcastUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "broadcast-1" },
      data: {
        status: "PUSH_PENDING",
        targetCount: 2,
        inAppCount: 2,
      },
    });
    expect(mocks.broadcastUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "broadcast-1" },
      data: {
        status: "COMPLETED_WITH_PUSH_ERRORS",
        pushAttemptCount: 3,
        pushFailureCount: 1,
      },
    });
    expect(result).toEqual({
      id: "broadcast-1",
      status: "COMPLETED_WITH_PUSH_ERRORS",
      targetCount: 2,
      inAppCount: 2,
      pushAttemptCount: 3,
      pushFailureCount: 1,
      idempotent: false,
    });
  });

  it("stores null linkUrl for empty links while push falls back safely", async () => {
    await adminNotificationService.broadcast({
      createdByUserId: "admin-1",
      idempotencyKey: "request-2",
      title: "Sem link",
      body: "Mensagem sem destino especifico",
      linkUrl: "   ",
    });

    expect(mocks.broadcastCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ linkUrl: null }) })
    );
    expect(mocks.notificationCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ linkUrl: null })]),
      })
    );
    expect(mocks.sendToUsers).toHaveBeenCalledWith(["user-1", "user-2"], {
      title: "Sem link",
      body: "Mensagem sem destino especifico",
      url: null,
    });
  });

  it("completes the broadcast when push delivery rejects after in-app notifications", async () => {
    const error = new Error("push unavailable");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.sendToUsers.mockRejectedValue(error);

    await expect(
      adminNotificationService.broadcast({
        createdByUserId: "admin-1",
        idempotencyKey: "request-push-error",
        title: "Aviso com push indisponivel",
        body: "Mensagem ainda deve aparecer no app",
        linkUrl: "/inicio",
      })
    ).resolves.toEqual({
      id: "broadcast-1",
      status: "COMPLETED_WITH_PUSH_ERRORS",
      targetCount: 2,
      inAppCount: 2,
      pushAttemptCount: 0,
      pushFailureCount: 2,
      idempotent: false,
    });

    expect(mocks.notificationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          type: "SYSTEM",
          title: "Aviso com push indisponivel",
          body: "Mensagem ainda deve aparecer no app",
          linkUrl: "/inicio",
        },
        {
          userId: "user-2",
          type: "SYSTEM",
          title: "Aviso com push indisponivel",
          body: "Mensagem ainda deve aparecer no app",
          linkUrl: "/inicio",
        },
      ],
    });
    expect(mocks.broadcastUpdate).toHaveBeenCalledWith({
      where: { id: "broadcast-1" },
      data: {
        status: "PUSH_PENDING",
        targetCount: 2,
        inAppCount: 2,
      },
    });
    expect(mocks.broadcastUpdate).toHaveBeenCalledWith({
      where: { id: "broadcast-1" },
      data: {
        status: "COMPLETED_WITH_PUSH_ERRORS",
        pushAttemptCount: 0,
        pushFailureCount: 2,
      },
    });
    expect(errorSpy).toHaveBeenCalledWith("Admin notification push delivery failed", error);
    errorSpy.mockRestore();
  });

  it("does not send push and marks the audit failed when atomic in-app creation fails", async () => {
    const error = new Error("createMany failed");
    mocks.transaction.mockRejectedValue(error);

    await expect(
      adminNotificationService.broadcast({
        createdByUserId: "admin-1",
        idempotencyKey: "request-in-app-error",
        title: "Aviso com erro",
        body: "Mensagem",
        linkUrl: "/inicio",
      })
    ).rejects.toThrow("createMany failed");

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.sendToUsers).not.toHaveBeenCalled();
    expect(mocks.broadcastUpdate).toHaveBeenCalledWith({
      where: { id: "broadcast-1" },
      data: { status: "FAILED" },
    });
  });

  it("does not mark failed when final audit update fails after push delivery", async () => {
    const error = new Error("final update failed");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.sendToUsers.mockResolvedValue({ attempted: 2, sent: 2, failed: 0, removed: 0 });
    mocks.broadcastUpdate
      .mockResolvedValueOnce({
        id: "broadcast-1",
        status: "PUSH_PENDING",
        targetCount: 2,
        inAppCount: 2,
        pushAttemptCount: 0,
        pushFailureCount: 0,
      })
      .mockRejectedValueOnce(error);

    await expect(
      adminNotificationService.broadcast({
        createdByUserId: "admin-1",
        idempotencyKey: "request-final-update-error",
        title: "Aviso entregue",
        body: "Mensagem entregue no app e push",
        linkUrl: "/inicio",
      })
    ).resolves.toEqual({
      id: "broadcast-1",
      status: "COMPLETED",
      targetCount: 2,
      inAppCount: 2,
      pushAttemptCount: 2,
      pushFailureCount: 0,
      idempotent: false,
    });

    expect(mocks.notificationCreateMany).toHaveBeenCalled();
    expect(mocks.sendToUsers).toHaveBeenCalledWith(["user-1", "user-2"], {
      title: "Aviso entregue",
      body: "Mensagem entregue no app e push",
      url: "/inicio",
    });
    expect(mocks.broadcastUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.broadcastUpdate).not.toHaveBeenCalledWith({
      where: { id: "broadcast-1" },
      data: { status: "FAILED" },
    });
    expect(errorSpy).toHaveBeenCalledWith("Admin notification final audit update failed", error);
    errorSpy.mockRestore();
  });

  it("rejects invalid or outside links before creating an audit record", async () => {
    await expect(
      adminNotificationService.broadcast({
        createdByUserId: "admin-1",
        idempotencyKey: "request-3",
        title: "Link ruim",
        body: "Mensagem",
        linkUrl: "https://evil.example/phishing",
      })
    ).rejects.toBeInstanceOf(InvalidNotificationUrlError);

    expect(mocks.broadcastCreate).not.toHaveBeenCalled();
    expect(mocks.sendToUsers).not.toHaveBeenCalled();
  });

  it("returns an existing broadcast for the same admin and idempotency key without resending", async () => {
    mocks.broadcastFindUnique.mockResolvedValue({
      id: "broadcast-existing",
      createdByUserId: "admin-1",
      status: "COMPLETED",
      targetCount: 5,
      inAppCount: 5,
      pushAttemptCount: 4,
      pushFailureCount: 1,
    });

    const result = await adminNotificationService.broadcast({
      createdByUserId: "admin-1",
      idempotencyKey: "request-4",
      title: "Aviso repetido",
      body: "Mensagem",
      linkUrl: "/inicio",
    });

    expect(result).toEqual({
      id: "broadcast-existing",
      status: "COMPLETED",
      targetCount: 5,
      inAppCount: 5,
      pushAttemptCount: 4,
      pushFailureCount: 1,
      idempotent: true,
    });
    expect(mocks.broadcastCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreateMany).not.toHaveBeenCalled();
    expect(mocks.sendToUsers).not.toHaveBeenCalled();
  });
});
