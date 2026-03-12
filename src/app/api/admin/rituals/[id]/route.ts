import { NextRequest } from "next/server";
import { ritualRepository } from "@/repositories/ritual.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateRitualSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  pointsValue: z.number().int().min(0).optional(),
  startAt: z.iso.datetime().optional(),
  endAt: z.iso.datetime().optional(),
  autoApprove: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateRitualSchema.parse(body);

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.startAt) data.startAt = new Date(parsed.startAt);
    if (parsed.endAt) data.endAt = new Date(parsed.endAt);

    const ritual = await ritualRepository.update(id, data as Parameters<typeof ritualRepository.update>[1]);
    return Response.json(ritual);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    await ritualRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
