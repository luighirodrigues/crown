import { NextRequest } from "next/server";
import { commentService, createCommentSchema } from "@/services/comment.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const comments = await commentService.listByPost(id);
    return Response.json(comments);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = createCommentSchema.parse(body);
    const comment = await commentService.create(id, parsed, user.id);
    return Response.json(comment, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
