-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('client', 'vendor_owner', 'driver', 'admin', 'employee');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('individual', 'business');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('available', 'on_delivery', 'offline');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('not_assigned', 'assigned', 'out_for_delivery', 'delivered');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('wallet', 'external', 'cod');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('new', 'processing', 'completed');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('pending', 'resolved', 'refunded');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "CashOutRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "RatingEntityType" AS ENUM ('product', 'vendor');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "picture" TEXT,
    "type" "UserType" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "payment_method_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" SERIAL NOT NULL,
    "type" "VendorType" NOT NULL,
    "cover_image_id" INTEGER,
    "description" TEXT,
    "fayda_image_id" INTEGER,
    "business_license_image_id" INTEGER,
    "rating_id" INTEGER,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_id" INTEGER,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" SERIAL NOT NULL,
    "vehicle_info" TEXT,
    "current_status" "DriverStatus" NOT NULL,
    "license_image_id" INTEGER,
    "fayda_image_id" INTEGER,
    "document_image_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "wallet_id" INTEGER,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_item" (
    "id" SERIAL NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wishlist_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "wishlist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adsyoumightbeinterestedin" (
    "id" SERIAL NOT NULL,
    "ad_content" TEXT NOT NULL,
    "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clicked_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER,

    CONSTRAINT "adsyoumightbeinterestedin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" SERIAL NOT NULL,
    "search_query" TEXT NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "has_discount" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "subcategory_id" INTEGER NOT NULL,
    "rating_id" INTEGER,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "product_id" INTEGER,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video" (
    "id" SERIAL NOT NULL,
    "video_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "product_id" INTEGER,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spec" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "spec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating" (
    "id" SERIAL NOT NULL,
    "entity_type" "RatingEntityType" NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "sum_ratings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethodType" NOT NULL,
    "payment_id" INTEGER,
    "status" "OrderStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "id" SERIAL NOT NULL,
    "qr_code" TEXT,
    "delivery_status" "DeliveryStatus" NOT NULL DEFAULT 'not_assigned',
    "delivered_at" TIMESTAMP(3),
    "client_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "tip_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "order_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "rating_id" INTEGER,

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_status_log" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "delivery_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER NOT NULL,

    CONSTRAINT "delivery_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "file_url" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'pending',
    "order_id" INTEGER NOT NULL,
    "issued_by_id" INTEGER NOT NULL,
    "issued_to_id" INTEGER NOT NULL,

    CONSTRAINT "complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "complaint_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "processed_by_id" INTEGER NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" SERIAL NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wallet_id" INTEGER NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_out_request" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CashOutRequestStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "cash_out_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "type" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor_id" INTEGER,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" SERIAL NOT NULL,
    "plan" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_category" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "vendor_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductWishlistItems" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductWishlistItems_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubcategoryProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SubcategoryProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubcategoryImages" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SubcategoryImages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryImages" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryImages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryVideos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryVideos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubcategoryVideos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SubcategoryVideos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserPaymentMethods" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPaymentMethods_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "user"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_cover_image_id_key" ON "vendor"("cover_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_fayda_image_id_key" ON "vendor"("fayda_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_business_license_image_id_key" ON "vendor"("business_license_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_rating_id_key" ON "vendor"("rating_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_user_id_key" ON "vendor"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_user_id_key" ON "client"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_wallet_id_key" ON "client"("wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_license_image_id_key" ON "driver"("license_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_fayda_image_id_key" ON "driver"("fayda_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_document_image_id_key" ON "driver"("document_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_user_id_key" ON "driver"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_wallet_id_key" ON "driver"("wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_rating_id_key" ON "product"("rating_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_entity_id_key" ON "rating"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_order_id_key" ON "delivery"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_rating_id_key" ON "delivery"("rating_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_order_id_key" ON "complaint"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_complaint_id_key" ON "refund"("complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_id_key" ON "wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_user_id_key" ON "employee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_vendor_id_key" ON "subscription"("vendor_id");

-- CreateIndex
CREATE INDEX "_ProductWishlistItems_B_index" ON "_ProductWishlistItems"("B");

-- CreateIndex
CREATE INDEX "_SubcategoryProducts_B_index" ON "_SubcategoryProducts"("B");

-- CreateIndex
CREATE INDEX "_SubcategoryImages_B_index" ON "_SubcategoryImages"("B");

-- CreateIndex
CREATE INDEX "_CategoryImages_B_index" ON "_CategoryImages"("B");

-- CreateIndex
CREATE INDEX "_CategoryVideos_B_index" ON "_CategoryVideos"("B");

-- CreateIndex
CREATE INDEX "_CategoryProducts_B_index" ON "_CategoryProducts"("B");

-- CreateIndex
CREATE INDEX "_SubcategoryVideos_B_index" ON "_SubcategoryVideos"("B");

-- CreateIndex
CREATE INDEX "_UserPaymentMethods_B_index" ON "_UserPaymentMethods"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_fayda_image_id_fkey" FOREIGN KEY ("fayda_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_business_license_image_id_fkey" FOREIGN KEY ("business_license_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_license_image_id_fkey" FOREIGN KEY ("license_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_fayda_image_id_fkey" FOREIGN KEY ("fayda_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_document_image_id_fkey" FOREIGN KEY ("document_image_id") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adsyoumightbeinterestedin" ADD CONSTRAINT "adsyoumightbeinterestedin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adsyoumightbeinterestedin" ADD CONSTRAINT "adsyoumightbeinterestedin_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spec" ADD CONSTRAINT "spec_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_entity_id_vendor_fkey" FOREIGN KEY ("entity_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_entity_id_product_fkey" FOREIGN KEY ("entity_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_entity_id_delivery_fkey" FOREIGN KEY ("entity_id") REFERENCES "delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_status_log" ADD CONSTRAINT "delivery_status_log_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_status_log" ADD CONSTRAINT "delivery_status_log_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_issued_to_id_fkey" FOREIGN KEY ("issued_to_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_out_request" ADD CONSTRAINT "cash_out_request_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_out_request" ADD CONSTRAINT "cash_out_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory" ADD CONSTRAINT "subcategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category" ADD CONSTRAINT "vendor_category_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category" ADD CONSTRAINT "vendor_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductWishlistItems" ADD CONSTRAINT "_ProductWishlistItems_A_fkey" FOREIGN KEY ("A") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductWishlistItems" ADD CONSTRAINT "_ProductWishlistItems_B_fkey" FOREIGN KEY ("B") REFERENCES "wishlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryProducts" ADD CONSTRAINT "_SubcategoryProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryProducts" ADD CONSTRAINT "_SubcategoryProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryImages" ADD CONSTRAINT "_SubcategoryImages_A_fkey" FOREIGN KEY ("A") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryImages" ADD CONSTRAINT "_SubcategoryImages_B_fkey" FOREIGN KEY ("B") REFERENCES "subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryImages" ADD CONSTRAINT "_CategoryImages_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryImages" ADD CONSTRAINT "_CategoryImages_B_fkey" FOREIGN KEY ("B") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryVideos" ADD CONSTRAINT "_CategoryVideos_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryVideos" ADD CONSTRAINT "_CategoryVideos_B_fkey" FOREIGN KEY ("B") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryProducts" ADD CONSTRAINT "_CategoryProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryProducts" ADD CONSTRAINT "_CategoryProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryVideos" ADD CONSTRAINT "_SubcategoryVideos_A_fkey" FOREIGN KEY ("A") REFERENCES "subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubcategoryVideos" ADD CONSTRAINT "_SubcategoryVideos_B_fkey" FOREIGN KEY ("B") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPaymentMethods" ADD CONSTRAINT "_UserPaymentMethods_A_fkey" FOREIGN KEY ("A") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPaymentMethods" ADD CONSTRAINT "_UserPaymentMethods_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
