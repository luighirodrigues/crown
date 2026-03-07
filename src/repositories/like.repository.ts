import { prisma } from "@/lib/prisma";

export const likeRepository = {
  async toggle(postId: string, userId: string) {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      });
      return { liked: false, likeId: existing.id };
    }

    const like = await prisma.like.create({
      data: { postId, userId },
    });
    return { liked: true, likeId: like.id };
  },

  countByPost(postId: string) {
    return prisma.like.count({ where: { postId } });
  },

  isLikedByUser(postId: string, userId: string) {
    return prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
  },
};
