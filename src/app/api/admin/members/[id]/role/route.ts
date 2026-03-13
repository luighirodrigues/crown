import { NextRequest } from "next/server";
import { userRepository } from "@/repositories/user.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateRoleSchema = z.object({
  role: z.enum(["MEMBER", "ADMIN", "MODERATOR"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("ADMIN");
    const { id } = await params;

    // Prevent self-demotion
    if (currentUser.id === id) {
      return Response.json({ error: "Você não pode alterar seu próprio papel" }, { status: 400 });
    }

    const user = await userRepository.findById(id);
    if (!user) {
      return Response.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateRoleSchema.parse(body);

    const updated = await userRepository.updateRole(id, parsed.role);
    return Response.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
