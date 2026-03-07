import { NextRequest } from "next/server";
import { ritualCheckInService } from "@/services/ritual-checkin.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    if (active === "true") {
      const rituals = await ritualCheckInService.listActive();
      return Response.json(rituals);
    }

    const rituals = await ritualCheckInService.listAll();
    return Response.json(rituals);
  } catch (error) {
    return handleAuthError(error);
  }
}
