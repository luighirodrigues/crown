import { prisma } from "@/lib/prisma";

interface CreatePostData {
  channelId: string;
  authorId: string;
  title: string;
  body: string;
  imageUrl?: string;
}

export const postRepository = {
  findByChannel(channelId: string | null, opts: { take?: number; skip?: number } = {}) {
    const { take = 20, skip = 0 } = opts;
    return prisma.post.findMany({
      where: channelId ? { channelId } : undefined,
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    });
  },

  findRecent(limit: number = 10) {
    return prisma.post.findMany({
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  findTopByLikes(days: number = 7, limit: number = 5) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.post.findMany({
      where: { createdAt: { gte: since } },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: "desc" } },
      take: limit,
    });
  },

  findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
  },

  create(data: CreatePostData) {
    return prisma.post.create({
      data,
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
  },
};
