import { prisma } from "@/lib/prisma";

interface CreateLedgerData {
  userId: string;
  ruleKey: string;
  points: number;
  sourceType: string;
  sourceId: string;
}

export const pointsLedgerRepository = {
  create(data: CreateLedgerData) {
    return prisma.pointsLedger.create({ data });
  },

  findByUser(userId: string, opts: { take?: number; skip?: number } = {}) {
    const { take = 50, skip = 0 } = opts;
    return prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  },

  sumByUser(userId: string) {
    return prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    });
  },

  /**
   * Sum tributos for a user within a date range (UTC boundaries computed by caller).
   */
  sumByUserAndRange(userId: string, start: Date, end: Date) {
    return prisma.pointsLedger.aggregate({
      where: {
        userId,
        createdAt: { gte: start, lt: end },
      },
      _sum: { points: true },
    });
  },

  /**
   * Ranking: group by userId, sum points within date range, ordered desc.
   */
  rankByRange(start: Date, end: Date, limit: number = 10) {
    return prisma.pointsLedger.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start, lt: end } },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
  },
};
