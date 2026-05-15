import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { handleAuthError, requireRole } from "@/lib/auth/rbac";
import { InvalidNotificationUrlError } from "../../../../lib/push/url";
import { adminNotificationService } from "@/services/admin-notification.service";

export const runtime = "nodejs";

const broadcastSchema = z.object({
  idempotencyKey: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  linkUrl: z.string().optional().nullable(),
});

export async function POST(request: NextRequest | Request) {
  try {
    const admin = await requireRole("ADMIN");
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = broadcastSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const result = await adminNotificationService.broadcast({
      createdByUserId: admin.id,
      idempotencyKey: parsed.data.idempotencyKey,
      title: parsed.data.title,
      body: parsed.data.body,
      linkUrl: parsed.data.linkUrl ?? null,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof InvalidNotificationUrlError) {
      return Response.json({ error: "Link inválido" }, { status: 400 });
    }

    return handleAuthError(error);
  }
}
