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

**What changed:** *(to be filled after Phase 1 execution)*

---

### Commit 10: `feat: add ProtectedRoute component`

```
git add frontend/src/components/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component"
git push
```

**What changed:** *(to be filled after Phase 1 execution)*

---

### Commit 11: `feat: wrap app with AuthProvider and protect all dashboard routes`

```
git add frontend/src/App.tsx
git commit -m "feat: wrap app with AuthProvider and protect all dashboard routes"
git push
```

**What changed:** *(to be filled after Phase 1 execution)*

---

### Commit 12: `feat: connect LoginPage to real auth with error handling`

```
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: connect LoginPage to real auth with error handling"
git push
```

**What changed:** *(to be filled after Phase 1 execution)*

---

### Commit 13: `feat: wire up Sign Out button in DashboardLayout`

```
git add frontend/src/components/DashboardLayout.tsx
git commit -m "feat: wire up Sign Out button in DashboardLayout"
git push
```

**What changed:** *(to be filled after Phase 1 execution)*

---

## 🔲 PHASE 2 — State Management & Data Layer

---

### Commit 14: `feat: add InventoryContext for shared inventory state`

```
git add frontend/src/contexts/InventoryContext.tsx
git add frontend/src/pages/InventoryPage.tsx
git add frontend/src/pages/DashboardPage.tsx
git add frontend/src/components/LowStockAlerts.tsx
git commit -m "feat: add InventoryContext for shared inventory state"
git push
```

**What changed:** *(to be filled after Phase 2 execution)*

---

### Commit 15: `feat: add SalesContext for shared sales state`

```
git add frontend/src/contexts/SalesContext.tsx
git add frontend/src/pages/SalesPage.tsx
git add frontend/src/pages/DashboardPage.tsx
git add frontend/src/components/RecentSalesTable.tsx
git commit -m "feat: add SalesContext for shared sales state"
git push
```

**What changed:** *(to be filled after Phase 2 execution)*

---

## 🔲 PHASE 3 — CRUD Operations

---

### Commit 16: `feat: add AddInventoryForm dialog with validation`

```
git add frontend/src/components/forms/AddInventoryForm.tsx
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add AddInventoryForm dialog with validation"
git push
```

**What changed:** *(to be filled after Phase 3 execution)*

---

### Commit 17: `feat: add EditInventoryForm dialog`

```
git add frontend/src/components/forms/EditInventoryForm.tsx
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add EditInventoryForm dialog"
git push
```

**What changed:** *(to be filled after Phase 3 execution)*

---

### Commit 18: `feat: add delete confirmation dialog for inventory`

```
git add frontend/src/pages/InventoryPage.tsx
git commit -m "feat: add delete confirmation dialog for inventory"
git push
```

**What changed:** *(to be filled after Phase 3 execution)*

---

### Commit 19: `feat: add NewSaleForm dialog with stock decrement`

```
git add frontend/src/components/forms/NewSaleForm.tsx
git add frontend/src/pages/SalesPage.tsx
git commit -m "feat: add NewSaleForm dialog with stock decrement"
git push
```

**What changed:** *(to be filled after Phase 3 execution)*

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
| 2 | 1 | `feat: add AuthContext with login/logout and localStorage persistence` | 🔲 Pending |
| 3 | 1 | `feat: add ProtectedRoute component` | 🔲 Pending |
| 4 | 1 | `feat: wrap app with AuthProvider and protect all dashboard routes` | 🔲 Pending |
| 5 | 1 | `feat: connect LoginPage to real auth with error handling` | 🔲 Pending |
| 6 | 1 | `feat: wire up Sign Out button in DashboardLayout` | 🔲 Pending |
| 7 | 2 | `feat: add InventoryContext for shared inventory state` | 🔲 Pending |
| 8 | 2 | `feat: add SalesContext for shared sales state` | 🔲 Pending |
| 9 | 3 | `feat: add AddInventoryForm dialog with validation` | 🔲 Pending |
| 10 | 3 | `feat: add EditInventoryForm dialog` | 🔲 Pending |
| 11 | 3 | `feat: add delete confirmation dialog for inventory` | 🔲 Pending |
| 12 | 3 | `feat: add NewSaleForm dialog with stock decrement` | 🔲 Pending |
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
