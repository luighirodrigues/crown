import { prisma } from "@/lib/prisma";
import type { ApprovalStatus } from "@prisma/client";

export const missionCompletionRepository = {
  create(data: { missionId: string; userId: string; evidenceUrl?: string; status?: ApprovalStatus }) {
    return prisma.missionCompletion.create({
      data: {
        missionId: data.missionId,
        userId: data.userId,
        evidenceUrl: data.evidenceUrl,
        status: data.status ?? "PENDING",
      },
      include: { mission: true, user: true },
    });
  },

  findByUserAndMission(userId: string, missionId: string) {
    return prisma.missionCompletion.findUnique({
      where: { missionId_userId: { missionId, userId } },
    });
  },

  findPending() {
    return prisma.missionCompletion.findMany({
      where: { status: "PENDING" },
      include: { mission: true, user: true },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.missionCompletion.findUnique({
      where: { id },
      include: { mission: true, user: true },
    });
  },

  updateStatus(
    id: string,
    status: ApprovalStatus,
    reviewedByUserId: string,
    reviewNote?: string
  ) {
    return prisma.missionCompletion.update({
      where: { id },
      data: {
        status,
        reviewedByUserId,
        reviewNote,
        reviewedAt: new Date(),
      },
      include: { mission: true, user: true },
    });
  },
};
