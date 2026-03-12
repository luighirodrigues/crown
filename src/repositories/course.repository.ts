import { prisma } from "@/lib/prisma";

export const courseRepository = {
  findAllWithLessons() {
    return prisma.course.findMany({
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findByIdWithLessons(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });
  },

  create(data: {
    name: string;
    description: string;
    imageUrl?: string;
  }) {
    return prisma.course.create({ data });
  },

  update(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string | null;
  }) {
    return prisma.course.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.course.delete({ where: { id } });
  },

  createLesson(data: {
    courseId: string;
    title: string;
    link: string;
    order?: number;
  }) {
    return prisma.courseLesson.create({ data });
  },

  findLessonById(id: string) {
    return prisma.courseLesson.findUnique({ where: { id } });
  },

  updateLesson(id: string, data: {
    title?: string;
    link?: string;
    order?: number;
  }) {
    return prisma.courseLesson.update({ where: { id }, data });
  },

  deleteLesson(id: string) {
    return prisma.courseLesson.delete({ where: { id } });
  },
};
