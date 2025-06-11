
-- CreateTable
CREATE TABLE "Cost" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "margin" DECIMAL(65,30) NOT NULL,
    "lotId" TEXT NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "maxPrice" DECIMAL(65,30) NOT NULL,
    "minPrice" DECIMAL(65,30) NOT NULL,
    "valetPrice" DECIMAL(65,30) NOT NULL,
    "lotId" TEXT NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_lotId_key" ON "Pricing"("lotId");

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
