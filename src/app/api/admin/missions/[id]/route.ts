import { NextRequest } from "next/server";
import { missionRepository } from "@/repositories/mission.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateMissionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
  autoApprove: z.boolean().optional(),
  tributos: z.number().int().min(0).optional(),
  startAt: z.iso.datetime().nullable().optional(),
  endAt: z.iso.datetime().nullable().optional(),
  // TODO: criteriaJson for AUTOMATIC missions — scaffold only
  criteriaJson: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMissionSchema.parse(body);

    const { criteriaJson: _cj, ...data } = parsed;
    const updateData: Record<string, unknown> = { ...data };
    if (parsed.startAt !== undefined) updateData.startAt = parsed.startAt ? new Date(parsed.startAt) : null;
    if (parsed.endAt !== undefined) updateData.endAt = parsed.endAt ? new Date(parsed.endAt) : null;

    const mission = await missionRepository.update(id, updateData as Parameters<typeof missionRepository.update>[1]);
    return Response.json(mission);
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
    await missionRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
