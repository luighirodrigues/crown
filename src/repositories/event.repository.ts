import { prisma } from "@/lib/prisma";

export const eventRepository = {
  findUpcoming(limit: number = 10) {
    return prisma.event.findMany({
      where: { datetime: { gte: new Date() } },
      orderBy: { datetime: "asc" },
      take: limit,
    });
  },

  findAll() {
    return prisma.event.findMany({
      orderBy: { datetime: "desc" },
    });
  },

  findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
    });
  },

  create(data: {
    title: string;
    description: string;
    datetime: Date;
    link?: string;
    location?: string;
  }) {
    return prisma.event.create({ data });
  },
};
