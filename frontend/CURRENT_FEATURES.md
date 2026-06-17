# CURRENT FEATURES — AutoPartsPro
> What is fully built and working right now (as of June 16, 2026)

---

## Authentication

- **Login page** — email + password form with client-side validation (HTML `required`, type="email")
- **Real auth flow** — calls `useAuth().login()`, checks against mock credentials
- **Error feedback** — red error box shown when credentials are wrong
- **Loading state** — spinner on submit button, inputs disabled during login attempt
- **Session persistence** — `localStorage` saves session; surviving page refresh keeps you logged in
- **Sign out** — clears session, removes from localStorage, redirects to `/`
- **Show/hide password toggle** — eye icon with proper `aria-label`
- **Auth loading guard** — spinner shown on protected routes while session is being restored from localStorage (prevents login-page flash)

---

## Route Protection

- All 6 dashboard routes (`/dashboard`, `/inventory`, `/sales`, `/reports`, `/activity`, `/settings`) are protected by `<ProtectedRoute>`
- Unauthenticated access to any protected route → automatic redirect to `/`
- Browser back button after sign out stays on login page (no back-navigation to dashboard)

---

## Dashboard Page

- **Today's Revenue stat card** — live total from `useSales().todayTotal`
- **Total Sales stat card** — live count from `useSales().todaySales.length`
- **Units in Stock stat card** — live sum from `useInventory().totalItems`; shows low stock warning count
- **Monthly Profit stat card** — from `mockMonthlyReports` with % change vs previous month calculated dynamically
- **Recent Sales table** — shows up to 5 of today's transactions from `SalesContext`; shows empty state when no sales today
- **Low Stock Alerts panel** — shows items where `stock <= minStock` from `InventoryContext`; auto-updates when inventory changes; shows "All items adequately stocked" when none are low

---

## Inventory Module

### Read
- Full inventory table with columns: Part Name, Brand, Compatibility, Cost Price, Selling Price, Stock, Margin %, Actions
- Live stock count in page subtitle
- Low-stock rows highlighted: stock number shown in red when `stock <= minStock`, green when adequate
- Margin % calculated dynamically: `(sellingPrice - costPrice) / sellingPrice * 100`
- Client-side search filter: matches on Part Name, Brand, and Compatibility simultaneously
- Empty state: different message for "no parts at all" vs "no search results"

### Create
- "Add Part" button opens a Dialog modal (AddInventoryForm)
- Fields: Part Name, Brand, Compatibility, Cost Price, Selling Price, Initial Stock, Min Stock
- Zod schema validation on all fields (required strings, price > 0, stock integer ≥ 0, minStock integer ≥ 1)
- On submit: calls `InventoryContext.addItem()`, shows success toast, resets form, closes dialog
- Cancel button resets form before closing

### Update
- Edit button (pencil icon) on each row — opens EditInventoryForm dialog
- Pre-fills all 7 fields with current item values
- `useEffect` re-populates form when different rows are clicked without closing
- On submit: calls `InventoryContext.updateItem()`, shows success toast, closes dialog

### Delete
- Delete button (trash icon) on each row — opens AlertDialog confirmation
- Confirmation message shows item name and brand
- "Delete" action button styled red (`bg-destructive`)
- On confirm: calls `InventoryContext.deleteItem()`, shows success toast
- Cancel clears the pending delete target

---

## Sales Module

### Read
- Full sales table with columns: ID, Date, Item, Qty, Amount, Payment, Worker, Customer, Invoice
- Live "Today's total" in page subtitle from `SalesContext.todayTotal`
- Client-side search filter: matches on Item, Worker, Sale ID, and Customer
- Empty state shown when search returns no results

### Create
- "New Sale" button opens NewSaleForm dialog
- Part selector: only shows in-stock items; displays stock count and price in dropdown
- Live total amount: `sellingPrice × qty` updates in real-time as user types
- Client-side stock guard: form error shown if qty > available stock (prevents overselling)
- Payment method: Cash / Transfer / Credit (dropdown)
- Worker selector: populated from `mockWorkers` list
- Customer field: defaults to "Walk-in"
- On submit: calls `SalesContext.addSale()` which atomically adds the sale AND calls `InventoryContext.decrementStock()` — inventory and sales always stay in sync
- Success toast shows item name, qty, and total amount

---

## Reports Page

- 4 stat cards: Monthly Revenue, Cost of Goods, Operating Expenses, Net Profit (hardcoded strings from latest mock month)
- Monthly breakdown table: Jan–Mar 2026 from `mockMonthlyReports` (revenue, COGS, expenses, profit per month)
- Monthly expenses table: breakdown by category from `mockExpenses` with running total
- Export button exists (no handler — placeholder)

---

## Activity Page

- Worker status cards: shows 5 workers with online/offline indicator and "X sales today" count (derived from `mockActivityLogs`)
- Activity timeline: chronological log of actions (sale, stock update, auth) with icon and color per action type
- Non-interactive — read-only audit display

---

## Navigation & Layout

- **Sidebar** — fixed on desktop, slide-in on mobile
- **Mobile hamburger menu** — opens sidebar with overlay backdrop; clicking overlay closes sidebar
- **Active route highlighting** — current page highlighted in amber in sidebar
- **User avatar** — shows first letter of user's name; name and role from auth context (not hardcoded)
- **Sign Out button** — fully functional (see Auth section)

---

## Cross-Cutting Features

- **Toast notifications** — success toasts on: add item, edit item, delete item, new sale (using `sonner`)
- **Shared state** — all data flows through React Context; Dashboard, LowStockAlerts, RecentSalesTable, InventoryPage, SalesPage all read from the same source
- **Centralized types** — `src/types/index.ts` defines all interfaces: InventoryItem, Sale, Worker, ActivityLog, MonthlyReport, Expense, StatData, PaymentMethod, ActivityType
- **Centralized mock data** — `src/data/mockData.ts` is the single source of truth; helpers: `getTodayString()`, `getLowStockItems()`, `getSalesByDate()`, `getTotalRevenue()`, `getMarginPercent()`
- **Responsive design** — works on mobile (320px+), tablet, desktop; proper `sm:` and `lg:` breakpoints

---

## UI Polish

- Dark theme with amber primary color — full CSS variable system
- Consistent spacing, typography, card styles throughout
- Monospace font for all numbers and IDs (JetBrains Mono)
- Hover states on all interactive rows and buttons
- Accessible: `aria-label` on icon-only buttons, `autoComplete` attributes on inputs
- `disabled` state on form inputs during submission
