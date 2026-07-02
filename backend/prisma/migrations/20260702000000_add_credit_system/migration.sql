-- Migration: add_credit_system
-- Apply this via the Supabase SQL editor

-- 1. New enums
CREATE TYPE "CreditStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- Add CREDIT value to ActivityType enum (already exists as PaymentMethod value)
ALTER TYPE "ActivityType" ADD VALUE 'CREDIT';

-- 2. Credits table
CREATE TABLE "credits" (
    "id"            TEXT NOT NULL,
    "sale_id"       TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "total_amount"  DECIMAL(10,2) NOT NULL,
    "paid_amount"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status"        "CreditStatus" NOT NULL DEFAULT 'UNPAID',
    "notes"         TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- 3. Credit payments table
CREATE TABLE "credit_payments" (
    "id"              TEXT NOT NULL,
    "credit_id"       TEXT NOT NULL,
    "amount"          DECIMAL(10,2) NOT NULL,
    "payment_method"  "PaymentMethod" NOT NULL,
    "note"            TEXT,
    "recorded_by_id"  TEXT NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

-- 4. Unique constraint: one credit per sale
CREATE UNIQUE INDEX "credits_sale_id_key" ON "credits"("sale_id");

-- 5. Foreign keys
ALTER TABLE "credits"
    ADD CONSTRAINT "credits_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "credit_payments"
    ADD CONSTRAINT "credit_payments_credit_id_fkey"
    FOREIGN KEY ("credit_id") REFERENCES "credits"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "credit_payments"
    ADD CONSTRAINT "credit_payments_recorded_by_id_fkey"
    FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
