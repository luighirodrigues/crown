import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const channelRepository = {
  findAll() {
    return prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.channel.findUnique({
      where: { slug },
    });
  },

  findById(id: string) {
    return prisma.channel.findUnique({
      where: { id },
    });
  },

  create(data: Prisma.ChannelCreateInput) {
    return prisma.channel.create({ data });
  },
};
