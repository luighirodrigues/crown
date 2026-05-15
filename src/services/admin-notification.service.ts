import { AdminNotificationBroadcastStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireNotificationUrl } from "../lib/push/url";
import { sendToUsers, type PushDeliveryResult } from "./push.service";

type BroadcastInput = {
  createdByUserId: string;
  idempotencyKey: string;
  title: string;
  body: string;
  linkUrl?: string | null;
};

type BroadcastRecord = {
  id: string;
  createdByUserId: string;
  status: AdminNotificationBroadcastStatus;
  targetCount: number;
  inAppCount: number;
  pushAttemptCount: number;
  pushFailureCount: number;
};

type NotificationCreateManyInput = {
  data: Array<{
    userId: string;
    type: "SYSTEM";
    title: string;
    body: string;
    linkUrl?: string | null;
  }>;
};

type BroadcastWriteClient = {
  adminNotificationBroadcast: {
    update(input: {
      where: { id: string };
      data: Partial<Pick<BroadcastRecord, "status" | "targetCount" | "inAppCount" | "pushAttemptCount" | "pushFailureCount">>;
    }): Promise<BroadcastRecord>;
  };
  notification: {
    createMany(input: NotificationCreateManyInput): Promise<{ count: number }>;
  };
};

export type AdminNotificationBroadcastResult = Omit<BroadcastRecord, "createdByUserId"> & {
  idempotent: boolean;
};

const NOTIFICATION_BATCH_SIZE = 500;

function normalizeOptionalLink(linkUrl: string | null | undefined) {
  if (!linkUrl?.trim()) {
    return null;
  }

  return requireNotificationUrl(linkUrl);
}

function validateText(value: string, field: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
}

function toResult(record: BroadcastRecord, idempotent: boolean): AdminNotificationBroadcastResult {
  return {
    id: record.id,
    status: record.status,
    targetCount: record.targetCount,
    inAppCount: record.inAppCount,
    pushAttemptCount: record.pushAttemptCount,
    pushFailureCount: record.pushFailureCount,
    idempotent,
  };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

async function sendPushBestEffort(userIds: string[], title: string, body: string, linkUrl: string | null) {
  if (userIds.length === 0) {
    return { attempted: 0, failed: 0, hadError: false };
  }

  try {
    const result: PushDeliveryResult = await sendToUsers(userIds, { title, body, url: linkUrl });
    return { attempted: result.attempted, failed: result.failed, hadError: result.failed > 0 };
  } catch (error) {
    console.error("Admin notification push delivery failed", error);
    return { attempted: 0, failed: userIds.length, hadError: true };
  }
}

async function createInAppNotifications(
  client: Pick<BroadcastWriteClient, "notification">,
  userIds: string[],
  title: string,
  body: string,
  linkUrl: string | null
) {
  let count = 0;

  for (let index = 0; index < userIds.length; index += NOTIFICATION_BATCH_SIZE) {
    const batch = userIds.slice(index, index + NOTIFICATION_BATCH_SIZE);
    const result = await client.notification.createMany({
      data: batch.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title,
        body,
        linkUrl,
      })),
    });
    count += result.count;
  }

  return count;
}

async function createInAppNotificationsAndMarkPushPending(
  client: BroadcastWriteClient,
  broadcastId: string,
  userIds: string[],
  title: string,
  body: string,
  linkUrl: string | null
) {
  const inAppCount = userIds.length > 0
    ? await createInAppNotifications(client, userIds, title, body, linkUrl)
    : 0;

  return client.adminNotificationBroadcast.update({
    where: { id: broadcastId },
    data: {
      status: AdminNotificationBroadcastStatus.PUSH_PENDING,
      targetCount: userIds.length,
      inAppCount,
    },
  });
}

export const adminNotificationService = {
  async broadcast(input: BroadcastInput): Promise<AdminNotificationBroadcastResult> {
    const title = validateText(input.title, "title");
    const body = validateText(input.body, "body");
    const idempotencyKey = validateText(input.idempotencyKey, "idempotencyKey");
    const linkUrl = normalizeOptionalLink(input.linkUrl);

    const existing = await prisma.adminNotificationBroadcast.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.createdByUserId !== input.createdByUserId) {
        throw new Error("Idempotency key already used");
      }

      return toResult(existing, true);
    }

    let broadcast: BroadcastRecord;
    try {
      broadcast = await prisma.adminNotificationBroadcast.create({
        data: {
          createdByUserId: input.createdByUserId,
          idempotencyKey,
          title,
          body,
          linkUrl,
          status: AdminNotificationBroadcastStatus.PROCESSING,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const duplicate = await prisma.adminNotificationBroadcast.findUnique({ where: { idempotencyKey } });
      if (duplicate?.createdByUserId === input.createdByUserId) {
        return toResult(duplicate, true);
      }

      throw error;
    }

    let userIds: string[];
    let inAppReadyBroadcast: BroadcastRecord;

    try {
      const users = await prisma.user.findMany({
        where: { subscriptionStatus: "ACTIVE" },
        select: { id: true },
      });
      userIds = users.map((user) => user.id);
      inAppReadyBroadcast = await prisma.$transaction((tx) =>
        createInAppNotificationsAndMarkPushPending(tx, broadcast.id, userIds, title, body, linkUrl)
      );
    } catch (error) {
      await prisma.adminNotificationBroadcast.update({
        where: { id: broadcast.id },
        data: { status: AdminNotificationBroadcastStatus.FAILED },
      });
      throw error;
    }

    const pushResult = await sendPushBestEffort(userIds, title, body, linkUrl);
    const finalData = {
      status: pushResult.hadError
        ? AdminNotificationBroadcastStatus.COMPLETED_WITH_PUSH_ERRORS
        : AdminNotificationBroadcastStatus.COMPLETED,
      pushAttemptCount: pushResult.attempted,
      pushFailureCount: pushResult.failed,
    };

    try {
      const updated = await prisma.adminNotificationBroadcast.update({
        where: { id: broadcast.id },
        data: finalData,
      });

      return toResult({ ...inAppReadyBroadcast, ...updated }, false);
    } catch (error) {
      console.error("Admin notification final audit update failed", error);
      return toResult({ ...inAppReadyBroadcast, ...finalData }, false);
    }
  },
};
