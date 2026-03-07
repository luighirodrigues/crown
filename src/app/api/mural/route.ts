import { NextRequest } from "next/server";
import { muralService } from "@/services/mural.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get("month") ?? undefined;

    const data = await muralService.getMuralData(user.role, selectedMonth);
    return Response.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
