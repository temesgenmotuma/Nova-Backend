/*
  Warnings:

  - You are about to drop the column `password` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `passsword` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "passsword";
