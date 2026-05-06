import { NextRequest } from "next/server";
import { bannerRepository } from "@/repositories/banner.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const banners = await bannerRepository.findAll();
    return Response.json(banners);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createBannerSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  imageUrl: z.string().min(1, "Imagem é obrigatória"),
  linkUrl: z.string().url().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createBannerSchema.parse(body);
    const banner = await bannerRepository.create(parsed);
    return Response.json(banner, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
