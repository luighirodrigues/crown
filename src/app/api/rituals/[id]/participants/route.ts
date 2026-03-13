import { NextRequest } from "next/server";
import { ritualCheckInService } from "@/services/ritual-checkin.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const data = await ritualCheckInService.getParticipants(id);
    return Response.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
