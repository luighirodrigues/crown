import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const channelRepository = {
  findAll(includeInactive = false) {
    return prisma.channel.findMany({
      where: includeInactive ? undefined : { isActive: true },
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

  update(id: string, data: Prisma.ChannelUpdateInput) {
    return prisma.channel.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.channel.delete({ where: { id } });
  },
};
