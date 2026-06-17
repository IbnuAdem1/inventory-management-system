# PROJECT STATE — AutoPartsPro
> Audit date: June 16, 2026 | New-chat baseline snapshot

---

## 1. Project Identity

| Field | Value |
|---|---|
| App name | AutoPartsPro |
| Type | Spare Parts Inventory & Sales Management SPA |
| Origin | Lovable AI prototype → heavily customized |
| Stack | React 18 + TypeScript 5.8 + Vite 5.4 + Tailwind CSS + shadcn/ui |
| Backend | None (Supabase planned — not started) |
| Database | None (mock data only) |
| Deployment | Not deployed |

---

## 2. Folder Structure

```
inventory-management-system/
├── .git/
├── .vscode/
└── frontend/                          ← only folder; no backend/ or server/
    ├── index.html
    ├── package.json
    ├── tsconfig.app.json              (strict: true — fully enabled)
    ├── components.json                (shadcn/ui config)
    ├── eslint.config.js
    ├── playwright.config.ts
    ├── dist/                          (built output — exists)
    ├── public/
    │   ├── favicon.ico
    │   ├── placeholder.svg
    │   └── robots.txt
    ├── Documentation/
    │   ├── MASTER_IMPLEMENTATION_PLAN.md
    │   ├── PROJECT_ANALYSIS.md
    │   ├── COMMIT_PLAN.md
    │   ├── DEPLOYMENT_GUIDE.md
    │   ├── ENV_SETUP_GUIDE.md
    │   ├── PRODUCTION_CHECKLIST.md
    │   └── README.md (placeholder — "TODO: Document your project")
    └── src/
        ├── App.tsx                    (router + provider setup)
        ├── main.tsx
        ├── index.css                  (dark theme + CSS custom properties)
        ├── vite-env.d.ts
        ├── types/
        │   └── index.ts               (all TS interfaces — centralized)
        ├── data/
        │   └── mockData.ts            (all mock data — centralized)
        ├── contexts/
        │   ├── AuthContext.tsx
        │   ├── InventoryContext.tsx
        │   └── SalesContext.tsx
        ├── components/
        │   ├── DashboardLayout.tsx
        │   ├── LowStockAlerts.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── RecentSalesTable.tsx
        │   ├── StatCard.tsx
        │   ├── forms/
        │   │   ├── AddInventoryForm.tsx
        │   │   ├── EditInventoryForm.tsx
        │   │   └── NewSaleForm.tsx
        │   └── ui/                    (48 shadcn/ui components)
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── InventoryPage.tsx
        │   ├── SalesPage.tsx
        │   ├── ReportsPage.tsx
        │   ├── ActivityPage.tsx
        │   ├── SettingsPage.tsx
        │   └── NotFound.tsx
        ├── hooks/
        │   ├── use-mobile.tsx         (breakpoint detection)
        │   └── use-toast.ts           (toast state — used internally by shadcn)
        ├── lib/
        │   └── utils.ts               (cn() helper only)
        └── test/
            ├── example.test.ts        (trivial: expect(true).toBe(true))
            └── setup.ts
```

No backend folder exists. No server, no API, no database files.

---

## 3. Frontend Architecture

**Framework:** React 18.3.1 + TypeScript 5.8.3
**Build tool:** Vite 5.4.19 with SWC plugin
**Routing:** React Router DOM 6.30.1 (BrowserRouter + Routes)
**Styling:** Tailwind CSS 3.4.17 + CSS custom properties (full dark theme with amber primary)
**UI library:** shadcn/ui (Radix UI primitives) — 48 components installed

**Provider nesting order (App.tsx):**
```
QueryClientProvider
  └── AuthProvider
        └── InventoryProvider
              └── SalesProvider
                    └── TooltipProvider
                          └── BrowserRouter
```

**TypeScript config:**
- `strict: true` ✅
- `noImplicitAny: true` ✅
- `noUnusedLocals: true` ✅
- `noUnusedParameters: true` ✅
- `noFallthroughCasesInSwitch: true` ✅
- Path alias: `@/*` → `./src/*` ✅

---

## 4. Routing

| Route | Component | Access | Status |
|---|---|---|---|
| `/` | LoginPage | Public | ✅ Working |
| `/dashboard` | DashboardPage | Protected | ✅ Working |
| `/inventory` | InventoryPage | Protected | ✅ Working |
| `/sales` | SalesPage | Protected | ✅ Working |
| `/reports` | ReportsPage | Protected | ⚠️ Partial |
| `/activity` | ActivityPage | Protected | ⚠️ Static only |
| `/settings` | SettingsPage | Protected | ❌ Shell only |
| `*` | NotFound | Public | ✅ Working |

All 6 dashboard routes are wrapped with `<ProtectedRoute>`. Unauthenticated users are redirected to `/`.

---

## 5. State Management

**Approach:** React Context API + `useState` + `useMemo`
**No Redux, no Zustand, no Jotai**

| Context | Data | Operations | Where Used |
|---|---|---|---|
| AuthContext | user, isAuthenticated, isLoading | login(), logout() | LoginPage, DashboardLayout, ProtectedRoute, NewSaleForm |
| InventoryContext | inventory[], lowStockItems[], totalItems, totalStockValue | addItem(), updateItem(), deleteItem(), decrementStock() | InventoryPage, DashboardPage, LowStockAlerts, NewSaleForm |
| SalesContext | sales[], todaySales[], todayTotal, totalSalesCount | addSale() | SalesPage, DashboardPage, RecentSalesTable |

**@tanstack/react-query** is installed and configured with `QueryClient` in App.tsx but **zero query/mutation hooks exist**. It's scaffolded for Phase 4.

---

## 6. Authentication

| Item | Status |
|---|---|
| Login form | ✅ Working — email/password, loading state, error message |
| Auth context | ✅ Working — useAuth() hook, user/isAuthenticated/isLoading |
| Session persistence | ✅ Working — localStorage key `"autoparts_user"` |
| Page-refresh retention | ✅ Working — spinner during localStorage restore |
| Route protection | ✅ Working — ProtectedRoute redirects to `/` |
| Sign out | ✅ Working — clears state + localStorage, navigates to `/` |
| Real backend auth | ❌ Not implemented — mock credentials only |
| Multi-user login | ❌ Not implemented — single owner account only |
| Token expiry | ❌ Not implemented |

Mock credentials: `owner@autopartspro.com` / `admin123`

---

## 7. Data Layer

All data lives in `src/data/mockData.ts`:

| Dataset | Count | Notes |
|---|---|---|
| mockInventory | 8 items | Spare auto parts |
| mockSales | 7 sales | 5 today, 2 yesterday (dates dynamic) |
| mockWorkers | 5 workers | Ahmed, Yusuf, Khalid, Omar, Faisal |
| mockActivityLogs | 11 entries | Static — not connected to real actions |
| mockMonthlyReports | 3 months | Jan–Mar 2026, hardcoded |
| mockExpenses | 5 categories | Hardcoded, not editable |

Data resets to mock values on every page reload. No persistence.

---

## 8. Dependencies Summary

**Runtime (key packages):**

| Package | Version | Used? |
|---|---|---|
| react + react-dom | ^18.3.1 | ✅ Yes |
| react-router-dom | ^6.30.1 | ✅ Yes |
| @tanstack/react-query | ^5.83.0 | ⚠️ Installed, NOT used |
| react-hook-form | ^7.61.1 | ✅ Yes (all 3 forms) |
| @hookform/resolvers | ^3.10.0 | ✅ Yes |
| zod | ^3.25.76 | ✅ Yes (all 3 forms) |
| recharts | ^2.15.4 | ⚠️ Installed, NOT used |
| sonner | ^1.7.4 | ✅ Yes (toasts) |
| lucide-react | ^0.462.0 | ✅ Yes |
| next-themes | ^0.3.0 | ⚠️ Installed, not actively used |
| date-fns | ^3.6.0 | ⚠️ Installed, not used directly |
| All @radix-ui/* | various | ✅ Via shadcn/ui components |

**Dev:**
- Vitest ^3.2.4 + @testing-library/react — unit test framework
- Playwright ^1.57.0 — E2E config exists, no test files written
- lovable-tagger ^1.1.13 — Lovable AI artifact (removable)

---

## 9. Environment & Deployment

| Item | Status |
|---|---|
| `.env` file | ❌ Does not exist |
| `.env.example` | ❌ Does not exist |
| Supabase client (`src/lib/supabase.ts`) | ❌ Does not exist |
| CI/CD pipeline | ❌ None |
| Deployed URL | ❌ Not deployed |
| `dist/` build output | ✅ Exists (built at some point) |

---

## 10. Implementation Phase Progress

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Cleanup & Foundation | ✅ Complete |
| Phase 1 | Authentication & Route Protection | ✅ Complete |
| Phase 2 | State Management & Data Layer | ✅ Complete |
| Phase 3 | CRUD Operations | ✅ Complete |
| Phase 4 | Supabase Backend Integration | ❌ Not started |
| Phase 5 | UI Completeness | ❌ Not started |
| Phase 6 | Testing | ❌ Not started |
| Phase 7 | Deployment | ❌ Not started |

Phases 0–3 are fully complete. Phase 4 (backend) is the next step.

---

## 11. Build & Test Commands

```bash
# From frontend/ directory
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Serve dist/ locally
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npx playwright test  # E2E tests (no test files yet)
```
