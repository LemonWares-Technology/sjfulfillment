/*
  Warnings:

  - You are about to drop the column `description` on the `refund_requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `merchants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "refund_requests" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "OrderAddon" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "addonServiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundRequestId" TEXT,
    "deliveryMetricsId" TEXT,

    CONSTRAINT "OrderAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_verificationToken_key" ON "merchants"("verificationToken");

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_addonServiceId_fkey" FOREIGN KEY ("addonServiceId") REFERENCES "addon_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_refundRequestId_fkey" FOREIGN KEY ("refundRequestId") REFERENCES "refund_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_deliveryMetricsId_fkey" FOREIGN KEY ("deliveryMetricsId") REFERENCES "delivery_metrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
