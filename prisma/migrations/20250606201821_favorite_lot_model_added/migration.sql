-- CreateTable
CREATE TABLE "FavoriteLot" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteLot_customerId_lotId_key" ON "FavoriteLot"("customerId", "lotId");

-- AddForeignKey
ALTER TABLE "FavoriteLot" ADD CONSTRAINT "FavoriteLot_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteLot" ADD CONSTRAINT "FavoriteLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
