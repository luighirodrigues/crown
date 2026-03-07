import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const onboardingSchema = z.object({
  name: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres").max(100),
  phone: z.string().min(8, "Telefone inválido").max(20).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(10).optional(),
});

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const profile = await prisma.profile.findUnique({
      where: { userId: sessionUser.id },
    });
    return Response.json({
      onboardingComplete: profile?.onboardingComplete ?? false,
      name: sessionUser.name,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    // Update user name
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name: data.name },
    });

    // Update or create profile
    await prisma.profile.upsert({
      where: { userId: sessionUser.id },
      update: {
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        interests: data.interests ?? [],
        skills: data.skills ?? [],
        onboardingComplete: true,
      },
      create: {
        userId: sessionUser.id,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        interests: data.interests ?? [],
        skills: data.skills ?? [],
        onboardingComplete: true,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
