import { NextRequest } from "next/server";
import { rankingService, getCurrentBrasiliaMonth } from "@/services/ranking.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    let year: number;
    let month: number;

    const monthParam = searchParams.get("month");
    if (monthParam && (user.role === "ADMIN" || user.role === "MODERATOR")) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m;
    } else {
      // Members always see current Brasília month
      const current = getCurrentBrasiliaMonth();
      year = current.year;
      month = current.month;
    }

    const limit = Number(searchParams.get("limit") || 10);
    const rankings = await rankingService.getMonthlyRanking(year, month, limit);

    return Response.json({
      rankings,
      month: `${year}-${String(month).padStart(2, "0")}`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
