-- Restructure sales into Sale + SaleItem (one-to-many)
-- Applied manually via Supabase SQL Editor

-- Drop old flat sales table
DROP TABLE IF EXISTS "sales" CASCADE;

-- New sales table: one row = one transaction header
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "customer" TEXT NOT NULL DEFAULT 'Walk-in',
    "payment_method" "PaymentMethod" NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- New sale_items table: one row = one product line
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "sales" ADD CONSTRAINT "sales_worker_id_fkey"
    FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_inventory_id_fkey"
    FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
