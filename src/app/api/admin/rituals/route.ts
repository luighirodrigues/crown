import { NextRequest } from "next/server";
import { ritualRepository } from "@/repositories/ritual.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const rituals = await ritualRepository.findAll();
    return Response.json(rituals);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createRitualSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().url().optional(),
  pointsValue: z.number().int().min(0).default(0),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  autoApprove: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createRitualSchema.parse(body);

    const ritual = await ritualRepository.create({
      ...parsed,
      startAt: new Date(parsed.startAt),
      endAt: new Date(parsed.endAt),
    });
    return Response.json(ritual, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
