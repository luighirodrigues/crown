import { NextRequest } from "next/server";
import { courseRepository } from "@/repositories/course.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const { id } = await params;
    const course = await courseRepository.findByIdWithLessons(id);
    if (!course) {
      return Response.json({ error: "Curso não encontrado" }, { status: 404 });
    }
    return Response.json(course);
  } catch (error) {
    return handleAuthError(error);
  }
}

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCourseSchema.parse(body);
    const course = await courseRepository.update(id, parsed);
    return Response.json(course);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    await courseRepository.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
