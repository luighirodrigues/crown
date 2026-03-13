import { prisma } from "@/lib/prisma";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { rankingService, getCurrentBrasiliaMonth } from "@/services/ranking.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { generateUniqueSlug } from "@/lib/slug";
import { z } from "zod/v4";

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const userId = sessionUser.id;

    const [user, profile, totalTributos, presenceCounts, postsCount, commentsCount, pointsHistory] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, image: true, email: true, role: true, createdAt: true, slug: true },
        }),
        prisma.profile.findUnique({ where: { userId } }),
        pointsService.getUserTotal(userId),
        presenceService.getUserCounts(userId),
        prisma.post.count({ where: { authorId: userId } }),
        prisma.comment.count({ where: { authorId: userId } }),
        pointsService.getUserHistory(userId, { take: 50 }),
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
      pointsHistory,
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

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().max(500).optional(),
  bio: z.string().max(500).optional(),
  bannerUrl: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
  profession: z.string().max(100).optional(),
  birthday: z.string().optional(),
  city: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  externalLink: z.string().max(300).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
});

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireAuth();
    const userId = sessionUser.id;
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Update User fields (name, image) — regenerate slug if name changes
    if (data.name !== undefined || data.image !== undefined) {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
        updateData.slug = await generateUniqueSlug(data.name, userId);
      }
      if (data.image !== undefined) updateData.image = data.image;
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Update Profile fields
    const profileData: Record<string, unknown> = {};
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.bannerUrl !== undefined) profileData.bannerUrl = data.bannerUrl;
    if (data.displayName !== undefined) profileData.displayName = data.displayName;
    if (data.profession !== undefined) profileData.profession = data.profession;
    if (data.birthday !== undefined) profileData.birthday = data.birthday ? new Date(data.birthday) : null;
    if (data.city !== undefined) profileData.city = data.city;
    if (data.instagram !== undefined) profileData.instagram = data.instagram;
    if (data.externalLink !== undefined) profileData.externalLink = data.externalLink;
    if (data.interests !== undefined) profileData.interests = data.interests;
    if (data.skills !== undefined) profileData.skills = data.skills;

    if (Object.keys(profileData).length > 0) {
      await prisma.profile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData } as never,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
