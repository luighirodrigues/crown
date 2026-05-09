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

  /** Get all counted+approved check-ins for a user grouped by ritual */
  findCountedApprovedByUser(userId: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, isCounted: true, status: "APPROVED" },
      select: { ritualId: true, localDate: true },
    });
  },

  /** Get all counted check-in statuses for approval transition detection */
  findCountedByUser(userId: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, isCounted: true },
      select: { id: true, ritualId: true, status: true },
    });
  },

  /** Get today's counted check-in status for a user across specified rituals */
  findCountedByUserAndDate(userId: string, localDate: string) {
    return prisma.ritualCheckIn.findMany({
      where: { userId, localDate, isCounted: true },
      select: { ritualId: true, status: true },
    });
  },

  /** Count distinct participants (users who have at least one counted check-in) per ritual */
  async countParticipantsByRitualIds(ritualIds: string[]) {
    const results = await prisma.ritualCheckIn.groupBy({
      by: ["ritualId"],
      where: { ritualId: { in: ritualIds }, isCounted: true },
      _count: { userId: true },
    });
    // groupBy counts all rows; we need distinct users
    const distinctResults = await Promise.all(
      ritualIds.map(async (ritualId) => {
        const count = await prisma.ritualCheckIn.findMany({
          where: { ritualId, isCounted: true },
          select: { userId: true },
          distinct: ["userId"],
        });
        return { ritualId, count: count.length };
      })
    );
    return distinctResults;
  },

  /** Get today's check-ins for a ritual with user info (for participants view) */
  findTodayCheckInsByRitual(ritualId: string, localDate: string) {
    return prisma.ritualCheckIn.findMany({
      where: { ritualId, localDate, isCounted: true },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get participant stats for a ritual: distinct users + total counted check-ins */
  async getParticipantStats(ritualId: string) {
    const [participants, totalCheckIns] = await Promise.all([
      prisma.ritualCheckIn.findMany({
        where: { ritualId, isCounted: true },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.ritualCheckIn.count({
        where: { ritualId, isCounted: true },
      }),
    ]);
    return { participantCount: participants.length, totalCheckIns };
  },

  /** Get all checked-in users for today with their total counts */
  async getTodayParticipantsWithStats(ritualId: string, localDate: string, totalDays: number) {
    // Get today's check-ins
    const todayCheckIns = await prisma.ritualCheckIn.findMany({
      where: { ritualId, localDate, isCounted: true },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get total counted check-in count per user who checked in today
    const userIds = [...new Set(todayCheckIns.map((c) => c.userId))];
    const userTotals = await Promise.all(
      userIds.map(async (userId) => {
        const count = await prisma.ritualCheckIn.count({
          where: { ritualId, userId, isCounted: true, status: "APPROVED" },
        });
        return { userId, count };
      })
    );
    const totalsByUser = new Map(userTotals.map((t) => [t.userId, t.count]));

    return todayCheckIns.map((c) => ({
      id: c.id,
      text: c.text,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt,
      status: c.status,
      user: {
        id: c.user.id,
        name: c.user.name,
        image: c.user.image,
      },
      userTotalCheckIns: totalsByUser.get(c.userId) ?? 0,
      totalDays,
    }));
  },
};
