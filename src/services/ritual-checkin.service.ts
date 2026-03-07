import { z } from "zod/v4";
import { ritualCheckInRepository } from "@/repositories/ritual-checkin.repository";
import { ritualRepository } from "@/repositories/ritual.repository";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { toZonedTime, format } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";

export const createCheckInSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;

/**
 * Compute the current date in Brasília timezone as YYYY-MM-DD string.
 */
export function getBrasiliaLocalDate(date: Date = new Date()): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd", { timeZone: TIMEZONE });
}

export const ritualCheckInService = {
  async listActive() {
    return ritualRepository.findActive();
  },

  async listAll() {
    return ritualRepository.findAll();
  },

  /**
   * Create a check-in enforcing all business rules:
   * 1. Ritual must exist
   * 2. Check-in must be within ritual period (startAt <= now <= endAt in Brasília)
   * 3. Only the first check-in of the day is counted (isCounted = true)
   * 4. If autoApprove + isCounted: APPROVED immediately + award points/presence
   * 5. If !autoApprove + isCounted: PENDING (no points/presence yet)
   * 6. If !isCounted: record kept but not counted
   */
  async createCheckIn(ritualId: string, input: CreateCheckInInput, userId: string) {
    const ritual = await ritualRepository.findById(ritualId);
    if (!ritual) {
      throw new Error("Ritual não encontrado");
    }

    // Validate period: check-in only valid within ritual's active period
    const now = new Date();
    if (now < ritual.startAt || now > ritual.endAt) {
      throw new Error("Ritual fora do período ativo. Check-in não permitido.");
    }

    const localDate = getBrasiliaLocalDate(now);

    // Check if there's already a counted check-in for this user+ritual+date
    const existingCounted = await ritualCheckInRepository.findCountedByDate(
      userId,
      ritualId,
      localDate
    );

    const isFirstOfDay = !existingCounted;

    // Determine status
    let status: "APPROVED" | "PENDING" = "PENDING";
    if (isFirstOfDay && ritual.autoApprove) {
      status = "APPROVED";
    }

    const checkIn = await ritualCheckInRepository.create({
      ritualId,
      userId,
      text: input.text,
      imageUrl: input.imageUrl,
      localDate,
      status,
      isCounted: isFirstOfDay,
    });

    // If counted + auto-approved → award points and presence immediately
    if (isFirstOfDay && ritual.autoApprove) {
      await Promise.all([
        pointsService.awardPoints(userId, "RITUAL_CHECKIN", "ritual_checkin", checkIn.id),
        presenceService.recordGeneral(userId, "ritual_checkin", checkIn.id),
        presenceService.recordRoutine(userId, "ritual_checkin", checkIn.id),
      ]);
    }

    return checkIn;
  },

  /**
   * Delete a check-in. If it was the counted one, promote the next oldest.
   */
  async deleteCheckIn(checkInId: string, userId: string) {
    const checkIn = await ritualCheckInRepository.findById(checkInId);
    if (!checkIn) throw new Error("Check-in não encontrado");
    if (checkIn.userId !== userId) throw new Error("Sem permissão para apagar este check-in");

    const wasCounted = checkIn.isCounted;
    const { ritualId, localDate } = checkIn;

    await ritualCheckInRepository.delete(checkInId);

    // If the deleted check-in was the counted one, promote the next oldest
    if (wasCounted) {
      const remaining = await ritualCheckInRepository.findAllByDate(userId, ritualId, localDate);
      if (remaining.length > 0) {
        const promoted = remaining[0]; // oldest remaining
        await ritualCheckInRepository.updateIsCounted(promoted.id, true);

        // If the promoted check-in is already APPROVED, award points/presence (idempotent)
        if (promoted.status === "APPROVED") {
          await Promise.all([
            pointsService.awardPoints(userId, "RITUAL_CHECKIN", "ritual_checkin", promoted.id),
            presenceService.recordGeneral(userId, "ritual_checkin", promoted.id),
            presenceService.recordRoutine(userId, "ritual_checkin", promoted.id),
          ]);
        }
      }
    }
  },

  /**
   * Get user's check-in status for a ritual on a given date.
   */
  async getCheckInStatus(userId: string, ritualId: string, localDate?: string) {
    const date = localDate ?? getBrasiliaLocalDate();
    const checkIns = await ritualCheckInRepository.findAllByDate(userId, ritualId, date);
    const counted = checkIns.find((c) => c.isCounted);
    return {
      hasCheckIn: checkIns.length > 0,
      isCounted: !!counted,
      countedStatus: counted?.status ?? null,
      checkIns,
    };
  },
};
