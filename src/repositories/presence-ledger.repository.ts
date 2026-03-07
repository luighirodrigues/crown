import { prisma } from "@/lib/prisma";
import type { PresenceType } from "@prisma/client";

interface CreatePresenceData {
  userId: string;
  type: PresenceType;
  sourceType: string;
  sourceId: string;
}

export const presenceLedgerRepository = {
  create(data: CreatePresenceData) {
    return prisma.presenceLedger.create({ data });
  },

  countByUser(userId: string, type?: PresenceType) {
    return prisma.presenceLedger.count({
      where: { userId, ...(type ? { type } : {}) },
    });
  },

  countByUserGeneral(userId: string) {
    return prisma.presenceLedger.count({
      where: { userId, type: "GENERAL" },
    });
  },

  countByUserRoutine(userId: string) {
    return prisma.presenceLedger.count({
      where: { userId, type: "ROUTINE" },
    });
  },
};
