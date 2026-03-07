import { prisma } from "@/lib/prisma";
import type { MissionType } from "@prisma/client";

interface CreateMissionData {
  name: string;
  description: string;
  type?: MissionType;
  autoApprove?: boolean;
  startAt?: Date;
  endAt?: Date;
  tributos?: number;
}

export const missionRepository = {
  findAll() {
    return prisma.mission.findMany({
      include: { _count: { select: { completions: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findActive() {
    const now = new Date();
    return prisma.mission.findMany({
      where: {
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: null },
          { startAt: null, endAt: { gte: now } },
        ],
      },
      include: { _count: { select: { completions: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.mission.findUnique({
      where: { id },
      include: { completions: { include: { user: true } } },
    });
  },

  create(data: CreateMissionData) {
    return prisma.mission.create({ data });
  },
};
