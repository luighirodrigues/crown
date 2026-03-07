/*
  Warnings:

  - A unique constraint covering the columns `[missionId,userId]` on the table `MissionCompletion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RitualCheckIn" ADD COLUMN     "isCounted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Event_datetime_idx" ON "Event"("datetime");

-- CreateIndex
CREATE INDEX "MissionCompletion_userId_createdAt_idx" ON "MissionCompletion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCompletion_missionId_userId_key" ON "MissionCompletion"("missionId", "userId");
