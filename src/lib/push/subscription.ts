import { ECDH } from "node:crypto";

export const PUSH_ENDPOINT_MAX_LENGTH = 2048;

export function isTrustedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > PUSH_ENDPOINT_MAX_LENGTH) {
    return false;
  }

  try {
    const url = new URL(endpoint);
    const { hostname } = url;

    return url.href === endpoint && url.protocol === "https:" && !url.port &&
      !url.username && !url.password && !url.hash && (
        hostname === "fcm.googleapis.com" || hostname === "updates.push.services.mozilla.com" ||
        hostname.endsWith(".push.apple.com") || hostname.endsWith(".notify.windows.com")
      );
  } catch {
    return false;
  }
}

export function hasValidPushKeys(p256dh: unknown, auth: unknown): boolean {
  if (typeof p256dh !== "string" || typeof auth !== "string" ||
    !/^[A-Za-z0-9_-]{87}$/.test(p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(auth)) {
    return false;
  }

  const publicKey = Buffer.from(p256dh, "base64url");
  const secret = Buffer.from(auth, "base64url");

  if (publicKey[0] !== 4 || publicKey.toString("base64url") !== p256dh || secret.toString("base64url") !== auth) {
    return false;
  }

  try {
    ECDH.convertKey(publicKey, "prime256v1");
    return true;
  } catch {
    return false;
  }
}
