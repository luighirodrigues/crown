import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const course = await courseRepository.findByIdWithLessons(id);
    if (!course) {
      return Response.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const progress = await courseRepository.findUserProgress(user.id);
    const completedSet = new Set(progress.map((p) => p.lessonId));

    const enriched = {
      ...course,
      completedLessons: course.lessons.filter((l) => completedSet.has(l.id)).length,
      lessons: course.lessons.map((l) => ({
        ...l,
        completed: completedSet.has(l.id),
      })),
    };

    return Response.json(enriched);
  } catch (error) {
    return handleAuthError(error);
  }
}
