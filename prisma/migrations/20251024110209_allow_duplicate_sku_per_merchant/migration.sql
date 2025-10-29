/*
  Warnings:

  - A unique constraint covering the columns `[sku,merchantId]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "products_sku_key";

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_merchantId_key" ON "products"("sku", "merchantId");
