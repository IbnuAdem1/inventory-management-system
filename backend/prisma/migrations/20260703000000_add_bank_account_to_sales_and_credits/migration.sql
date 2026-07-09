-- Migration: add_bank_account_to_sales_and_credits
-- Apply this via the Supabase SQL editor

-- 1. Add bank_account_id to sales table
ALTER TABLE "sales" 
  ADD COLUMN "bank_account_id" TEXT;

-- 2. Add bank_account_id to credit_payments table  
ALTER TABLE "credit_payments"
  ADD COLUMN "bank_account_id" TEXT;

-- 3. Add foreign key constraints
ALTER TABLE "sales"
  ADD CONSTRAINT "sales_bank_account_id_fkey"
  FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credit_payments"
  ADD CONSTRAINT "credit_payments_bank_account_id_fkey"
  FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
