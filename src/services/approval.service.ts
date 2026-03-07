import { ritualCheckInRepository } from "@/repositories/ritual-checkin.repository";
import { missionCompletionRepository } from "@/repositories/mission-completion.repository";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { notificationTriggerService } from "@/services/notification-trigger.service";

/**
 * Approval Workflow — manages PENDING → APPROVED/REJECTED transitions.
 * On approval: awards points and presence. On rejection: notifies with reason.
 */
export const approvalService = {
  // ─── Queues ────────────────────────────────────────────

  async listPendingCheckIns() {
    return ritualCheckInRepository.findPending();
  },

  async listPendingMissions() {
    return missionCompletionRepository.findPending();
  },

  // ─── Ritual Check-in Approval ──────────────────────────

  async approveCheckIn(checkInId: string, reviewerId: string, reviewNote?: string) {
    const checkIn = await ritualCheckInRepository.updateStatus(
      checkInId,
      "APPROVED",
      reviewerId,
      reviewNote
    );

    // Award points and presence (idempotent)
    await Promise.all([
      pointsService.awardPoints(
        checkIn.userId,
        "RITUAL_CHECKIN",
        "ritual_checkin",
        checkIn.id
      ),
      presenceService.recordGeneral(checkIn.userId, "ritual_checkin", checkIn.id),
      presenceService.recordRoutine(checkIn.userId, "ritual_checkin", checkIn.id),
    ]);

    // Notify user
    await notificationTriggerService.onApprovalStatusChanged(
      checkIn.userId,
      "Check-in",
      "APPROVED",
      reviewNote
    );

    return checkIn;
  },

  async rejectCheckIn(checkInId: string, reviewerId: string, reviewNote: string) {
    const checkIn = await ritualCheckInRepository.updateStatus(
      checkInId,
      "REJECTED",
      reviewerId,
      reviewNote
    );

    await notificationTriggerService.onApprovalStatusChanged(
      checkIn.userId,
      "Check-in",
      "REJECTED",
      reviewNote
    );

    return checkIn;
  },

  // ─── Mission Completion Approval ───────────────────────

  async approveMission(completionId: string, reviewerId: string, reviewNote?: string) {
    const completion = await missionCompletionRepository.updateStatus(
      completionId,
      "APPROVED",
      reviewerId,
      reviewNote
    );

    // Award points and presence (idempotent)
    await Promise.all([
      pointsService.awardPoints(
        completion.userId,
        "MISSION_COMPLETE",
        "mission",
        completion.id
      ),
      presenceService.recordGeneral(completion.userId, "mission", completion.id),
    ]);

    // Notify user
    await notificationTriggerService.onApprovalStatusChanged(
      completion.userId,
      "Missão",
      "APPROVED",
      reviewNote
    );

    return completion;
  },

  async rejectMission(completionId: string, reviewerId: string, reviewNote: string) {
    const completion = await missionCompletionRepository.updateStatus(
      completionId,
      "REJECTED",
      reviewerId,
      reviewNote
    );

    await notificationTriggerService.onApprovalStatusChanged(
      completion.userId,
      "Missão",
      "REJECTED",
      reviewNote
    );

    return completion;
  },
};
