import { prisma } from "@/lib/prisma";

export const bannerRepository = {
  findAll() {
    return prisma.banner.findMany({
      orderBy: { order: "asc" },
    });
  },

  findActive() {
    return prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  },

  findById(id: string) {
    return prisma.banner.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    active?: boolean;
    order?: number;
  }) {
    return prisma.banner.create({ data });
  },

  update(id: string, data: {
    title?: string;
    imageUrl?: string;
    linkUrl?: string | null;
    active?: boolean;
    order?: number;
  }) {
    return prisma.banner.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.banner.delete({ where: { id } });
  },
};
