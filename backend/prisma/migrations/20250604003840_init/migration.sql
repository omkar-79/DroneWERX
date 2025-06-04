/*
  Warnings:

  - You are about to drop the column `voteType` on the `votes` table. All the data in the column will be lost.
  - Added the required column `title` to the `solutions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SolutionStatus" ADD VALUE 'DRAFT';
ALTER TYPE "SolutionStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "SolutionStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "SolutionStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "solutions" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "color" SET DEFAULT '#3B82F6';

-- AlterTable
ALTER TABLE "threads" ADD COLUMN     "deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "voteType",
ADD COLUMN     "type" "VoteType" NOT NULL;

-- CreateTable
CREATE TABLE "thread_views" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thread_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "thread_views_threadId_viewedAt_idx" ON "thread_views"("threadId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "thread_views_threadId_userId_key" ON "thread_views"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "thread_views_threadId_ipAddress_key" ON "thread_views"("threadId", "ipAddress");

-- AddForeignKey
ALTER TABLE "thread_views" ADD CONSTRAINT "thread_views_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_views" ADD CONSTRAINT "thread_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
