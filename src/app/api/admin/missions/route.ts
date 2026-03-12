import { NextRequest } from "next/server";
import { missionRepository } from "@/repositories/mission.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const missions = await missionRepository.findAll();
    return Response.json(missions);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createMissionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
  autoApprove: z.boolean().default(false),
  tributos: z.number().int().min(0).default(0),
  startAt: z.iso.datetime().optional(),
  endAt: z.iso.datetime().optional(),
  // TODO: criteriaJson for AUTOMATIC missions — scaffold only
  criteriaJson: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createMissionSchema.parse(body);

    const mission = await missionRepository.create({
      name: parsed.name,
      description: parsed.description,
      type: parsed.type,
      autoApprove: parsed.autoApprove,
      tributos: parsed.tributos,
      startAt: parsed.startAt ? new Date(parsed.startAt) : undefined,
      endAt: parsed.endAt ? new Date(parsed.endAt) : undefined,
    });
    return Response.json(mission, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
