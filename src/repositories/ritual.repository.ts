import { prisma } from "@/lib/prisma";

export const ritualRepository = {
  findAll() {
    return prisma.ritual.findMany({
      orderBy: { startAt: "desc" },
    });
  },

  findActive(now: Date = new Date()) {
    return prisma.ritual.findMany({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { startAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.ritual.findUnique({
      where: { id },
    });
  },

  create(data: {
    name: string;
    description: string;
    imageUrl?: string;
    pointsValue: number;
    startAt: Date;
    endAt: Date;
    autoApprove?: boolean;
  }) {
    return prisma.ritual.create({ data });
  },
};
