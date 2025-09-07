-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('active', 'low_stock', 'out_of_stock');

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "stock_status" "StockStatus" NOT NULL DEFAULT 'active';
