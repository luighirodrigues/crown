import { z } from "zod/v4";
import { missionRepository } from "@/repositories/mission.repository";
import { missionCompletionRepository } from "@/repositories/mission-completion.repository";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { Prisma } from "@prisma/client";

export const createMissionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
  autoApprove: z.boolean().default(false),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  tributos: z.number().int().min(0).default(0),
});

export type CreateMissionInput = z.infer<typeof createMissionSchema>;

export const submitCompletionSchema = z.object({
  evidenceUrl: z.string().url().optional(),
});

export type SubmitCompletionInput = z.infer<typeof submitCompletionSchema>;

export const missionService = {
  async listAll() {
    return missionRepository.findAll();
  },

  async listActive() {
    return missionRepository.findActive();
  },

  async findById(id: string) {
    return missionRepository.findById(id);
  },

  async create(input: CreateMissionInput) {
    return missionRepository.create({
      name: input.name,
      description: input.description,
      type: input.type,
      autoApprove: input.autoApprove,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
      tributos: input.tributos,
    });
  },

  /**
   * Submit a mission completion for a user.
   * If autoApprove → APPROVED immediately + award points/presence.
   * If !autoApprove → PENDING (no points/presence yet).
   */
  async submitCompletion(missionId: string, userId: string, input: SubmitCompletionInput) {
    const mission = await missionRepository.findById(missionId);
    if (!mission) throw new Error("Missão não encontrada");

    // Check if already completed (unique constraint will catch duplicates)
    const existing = await missionCompletionRepository.findByUserAndMission(userId, missionId);
    if (existing) throw new Error("Você já completou esta missão");

    const status = mission.autoApprove ? "APPROVED" : "PENDING";

    try {
      const completion = await missionCompletionRepository.create({
        missionId,
        userId,
        evidenceUrl: input.evidenceUrl,
        status,
      });

      // If auto-approved, award points/presence immediately
      if (mission.autoApprove) {
        await Promise.all([
          pointsService.awardPoints(userId, "MISSION_COMPLETE", "mission", completion.id),
          presenceService.recordGeneral(userId, "mission", completion.id),
        ]);
      }

      return completion;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Você já completou esta missão");
      }
      throw error;
    }
  },

  /**
   * Get user's completion status for a specific mission.
   */
  async getUserCompletion(missionId: string, userId: string) {
    return missionCompletionRepository.findByUserAndMission(userId, missionId);
  },
};
