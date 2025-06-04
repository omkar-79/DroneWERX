/*
  Warnings:

  - Added the required column `updatedAt` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Made the column `checksum` on table `attachments` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update any NULL checksum values
UPDATE "attachments" SET "checksum" = '' WHERE "checksum" IS NULL;

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "accessPolicy" TEXT,
ADD COLUMN     "bucketName" TEXT NOT NULL DEFAULT 'dronewerx-media',
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "processingError" TEXT,
ADD COLUMN     "storageKey" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "width" INTEGER,
ALTER COLUMN "checksum" SET NOT NULL,
ALTER COLUMN "checksum" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "attachments_uploadedBy_idx" ON "attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "attachments_storageKey_idx" ON "attachments"("storageKey");

-- CreateIndex
CREATE INDEX "attachments_mimeType_idx" ON "attachments"("mimeType");
