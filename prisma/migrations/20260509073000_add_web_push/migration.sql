-- CreateEnum
CREATE TYPE "AdminNotificationBroadcastStatus" AS ENUM ('PROCESSING', 'PUSH_PENDING', 'COMPLETED', 'COMPLETED_WITH_PUSH_ERRORS', 'FAILED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "linkUrl" TEXT;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" VARCHAR(2048) NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "expirationTime" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotificationBroadcast" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "status" "AdminNotificationBroadcastStatus" NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "inAppCount" INTEGER NOT NULL DEFAULT 0,
    "pushAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "pushFailureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotificationBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_lastSeenAt_idx" ON "PushSubscription"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationBroadcast_idempotencyKey_key" ON "AdminNotificationBroadcast"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotificationBroadcast" ADD CONSTRAINT "AdminNotificationBroadcast_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
