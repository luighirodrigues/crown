import { NextRequest } from "next/server";
import { userRepository } from "@/repositories/user.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateMemberSchema = z.object({
  subscriptionStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("ADMIN");
    const { id } = await params;

    const user = await userRepository.findById(id);
    if (!user) {
      return Response.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateMemberSchema.parse(body);

    if (parsed.subscriptionStatus) {
      // Prevent self-suspension
      if (currentUser.id === id && parsed.subscriptionStatus !== "ACTIVE") {
        return Response.json({ error: "Você não pode suspender a si mesmo" }, { status: 400 });
      }
      const updated = await userRepository.updateSubscriptionStatus(id, parsed.subscriptionStatus);
      return Response.json(updated);
    }

    return Response.json(user);
  } catch (error) {
    return handleAuthError(error);
  }
}
