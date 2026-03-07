import { prisma } from "@/lib/prisma";

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findAll() {
    return prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
  },

  updateProfile(userId: string, data: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },
};
