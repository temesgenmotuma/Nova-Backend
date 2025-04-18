-- CreateTable
CREATE TABLE "ProviderSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "ProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderDefaultSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderDefaultSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valetTicket" (
    "id" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerEmail" TEXT,
    "customerId" TEXT,
    "issuedBy" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "valetTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProviderSetting" ADD CONSTRAINT "ProviderSetting_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valetTicket" ADD CONSTRAINT "valetTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valetTicket" ADD CONSTRAINT "valetTicket_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valetTicket" ADD CONSTRAINT "valetTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
