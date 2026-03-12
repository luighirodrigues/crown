import { NextRequest } from "next/server";
import { channelRepository } from "@/repositories/channel.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const channels = await channelRepository.findAll(true);
    return Response.json(channels);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createChannelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  icon: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createChannelSchema.parse(body);

    const existing = await channelRepository.findBySlug(parsed.slug);
    if (existing) {
      return Response.json({ error: "Já existe um canal com esse slug" }, { status: 409 });
    }

    const channel = await channelRepository.create(parsed);
    return Response.json(channel, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
