import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { getVapidConfigStatus, getVapidPublicKey } from "@/lib/push/vapid";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth();

    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      const status = getVapidConfigStatus();
      return Response.json({
        enabled: false,
        publicKey: null,
        message: status.message ?? "Web Push is disabled: missing VAPID public key",
        missing: status.missing,
      });
    }

    return Response.json({ publicKey });
  } catch (error) {
    return handleAuthError(error);
  }
}
