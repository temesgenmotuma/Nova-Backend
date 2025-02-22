/*
  Warnings:

  - A unique constraint covering the columns `[supabaseId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabaseId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabaseId]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabaseId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supabaseId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supabaseId` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "supabaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "supabaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "supabaseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_supabaseId_key" ON "Customer"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_supabaseId_key" ON "Employee"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_supabaseId_key" ON "Provider"("supabaseId");
