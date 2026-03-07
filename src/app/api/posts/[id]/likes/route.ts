import { NextRequest } from "next/server";
import { likeService } from "@/services/like.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await likeService.toggle(id, user.id);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
