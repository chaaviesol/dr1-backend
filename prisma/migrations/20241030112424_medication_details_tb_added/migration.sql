/*
  Warnings:

  - You are about to drop the column `medication_details` on the `sales_invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sales_invoice" DROP COLUMN "medication_details";

-- CreateTable
CREATE TABLE "medication_details" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "medicine" INTEGER,
    "afterFd_beforeFd" TEXT,
    "totalQuantity" TEXT,
    "timing" JSONB,
    "takingQuantity" TEXT,
    "created_date" TIMESTAMP(3),
    "sales_invoiceid" INTEGER,

    CONSTRAINT "medication_details_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medication_details" ADD CONSTRAINT "medication_details_sales_invoiceid_fkey" FOREIGN KEY ("sales_invoiceid") REFERENCES "sales_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_details" ADD CONSTRAINT "medication_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_details" ADD CONSTRAINT "medication_details_medicine_fkey" FOREIGN KEY ("medicine") REFERENCES "generic_product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
