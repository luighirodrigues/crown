import { prisma } from "@/lib/prisma";

export const pointsRuleRepository = {
  findByKey(key: string) {
    return prisma.pointsRule.findUnique({ where: { key } });
  },

  findAllActive() {
    return prisma.pointsRule.findMany({ where: { active: true }, orderBy: { key: "asc" } });
  },

  findAll() {
    return prisma.pointsRule.findMany({ orderBy: { key: "asc" } });
  },

  update(key: string, data: { label?: string; points?: number; active?: boolean }) {
    return prisma.pointsRule.update({ where: { key }, data });
  },
};
