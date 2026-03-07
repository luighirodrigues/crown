import { prisma } from "@/lib/prisma";
import type { ApprovalStatus } from "@prisma/client";

interface CreateCheckInData {
  ritualId: string;
  userId: string;
  text?: string;
  imageUrl?: string;
  localDate: string; // YYYY-MM-DD in America/Sao_Paulo
  status?: ApprovalStatus;
  isCounted?: boolean;
}

export const ritualCheckInRepository = {
  create(data: CreateCheckInData) {
    return prisma.ritualCheckIn.create({
      data: {
        ritualId: data.ritualId,
        userId: data.userId,
        text: data.text,
        imageUrl: data.imageUrl,
        localDate: data.localDate,
        status: data.status ?? "PENDING",
        isCounted: data.isCounted ?? false,
      },
      include: { ritual: true, user: true },
    });
  },

  findByUserAndRitual(userId: string, ritualId: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, ritualId },
      orderBy: { createdAt: "desc" },
    });
  },

  findByRitual(ritualId: string) {
    return prisma.ritualCheckIn.findMany({
      where: { ritualId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findByUserAndRitualAndDate(userId: string, ritualId: string, localDate: string) {
    return prisma.ritualCheckIn.findFirst({
      where: { userId, ritualId, localDate },
    });
  },

  findById(id: string) {
    return prisma.ritualCheckIn.findUnique({
      where: { id },
      include: { ritual: true, user: true },
    });
  },

  /** Find the counted check-in for a user+ritual+date, if any */
  findCountedByDate(userId: string, ritualId: string, localDate: string) {
    return prisma.ritualCheckIn.findFirst({
      where: { userId, ritualId, localDate, isCounted: true },
    });
  },

  /** Get all check-ins for a user+ritual+date ordered by creation (oldest first) */
  findAllByDate(userId: string, ritualId: string, localDate: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, ritualId, localDate },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Update the isCounted flag */
  updateIsCounted(id: string, isCounted: boolean) {
    return prisma.ritualCheckIn.update({
      where: { id },
      data: { isCounted },
    });
  },

  /** Update approval status + reviewer fields */
  updateStatus(
    id: string,
    status: ApprovalStatus,
    reviewedByUserId: string,
    reviewNote?: string
  ) {
    return prisma.ritualCheckIn.update({
      where: { id },
      data: {
        status,
        reviewedByUserId,
        reviewNote,
        reviewedAt: new Date(),
      },
      include: { ritual: true, user: true },
    });
  },

  /** List all PENDING check-ins (admin approval queue) */
  findPending() {
    return prisma.ritualCheckIn.findMany({
      where: { status: "PENDING", isCounted: true },
      include: { ritual: true, user: true },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Delete a check-in by ID */
  delete(id: string) {
    return prisma.ritualCheckIn.delete({ where: { id } });
  },

  /** Get all check-ins for a user across all rituals for a given date */
  findByUserAndDate(userId: string, localDate: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, localDate },
      include: { ritual: true },
      orderBy: { createdAt: "desc" },
    });
  },
};
