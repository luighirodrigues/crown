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

  createLesson(data: {
    courseId: string;
    title: string;
    link: string;
    order?: number;
  }) {
    return prisma.courseLesson.create({ data });
  },
};
