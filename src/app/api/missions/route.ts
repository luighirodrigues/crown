import { NextRequest } from "next/server";
import { missionService, createMissionSchema } from "@/services/mission.service";
import { requireAuth, requireRole, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const user = await requireAuth();
    const missions = await missionService.listActiveForUser(user.id);
    return Response.json(missions);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createMissionSchema.parse(body);
    const mission = await missionService.create(parsed);
    return Response.json(mission, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
