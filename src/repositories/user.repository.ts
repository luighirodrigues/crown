import { prisma } from "@/lib/prisma";
import { Role, SubscriptionStatus } from "@prisma/client";

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  findBySlug(slug: string) {
    return prisma.user.findUnique({
      where: { slug },
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

  findAllWithCounts() {
    return prisma.user.findMany({
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            pointsLedger: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateProfile(userId: string, data: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  updateRole(userId: string, role: Role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true },
    });
  },

  updateSubscriptionStatus(userId: string, subscriptionStatus: SubscriptionStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus },
      include: { profile: true },
    });
  },
};
