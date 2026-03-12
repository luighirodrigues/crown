import { NextRequest } from "next/server";
import { channelRepository } from "@/repositories/channel.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens")
    .optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateChannelSchema.parse(body);

    if (parsed.slug) {
      const existing = await channelRepository.findBySlug(parsed.slug);
      if (existing && existing.id !== id) {
        return Response.json({ error: "Já existe um canal com esse slug" }, { status: 409 });
      }
    }

    const channel = await channelRepository.update(id, parsed);
    return Response.json(channel);
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
    await channelRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
