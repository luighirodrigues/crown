import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: courseId, lessonId } = await params;

    // Validate lesson belongs to course
    const course = await courseRepository.findByIdWithLessons(courseId);
    if (!course) {
      return Response.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return Response.json({ error: "Aula não encontrada neste curso" }, { status: 404 });
    }

    const progress = await courseRepository.completeLesson(user.id, lessonId);

    // Award points (idempotent)
    await Promise.all([
      pointsService.awardPoints(user.id, "COURSE_LESSON", "course_lesson", lessonId),
      presenceService.recordGeneral(user.id, "course_lesson", lessonId),
    ]);

    return Response.json(progress, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
