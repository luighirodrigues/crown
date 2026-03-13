import { courseRepository } from "@/repositories/course.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const user = await requireAuth();
    const [courses, progress] = await Promise.all([
      courseRepository.findAllWithLessons(),
      courseRepository.findUserProgress(user.id),
    ]);

    const completedSet = new Set(progress.map((p) => p.lessonId));

    const enriched = courses.map((course) => ({
      ...course,
      completedLessons: course.lessons.filter((l) => completedSet.has(l.id)).length,
    }));

    return Response.json(enriched);
  } catch (error) {
    return handleAuthError(error);
  }
}
