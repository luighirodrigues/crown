import { pointsLedgerRepository } from "@/repositories/points-ledger.repository";
import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";

/**
 * Compute UTC boundaries for a given month in Brasília timezone.
 * E.g. March 2026 in BRT → 2026-03-01T03:00:00Z to 2026-04-01T03:00:00Z
 */
function getMonthBoundariesUTC(year: number, month: number): { start: Date; end: Date } {
  // Create the first instant of the month in Brasília
  // Brasília is UTC-3 normally
  const startLocal = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endLocal = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00-03:00`
  );
  return { start: startLocal, end: endLocal };
}

/**
 * Get current year and month in Brasília timezone.
 */
export function getCurrentBrasiliaMonth(): { year: number; month: number } {
  const now = toZonedTime(new Date(), TIMEZONE);
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export const rankingService = {
  /**
   * Get monthly ranking based solely on tributos (PointsLedger).
   * Returns top N users with their sum of points for the given month.
   */
  async getMonthlyRanking(year: number, month: number, limit: number = 10) {
    const { start, end } = getMonthBoundariesUTC(year, month);

    const grouped = await pointsLedgerRepository.rankByRange(start, end, limit);

    if (grouped.length === 0) return [];

    // Fetch user details for the ranked users
    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, slug: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, i) => ({
      position: i + 1,
      user: userMap.get(g.userId) ?? { id: g.userId, name: "Desconhecida", image: null },
      tributos: g._sum.points ?? 0,
    }));
  },

  async getTop3(year?: number, month?: number) {
    const current = getCurrentBrasiliaMonth();
    return this.getMonthlyRanking(year ?? current.year, month ?? current.month, 3);
  },

  async getTop5(year?: number, month?: number) {
    const current = getCurrentBrasiliaMonth();
    return this.getMonthlyRanking(year ?? current.year, month ?? current.month, 5);
  },
};
