import { NextRequest } from "next/server";
import { eventRepository } from "@/repositories/event.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { notificationTriggerService } from "@/services/notification-trigger.service";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const events = await eventRepository.findAll();
    return Response.json(events);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  datetime: z.iso.datetime(),
  link: z.string().url().optional(),
  location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createEventSchema.parse(body);

    const event = await eventRepository.create({
      ...parsed,
      datetime: new Date(parsed.datetime),
    });

    // Notify all active users about the new event
    await notificationTriggerService.onEventCreated(
      event.title,
      event.datetime.toISOString()
    );

    return Response.json(event, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
