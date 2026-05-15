import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  userFindMany: vi.fn(),
  sendToUser: vi.fn(),
  sendToUsers: vi.fn(),
}));

vi.mock("@/repositories/notification.repository", () => ({
  notificationRepository: {
    create: mocks.notificationCreate,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      createMany: mocks.notificationCreateMany,
    },
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

vi.mock("./push.service", () => ({
  sendToUser: mocks.sendToUser,
  sendToUsers: mocks.sendToUsers,
}));

import { notificationTriggerService } from "./notification-trigger.service";

describe("notification trigger service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notificationCreate.mockResolvedValue({ id: "notification-1" });
    mocks.notificationCreateMany.mockResolvedValue({ count: 0 });
    mocks.userFindMany.mockResolvedValue([]);
    mocks.sendToUser.mockResolvedValue({ attempted: 1, sent: 1, failed: 0, removed: 0 });
    mocks.sendToUsers.mockResolvedValue({ attempted: 1, sent: 1, failed: 0, removed: 0 });
  });

  it("sends push after creating a comment notification", async () => {
    const order: string[] = [];
    const notification = { id: "comment-notification" };
    mocks.notificationCreate.mockImplementation(async () => {
      order.push("create-notification");
      return notification;
    });
    mocks.sendToUser.mockImplementation(async () => {
      order.push("send-push");
      return { attempted: 1, sent: 1, failed: 0, removed: 0 };
    });

    const result = await notificationTriggerService.onPostCommented("user-1", "Ana", "Post Legal");

    expect(result).toBe(notification);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      userId: "user-1",
      type: "COMMENT",
      title: "Novo comentário",
      body: 'Ana comentou no seu post "Post Legal"',
      linkUrl: "/inicio",
    });
    expect(mocks.sendToUser).toHaveBeenCalledWith("user-1", {
      title: "Novo comentário",
      body: 'Ana comentou no seu post "Post Legal"',
      url: "/inicio",
      notificationId: "comment-notification",
    });
    expect(order).toEqual(["create-notification", "send-push"]);
  });

  it("sends push after creating a reply notification", async () => {
    mocks.notificationCreate.mockResolvedValue({ id: "reply-notification" });

    await notificationTriggerService.onCommentReplied("user-2", "Bia", "Post Legal");

    expect(mocks.sendToUser).toHaveBeenCalledWith("user-2", {
      title: "Nova resposta",
      body: 'Bia respondeu seu comentário em "Post Legal"',
      url: "/inicio",
      notificationId: "reply-notification",
    });
  });

  it("sends push after creating an approval notification", async () => {
    mocks.notificationCreate.mockResolvedValue({ id: "approval-notification" });

    await notificationTriggerService.onApprovalStatusChanged("user-3", "Missão", "APPROVED");

    expect(mocks.sendToUser).toHaveBeenCalledWith("user-3", {
      title: "Missão aprovado(a)",
      body: "Seu Missão foi aprovado! Tributos e presenças foram contabilizados.",
      url: "/inicio",
      notificationId: "approval-notification",
    });
  });

  it("sends event push to active users after creating in-app notifications", async () => {
    const order: string[] = [];
    mocks.userFindMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
    mocks.notificationCreateMany.mockImplementation(async () => {
      order.push("create-notifications");
      return { count: 2 };
    });
    mocks.sendToUsers.mockImplementation(async () => {
      order.push("send-push");
      return { attempted: 1, sent: 1, failed: 0, removed: 0 };
    });

    await notificationTriggerService.onEventCreated("Encontro CROWN", "2026-05-09T15:00:00.000Z");

    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { subscriptionStatus: "ACTIVE" },
      select: { id: true },
    });
    expect(mocks.notificationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          type: "EVENT",
          title: "Novo evento",
          body: '"Encontro CROWN" foi adicionado à agenda.',
          linkUrl: "/inicio",
        },
        {
          userId: "user-2",
          type: "EVENT",
          title: "Novo evento",
          body: '"Encontro CROWN" foi adicionado à agenda.',
          linkUrl: "/inicio",
        },
      ],
    });
    expect(mocks.sendToUsers).toHaveBeenCalledWith(["user-1", "user-2"], {
      title: "Novo evento",
      body: '"Encontro CROWN" foi adicionado à agenda.',
      url: "/inicio",
    });
    expect(order).toEqual(["create-notifications", "send-push"]);
  });

  it("keeps likes in-app only", async () => {
    await notificationTriggerService.onPostLiked("user-1", "Ana", "Post Legal");

    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      userId: "user-1",
      type: "LIKE",
      title: "Nova curtida",
      body: 'Ana curtiu seu post "Post Legal"',
    });
    expect(mocks.sendToUser).not.toHaveBeenCalled();
    expect(mocks.sendToUsers).not.toHaveBeenCalled();
  });

  it("does not reject in-app notification creation when push fails", async () => {
    const error = new Error("push unavailable");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.notificationCreate.mockResolvedValue({ id: "notification-1" });
    mocks.sendToUser.mockRejectedValue(error);

    await expect(notificationTriggerService.onPostCommented("user-1", "Ana", "Post Legal")).resolves.toEqual({
      id: "notification-1",
    });

    expect(errorSpy).toHaveBeenCalledWith("Notification push delivery failed", error);
    errorSpy.mockRestore();
  });
});
