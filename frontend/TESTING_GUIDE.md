# TESTING GUIDE — AutoPartsPro

> Testing means writing code that checks your other code is correct.  
> Tests catch bugs before your users do.  
> This guide covers unit tests, component tests, and E2E tests.

---

## WHAT TESTING TOOLS ARE INSTALLED

| Tool | Purpose | How to run |
|---|---|---|
| **Vitest** | Unit & component tests | `npm test` |
| **@testing-library/react** | Render React components in tests | (used inside Vitest) |
| **Playwright** | End-to-End (E2E) browser tests | `npx playwright test` |

These are already installed. You don't need to install anything.

---

## RUNNING TESTS

```bash
# Run all unit/component tests once
npm test

# Run tests in watch mode (re-runs when you edit a file)
npm run test:watch

# Run E2E tests (opens a browser and clicks through the app)
npx playwright test

# Run E2E tests with a visible browser window
npx playwright test --headed
```

---

## WHERE TO PUT TEST FILES

```
src/
  test/
    setup.ts          ← test configuration (already exists)
    utils.test.ts     ← tests for utility functions (NEW)
    components/
      StatCard.test.tsx   ← component tests (NEW)
      LoginPage.test.tsx  ← page tests (NEW)
  
e2e/
  login.spec.ts       ← E2E test: login flow (NEW)
  inventory.spec.ts   ← E2E test: adding/editing items (NEW)
```

File naming: `*.test.ts` or `*.spec.ts` — Vitest picks these up automatically.

---

## UNIT TESTS — Testing Pure Functions

These test JavaScript functions with no UI involved.

### Example: test the `getLowStockItems` helper

Create `src/test/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getLowStockItems } from "@/data/mockData";
import type { InventoryItem } from "@/types";

describe("getLowStockItems", () => {
  const inventory: InventoryItem[] = [
    { id: 1, name: "Brake Pads", brand: "Brembo", compatibility: "Toyota", 
      costPrice: 35, sellingPrice: 85, stock: 2, minStock: 10 },  // LOW
    { id: 2, name: "Oil Filter", brand: "Bosch", compatibility: "Honda",
      costPrice: 8, sellingPrice: 24, stock: 20, minStock: 15 },  // OK
    { id: 3, name: "Spark Plugs", brand: "NGK", compatibility: "Nissan",
      costPrice: 22, sellingPrice: 62, stock: 5, minStock: 5 },   // EXACTLY at min
  ];

  it("returns items where stock is at or below minStock", () => {
    const result = getLowStockItems(inventory);
    expect(result).toHaveLength(2); // Brake Pads and Spark Plugs
  });

  it("does not include items with sufficient stock", () => {
    const result = getLowStockItems(inventory);
    const names = result.map((i) => i.name);
    expect(names).not.toContain("Oil Filter");
  });

  it("returns empty array when all items have sufficient stock", () => {
    const allGoodInventory = inventory.map((i) => ({ ...i, stock: i.minStock + 5 }));
    expect(getLowStockItems(allGoodInventory)).toHaveLength(0);
  });
});
```

**Run it:**
```bash
npm test
```

---

## COMPONENT TESTS — Testing React Components

These render a component and check that it displays the right things.

### Example: test StatCard

Create `src/test/components/StatCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "@/components/StatCard";
import { DollarSign } from "lucide-react";

describe("StatCard", () => {
  it("renders the title and value", () => {
    render(
      <StatCard
        title="Today's Revenue"
        value="$2,450"
        icon={<DollarSign />}
      />
    );
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText("$2,450")).toBeInTheDocument();
  });

  it("shows positive change text in green", () => {
    render(
      <StatCard
        title="Revenue"
        value="$100"
        change="+12% from yesterday"
        changeType="positive"
        icon={<DollarSign />}
      />
    );
    const changeEl = screen.getByText("+12% from yesterday");
    expect(changeEl).toHaveClass("text-success");
  });

  it("shows negative change text in red", () => {
    render(
      <StatCard
        title="Revenue"
        value="$100"
        change="-5% from yesterday"
        changeType="negative"
        icon={<DollarSign />}
      />
    );
    const changeEl = screen.getByText("-5% from yesterday");
    expect(changeEl).toHaveClass("text-destructive");
  });

  it("does not render change text when not provided", () => {
    render(
      <StatCard title="Revenue" value="$100" icon={<DollarSign />} />
    );
    // change text should not appear at all
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
```

---

### Example: test the search filter in InventoryPage

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InventoryPage from "@/pages/InventoryPage";

// We wrap it in MemoryRouter because InventoryPage uses DashboardLayout
// which uses <Link> components that need a Router
describe("InventoryPage search", () => {
  it("filters items by name", async () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search parts, brands, models...");
    fireEvent.change(searchInput, { target: { value: "Brake" } });

    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
  });

  it("shows all items when search is empty", () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );

    // All 8 items should be visible
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("Spark Plugs (x4)")).toBeInTheDocument();
  });
});
```

---

## AUTH TESTS

### Example: test login form validation

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

// Mock the useAuth hook so we control what login() returns
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(false), // simulate wrong credentials
  }),
}));

describe("LoginPage", () => {
  it("shows error message on failed login", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
    });
  });
});
```

---

## END-TO-END (E2E) TESTS WITH PLAYWRIGHT

E2E tests open a real browser and simulate what a user does: clicking, typing, navigating.

### Setup

Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Example: test the full login flow

Create `e2e/login.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects to login when accessing dashboard without auth", async ({ page }) => {
    await page.goto("http://localhost:8080/dashboard");
    // Should be redirected to login
    await expect(page).toHaveURL("http://localhost:8080/");
    await expect(page.getByText("Sign In")).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("http://localhost:8080/");
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("http://localhost:8080/");
    await page.fill('input[type="email"]', "owner@autopartspro.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("http://localhost:8080/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("sign out returns to login page", async ({ page }) => {
    // First login
    await page.goto("http://localhost:8080/");
    await page.fill('input[type="email"]', "owner@autopartspro.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:8080/dashboard");

    // Then sign out
    await page.click("button:has-text('Sign Out')");
    await expect(page).toHaveURL("http://localhost:8080/");
  });
});
```

**To run E2E tests:**
1. Start the dev server in one terminal: `npm run dev`
2. In another terminal: `npx playwright test`

---

## TESTING STRATEGY SUMMARY

| What to test | How | Priority |
|---|---|---|
| Utility functions (getLowStockItems, getTodayString) | Vitest unit tests | 🔴 First |
| StatCard renders correctly | Vitest component test | 🔴 First |
| Search filter works | Vitest component test | 🔴 First |
| Login form validation | Vitest component test | 🔴 First |
| Auth context (login/logout) | Vitest unit test | 🟡 Second |
| Add inventory item flow | Vitest integration test | 🟡 Second |
| Full login/logout flow | Playwright E2E | 🟡 Second |
| CRUD operations end-to-end | Playwright E2E | 🟠 Third |
| Reports calculations | Vitest unit test | 🟠 Third |

---

## DEBUGGING FAILING TESTS

### Vitest

Run a single test file:
```bash
npx vitest run src/test/utils.test.ts
```

Show detailed output:
```bash
npx vitest run --reporter=verbose
```

### Playwright

Run with visible browser:
```bash
npx playwright test --headed
```

Slow down to watch what it does:
```bash
npx playwright test --headed --slow-mo=1000
```

Debug step by step:
```bash
npx playwright test --debug
```

Show test report in browser:
```bash
npx playwright show-report
```

---

## COMMON TEST FAILURES

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@/...'` | Path alias not configured for tests | Check `vitest.config.ts` has the `resolve.alias` for `@` |
| `document is not defined` | Test file missing jsdom environment | Add `// @vitest-environment jsdom` at top of file |
| `act(...)` warning | State update happens after test | Wrap in `waitFor(() => ...)` |
| Element not found | Text doesn't match exactly | Use `.getByRole()` or check casing |
| Playwright timeout | Dev server not running | Start `npm run dev` before running Playwright |
| `[object Object]` in test output | Forgot to `await` a promise | Add `await` before async calls |
