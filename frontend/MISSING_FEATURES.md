# MISSING FEATURES — AutoPartsPro
> Everything that is not yet built, organized by priority

---

## Legend
- 🔴 Blocker — app cannot be used in production without this
- 🟡 High — users will notice this is missing immediately
- 🟠 Medium — important for a complete product
- 🟢 Nice to have — polish and extras

---

## PHASE 4 — Backend & Real Data (Not Started)

### Supabase Setup

| # | Feature | Priority | Notes |
|---|---|---|---|
| BE-01 | Supabase project creation | 🔴 | Free tier available at supabase.com |
| BE-02 | Database tables: `inventory`, `sales`, `activity_logs` | 🔴 | SQL in MASTER_IMPLEMENTATION_PLAN.md Task 4.2 |
| BE-03 | Row Level Security (RLS) policies | 🔴 | Already written in the SQL plan |
| BE-04 | `.env` file with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | 🔴 | No env file exists yet |
| BE-05 | `.env.example` file | 🟡 | Documents required variables |
| BE-06 | `src/lib/supabase.ts` — Supabase client singleton | 🔴 | Nothing to query without this |

### Real Authentication

| # | Feature | Priority | Notes |
|---|---|---|---|
| AU-01 | Replace mock `login()` with `supabase.auth.signInWithPassword()` | 🔴 | Currently accepts hardcoded credentials only |
| AU-02 | Replace mock `logout()` with `supabase.auth.signOut()` | 🔴 | Current logout only clears localStorage |
| AU-03 | Auth state from `supabase.auth.onAuthStateChange()` | 🔴 | Required for real session management |
| AU-04 | Multi-user login (workers can log in, not just owner) | 🟡 | Role-based UI differences (worker vs owner) |
| AU-05 | Session token expiry and refresh | 🟡 | Currently sessions never expire |

### Real Data Hooks

| # | Feature | Priority | Notes |
|---|---|---|---|
| DH-01 | `src/hooks/useInventoryQuery.ts` — fetch inventory from Supabase | 🔴 | Replace `mockInventory` in InventoryContext |
| DH-02 | `src/hooks/useSalesQuery.ts` — fetch sales from Supabase | 🔴 | Replace `mockSales` in SalesContext |
| DH-03 | `src/hooks/useActivityLogsQuery.ts` — fetch logs from Supabase | 🟡 | ActivityPage is fully static now |
| DH-04 | Mutations: add/update/delete inventory via Supabase | 🔴 | Currently only in-memory |
| DH-05 | Mutation: insert sale + decrement stock (atomic via DB function) | 🔴 | Currently in-memory Context |
| DH-06 | Activity log writes on every user action | 🟡 | Nothing gets written to activity_logs table |

---

## PHASE 5 — UI Completeness (Not Started)

### Sales Module Gaps

| # | Feature | Priority | Notes |
|---|---|---|---|
| SM-01 | Edit/Void a sale | 🟡 | No update or cancel mechanism for existing sales |
| SM-02 | Invoice/Receipt generation | 🟡 | Invoice button exists in the table but has no handler |
| SM-03 | Print receipt (window.print() approach) | 🟠 | Simple implementation with CSS print styles |
| SM-04 | Sale detail view / modal | 🟠 | Currently no way to expand a sale's details |

### Reports Page Gaps

| # | Feature | Priority | Notes |
|---|---|---|---|
| RP-01 | Charts: bar chart for monthly revenue vs profit (recharts installed) | 🟠 | recharts is installed, never wired up |
| RP-02 | Charts: pie/donut chart for expense breakdown | 🟠 | recharts is installed, never wired up |
| RP-03 | Stat cards pulling from real computed data | 🟡 | Currently hardcoded strings like "$24,800" |
| RP-04 | CSV export — downloads a file | 🟡 | Export button exists, no handler |
| RP-05 | Date range filter | 🟠 | Reports always show fixed months |

### Activity Page Gaps

| # | Feature | Priority | Notes |
|---|---|---|---|
| AP-01 | Real activity logs (from DB / context actions) | 🟡 | Currently 100% static mock data |
| AP-02 | Filter by worker | 🟠 | No way to view one worker's activity |
| AP-03 | Filter by date / date range | 🟠 | Currently shows only "today" label but no filtering |
| AP-04 | Pagination of log entries | 🟠 | Will get very long with real data |

### Settings Page (Empty Shell)

| # | Feature | Priority | Notes |
|---|---|---|---|
| ST-01 | Change password form | 🟡 | Currently just a decorative card |
| ST-02 | Worker/user management (add, edit, deactivate workers) | 🟡 | Cards are placeholders only |
| ST-03 | Low-stock alert threshold configuration | 🟠 | Currently hardcoded per-item `minStock` |
| ST-04 | Notification preferences | 🟠 | Placeholder card only |
| ST-05 | Business info / store name | 🟢 | Nice to have |

### Loading & Error States

| # | Feature | Priority | Notes |
|---|---|---|---|
| LS-01 | Skeleton loaders for Inventory table while fetching | 🟡 | Nothing indicates data is loading |
| LS-02 | Skeleton loaders for Sales table while fetching | 🟡 | Same |
| LS-03 | Skeleton loaders for Dashboard stat cards | 🟠 | |
| LS-04 | Error state UI when a query fails | 🟡 | No error boundaries, no retry UI |
| LS-05 | React Error Boundary component | 🟡 | App can crash silently without one |
| LS-06 | Toast on query failure | 🟡 | No feedback when DB operations fail |

### Pagination

| # | Feature | Priority | Notes |
|---|---|---|---|
| PG-01 | Pagination on Inventory table | 🟠 | Will break at 100+ items |
| PG-02 | Pagination on Sales table | 🟠 | Will break at 100+ sales |

---

## PHASE 6 — Testing (Not Started)

| # | Feature | Priority | Notes |
|---|---|---|---|
| TS-01 | Unit tests for utility functions (getLowStockItems, getMarginPercent, etc.) | 🟡 | Only trivial `expect(true)` test exists |
| TS-02 | Component tests for StatCard, search filters | 🟠 | |
| TS-03 | Form validation tests (Add/Edit/NewSale forms) | 🟠 | |
| TS-04 | Integration test: login flow | 🟡 | |
| TS-05 | Integration test: add inventory item | 🟡 | |
| TS-06 | Integration test: new sale + stock decrement | 🟡 | |
| TS-07 | E2E tests (Playwright) for core flows | 🟠 | Playwright installed, no test files |

---

## PHASE 7 — Deployment (Not Started)

| # | Feature | Priority | Notes |
|---|---|---|---|
| DP-01 | Push to GitHub | 🔴 | Required for Vercel deployment |
| DP-02 | Deploy to Vercel | 🔴 | DEPLOYMENT_GUIDE.md has full instructions |
| DP-03 | Set env vars in Vercel dashboard | 🔴 | After Supabase project is created |
| DP-04 | Configure Supabase site URL | 🔴 | Auth callbacks won't work without this |
| DP-05 | Custom domain (optional) | 🟢 | Optional — step in DEPLOYMENT_GUIDE.md |

---

## Known Dead Code / Cleanup

| # | Item | Priority | Notes |
|---|---|---|---|
| CL-01 | Remove `lovable-tagger` dev dependency | 🟢 | Lovable AI artifact in package.json |
| CL-02 | README.md is a placeholder ("TODO: Document your project") | 🟠 | |
| CL-03 | `@tanstack/react-query` configured but zero hooks exist | — | Will be used in Phase 4 |
| CL-04 | `next-themes` installed but dark/light toggle not implemented | 🟢 | Either implement or remove |
| CL-05 | `date-fns` + `react-day-picker` installed but never used | 🟢 | Will be needed for date filtering in reports |

---

## Summary by Count

| Priority | Count |
|---|---|
| 🔴 Blocker (must have before real users) | 14 |
| 🟡 High (users notice immediately) | 16 |
| 🟠 Medium (important but not critical) | 17 |
| 🟢 Nice to have / polish | 5 |
| **Total missing items** | **52** |
