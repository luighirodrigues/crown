import { z } from "zod/v4";
import { channelRepository } from "@/repositories/channel.repository";

export const createChannelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  icon: z.string().optional(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const channelService = {
  async list() {
    return channelRepository.findAll();
  },

  async create(input: CreateChannelInput) {
    const existing = await channelRepository.findBySlug(input.slug);
    if (existing) {
      throw new Error("Já existe um canal com esse slug");
    }
    return channelRepository.create(input);
  },
};
