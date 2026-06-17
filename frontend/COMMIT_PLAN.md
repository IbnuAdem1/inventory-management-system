# COMMIT PLAN — AutoPartsPro

> This file tracks every commit across all 7 phases.
> Each entry has the exact commands to run, the files involved, and a precise description of what changed.
> Run all commands from inside the `frontend/` folder.

---

## ✅ PHASE 0 — Cleanup & Foundation

> NOTE: All Phase 0 changes were made before the first git commit, so the entire
> frontend is untracked. Stage everything in one initial commit, then continue
> with individual commits from Phase 1 onward.

---

### Commit 1: `feat: initial frontend — AutoPartsPro Phase 0 complete`

```
git add frontend/
git commit -m "feat: initial frontend — AutoPartsPro Phase 0 complete"
git push
```

**What this captures (all Phase 0 work in one shot):**

- `tsconfig.app.json` — TypeScript strict mode enabled: `"strict": true`, `"noImplicitAny": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noFallthroughCasesInSwitch": true`
- `src/pages/Index.tsx` — deleted (Lovable placeholder, never registered in router)
- `src/components/NavLink.tsx` — deleted (never imported anywhere)
- `src/App.css` — deleted (Vite boilerplate, unused in this dark-theme app)
- `src/pages/NotFound.tsx` — replaced `<a href="/">` with `<Link to="/">` to prevent full page reload on 404
- `src/types/index.ts` — new file, centralized type definitions: `InventoryItem`, `Sale`, `Worker`, `ActivityLog`, `MonthlyReport`, `Expense`, `PaymentMethod`, `ActivityType`, `StatData`
- `src/data/mockData.ts` — new file, single source of truth for all mock data + helper functions (`getTodayString`, `getLowStockItems`, `getSalesByDate`, `getTotalRevenue`, `getMarginPercent`)
- `src/pages/InventoryPage.tsx` — removed inline inventory array, imports from `@/data/mockData`
- `src/pages/SalesPage.tsx` — removed inline sales array and hardcoded date `"2026-03-31"`, uses `getTodayString()` so today's total is always live
- `src/pages/ReportsPage.tsx` — removed inline data arrays, imports from `@/data/mockData`
- `src/pages/ActivityPage.tsx` — removed inline workers and logs arrays, imports from `@/data/mockData`
- `src/components/RecentSalesTable.tsx` — removed local sales array, now synced to shared mockSales via `getSalesByDate()`
- `src/components/LowStockAlerts.tsx` — removed local inventory array, now synced to shared mockInventory via `getLowStockItems()`
- `src/index.css` — moved Google Fonts `@import` above `@tailwind` directives (CSS spec requirement)
- `index.html` — updated title, meta description, OG tags; removed all Lovable CDN branding
- `PROJECT_ANALYSIS.md`, `MASTER_IMPLEMENTATION_PLAN.md`, `DEPLOYMENT_GUIDE.md`, `ENV_SETUP_GUIDE.md`, `PRODUCTION_CHECKLIST.md`, `COMMIT_PLAN.md` — full documentation suite added

---

## 🔲 PHASE 1 — Authentication & Route Protection

---

### Commit 9: `feat: add AuthContext with login/logout and localStorage persistence`

```
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext with login/logout and localStorage persistence"
git push
```

**What changed:**
- `src/contexts/AuthContext.tsx` — new file, global auth state provider:
  - `User` interface: `email`, `name`, `role` (`"owner" | "worker"`)
  - `AuthProvider` wraps the app and exposes `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`
  - On startup: restores session from `localStorage` key `"autoparts_user"` so login survives page refresh
  - `login(email, password)` — checks against `MOCK_CREDENTIALS` (email: `owner@autopartspro.com`, password: `admin123`), returns `true` on success / `false` on failure; saves user to localStorage on success
  - `logout()` — clears user state and removes the localStorage key
  - `useAuth()` hook — throws if called outside `<AuthProvider>` so misuse is caught at runtime
  - Phase 4 note in comments: replace `login()` body with `supabase.auth.signInWithPassword()`

---

### Commit 10: `feat: add ProtectedRoute component`

```
git add frontend/src/components/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component"
git push
```

**What changed:**
- `src/components/ProtectedRoute.tsx` — new file, route guard component:
  - While `isLoading` is true (checking localStorage on startup): renders a centered amber spinner to prevent a flash of the login page when the user is already logged in
  - If not authenticated: redirects to `/` with `<Navigate replace />`
  - If authenticated: renders `{children}` normally

---

### Commit 11: `feat: wrap app with AuthProvider and protect all dashboard routes`

```
git add frontend/src/App.tsx
git commit -m "feat: wrap app with AuthProvider and protect all dashboard routes"
git push
```

**What changed:**
- `src/App.tsx` — wrapped entire app with `<AuthProvider>` (inside `QueryClientProvider`, outside `TooltipProvider`)
- Removed unused `Navigate` import
- All 6 dashboard routes (`/dashboard`, `/inventory`, `/sales`, `/reports`, `/activity`, `/settings`) now wrapped with `<ProtectedRoute>` — unauthenticated users are redirected to `/`
- `/` (LoginPage) and `*` (NotFound) remain public

---

### Commit 12: `feat: connect LoginPage to real auth with error handling`

```
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: connect LoginPage to real auth with error handling"
git push
```

**What changed:**
- `src/pages/LoginPage.tsx` — replaced fake `navigate("/dashboard")` with real auth flow:
  - Imports and calls `login()` from `useAuth()`
  - `isSubmitting` state disables the form and shows a `<Loader2>` spinner on the button during the login call
  - On `login()` returning `false`: sets `error` state, displays a red error box below the password field
  - On success: navigates to `/dashboard`
  - Added `disabled={isSubmitting}` on both inputs to prevent double-submit
  - Added `autoComplete="email"` and `autoComplete="current-password"` for browser autofill support
  - Added `aria-label` on show/hide password toggle button for accessibility

---

### Commit 13: `feat: wire up Sign Out button in DashboardLayout`

```
git add frontend/src/components/DashboardLayout.tsx
git commit -m "feat: wire up Sign Out button in DashboardLayout"
git push
```

**What changed:**
- `src/components/DashboardLayout.tsx` — Sign Out is now fully functional:
  - Imports `useAuth` and `useNavigate`
  - `handleSignOut()` calls `logout()` then `navigate("/")` — clears session and redirects to login
  - Top bar name and role now show real user data from `user?.name` and `user?.role` instead of hardcoded `"Owner"` / `"Admin"`
  - Avatar initial is derived dynamically from `user?.name?.charAt(0)`
  - Added `aria-label` on hamburger menu open/close buttons for accessibility

---

## ✅ PHASE 2 — State Management & Data Layer

---

### Commit 7: `feat: add InventoryContext for shared inventory state`

```
git add frontend/src/contexts/InventoryContext.tsx
git add frontend/src/pages/InventoryPage.tsx
git add frontend/src/components/LowStockAlerts.tsx
git commit -m "feat: add InventoryContext for shared inventory state"
git push
```

**What changed:**
- `src/contexts/InventoryContext.tsx` — new file, global inventory state:
  - Initialised from `mockInventory` (Phase 4: replace with Supabase query)
  - `addItem(item)` — appends new item with auto-incremented id + timestamps
  - `updateItem(id, updates)` — merges partial updates, sets `updatedAt`
  - `deleteItem(id)` — removes item by id
  - `decrementStock(id, qty)` — reduces stock by qty, floors at 0 (called by SalesContext on new sale)
  - `lowStockItems` — `useMemo` derived list of items where `stock <= minStock`
  - `totalItems` — `useMemo` sum of all stock units
  - `totalStockValue` — `useMemo` sum of `sellingPrice * stock` across all items
  - Re-exports `getMarginPercent` so consumers only need one import
- `src/pages/InventoryPage.tsx` — swapped `mockInventory` import for `useInventory()`, added empty state row when search returns 0 results, added `aria-label` on Edit/Delete buttons
- `src/components/LowStockAlerts.tsx` — swapped `mockInventory` + `getLowStockItems` for `useInventory().lowStockItems` — now always live with inventory changes

---

### Commit 8: `feat: add SalesContext for shared sales state`

```
git add frontend/src/contexts/SalesContext.tsx
git add frontend/src/pages/SalesPage.tsx
git add frontend/src/pages/DashboardPage.tsx
git add frontend/src/components/RecentSalesTable.tsx
git add frontend/src/App.tsx
git commit -m "feat: add SalesContext for shared sales state"
git push
```

**What changed:**
- `src/contexts/SalesContext.tsx` — new file, global sales state:
  - Initialised from `mockSales` (Phase 4: replace with Supabase query)
  - `addSale(input)` — creates new Sale with auto-generated id (`S-00N`), today's date, appends to top of list, and calls `decrementStock()` on InventoryContext to keep stock in sync
  - `todaySales` — `useMemo` filtered list of today's sales
  - `todayTotal` — `useMemo` sum of today's sale amounts
  - `totalSalesCount` — total number of sales records
  - SalesProvider must be nested inside InventoryProvider (depends on `decrementStock`)
- `src/App.tsx` — added `<InventoryProvider>` and `<SalesProvider>` wrappers around the app; SalesProvider is inside InventoryProvider
- `src/pages/SalesPage.tsx` — swapped `mockSales` for `useSales()`, `todayTotal` now from context (live), added empty state row, added `aria-label` on Invoice button, added customer field to search filter
- `src/pages/DashboardPage.tsx` — all 4 stat cards now show real computed data:
  - Today's Revenue from `useSales().todayTotal`
  - Total Sales count from `useSales().todaySales.length`
  - Units in Stock from `useInventory().totalItems`
  - Low stock count from `useInventory().lowStockItems.length`
  - Monthly Profit from `mockMonthlyReports` with % change vs previous month calculated dynamically
- `src/components/RecentSalesTable.tsx` — swapped local array for `useSales().todaySales`, shows empty state when no sales today

---

## ✅ PHASE 3 — CRUD Operations

---

### Commit 9: `feat: add AddInventoryForm dialog with validation`

```
git add frontend/src/components/forms/AddInventoryForm.tsx
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add AddInventoryForm dialog with validation"
git push
```

**What changed:**
- `src/components/forms/AddInventoryForm.tsx` — new file, dialog form for adding a part:
  - Zod schema validates all 7 fields (name, brand, compatibility, costPrice, sellingPrice, stock, minStock)
  - `costPrice` must be ≥ 0, `sellingPrice` > 0, `stock` ≥ 0 (integer), `minStock` ≥ 1 (integer)
  - On submit: calls `addItem()` from InventoryContext, fires a success toast, resets form, closes dialog
  - Cancel button resets form state before closing
- `src/pages/InventoryPage.tsx` — replaced dead `<Button>Add Part</Button>` with `<AddInventoryForm />` component; subtitle now shows live part count; empty state message differs between "no parts at all" vs "no search results"

---

### Commit 10: `feat: add EditInventoryForm dialog`

```
git add frontend/src/components/forms/EditInventoryForm.tsx
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add EditInventoryForm dialog"
git push
```

**What changed:**
- `src/components/forms/EditInventoryForm.tsx` — new file, dialog form for editing an existing part:
  - Pre-fills all fields from the passed `item` prop
  - `useEffect` resets form when `item` changes (handles clicking edit on different rows without closing)
  - On submit: calls `updateItem(item.id, values)`, fires success toast, closes dialog
  - Controlled externally via `open` / `onOpenChange` props (InventoryPage owns the open state)
- `src/pages/InventoryPage.tsx` — Edit button now calls `handleEditClick(item)`, sets `editItem` state, opens `EditInventoryForm`; dialog rendered outside the table to avoid DOM nesting issues; clears `editItem` on close

---

### Commit 11: `feat: add delete confirmation dialog for inventory`

```
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add delete confirmation dialog for inventory"
git push
```

**What changed:**
- `src/pages/InventoryPage.tsx` — Delete button now calls `handleDeleteClick(item)`, opens shadcn `AlertDialog` with item name and brand in the description text; "Delete" action button styled red (`bg-destructive`); on confirm: calls `deleteItem(id)` from InventoryContext and fires a success toast; cancel clears `deleteTarget` state

---

### Commit 12: `feat: add NewSaleForm dialog with stock decrement`

```
git add frontend/src/components/forms/NewSaleForm.tsx
git add frontend/src/pages/SalesPage.tsx
git commit -m "feat: add NewSaleForm dialog with stock decrement"
git push
```

**What changed:**
- `src/components/forms/NewSaleForm.tsx` — new file, dialog form for recording a sale:
  - Part selector shows only in-stock items with stock count and price in the dropdown
  - Live total amount computed as `sellingPrice × qty` shown in real time as user types
  - Quantity input shows max stock as a hint; client-side guard prevents submitting qty > available stock
  - Worker selector populated from `mockWorkers` (Phase 4: replace with real workers from DB)
  - Customer field defaults to "Walk-in"
  - On submit: calls `addSale()` from SalesContext which adds the sale AND decrements inventory stock atomically; fires success toast with item name, qty, and total
- `src/pages/SalesPage.tsx` — replaced dead `<Button>New Sale</Button>` with `<NewSaleForm />` component; removed now-unused `Plus` and `Button` imports

---

## 🔲 PHASE 4 — Supabase Backend

---

### Commit 20: `feat: install and configure Supabase client`

```
git add frontend/src/lib/supabase.ts
git add frontend/.env.example
git add frontend/.gitignore
git add frontend/package.json
git add frontend/package-lock.json
git commit -m "feat: install and configure Supabase client"
git push
```

**What changed:** *(to be filled after Phase 4 execution)*

---

### Commit 21: `feat: replace mock auth with Supabase authentication`

```
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat: replace mock auth with Supabase authentication"
git push
```

**What changed:** *(to be filled after Phase 4 execution)*

---

### Commit 22: `feat: add useInventory and useSales query hooks`

```
git add frontend/src/hooks/useInventory.ts
git add frontend/src/hooks/useSales.ts
git commit -m "feat: add useInventory and useSales query hooks"
git push
```

**What changed:** *(to be filled after Phase 4 execution)*

---

### Commit 23: `feat: replace mock data with live Supabase queries`

```
git add frontend/src/pages/InventoryPage.tsx
git add frontend/src/pages/SalesPage.tsx
git add frontend/src/pages/DashboardPage.tsx
git add frontend/src/pages/ReportsPage.tsx
git add frontend/src/pages/ActivityPage.tsx
git add frontend/src/components/LowStockAlerts.tsx
git add frontend/src/components/RecentSalesTable.tsx
git commit -m "feat: replace mock data with live Supabase queries"
git push
```

**What changed:** *(to be filled after Phase 4 execution)*

---

## 🔲 PHASE 5 — UI Completeness

---

### Commit 24: `feat: add charts to Reports page using Recharts`

```
git add frontend/src/pages/ReportsPage.tsx
git commit -m "feat: add charts to Reports page using Recharts"
git push
```

**What changed:** *(to be filled after Phase 5 execution)*

---

### Commit 25: `feat: add skeleton loaders for data tables`

```
git add frontend/src/components/TableSkeleton.tsx
git add frontend/src/pages/InventoryPage.tsx
git add frontend/src/pages/SalesPage.tsx
git commit -m "feat: add skeleton loaders for data tables"
git push
```

**What changed:** *(to be filled after Phase 5 execution)*

---

### Commit 26: `feat: add empty states and error states`

```
git add frontend/src/components/EmptyState.tsx
git add frontend/src/components/ErrorState.tsx
git add frontend/src/pages/InventoryPage.tsx
git add frontend/src/pages/SalesPage.tsx
git commit -m "feat: add empty states and error states"
git push
```

**What changed:** *(to be filled after Phase 5 execution)*

---

### Commit 27: `feat: implement CSV export in Reports page`

```
git add frontend/src/lib/exportCsv.ts
git add frontend/src/pages/ReportsPage.tsx
git commit -m "feat: implement CSV export in Reports page"
git push
```

**What changed:** *(to be filled after Phase 5 execution)*

---

### Commit 28: `feat: build out Settings page with working forms`

```
git add frontend/src/pages/SettingsPage.tsx
git commit -m "feat: build out Settings page with working forms"
git push
```

**What changed:** *(to be filled after Phase 5 execution)*

---

## 🔲 PHASE 6 — Testing

---

### Commit 29: `test: add unit tests for utility functions`

```
git add frontend/src/test/utils.test.ts
git commit -m "test: add unit tests for utility functions"
git push
```

**What changed:** *(to be filled after Phase 6 execution)*

---

### Commit 30: `test: add component tests for StatCard and search filters`

```
git add frontend/src/test/components/StatCard.test.tsx
git add frontend/src/test/components/InventoryPage.test.tsx
git commit -m "test: add component tests for StatCard and search filters"
git push
```

**What changed:** *(to be filled after Phase 6 execution)*

---

### Commit 31: `test: add E2E tests for login and inventory flows`

```
git add frontend/e2e/login.spec.ts
git add frontend/e2e/inventory.spec.ts
git commit -m "test: add E2E tests for login and inventory flows"
git push
```

**What changed:** *(to be filled after Phase 6 execution)*

---

## 🔲 PHASE 7 — Deployment

---

### Commit 32: `chore: add .env.example and finalize deployment configuration`

```
git add frontend/.env.example
git commit -m "chore: add .env.example and finalize deployment configuration"
git push
```

**What changed:** *(to be filled after Phase 7 execution)*

---

## COMMIT SUMMARY TABLE

| # | Phase | Commit Message | Status |
|---|---|---|---|
| 1 | 0 | `feat: initial frontend — AutoPartsPro Phase 0 complete` | ✅ Done |
| 2 | 1 | `feat: add AuthContext with login/logout and localStorage persistence` | ✅ Done |
| 3 | 1 | `feat: add ProtectedRoute component` | ✅ Done |
| 4 | 1 | `feat: wrap app with AuthProvider and protect all dashboard routes` | ✅ Done |
| 5 | 1 | `feat: connect LoginPage to real auth with error handling` | ✅ Done |
| 6 | 1 | `feat: wire up Sign Out button in DashboardLayout` | ✅ Done |
| 7 | 2 | `feat: add InventoryContext for shared inventory state` | ✅ Done |
| 8 | 2 | `feat: add SalesContext for shared sales state` | ✅ Done |
| 9 | 3 | `feat: add AddInventoryForm dialog with validation` | ✅ Done |
| 10 | 3 | `feat: add EditInventoryForm dialog` | ✅ Done |
| 11 | 3 | `feat: add delete confirmation dialog for inventory` | ✅ Done |
| 12 | 3 | `feat: add NewSaleForm dialog with stock decrement` | ✅ Done |
| 13 | 4 | `feat: install and configure Supabase client` | 🔲 Pending |
| 14 | 4 | `feat: replace mock auth with Supabase authentication` | 🔲 Pending |
| 15 | 4 | `feat: add useInventory and useSales query hooks` | 🔲 Pending |
| 16 | 4 | `feat: replace mock data with live Supabase queries` | 🔲 Pending |
| 17 | 5 | `feat: add charts to Reports page using Recharts` | 🔲 Pending |
| 18 | 5 | `feat: add skeleton loaders for data tables` | 🔲 Pending |
| 19 | 5 | `feat: add empty states and error states` | 🔲 Pending |
| 20 | 5 | `feat: implement CSV export in Reports page` | 🔲 Pending |
| 21 | 5 | `feat: build out Settings page with working forms` | 🔲 Pending |
| 22 | 6 | `test: add unit tests for utility functions` | 🔲 Pending |
| 23 | 6 | `test: add component tests for StatCard and search filters` | 🔲 Pending |
| 24 | 6 | `test: add E2E tests for login and inventory flows` | 🔲 Pending |
| 25 | 7 | `chore: add .env.example and finalize deployment configuration` | 🔲 Pending |
