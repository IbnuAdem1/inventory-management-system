# BACKEND READINESS — AutoPartsPro
> Is the frontend ready for backend integration?

---

## Executive Summary

**Yes — the frontend is well-prepared for Supabase integration.**

Phases 0–3 deliberately built the frontend with the backend swap in mind. Every context, every mock data import, and every auth function has a TODO comment pointing to the exact Supabase call that replaces it. The migration path is clear and mechanical — no architecture changes are needed.

---

## What Makes It Ready

### 1. TypeScript types are defined and stable
`src/types/index.ts` defines `InventoryItem`, `Sale`, `Worker`, `ActivityLog`, etc. These types already mirror the planned Supabase table schema. When the Supabase SDK returns data, it will match these interfaces with only minor field naming adjustments (snake_case → camelCase).

### 2. All mock data is centralized
`src/data/mockData.ts` is the single source of truth. When Phase 4 starts, this file gets deleted and each `import { mockInventory }` line gets replaced with a `useQuery` call. No hunting through 10 different files.

### 3. Contexts are the integration seams
The three contexts (AuthContext, InventoryContext, SalesContext) are where ALL the swaps happen. The pages and components don't need to change at all — they just call `useInventory()`, `useSales()`, `useAuth()` as before.

### 4. `@tanstack/react-query` is already installed and configured
`QueryClient` is set up in App.tsx. Zero additional installation needed. Just start writing `useQuery` hooks.

### 5. AuthContext has exact TODO comments
```typescript
// TODO (Phase 4): replace with supabase.auth.signInWithPassword()
// TODO (Phase 4): replace with supabase.auth.signOut()
```
These are the exact lines to edit.

### 6. Supabase SQL schema is already written
The full `CREATE TABLE` statements with RLS policies are in `MASTER_IMPLEMENTATION_PLAN.md` Task 4.2. Copy, paste into Supabase SQL editor, run.

---

## What Needs to Be Created Before Integration Starts

These files do not exist yet and must be created first:

| File | What it is | Effort |
|---|---|---|
| `.env` | Supabase URL + anon key | 2 minutes |
| `.env.example` | Documents required variables | 2 minutes |
| `src/lib/supabase.ts` | Supabase client singleton | 5 minutes |

---

## Integration Map — Exact Replacements

### AuthContext.tsx

| Current (mock) | Replace with (Supabase) |
|---|---|
| `MOCK_CREDENTIALS` block | Delete |
| `login()` body — string comparison | `supabase.auth.signInWithPassword({ email, password })` |
| `logout()` body — localStorage.removeItem | `supabase.auth.signOut()` |
| `useEffect` — localStorage.getItem | `supabase.auth.onAuthStateChange(callback)` |
| `user` state — manual User object | User from Supabase session |

### InventoryContext.tsx

| Current (mock) | Replace with (Supabase) |
|---|---|
| `useState<InventoryItem[]>(mockInventory)` | `useQuery({ queryFn: () => supabase.from("inventory").select("*") })` |
| `addItem()` — setInventory | `useMutation` → `supabase.from("inventory").insert(item)` |
| `updateItem()` — setInventory | `useMutation` → `supabase.from("inventory").update(updates).eq("id", id)` |
| `deleteItem()` — setInventory filter | `useMutation` → `supabase.from("inventory").delete().eq("id", id)` |
| `decrementStock()` — setInventory map | `useMutation` → Supabase RPC or update with computed value |

### SalesContext.tsx

| Current (mock) | Replace with (Supabase) |
|---|---|
| `useState<Sale[]>(mockSales)` | `useQuery({ queryFn: () => supabase.from("sales").select("*").order("created_at", { ascending: false }) })` |
| `addSale()` — setSales | `useMutation` → `supabase.from("sales").insert(sale)` + invalidate inventory query |

---

## Database Schema (From MASTER_IMPLEMENTATION_PLAN.md)

```sql
-- Ready to run in Supabase SQL Editor

create table inventory (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  brand         text not null,
  compatibility text not null,
  cost_price    numeric(10,2) not null check (cost_price >= 0),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  stock         integer not null default 0 check (stock >= 0),
  min_stock     integer not null default 5 check (min_stock >= 0),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table sales (
  id              uuid primary key default uuid_generate_v4(),
  inventory_id    uuid references inventory(id),
  item_name       text not null,
  worker_name     text not null,
  customer        text not null default 'Walk-in',
  quantity        integer not null check (quantity > 0),
  amount          numeric(10,2) not null,
  payment_method  text not null check (payment_method in ('Cash', 'Transfer', 'Credit')),
  created_at      timestamptz default now()
);

create table activity_logs (
  id          uuid primary key default uuid_generate_v4(),
  worker_name text not null,
  action      text not null,
  detail      text not null,
  type        text not null check (type in ('sale', 'stock', 'auth', 'price')),
  created_at  timestamptz default now()
);

-- RLS policies (authenticated users only)
alter table inventory enable row level security;
alter table sales enable row level security;
alter table activity_logs enable row level security;

create policy "auth users full access on inventory"
  on inventory for all using (auth.role() = 'authenticated');

create policy "auth users full access on sales"
  on sales for all using (auth.role() = 'authenticated');

create policy "auth users can read activity logs"
  on activity_logs for select using (auth.role() = 'authenticated');

create policy "auth users can insert activity logs"
  on activity_logs for insert with check (auth.role() = 'authenticated');
```

---

## One Important Consideration: IDs

The frontend currently uses `number` IDs for inventory (`id: number`) and string IDs for sales (`id: string` like `"S-001"`). Supabase uses `uuid` by default.

**Two options:**

**Option A — Use integer IDs in Supabase** (minimal frontend change)
```sql
id bigint generated always as identity primary key
```
TypeScript `id: number` stays the same.

**Option B — Switch frontend to string UUIDs** (cleaner long-term)
Change `InventoryItem.id: number` → `InventoryItem.id: string` in `src/types/index.ts`. Update all comparisons from `=== id` to string comparison. Better for production.

**Recommendation:** Option B. UUIDs are correct for production and prevent ID collision issues. The type change is mechanical — TypeScript will flag every place that needs updating, making it safe.

---

## Risk Assessment

| Risk | Severity | Notes |
|---|---|---|
| `decrementStock` is currently in-memory and instant | Medium | With Supabase, stock must be decremented atomically. Use a DB function (RPC) or transaction. Otherwise a race condition allows overselling. |
| Workers list is hardcoded in `mockWorkers` | Medium | NewSaleForm populates the worker dropdown from `mockWorkers`. After Phase 4, this must come from Supabase Auth users or a `workers` table. |
| ActivityPage is 100% static | Low | ActivityPage won't auto-update when real logs are written. Needs a query hook and real log writes from mutation side effects. |
| No real-time updates | Low | With plain REST queries, two workers on different browsers won't see each other's sales without a refresh. Consider `supabase.channel()` subscriptions for live updates in Phase 4+. |

---

## Recommended Integration Order (Phase 4)

1. Create Supabase project and run the SQL schema
2. Create `.env` + `.env.example` + `src/lib/supabase.ts`
3. Replace AuthContext with Supabase auth (blocking — everything else needs a real user)
4. Create `src/hooks/useInventoryQuery.ts` with useQuery + mutations
5. Create `src/hooks/useSalesQuery.ts` with useQuery + mutation
6. Wire InventoryContext to the query hook (swap `mockInventory` → `useQuery`)
7. Wire SalesContext to the query hook (swap `mockSales` → `useQuery`)
8. Add loading states (skeletons) — now that async latency exists
9. Add error states — now that network failures are possible
10. Handle activity log writes as side effects of mutations
11. Swap `mockWorkers` in NewSaleForm with a real query for workers

---

## Verdict

The frontend is **ready for backend integration**. The architecture was designed for this transition. Start Phase 4 immediately — no refactoring needed first.

The only prerequisite: create a Supabase account and project (15 minutes, free).
