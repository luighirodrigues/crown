import { prisma } from "@/lib/prisma";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { rankingService, getCurrentBrasiliaMonth } from "@/services/ranking.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const userId = sessionUser.id;

    const [user, profile, totalTributos, presenceCounts, postsCount, commentsCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, image: true, email: true, role: true, createdAt: true },
        }),
        prisma.profile.findUnique({ where: { userId } }),
        pointsService.getUserTotal(userId),
        presenceService.getUserCounts(userId),
        prisma.post.count({ where: { authorId: userId } }),
        prisma.comment.count({ where: { authorId: userId } }),
      ]);

    if (!user) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Get current month ranking position
    const { year, month } = getCurrentBrasiliaMonth();
    const ranking = await rankingService.getMonthlyRanking(year, month, 100);
    const rankPosition = ranking.findIndex((r) => r.user.id === userId) + 1;

    return Response.json({
      ...user,
      profile,
      stats: {
        totalTributos,
        presencaGeral: presenceCounts.general,
        presencaRotina: presenceCounts.routine,
        postsCount,
        commentsCount,
        rankPosition: rankPosition > 0 ? rankPosition : null,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
