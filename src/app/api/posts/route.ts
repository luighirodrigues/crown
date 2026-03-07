import { NextRequest } from "next/server";
import { postService, createPostSchema } from "@/services/post.service";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const take = Number(searchParams.get("take") || 20);
    const skip = Number(searchParams.get("skip") || 0);

    const posts = await postService.listByChannel(channelId, { take, skip });
    return Response.json(posts);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = createPostSchema.parse(body);
    const post = await postService.create(parsed, user.id);
    return Response.json(post, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
