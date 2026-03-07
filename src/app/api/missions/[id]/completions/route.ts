import { NextRequest } from "next/server";
import { missionService, submitCompletionSchema } from "@/services/mission.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = submitCompletionSchema.parse(body);
    const completion = await missionService.submitCompletion(id, user.id, parsed);
    return Response.json(completion, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
