/*
  Warnings:

  - You are about to drop the column `document_image_id` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_CategoryImages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CategoryVideos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubcategoryImages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubcategoryVideos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[image_id]` on the table `client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profile_image_id]` on the table `driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transaction_id]` on the table `transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `vendor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wallet_id]` on the table `vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - The required column `transaction_id` was added to the `transaction` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscription_id` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `wallet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('active', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- DropForeignKey
ALTER TABLE "_CategoryImages" DROP CONSTRAINT "_CategoryImages_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryImages" DROP CONSTRAINT "_CategoryImages_B_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryVideos" DROP CONSTRAINT "_CategoryVideos_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryVideos" DROP CONSTRAINT "_CategoryVideos_B_fkey";

-- DropForeignKey
ALTER TABLE "_SubcategoryImages" DROP CONSTRAINT "_SubcategoryImages_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubcategoryImages" DROP CONSTRAINT "_SubcategoryImages_B_fkey";

-- DropForeignKey
ALTER TABLE "_SubcategoryVideos" DROP CONSTRAINT "_SubcategoryVideos_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubcategoryVideos" DROP CONSTRAINT "_SubcategoryVideos_B_fkey";

-- DropForeignKey
ALTER TABLE "cash_out_request" DROP CONSTRAINT "cash_out_request_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cash_out_request" DROP CONSTRAINT "cash_out_request_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_document_image_id_fkey";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_fayda_image_id_fkey";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_license_image_id_fkey";

-- DropForeignKey
ALTER TABLE "image" DROP CONSTRAINT "image_category_id_fkey";

-- DropForeignKey
ALTER TABLE "image" DROP CONSTRAINT "image_product_id_fkey";

-- DropForeignKey
ALTER TABLE "image" DROP CONSTRAINT "image_subcategory_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_business_license_image_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_cover_image_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_fayda_image_id_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_category_id_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_product_id_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_subcategory_id_fkey";

-- DropIndex
DROP INDEX "driver_document_image_id_key";

-- DropIndex
DROP INDEX "subscription_vendor_id_key";

-- AlterTable
ALTER TABLE "cash_out_request" ALTER COLUMN "vendor_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "image_id" INTEGER;

-- AlterTable
ALTER TABLE "driver" DROP COLUMN "document_image_id",
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile_image_id" INTEGER;

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "vendor_id",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'completed',
ADD COLUMN     "transaction_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "picture",
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "name" TEXT,
ADD COLUMN     "status" BOOLEAN DEFAULT true,
ADD COLUMN     "subscription_id" INTEGER NOT NULL,
ADD COLUMN     "wallet_id" INTEGER;

-- AlterTable
ALTER TABLE "wallet" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "WalletStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "_CategoryImages";

-- DropTable
DROP TABLE "_CategoryVideos";

-- DropTable
DROP TABLE "_SubcategoryImages";

-- DropTable
DROP TABLE "_SubcategoryVideos";

-- DropTable
DROP TABLE "image";

-- DropTable
DROP TABLE "video";

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "product_id" INTEGER,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "video_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "product_id" INTEGER,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_image_id_key" ON "client"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profile_image_id_key" ON "driver"("profile_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_transaction_id_key" ON "transaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_name_key" ON "vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_wallet_id_key" ON "vendor"("wallet_id");

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_fayda_image_id_fkey" FOREIGN KEY ("fayda_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_business_license_image_id_fkey" FOREIGN KEY ("business_license_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_profile_image_id_fkey" FOREIGN KEY ("profile_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_license_image_id_fkey" FOREIGN KEY ("license_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_fayda_image_id_fkey" FOREIGN KEY ("fayda_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_out_request" ADD CONSTRAINT "cash_out_request_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_out_request" ADD CONSTRAINT "cash_out_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
