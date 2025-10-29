-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_merchantId_fkey";

-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "merchantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
