import { NextRequest } from "next/server";
import { eventService } from "@/services/event.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 10);
    const events = await eventService.listUpcoming(limit);
    return Response.json(events);
  } catch (error) {
    return handleAuthError(error);
  }
}
