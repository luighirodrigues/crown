import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  link: z.string().url().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { lessonId } = await params;
    const body = await request.json();
    const parsed = updateLessonSchema.parse(body);
    const lesson = await courseRepository.updateLesson(lessonId, parsed);
    return Response.json(lesson);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { lessonId } = await params;
    await courseRepository.deleteLesson(lessonId);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
