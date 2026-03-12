import { NextRequest } from "next/server";
import { eventRepository } from "@/repositories/event.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  datetime: z.iso.datetime().optional(),
  link: z.string().url().nullable().optional(),
  location: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateEventSchema.parse(body);

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.datetime) data.datetime = new Date(parsed.datetime);

    const event = await eventRepository.update(id, data as Parameters<typeof eventRepository.update>[1]);
    return Response.json(event);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    await eventRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
