import webPush, { type PushSubscription as WebPushSubscription } from "web-push";

import { normalizeNotificationUrl } from "../lib/push/url";
import { getVapidConfig } from "../lib/push/vapid";
import { pushSubscriptionRepository } from "../repositories/push-subscription.repository";

type PushSubscriptionRecord = Awaited<
  ReturnType<typeof pushSubscriptionRepository.findByUser>
>[number];

export type PushPayload = {
  title: string;
  body: string;
  url?: string | null;
  notificationId?: string | null;
};

export type PushDeliveryResult = {
  attempted: number;
  sent: number;
  failed: number;
  removed: number;
};

const CONCURRENT_SEND_LIMIT = 10;
const USER_LOOKUP_BATCH_SIZE = 100;

const emptyResult: PushDeliveryResult = {
  attempted: 0,
  sent: 0,
  failed: 0,
  removed: 0,
};

function toWebPushSubscription(subscription: PushSubscriptionRecord): WebPushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

function createPayload(payload: PushPayload) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: normalizeNotificationUrl(payload.url),
    notificationId: payload.notificationId ?? undefined,
  });
}

function isPermanentDeliveryFailure(error: unknown) {
  const statusCode = typeof error === "object" && error !== null ? (error as { statusCode?: unknown }).statusCode : null;

  return statusCode === 404 || statusCode === 410;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, callback: (item: T) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
}

async function sendToSubscriptions(subscriptions: PushSubscriptionRecord[], payload: PushPayload): Promise<PushDeliveryResult> {
  if (subscriptions.length === 0) {
    return { ...emptyResult };
  }

  const serializedPayload = createPayload(payload);
  const deliveryResults = await mapWithConcurrency(subscriptions, CONCURRENT_SEND_LIMIT, async (subscription) => {
    try {
      await webPush.sendNotification(toWebPushSubscription(subscription), serializedPayload);
      return { sent: true, endpointToRemove: null };
    } catch (error) {
      if (isPermanentDeliveryFailure(error)) {
        return { sent: false, endpointToRemove: subscription.endpoint };
      }

      console.error("Web Push delivery failed", error);
      return { sent: false, endpointToRemove: null };
    }
  });

  const endpointsToRemove = deliveryResults
    .map((result) => result.endpointToRemove)
    .filter((endpoint): endpoint is string => Boolean(endpoint));
  const removed = endpointsToRemove.length > 0 ? await pushSubscriptionRepository.deleteByEndpoints(endpointsToRemove) : { count: 0 };
  const sent = deliveryResults.filter((result) => result.sent).length;

  return {
    attempted: subscriptions.length,
    sent,
    failed: subscriptions.length - sent,
    removed: removed.count,
  };
}

function configureWebPush() {
  const config = getVapidConfig();

  if (!config) {
    console.warn("Web Push delivery disabled: VAPID config is missing or invalid");
    return false;
  }

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<PushDeliveryResult> {
  if (!configureWebPush()) {
    return { ...emptyResult };
  }

  const subscriptions = await pushSubscriptionRepository.findByUser(userId);
  return sendToSubscriptions(subscriptions, payload);
}

export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<PushDeliveryResult> {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);

  if (uniqueUserIds.length === 0 || !configureWebPush()) {
    return { ...emptyResult };
  }

  const subscriptions: PushSubscriptionRecord[] = [];

  for (let index = 0; index < uniqueUserIds.length; index += USER_LOOKUP_BATCH_SIZE) {
    subscriptions.push(
      ...(await pushSubscriptionRepository.findByUsers(uniqueUserIds.slice(index, index + USER_LOOKUP_BATCH_SIZE)))
    );
  }

  return sendToSubscriptions(subscriptions, payload);
}
