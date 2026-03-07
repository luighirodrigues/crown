import { NextRequest } from "next/server";
import { ritualCheckInService, createCheckInSchema } from "@/services/ritual-checkin.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = createCheckInSchema.parse(body);
    const checkIn = await ritualCheckInService.createCheckIn(id, parsed, user.id);
    return Response.json(checkIn, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const checkInId = searchParams.get("checkInId");

    if (!checkInId) {
      return Response.json({ error: "checkInId é obrigatório" }, { status: 400 });
    }

    await ritualCheckInService.deleteCheckIn(checkInId, user.id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
