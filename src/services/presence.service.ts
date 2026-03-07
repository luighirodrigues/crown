import { presenceLedgerRepository } from "@/repositories/presence-ledger.repository";
import { Prisma } from "@prisma/client";

/**
 * Presence Engine — records user presence for engagement tracking.
 * Two types: GENERAL (any engagement) and ROUTINE (events + rituals).
 * Idempotent: duplicate entries are silently skipped.
 */
export const presenceService = {
  /**
   * Record a GENERAL presence entry (any action — posts, comments, likes, check-ins, etc.).
   */
  async recordGeneral(userId: string, sourceType: string, sourceId: string) {
    return this._record(userId, "GENERAL", sourceType, sourceId);
  },

  /**
   * Record a ROUTINE presence entry (events + rituals only).
   */
  async recordRoutine(userId: string, sourceType: string, sourceId: string) {
    return this._record(userId, "ROUTINE", sourceType, sourceId);
  },

  /**
   * Get presence counts for a user.
   */
  async getUserCounts(userId: string) {
    const [general, routine] = await Promise.all([
      presenceLedgerRepository.countByUserGeneral(userId),
      presenceLedgerRepository.countByUserRoutine(userId),
    ]);
    return { general, routine };
  },

  async _record(
    userId: string,
    type: "GENERAL" | "ROUTINE",
    sourceType: string,
    sourceId: string
  ) {
    try {
      return await presenceLedgerRepository.create({
        userId,
        type,
        sourceType,
        sourceId,
      });
    } catch (error) {
      // P2002 = unique constraint violation → idempotent, already recorded
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return null;
      }
      throw error;
    }
  },
};
