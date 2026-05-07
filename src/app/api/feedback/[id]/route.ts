import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status: parsed.status },
    });

    return Response.json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
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

    await prisma.feedback.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}