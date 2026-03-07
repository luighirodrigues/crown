import { NextRequest } from "next/server";
import { channelService, createChannelSchema } from "@/services/channel.service";
import { requireAuth, requireRole, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    await requireAuth();
    const channels = await channelService.list();
    return Response.json(channels);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createChannelSchema.parse(body);
    const channel = await channelService.create(parsed);
    return Response.json(channel, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
