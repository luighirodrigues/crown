import { NextRequest } from "next/server";
import { bannerRepository } from "@/repositories/banner.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateBannerSchema = z.object({
  title: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  linkUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateBannerSchema.parse(body);
    const banner = await bannerRepository.update(id, parsed);
    return Response.json(banner);
  } catch (error) {
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
    await bannerRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
