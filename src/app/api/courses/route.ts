import { courseRepository } from "@/repositories/course.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    await requireAuth();
    const courses = await courseRepository.findAllWithLessons();
    return Response.json(courses);
  } catch (error) {
    return handleAuthError(error);
  }
}
