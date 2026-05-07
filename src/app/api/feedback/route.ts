import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleAuthError } from "@/lib/auth/rbac";
import { storage, StorageError } from "@/lib/storage";
import { z } from "zod/v4";

const feedbackSchema = z.object({
  type: z.enum(["ideia", "bug", "outro"]),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(500, "Máximo 500 caracteres"),
  isAnonymous: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();

    const type = formData.get("type") as string;
    const message = formData.get("message") as string;
    const isAnonymous = formData.get("isAnonymous") === "true";
    const imageFile = formData.get("image");

    const parsed = feedbackSchema.parse({ type, message, isAnonymous });

    let imageUrl: string | undefined;
    if (imageFile instanceof File && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await storage.uploadFile(buffer, imageFile.name, imageFile.type, "feedback");
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type: parsed.type,
        message: parsed.message,
        imageUrl,
        isAnonymous: parsed.isAnonymous ?? false,
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Feedback enviado!",
        body: "Agradecemos seu feedback. Nossa equipe irá analisar em breve.",
      },
    });

    return Response.json(feedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return handleAuthError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const skip = (page - 1) * limit;

    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return Response.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}