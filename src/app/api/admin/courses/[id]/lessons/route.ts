import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const createLessonSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  link: z.string().url("Link deve ser uma URL válida"),
  order: z.number().int().min(0).default(0),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id: courseId } = await params;

    const course = await courseRepository.findByIdWithLessons(courseId);
    if (!course) {
      return Response.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createLessonSchema.parse(body);
    const lesson = await courseRepository.createLesson({ ...parsed, courseId });
    return Response.json(lesson, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
