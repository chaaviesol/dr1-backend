/*
  Warnings:

  - Made the column `sales_id` on table `sales_list` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product_id` on table `sales_list` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sales_list" DROP CONSTRAINT "sales_list_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_list" DROP CONSTRAINT "sales_list_sales_id_fkey";

-- AlterTable
ALTER TABLE "sales_list" ALTER COLUMN "sales_id" SET NOT NULL,
ALTER COLUMN "product_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "generic_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
