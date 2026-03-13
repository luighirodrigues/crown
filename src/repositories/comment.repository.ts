import { prisma } from "@/lib/prisma";

interface CreateCommentData {
  postId: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  parentId?: string;
}

export const commentRepository = {
  findByPost(postId: string) {
    return prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  create(data: CreateCommentData) {
    return prisma.comment.create({
      data,
      include: { author: true },
    });
  },

  countByPost(postId: string) {
    return prisma.comment.count({ where: { postId } });
  },

  findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
  },
};
