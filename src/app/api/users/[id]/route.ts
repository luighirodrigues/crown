import { prisma } from "@/lib/prisma";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { rankingService, getCurrentBrasiliaMonth } from "@/services/ranking.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: slugOrId } = await params;

    // Try to find user by slug first, then by id as fallback
    let userId: string;
    const bySlug = await prisma.user.findUnique({
      where: { slug: slugOrId },
      select: { id: true },
    });
    if (bySlug) {
      userId = bySlug.id;
    } else {
      const byId = await prisma.user.findUnique({
        where: { id: slugOrId },
        select: { id: true },
      });
      if (!byId) {
        return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
      }
      userId = byId.id;
    }

    const [user, profile, totalTributos, presenceCounts, postsCount, commentsCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, image: true, role: true, createdAt: true, slug: true },
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

    const { year, month } = getCurrentBrasiliaMonth();
    const ranking = await rankingService.getMonthlyRanking(year, month, 100);
    const rankPosition = ranking.findIndex((r) => r.user.id === userId) + 1;

    return Response.json({
      ...user,
      profile: profile
        ? {
            bio: profile.bio,
            bannerUrl: profile.bannerUrl,
            displayName: profile.displayName,
            profession: profile.profession,
            birthday: profile.birthday,
            city: profile.city,
            instagram: profile.instagram,
            externalLink: profile.externalLink,
            interests: profile.interests,
            skills: profile.skills,
          }
        : null,
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
