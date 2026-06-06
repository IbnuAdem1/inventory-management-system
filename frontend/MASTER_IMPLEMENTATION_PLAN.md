# MASTER IMPLEMENTATION PLAN — AutoPartsPro

> This is your complete step-by-step roadmap from "broken prototype" to "production-ready app."  
> Work through these phases IN ORDER. Do not skip ahead.  
> Each phase builds on the previous one.

---

## HOW TO READ THIS DOCUMENT

- 🔴 = Critical / Do this first
- 🟡 = High priority
- 🟠 = Medium priority  
- 🟢 = Nice to have / Polish
- Each task has: WHY, WHAT files, WHAT to do, HOW to verify, HOW to rollback

---

# PHASE 0 — CLEANUP & FOUNDATION
*Goal: Clean up the project so you start from a solid base*  
*Time estimate: 1–2 hours*  
*Risk: Very Low*

---

### TASK 0.1 — Enable TypeScript Strict Mode
**Priority:** 🔴 Critical  
**Difficulty:** Easy  
**Risk:** Low (may surface new errors — that's good, they're real bugs)

**WHY:** TypeScript is installed but running in "relaxed" mode. `strict: false` means TypeScript won't catch null pointer errors, undefined variables, or incorrect types. These become runtime crashes in production.

**WHAT files are affected:**
- `tsconfig.app.json`

**WHAT to change:**
```json
// tsconfig.app.json — change this:
"strict": false

// To this:
"strict": true
```

**HOW to verify:** Run `npm run build`. Fix any TypeScript errors that appear. There should be very few since the current code is simple.

**HOW to rollback:** Change `"strict": true` back to `"strict": false`.

---

### TASK 0.2 — Delete Dead Files
**Priority:** 🟡 High  
**Difficulty:** Trivial  
**Risk:** None (these files are never imported)

**WHY:** Dead code adds confusion. A new developer reading the project would waste time wondering "what is Index.tsx for?" or "why is NavLink.tsx never used?"

**WHAT to delete:**
- `src/pages/Index.tsx` — Lovable placeholder, never routed
- `src/components/NavLink.tsx` — never imported anywhere
- `src/App.css` — Vite boilerplate, not used in this dark-theme app

**HOW to verify:** Run `npm run build` — no errors. Run `npm run dev` — app looks identical.

---

### TASK 0.3 — Fix NotFound Page
**Priority:** 🟡 High  
**Difficulty:** Trivial  
**Risk:** None

**WHY:** `NotFound.tsx` uses `<a href="/">` which causes a full browser page reload, losing React's SPA behavior. This is a React Router app — we must use `<Link>`.

**WHAT files:** `src/pages/NotFound.tsx`

**WHAT to change:**
```tsx
// Replace this import:
import { useLocation } from "react-router-dom";

// With this:
import { useLocation, Link } from "react-router-dom";

// Replace this JSX:
<a href="/" className="text-primary underline hover:text-primary/90">
  Return to Home
</a>

// With this:
<Link to="/" className="text-primary underline hover:text-primary/90">
  Return to Home
</Link>
```

---

### TASK 0.4 — Create Shared Type Definitions
**Priority:** 🔴 Critical  
**Difficulty:** Easy  
**Risk:** None

**WHY:** Right now, the shape of an inventory item is defined differently in `InventoryPage.tsx`, `LowStockAlerts.tsx`, and the component that shows it. When you connect a real database, you need ONE definition that all files use. This is the foundation everything else builds on.

**WHAT to create:** `src/types/index.ts`

**FULL FILE CONTENT:**
```typescript
// src/types/index.ts
// These are the data shapes (interfaces) used throughout the entire app.
// Think of these as the "blueprint" for what your data looks like.

export type PaymentMethod = "Cash" | "Transfer" | "Credit";

export type ActivityType = "sale" | "stock" | "auth" | "price";

export interface Worker {
  id: string;
  name: string;
  role: "owner" | "worker";
  email: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  brand: string;
  compatibility: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  date: string;
  item: string;
  inventoryId?: number;
  qty: number;
  amount: number;
  payment: PaymentMethod;
  worker: string;
  customer: string;
}

export interface ActivityLog {
  id?: number;
  time: string;
  worker: string;
  action: string;
  detail: string;
  type: ActivityType;
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
}

export interface Expense {
  category: string;
  amount: number;
}
```

**HOW to verify:** `npm run build` — no errors.

---

### TASK 0.5 — Consolidate Mock Data
**Priority:** 🔴 Critical  
**Difficulty:** Easy  
**Risk:** Low

**WHY:** Right now, `RecentSalesTable.tsx` and `SalesPage.tsx` both define their own separate sales arrays. `LowStockAlerts.tsx` and `InventoryPage.tsx` both define their own separate inventory arrays. They don't match each other. When you edit one, the other becomes stale. We need ONE place where all mock data lives.

**WHAT to create:** `src/data/mockData.ts`

**FULL FILE CONTENT:**
```typescript
// src/data/mockData.ts
// ONE single place for all mock data.
// When you connect a real database later, you'll DELETE this file
// and replace imports with API calls. Having all mocks here makes that easy.

import type { InventoryItem, Sale, ActivityLog, MonthlyReport, Expense, Worker } from "@/types";

export const mockWorkers: Worker[] = [
  { id: "w1", name: "Ahmed", role: "worker", email: "ahmed@autopartspro.com" },
  { id: "w2", name: "Yusuf", role: "worker", email: "yusuf@autopartspro.com" },
  { id: "w3", name: "Khalid", role: "worker", email: "khalid@autopartspro.com" },
  { id: "w4", name: "Omar", role: "worker", email: "omar@autopartspro.com" },
  { id: "w5", name: "Faisal", role: "worker", email: "faisal@autopartspro.com" },
];

export const mockInventory: InventoryItem[] = [
  { id: 1, name: "Brake Pads", brand: "Brembo", compatibility: "Toyota Camry 2018-2023", costPrice: 35, sellingPrice: 85, stock: 2, minStock: 10 },
  { id: 2, name: "Oil Filter", brand: "Bosch", compatibility: "Honda Civic 2016-2022", costPrice: 8, sellingPrice: 24.5, stock: 3, minStock: 15 },
  { id: 3, name: "Spark Plugs (x4)", brand: "NGK", compatibility: "Nissan Altima 2019-2023", costPrice: 22, sellingPrice: 62, stock: 45, minStock: 20 },
  { id: 4, name: "Air Filter", brand: "Mann", compatibility: "Ford Focus 2017-2022", costPrice: 12, sellingPrice: 35, stock: 28, minStock: 10 },
  { id: 5, name: "Alternator Belt", brand: "Gates", compatibility: "BMW 320i 2015-2020", costPrice: 45, sellingPrice: 120, stock: 8, minStock: 5 },
  { id: 6, name: "Headlight Bulb H4", brand: "Philips", compatibility: "Universal", costPrice: 6, sellingPrice: 18, stock: 4, minStock: 12 },
  { id: 7, name: "Timing Belt Kit", brand: "Continental", compatibility: "Nissan Altima 2017-2022", costPrice: 85, sellingPrice: 210, stock: 1, minStock: 5 },
  { id: 8, name: "Radiator Hose", brand: "Dayco", compatibility: "Toyota Corolla 2014-2019", costPrice: 15, sellingPrice: 42, stock: 14, minStock: 8 },
];

export const mockSales: Sale[] = [
  { id: "S-001", date: "2026-06-06", item: "Brake Pads - Toyota Camry", qty: 1, amount: 85, payment: "Cash", worker: "Ahmed", customer: "Walk-in" },
  { id: "S-002", date: "2026-06-06", item: "Oil Filter - Honda Civic", qty: 2, amount: 49, payment: "Transfer", worker: "Yusuf", customer: "Ali Hassan" },
  { id: "S-003", date: "2026-06-06", item: "Spark Plugs (x4) - Nissan", qty: 1, amount: 62, payment: "Cash", worker: "Khalid", customer: "Walk-in" },
  { id: "S-004", date: "2026-06-06", item: "Air Filter - Ford Focus", qty: 1, amount: 35, payment: "Credit", worker: "Ahmed", customer: "Garage #7" },
  { id: "S-005", date: "2026-06-06", item: "Alternator Belt - BMW 320i", qty: 1, amount: 120, payment: "Transfer", worker: "Omar", customer: "Walk-in" },
  { id: "S-006", date: "2026-06-05", item: "Radiator Hose - Toyota", qty: 1, amount: 42, payment: "Cash", worker: "Yusuf", customer: "Walk-in" },
  { id: "S-007", date: "2026-06-05", item: "Headlight Bulb H4", qty: 2, amount: 36, payment: "Cash", worker: "Ahmed", customer: "Faisal Motors" },
];

export const mockActivityLogs: ActivityLog[] = [
  { time: "10:32 AM", worker: "Ahmed", action: "Recorded sale", detail: "Brake Pads - Toyota Camry ($85.00)", type: "sale" },
  { time: "10:28 AM", worker: "Ahmed", action: "Updated stock", detail: "Brake Pads - Toyota Camry: 3 → 2", type: "stock" },
  { time: "10:15 AM", worker: "Yusuf", action: "Recorded sale", detail: "Oil Filter - Honda Civic x2 ($49.00)", type: "sale" },
  { time: "09:48 AM", worker: "Khalid", action: "Recorded sale", detail: "Spark Plugs (x4) - Nissan ($62.00)", type: "sale" },
  { time: "09:30 AM", worker: "Khalid", action: "Updated stock", detail: "Added 20 units: Spark Plugs - Universal", type: "stock" },
  { time: "09:22 AM", worker: "Ahmed", action: "Recorded sale", detail: "Air Filter - Ford Focus ($35.00)", type: "sale" },
  { time: "09:05 AM", worker: "Omar", action: "Recorded sale", detail: "Alternator Belt - BMW 320i ($120.00)", type: "sale" },
  { time: "08:55 AM", worker: "Omar", action: "Logged in", detail: "Session started", type: "auth" },
  { time: "08:50 AM", worker: "Khalid", action: "Logged in", detail: "Session started", type: "auth" },
  { time: "08:45 AM", worker: "Yusuf", action: "Logged in", detail: "Session started", type: "auth" },
  { time: "08:30 AM", worker: "Ahmed", action: "Logged in", detail: "Session started", type: "auth" },
];

export const mockMonthlyReports: MonthlyReport[] = [
  { month: "Jan", revenue: 18200, cost: 9800, expenses: 4500, profit: 3900 },
  { month: "Feb", revenue: 21500, cost: 11200, expenses: 4500, profit: 5800 },
  { month: "Mar", revenue: 24800, cost: 12900, expenses: 4700, profit: 7200 },
];

export const mockExpenses: Expense[] = [
  { category: "Rent", amount: 2000 },
  { category: "Salaries", amount: 1500 },
  { category: "Utilities", amount: 350 },
  { category: "Transport", amount: 200 },
  { category: "Misc", amount: 150 },
];

// Helper: get today's date in YYYY-MM-DD format
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Helper: get low stock items from inventory
export const getLowStockItems = (inventory: InventoryItem[]) => {
  return inventory.filter((item) => item.stock <= item.minStock);
};
```

**Then update each page** to import from `@/data/mockData` instead of defining its own arrays. (Step-by-step instructions in Phase 1 tasks below.)

---

### TASK 0.6 — Fix index.html Metadata
**Priority:** 🟠 Medium  
**Difficulty:** Trivial  
**Risk:** None

**WHAT files:** `index.html`

**WHAT to change:**
```html
<!-- Replace the <head> section with: -->
<title>AutoPartsPro — Spare Parts Management</title>
<meta name="description" content="AutoPartsPro — Internal spare parts inventory and sales management system." />
<meta name="author" content="AutoPartsPro" />
<meta property="og:title" content="AutoPartsPro" />
<meta property="og:description" content="Spare parts inventory and sales management." />
<meta property="og:type" content="website" />
<!-- Remove the og:image and twitter:image that point to lovable.dev -->
```

---

# PHASE 1 — AUTHENTICATION & ROUTE PROTECTION
*Goal: Make login real, protect all routes*  
*Time estimate: 4–6 hours*  
*Risk: Medium (changes routing for every page)*

---

### TASK 1.1 — Create Auth Context
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHY:** We need a global "who is logged in" state that every page can read. When the user logs in, we store that fact globally. When they log out, we clear it. Every protected page can then check "is someone logged in?" before rendering.

**WHAT to create:** `src/contexts/AuthContext.tsx`

This file will:
- Track whether a user is logged in (stores their info)
- Provide a `login()` function
- Provide a `logout()` function
- Save login state to `localStorage` so it survives page refresh

**FULL FILE CONTENT:**
```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// What a logged-in user looks like
interface User {
  email: string;
  name: string;
  role: "owner" | "worker";
}

// What the AuthContext provides to any component that uses it
interface AuthContextType {
  user: User | null;           // null = not logged in
  isAuthenticated: boolean;    // shortcut: true if user is not null
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;          // true while checking localStorage on startup
}

// Create the context (with undefined as default — we'll always use the Provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Temporary hardcoded credentials — REPLACE with real API call in Phase 4
const MOCK_CREDENTIALS = {
  email: "owner@autopartspro.com",
  password: "admin123",
  user: { email: "owner@autopartspro.com", name: "Owner", role: "owner" as const },
};

// The Provider wraps our entire app and makes auth state available everywhere
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // start loading while we check localStorage

  // On app startup: check if user was previously logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("autoparts_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("autoparts_user");
      }
    }
    setIsLoading(false); // done checking
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // TODO (Phase 4): Replace this with a real API call
    // e.g.: const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (
      email.toLowerCase() === MOCK_CREDENTIALS.email &&
      password === MOCK_CREDENTIALS.password
    ) {
      setUser(MOCK_CREDENTIALS.user);
      localStorage.setItem("autoparts_user", JSON.stringify(MOCK_CREDENTIALS.user));
      return true; // login succeeded
    }
    return false; // login failed
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("autoparts_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component calls useAuth() to get the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
```

---

### TASK 1.2 — Create Protected Route Component
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHY:** We need a "gate" that sits in front of every dashboard page. If the user is not logged in, the gate redirects them to the login page. If they are logged in, the gate lets them through.

**WHAT to create:** `src/components/ProtectedRoute.tsx`

**FULL FILE CONTENT:**
```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while we check if the user is logged in (checking localStorage)
  // Without this, you'd see a flash of the login page even when already logged in
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If logged in, render the actual page
  return <>{children}</>;
};

export default ProtectedRoute;
```

---

### TASK 1.3 — Wrap App with AuthProvider and Protect Routes
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHAT files:** `src/App.tsx`

**FULL REPLACEMENT:**
```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import ReportsPage from "./pages/ReportsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected routes — require login */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

---

### TASK 1.4 — Fix LoginPage to Use Real Auth
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHAT files:** `src/pages/LoginPage.tsx`

**WHAT to change:** Replace the fake `navigate("/dashboard")` with a real call to `login()` from the auth context. Show an error message when credentials are wrong.

**KEY CODE CHANGE:**
```tsx
// Replace the handleLogin function with:
const { login } = useAuth();
const [error, setError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsSubmitting(true);
  
  const success = await login(email, password);
  
  if (success) {
    navigate("/dashboard");
  } else {
    setError("Invalid email or password.");
  }
  setIsSubmitting(false);
};
```

Add the error display in the JSX and a loading state on the Submit button.

---

### TASK 1.5 — Fix Sign Out Button
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHAT files:** `src/components/DashboardLayout.tsx`

**WHAT to change:** The Sign Out button needs to call `logout()` and navigate to `/`.

```tsx
// Add to top of component:
const { logout, user } = useAuth();
const navigate = useNavigate();

const handleSignOut = () => {
  logout();
  navigate("/");
};

// Update the Sign Out button:
<button onClick={handleSignOut} className="...">
  <LogOut className="h-4 w-4" />
  Sign Out
</button>

// Also update the hardcoded "Owner" / "O" avatar to use real user info:
<p className="text-sm font-medium text-foreground">{user?.name ?? "Owner"}</p>
```

---

# PHASE 2 — STATE MANAGEMENT & DATA LAYER
*Goal: Connect all pages to a shared data source (still mock, but now shared)*  
*Time estimate: 3–4 hours*  
*Risk: Low*

---

### TASK 2.1 — Create Inventory State with React Context
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHY:** Right now each page has its own isolated data. When you add an item in InventoryPage, the LowStockAlerts component on the Dashboard doesn't know about it. We need ONE place to store inventory data that all pages can read and write to.

**WHAT to create:** `src/contexts/InventoryContext.tsx`

This will:
- Store the inventory array
- Provide `addItem()`, `updateItem()`, `deleteItem()` functions
- Derive `lowStockItems` automatically

---

### TASK 2.2 — Create Sales State with React Context
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHAT to create:** `src/contexts/SalesContext.tsx`

This will:
- Store the sales array
- Provide `addSale()` function
- Derive today's sales, today's total automatically

---

### TASK 2.3 — Update All Pages to Use Shared Context
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHAT files:**
- `src/pages/DashboardPage.tsx` — read from InventoryContext + SalesContext
- `src/pages/InventoryPage.tsx` — read/write InventoryContext
- `src/pages/SalesPage.tsx` — read/write SalesContext
- `src/components/LowStockAlerts.tsx` — read from InventoryContext
- `src/components/RecentSalesTable.tsx` — read from SalesContext

---

# PHASE 3 — CRUD OPERATIONS
*Goal: Make Add, Edit, Delete, New Sale buttons actually work*  
*Time estimate: 8–12 hours*  
*Risk: Medium*

---

### TASK 3.1 — Add Inventory Item Dialog
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHAT to create:** `src/components/forms/AddInventoryForm.tsx`

Uses `react-hook-form` + `zod` (already installed). When submitted, calls `addItem()` from InventoryContext.

Fields: Part Name, Brand, Compatibility, Cost Price, Selling Price, Initial Stock, Minimum Stock

---

### TASK 3.2 — Edit Inventory Item Dialog
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHAT to create:** `src/components/forms/EditInventoryForm.tsx`

Pre-fills form with existing item data. When submitted, calls `updateItem()`.

---

### TASK 3.3 — Delete Confirmation Dialog
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

Uses the existing shadcn `AlertDialog` component (already installed). Shows "Are you sure?" before deleting.

---

### TASK 3.4 — New Sale Dialog
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

**WHAT to create:** `src/components/forms/NewSaleForm.tsx`

Fields: Part (select from inventory), Quantity, Payment Method, Customer name/walk-in
When submitted:
- Adds sale to SalesContext
- Decrements stock in InventoryContext
- Creates activity log entry

---

### TASK 3.5 — Invoice/Receipt View
**Priority:** 🟡 High  
**Difficulty:** Medium  

Shows a printable receipt for a sale. Use the browser's `window.print()` for now.

---

# PHASE 4 — BACKEND & REAL DATA (SUPABASE)
*Goal: Replace mock data with a real database*  
*Time estimate: 1–3 days*  
*Risk: High (requires external account setup)*

---

### TASK 4.1 — Create Supabase Account & Project
**Priority:** 🔴 Critical  
**Difficulty:** Easy (just clicking through a website)  

**WHY:** Supabase gives you a free PostgreSQL database, an API, and authentication — all in one. No server to manage.

**STEPS:**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New project"
5. Choose a name (e.g., "autopartspro")
6. Choose a database password (save this somewhere safe)
7. Choose the region closest to you
8. Click "Create new project" — wait ~2 minutes for it to set up

---

### TASK 4.2 — Create Database Tables in Supabase
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

In your Supabase project, go to the SQL editor and run:

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Inventory table
create table inventory (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  brand       text not null,
  compatibility text not null,
  cost_price  numeric(10,2) not null check (cost_price >= 0),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  min_stock   integer not null default 5 check (min_stock >= 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Sales table
create table sales (
  id          uuid primary key default uuid_generate_v4(),
  inventory_id uuid references inventory(id),
  item_name   text not null,
  worker_name text not null,
  customer    text not null default 'Walk-in',
  quantity    integer not null check (quantity > 0),
  amount      numeric(10,2) not null,
  payment_method text not null check (payment_method in ('Cash', 'Transfer', 'Credit')),
  created_at  timestamptz default now()
);

-- Activity logs table
create table activity_logs (
  id          uuid primary key default uuid_generate_v4(),
  worker_name text not null,
  action      text not null,
  detail      text not null,
  type        text not null check (type in ('sale', 'stock', 'auth', 'price')),
  created_at  timestamptz default now()
);

-- Row Level Security (makes data private — only authenticated users can access)
alter table inventory enable row level security;
alter table sales enable row level security;
alter table activity_logs enable row level security;

-- Policy: only logged-in users can read/write
create policy "authenticated users can do everything on inventory"
  on inventory for all using (auth.role() = 'authenticated');

create policy "authenticated users can do everything on sales"
  on sales for all using (auth.role() = 'authenticated');

create policy "authenticated users can read activity logs"
  on activity_logs for select using (auth.role() = 'authenticated');

create policy "authenticated users can insert activity logs"
  on activity_logs for insert with check (auth.role() = 'authenticated');
```

---

### TASK 4.3 — Install Supabase SDK
**Priority:** 🔴 Critical  
**Difficulty:** Trivial  

**COMMAND (run in your project folder):**
```
npm install @supabase/supabase-js
```

---

### TASK 4.4 — Create Environment Variables
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHY:** We never hardcode API keys in code. If you accidentally push your code to GitHub with API keys in it, anyone can access your database. Environment variables keep secrets outside the code.

**WHAT to create:** `.env` file in the root of your project (same folder as package.json)

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:** In Supabase → Settings → API → Project URL and anon/public key.

**IMPORTANT:** Add `.env` to `.gitignore` so it never gets committed to Git!

Also create `.env.example` (this CAN be committed — it shows what variables are needed without the real values):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

### TASK 4.5 — Create Supabase Client
**Priority:** 🔴 Critical  
**Difficulty:** Easy  

**WHAT to create:** `src/lib/supabase.ts`

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### TASK 4.6 — Replace Mock Auth with Supabase Auth
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

Update `AuthContext.tsx` to use `supabase.auth.signInWithPassword()` and `supabase.auth.signOut()`.

---

### TASK 4.7 — Replace Mock Data with useQuery Hooks
**Priority:** 🔴 Critical  
**Difficulty:** Medium  

Create query hooks in `src/hooks/`:
- `useInventory.ts` — fetches from `supabase.from("inventory").select("*")`
- `useSales.ts` — fetches from `supabase.from("sales").select("*")`
- `useActivityLogs.ts` — fetches from `supabase.from("activity_logs").select("*")`

Each hook uses `@tanstack/react-query`'s `useQuery`. This gives you automatic caching, loading states, and error states for free.

---

# PHASE 5 — UI COMPLETENESS
*Goal: Fill in all the missing UI pieces*  
*Time estimate: 4–6 hours*

---

### TASK 5.1 — Add Charts to Reports Page
**Priority:** 🟡 High  

Recharts is already installed. Add a bar chart (monthly revenue vs profit) and a pie chart (expense breakdown). Both data sources already exist — just need to be connected.

---

### TASK 5.2 — Add Loading States
**Priority:** 🟡 High  

Create skeleton loaders for tables and stat cards. Show them while data is being fetched.

---

### TASK 5.3 — Add Error States
**Priority:** 🟡 High  

When a query fails, show a friendly error message with a retry button instead of crashing.

---

### TASK 5.4 — Add Empty States
**Priority:** 🟠 Medium  

When search returns 0 results, or when inventory is empty, show a helpful message instead of an empty table.

---

### TASK 5.5 — Build Out Settings Page
**Priority:** 🟡 High  

Add actual settings:
- Change Password form
- Notification preferences (low stock threshold)
- Business name / store info

---

### TASK 5.6 — Add Pagination
**Priority:** 🟠 Medium  

Add page navigation to Inventory and Sales tables so they don't render thousands of rows.

---

### TASK 5.7 — Export to CSV
**Priority:** 🟡 High  

The export button on Reports page should generate a CSV file and trigger a download. No library needed — pure JavaScript `Blob` + `URL.createObjectURL`.

---

# PHASE 6 — TESTING
*Goal: Write real tests*  
*Time estimate: 4–8 hours*

---

### TASK 6.1 — Unit Tests for Utility Functions
Test `getLowStockItems()`, margin calculation, date helpers.

### TASK 6.2 — Component Tests
Test that StatCard renders correctly, that forms validate correctly, that the search filter works.

### TASK 6.3 — Integration Tests
Test the full login flow, the add-item flow, the new-sale flow.

---

# PHASE 7 — DEPLOYMENT
*Goal: Put the app on the internet*  
*Time estimate: 2–4 hours (see DEPLOYMENT_GUIDE.md)*

---

### TASK 7.1 — Deploy Frontend to Vercel
Free hosting, connects to your GitHub repo, auto-deploys on every push.

### TASK 7.2 — Configure Environment Variables on Vercel
The `.env` file stays on your computer. You need to add the same variables in Vercel's dashboard.

### TASK 7.3 — Set Up Custom Domain (Optional)
Purchase a domain and connect it to Vercel.

---

# EXECUTION ORDER SUMMARY

```
Week 1: Phase 0 (cleanup) + Phase 1 (auth)
Week 2: Phase 2 (data layer) + Phase 3 (CRUD)
Week 3: Phase 4 (Supabase backend)
Week 4: Phase 5 (UI completeness) + Phase 6 (testing)
Week 5: Phase 7 (deployment)
```

**Start with Phase 0 right now.** It takes under 2 hours and makes everything else easier.

---

> Say "start Phase 0" and I will implement each task step by step with full code.
