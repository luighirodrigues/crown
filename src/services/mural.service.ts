import { eventRepository } from "@/repositories/event.repository";
import { postRepository } from "@/repositories/post.repository";
import { bannerRepository } from "@/repositories/banner.repository";
import { rankingService, getCurrentBrasiliaMonth } from "@/services/ranking.service";
import type { Role } from "@prisma/client";

/**
 * Mural (Dashboard) Service — aggregates data for the Início page.
 */
export const muralService = {
  /**
   * Get all mural data in a single call.
   * @param role - user role (MEMBER sees current month only; ADMIN/MOD can select month)
   * @param selectedMonth - optional "YYYY-MM" for admin/mod
   */
  async getMuralData(role: Role, selectedMonth?: string) {
    // Parse month for ranking
    let year: number;
    let month: number;

    if (selectedMonth && (role === "ADMIN" || role === "MODERATOR")) {
      const [y, m] = selectedMonth.split("-").map(Number);
      year = y;
      month = m;
    } else {
      const current = getCurrentBrasiliaMonth();
      year = current.year;
      month = current.month;
    }

    const [upcomingEvents, topPosts, rankingTop3, rankingTop5, banners] = await Promise.all([
      eventRepository.findUpcoming(3),
      postRepository.findTopByLikes(7, 5),
      rankingService.getMonthlyRanking(year, month, 3),
      rankingService.getMonthlyRanking(year, month, 5),
      bannerRepository.findActive(),
    ]);

    return {
      upcomingEvents,
      topPosts,
      rankingTop3,
      rankingTop5,
      banners,
      month: `${year}-${String(month).padStart(2, "0")}`,
    };
  },
};
