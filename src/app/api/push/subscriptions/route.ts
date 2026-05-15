import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { pushSubscriptionRepository } from "@/repositories/push-subscription.repository";

export const runtime = "nodejs";

type SubscriptionBody = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

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

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await readJsonBody(request);

    if (!body || !isNonEmptyString(body.endpoint) || !isValidEndpoint(body.endpoint)) {
      return badSubscriptionResponse();
    }

    if (!isNonEmptyString(body.keys?.p256dh) || !isNonEmptyString(body.keys?.auth)) {
      return badSubscriptionResponse();
    }

    const expirationTime = parseExpirationTime(body.expirationTime);
    if (expirationTime === undefined) {
      return badSubscriptionResponse();
    }

    await pushSubscriptionRepository.upsertForUser(user.id, {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      expirationTime,
      userAgent: request.headers.get("user-agent"),
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const body = await readJsonBody(request);

    if (!body || !isNonEmptyString(body.endpoint) || !isValidEndpoint(body.endpoint)) {
      return badSubscriptionResponse();
    }

    await pushSubscriptionRepository.deleteForUser(user.id, body.endpoint);

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
