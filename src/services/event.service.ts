import { z } from "zod/v4";
import { eventRepository } from "@/repositories/event.repository";

export const createEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  datetime: z.iso.datetime(),
  link: z.string().url().optional(),
  location: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const eventService = {
  async listUpcoming(limit?: number) {
    return eventRepository.findUpcoming(limit);
  },

  async create(input: CreateEventInput) {
    return eventRepository.create({
      ...input,
      datetime: new Date(input.datetime),
    });
  },
};
