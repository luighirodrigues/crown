import { prisma } from "@/lib/prisma";
import { Role, SubscriptionStatus } from "@prisma/client";

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  findBySlug(slug: string) {
    return prisma.user.findUnique({
      where: { slug },
      include: { profile: true },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findAll() {
    return prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findAllWithCounts() {
    return prisma.user.findMany({
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            pointsLedger: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateProfile(userId: string, data: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  updateRole(userId: string, role: Role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true },
    });
  },

  updateSubscriptionStatus(userId: string, subscriptionStatus: SubscriptionStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus },
      include: { profile: true },
    });
  },

  findRecentMembers(days: number, limit: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.user.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, image: true, slug: true, createdAt: true },
    });
  },

  findMembersSample(limit: number) {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, image: true, slug: true },
    });
  },

  countAll() {
    return prisma.user.count();
  },

  async findMembersPaginated({
    page,
    limit,
    search,
    sort,
  }: {
    page: number;
    limit: number;
    search: string;
    sort: string;
  }) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { profile: { profession: { contains: search, mode: "insensitive" as const } } },
            { profile: { city: { contains: search, mode: "insensitive" as const } } },
            { profile: { bio: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const orderBy =
      sort === "name"
        ? { name: "asc" as const }
        : { createdAt: "desc" as const };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: {
            select: {
              bannerUrl: true,
              profession: true,
              city: true,
              bio: true,
              instagram: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { members, total };
  },
};
