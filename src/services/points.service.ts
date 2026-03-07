import { pointsRuleRepository } from "@/repositories/points-rule.repository";
import { pointsLedgerRepository } from "@/repositories/points-ledger.repository";
import { Prisma } from "@prisma/client";

/**
 * Tributos Engine — awards points based on configurable PointsRule entries.
 * Idempotent: duplicate (userId, sourceType, sourceId, ruleKey) is silently skipped.
 */
export const pointsService = {
  /**
   * Award points to a user for an action.
   * Returns the ledger entry if created, or null if rule inactive/disabled or duplicate.
   */
  async awardPoints(
    userId: string,
    ruleKey: string,
    sourceType: string,
    sourceId: string
  ) {
    const rule = await pointsRuleRepository.findByKey(ruleKey);
    if (!rule || !rule.active) return null;

    try {
      const entry = await pointsLedgerRepository.create({
        userId,
        ruleKey,
        points: rule.points,
        sourceType,
        sourceId,
      });
      return entry;
    } catch (error) {
      // P2002 = unique constraint violation → idempotent, already awarded
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get a user's total tributos.
   */
  async getUserTotal(userId: string) {
    const result = await pointsLedgerRepository.sumByUser(userId);
    return result._sum.points ?? 0;
  },

  /**
   * Get a user's point history (extrato).
   */
  async getUserHistory(userId: string, opts?: { take?: number; skip?: number }) {
    return pointsLedgerRepository.findByUser(userId, opts);
  },
};
