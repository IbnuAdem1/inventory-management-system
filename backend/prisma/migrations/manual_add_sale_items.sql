-- ─────────────────────────────────────────────────────────────
-- MANUAL MIGRATION: Restructure sales + add sale_items table
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

-- Step 1: Drop old sales table (no real data yet — only seeded users/inventory)
DROP TABLE IF EXISTS "sales" CASCADE;

-- Step 2: Create new sales table (one row = one transaction)
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "customer" TEXT NOT NULL DEFAULT 'Walk-in',
    "payment_method" "PaymentMethod" NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create sale_items table (one row = one product line in a sale)
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

-- Step 4: Add foreign keys
ALTER TABLE "sales"
    ADD CONSTRAINT "sales_worker_id_fkey"
    FOREIGN KEY ("worker_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sale_items"
    ADD CONSTRAINT "sale_items_inventory_id_fkey"
    FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Mark migration as applied in Prisma's tracking table
-- This tells Prisma this schema state is already in the database
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    gen_random_uuid()::text,
    'manual_migration',
    NOW(),
    '20260616090000_add_sale_items',
    NULL,
    NULL,
    NOW(),
    1
);
