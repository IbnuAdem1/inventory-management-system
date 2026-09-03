// frontend/src/__tests__/permissions.test.ts
import { describe, it, expect } from "vitest";

describe("Frontend RBAC & Role Scoping Rules", () => {
  const allNavItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Inventory", path: "/inventory" },
    { label: "Sales & POS", path: "/sales" },
    { label: "Credits", path: "/credits" },
    { label: "Contacts", path: "/contacts" },
    { label: "Expenses", path: "/expenses" },
    { label: "Reports", path: "/reports" },
    { label: "Activity Log", path: "/activity" },
    { label: "Settings", path: "/settings" },
  ];

  function getVisibleNav(user: { role: string; permissions: string[] }) {
    const isOwner = user.role === "owner";
    const userPermissions = user.permissions || [];

    return allNavItems.filter((item) => {
      if (isOwner) return true;
      if (item.path === "/dashboard") return true;
      if (item.path === "/settings") return false; // Settings is strictly owner-only
      if (item.path === "/activity") return isOwner; // Activity is owner-only
      if (item.path === "/inventory") {
        return (
          userPermissions.includes("inventory_view") ||
          userPermissions.includes("inventory_manage") ||
          userPermissions.includes("inventory")
        );
      }
      if (item.path === "/sales") return userPermissions.includes("sales");
      if (item.path === "/credits") {
        return userPermissions.includes("credits") || userPermissions.includes("credits_all");
      }
      if (item.path === "/expenses") return userPermissions.includes("expenses");
      if (item.path === "/reports") return userPermissions.includes("reports");
      if (item.path === "/contacts") {
        return (
          userPermissions.includes("customers") ||
          userPermissions.includes("customers_all") ||
          userPermissions.includes("suppliers") ||
          userPermissions.includes("bank_accounts")
        );
      }
      return true;
    });
  }

  it("should show all 9 pages to the Store Owner", () => {
    const owner = { role: "owner", permissions: [] };
    const visible = getVisibleNav(owner);
    expect(visible.length).toBe(9);
    expect(visible.map((v) => v.path)).toEqual([
      "/dashboard",
      "/inventory",
      "/sales",
      "/credits",
      "/contacts",
      "/expenses",
      "/reports",
      "/activity",
      "/settings",
    ]);
  });

  it("should hide Expenses, Reports, Activity, and Settings from Counter Sales Clerks", () => {
    const clerk = {
      role: "worker",
      permissions: ["sales", "inventory_view", "credits", "customers"],
    };
    const visible = getVisibleNav(clerk);
    const paths = visible.map((v) => v.path);

    expect(paths).toContain("/dashboard");
    expect(paths).toContain("/inventory");
    expect(paths).toContain("/sales");
    expect(paths).toContain("/credits");
    expect(paths).toContain("/contacts");

    // Strictly forbidden for clerks
    expect(paths).not.toContain("/expenses");
    expect(paths).not.toContain("/reports");
    expect(paths).not.toContain("/activity");
    expect(paths).not.toContain("/settings");
  });

  it("should grant Expenses access to Assistant Managers when permitted", () => {
    const manager = {
      role: "worker",
      permissions: [
        "sales",
        "inventory_manage",
        "credits_all",
        "customers_all",
        "expenses",
      ],
    };
    const visible = getVisibleNav(manager);
    const paths = visible.map((v) => v.path);

    expect(paths).toContain("/expenses");
    expect(paths).not.toContain("/settings");
    expect(paths).not.toContain("/activity");
  });
});
