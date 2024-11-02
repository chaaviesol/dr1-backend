/*
  Warnings:

  - You are about to drop the column `invoice_no` on the `sales_invoice` table. All the data in the column will be lost.
  - You are about to drop the `medication_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "medication_details" DROP CONSTRAINT "medication_details_medicine_fkey";

-- DropForeignKey
ALTER TABLE "medication_details" DROP CONSTRAINT "medication_details_sales_invoiceid_fkey";

-- DropForeignKey
ALTER TABLE "medication_details" DROP CONSTRAINT "medication_details_userId_fkey";

-- AlterTable
ALTER TABLE "generic_product" ADD COLUMN     "hsn" TEXT;

-- AlterTable
ALTER TABLE "medicine_timetable" ADD COLUMN     "app_flag" BOOLEAN,
ADD COLUMN     "sales_invoiceid" INTEGER;

-- AlterTable
ALTER TABLE "sales_invoice" DROP COLUMN "invoice_no";

-- AlterTable
ALTER TABLE "sales_list" ADD COLUMN     "batch_no" TEXT,
ADD COLUMN     "selling_price" INTEGER;

-- DropTable
DROP TABLE "medication_details";

-- AddForeignKey
ALTER TABLE "medicine_timetable" ADD CONSTRAINT "medicine_timetable_sales_invoiceid_fkey" FOREIGN KEY ("sales_invoiceid") REFERENCES "sales_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
