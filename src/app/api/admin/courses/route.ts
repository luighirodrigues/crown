import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const courses = await courseRepository.findAllWithLessons();
    return Response.json(courses);
  } catch (error) {
    return handleAuthError(error);
  }
}

const createCourseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = createCourseSchema.parse(body);
    const course = await courseRepository.create(parsed);
    return Response.json(course, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
