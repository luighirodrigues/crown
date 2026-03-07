import { NextRequest } from "next/server";
import { approvalService } from "@/services/approval.service";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const { id } = await params;
    const body = await request.json();
    const parsed = approvalActionSchema.parse(body);

    let result;
    if (parsed.action === "approve") {
      result = await approvalService.approveCheckIn(id, user.id, parsed.reviewNote);
    } else {
      if (!parsed.reviewNote) {
        return Response.json(
          { error: "Motivo é obrigatório ao reprovar" },
          { status: 400 }
        );
      }
      result = await approvalService.rejectCheckIn(id, user.id, parsed.reviewNote);
    }

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
