import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { hasValidPushKeys, isTrustedPushEndpoint, PUSH_ENDPOINT_MAX_LENGTH } from "../../../../lib/push/subscription";
import { PushSubscriptionConflictError, pushSubscriptionRepository } from "@/repositories/push-subscription.repository";

export const runtime = "nodejs";

type SubscriptionBody = {
  endpoint?: unknown;
  expectedUserId?: unknown;
  expirationTime?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function parseExpirationTime(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const expirationTime = new Date(value);
  return Number.isNaN(expirationTime.getTime()) ? undefined : expirationTime;
}

async function readJsonBody(request: Request): Promise<SubscriptionBody | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SubscriptionBody) : null;
  } catch {
    return null;
  }
}

function badSubscriptionResponse() {
  return Response.json({ error: "Invalid push subscription" }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const endpoint = request.headers.get("X-Crown-Push-Endpoint");

    if (!isTrustedPushEndpoint(endpoint)) {
      return badSubscriptionResponse();
    }

    const enabled = await pushSubscriptionRepository.hasActiveEndpoint(user.id, endpoint);
    return Response.json({ enabled }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await readJsonBody(request);

    if (!body || !isTrustedPushEndpoint(body.endpoint)) {
      return badSubscriptionResponse();
    }

    if (body.expectedUserId !== undefined && body.expectedUserId !== user.id) {
      return Response.json({ error: "Push subscription account changed" }, { status: 409 });
    }

    const { p256dh, auth } = body.keys ?? {};
    if (typeof p256dh !== "string" || typeof auth !== "string" || !hasValidPushKeys(p256dh, auth)) {
      return badSubscriptionResponse();
    }

    const expirationTime = parseExpirationTime(body.expirationTime);
    if (expirationTime === undefined) {
      return badSubscriptionResponse();
    }

    await pushSubscriptionRepository.upsertForUser(user.id, {
      endpoint: body.endpoint,
      p256dh,
      auth,
      expirationTime,
      userAgent: request.headers.get("user-agent"),
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof PushSubscriptionConflictError) {
      return Response.json({ error: "Push subscription conflicts with an existing registration" }, { status: 409 });
    }
    return handleAuthError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const body = await readJsonBody(request);

    if (!body || typeof body.endpoint !== "string" || body.endpoint.length === 0 ||
      body.endpoint.length > PUSH_ENDPOINT_MAX_LENGTH) {
      return badSubscriptionResponse();
    }

    if (body.expectedUserId !== undefined && body.expectedUserId !== user.id) {
      return Response.json({ error: "Push subscription account changed" }, { status: 409 });
    }

    await pushSubscriptionRepository.deleteForUser(user.id, body.endpoint);

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
