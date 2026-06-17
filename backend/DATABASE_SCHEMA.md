# DATABASE SCHEMA — AutoPartsPro
> PostgreSQL on Supabase, managed via Prisma ORM

---

## 1. Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────────┐
│      users       │         │        inventory          │
│──────────────────│         │──────────────────────────│
│ id (UUID) PK     │         │ id (UUID) PK              │
│ email (unique)   │         │ name                      │
│ password_hash    │         │ brand                     │
│ name             │         │ compatibility             │
│ role             │         │ cost_price (Decimal)      │
│ created_at       │         │ selling_price (Decimal)   │
│ updated_at       │         │ stock (Int)               │
│ is_active (Bool) │         │ min_stock (Int)           │
└──────┬───────────┘         │ created_at                │
       │                     │ updated_at                │
       │  1                  └──────────┬────────────────┘
       │                               │ 1
       │  *                            │ *
┌──────▼───────────────────────────────▼────────────────┐
│                         sales                          │
│────────────────────────────────────────────────────────│
│ id (UUID) PK                                           │
│ inventory_id (UUID) FK → inventory.id                  │
│ worker_id (UUID) FK → users.id                         │
│ item_name (String) — snapshot of part name at sale     │
│ customer (String, default "Walk-in")                   │
│ quantity (Int)                                         │
│ unit_price (Decimal) — snapshot of price at sale time  │
│ amount (Decimal) — total charged                       │
│ payment_method (Enum: CASH, TRANSFER, CREDIT)          │
│ created_at                                             │
└──────────────────────────────────────────────────────┬─┘
                                                       │
       ┌───────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│              activity_logs                   │
│──────────────────────────────────────────────│
│ id (UUID) PK                                 │
│ worker_id (UUID) FK → users.id               │
│ worker_name (String) — snapshot              │
│ action (String) — e.g. "Recorded sale"       │
│ detail (String) — e.g. "Brake Pads x2 $170" │
│ type (Enum: SALE, STOCK, AUTH, PRICE)        │
│ created_at                                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│               expenses                        │
│──────────────────────────────────────────────│
│ id (UUID) PK                                 │
│ category (String)                            │
│ amount (Decimal)                             │
│ month (Int) — 1–12                           │
│ year (Int)                                   │
│ created_at                                   │
└──────────────────────────────────────────────┘
```

---

## 2. Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum Role {
  OWNER
  WORKER
}

enum PaymentMethod {
  CASH
  TRANSFER
  CREDIT
}

enum ActivityType {
  SALE
  STOCK
  AUTH
  PRICE
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  role         Role     @default(WORKER)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sales        Sale[]
  activityLogs ActivityLog[]

  @@map("users")
}

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

model Inventory {
  id            String   @id @default(uuid())
  name          String
  brand         String
  compatibility String
  costPrice     Decimal  @map("cost_price") @db.Decimal(10, 2)
  sellingPrice  Decimal  @map("selling_price") @db.Decimal(10, 2)
  stock         Int      @default(0)
  minStock      Int      @default(5) @map("min_stock")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  sales         Sale[]

  @@map("inventory")
}

// ─────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────

model Sale {
  id            String        @id @default(uuid())
  inventoryId   String        @map("inventory_id")
  workerId      String        @map("worker_id")
  itemName      String        @map("item_name")
  customer      String        @default("Walk-in")
  quantity      Int
  unitPrice     Decimal       @map("unit_price") @db.Decimal(10, 2)
  amount        Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod @map("payment_method")
  createdAt     DateTime      @default(now()) @map("created_at")

  inventory     Inventory     @relation(fields: [inventoryId], references: [id])
  worker        User          @relation(fields: [workerId], references: [id])

  @@map("sales")
}

// ─────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────

model ActivityLog {
  id         String       @id @default(uuid())
  workerId   String       @map("worker_id")
  workerName String       @map("worker_name")
  action     String
  detail     String
  type       ActivityType
  createdAt  DateTime     @default(now()) @map("created_at")

  worker     User         @relation(fields: [workerId], references: [id])

  @@map("activity_logs")
}

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

model Expense {
  id        String   @id @default(uuid())
  category  String
  amount    Decimal  @db.Decimal(10, 2)
  month     Int
  year      Int
  createdAt DateTime @default(now()) @map("created_at")

  @@map("expenses")
}
```

---

## 3. Table Descriptions

### users
Stores all staff accounts. The `role` field controls access:
- `OWNER` — can see cost prices, reports, and manage workers
- `WORKER` — can record sales and view inventory (selling price only, no cost price)

`is_active` allows soft-deactivating a worker without deleting their sales history.

### inventory
Each row is one spare part SKU. `min_stock` is the threshold that triggers low-stock alerts. `cost_price` is sensitive — never returned to WORKER-role requests.

### sales
Immutable records — sales are never edited or deleted (audit trail). `item_name`, `unit_price` are denormalized snapshots so the sale record is accurate even if the inventory item is later renamed or repriced. `inventory_id` and `worker_id` are foreign keys for relational queries.

### activity_logs
Append-only audit trail. Written server-side on every significant action. `worker_name` is snapshotted to preserve historical record even if a user is deleted.

### expenses
Monthly operating expenses (rent, salaries, utilities, etc.) per month/year. Needed for the Reports page profit calculation.

---

## 4. Database Constraints

| Table | Constraint | Rule |
|---|---|---|
| users | email UNIQUE | One account per email |
| inventory | stock >= 0 | Enforced in service layer (Prisma doesn't have check constraints directly, but migration SQL can add them) |
| inventory | selling_price > 0 | Service layer + Zod validation |
| sales | quantity > 0 | Zod validation |
| sales | amount > 0 | Computed server-side, always positive |
| expenses | month BETWEEN 1 AND 12 | Service layer validation |
| expenses | year > 2000 | Service layer validation |

---

## 5. Indexes

```sql
-- Frequently queried columns
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_worker_id ON sales(worker_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_inventory_stock ON inventory(stock);
CREATE INDEX idx_expenses_month_year ON expenses(month, year);
```

These are defined in Prisma schema using `@@index([fieldName])` directive.

---

## 6. Data Migration Plan

### From mock data to real data

When the backend is first deployed, a seed script will populate the database with initial data:

1. Create the owner user account
2. Optionally seed the 8 mock inventory items (for testing/demo purposes)
3. Workers are added through the Settings UI after deployment

**Seed file location:** `prisma/seed.ts`
**Run command:** `npx prisma db seed`

### Migration workflow

```
Development:   npx prisma migrate dev --name <description>
               (creates migration file + applies to dev DB)

Production:    npx prisma migrate deploy
               (applies pending migrations to prod DB without prompting)
```

Every schema change = one new migration file. Never edit existing migration files.

---

## 7. Supabase Connection

Supabase provides the DATABASE_URL. It looks like this:

```
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

The `?pgbouncer=true` is important — Supabase uses connection pooling (PgBouncer). For Prisma, you also need a direct URL for migrations:

```
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Both are added to `.env` and referenced in `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Accidental deletion of production data | Supabase provides daily backups on free tier |
| Schema drift between dev and prod | Always use `prisma migrate deploy` — never edit prod DB manually |
| Connection pool exhaustion | PgBouncer URL handles pooling; never instantiate multiple Prisma clients |
| Decimal precision issues | Use `Decimal` Prisma type + `db.Decimal(10,2)` — never store money as Float |
