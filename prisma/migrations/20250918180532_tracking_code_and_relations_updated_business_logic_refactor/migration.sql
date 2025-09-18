-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('CREATED', 'AWAITING_CHECKIN', 'AT_ORIGIN', 'IN_WAREHOUSE', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'EXCEPTION');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "currentWarehouseId" TEXT,
ADD COLUMN     "destinationId" TEXT,
ADD COLUMN     "lastScanAt" TIMESTAMP(3),
ADD COLUMN     "lastStatusAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "originId" TEXT,
ADD COLUMN     "status" "PackageStatus" NOT NULL DEFAULT 'CREATED';

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE INDEX "Package_currentWarehouseId_idx" ON "Package"("currentWarehouseId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_currentWarehouseId_fkey" FOREIGN KEY ("currentWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
