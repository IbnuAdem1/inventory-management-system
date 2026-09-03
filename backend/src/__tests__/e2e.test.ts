// backend/src/__tests__/e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, apiRequest, TestServer } from "./test-helper";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

describe("AutoPartsPro End-to-End System Test Suite", () => {
  let testEnv: TestServer;
  let ownerToken: string;
  let workerToken: string;
  let createdPartId: string;
  let createdCreditId: string;
  let mainBranchId: string;
  let secondBranchId: string;

  const testWorkerEmail = "test.worker@autopartspro.com";
  const testWorkerPassword = "WorkerPassword123!";

  beforeAll(async () => {
    testEnv = await startTestServer();

    // Ensure main and second branches exist in DB for transfer testing
    const mainBranch = await prisma.branch.upsert({
      where: { code: "MAIN-01" },
      update: {},
      create: {
        name: "Main Store",
        code: "MAIN-01",
        address: "Bole Road, Building A",
        isDefault: true,
      },
    });
    mainBranchId = mainBranch.id;

    const secondBranch = await prisma.branch.upsert({
      where: { code: "DOWN-02" },
      update: {},
      create: {
        name: "Downtown Branch",
        code: "DOWN-02",
        address: "Piazza Central, Shop #14",
        isDefault: false,
      },
    });
    secondBranchId = secondBranch.id;

    // Ensure test worker exists with known password and branch
    const workerPasswordHash = await bcrypt.hash(testWorkerPassword, 10);
    await prisma.user.upsert({
      where: { email: testWorkerEmail },
      update: {
        passwordHash: workerPasswordHash,
        isActive: true,
        branchId: mainBranchId,
        permissions: ["sales", "inventory", "credits", "customers"],
      },
      create: {
        email: testWorkerEmail,
        passwordHash: workerPasswordHash,
        name: "Dawit Tadesse",
        role: "WORKER",
        branchId: mainBranchId,
        permissions: ["sales", "inventory", "credits", "customers"],
        isActive: true,
      },
    });
  }, 15000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.close();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION & RBAC PERMISSION TESTING
  // ─────────────────────────────────────────────────────────────
  describe("1. Authentication & Role Permissions", () => {
    it("should reject invalid login credentials with 401", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/auth/login", {
        method: "POST",
        body: { email: "owner@autopartspro.com", password: "wrongpassword" },
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty("message");
    });

    it("should successfully log in Store Owner and return JWT token", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/auth/login", {
        method: "POST",
        body: { email: "owner@autopartspro.com", password: "admin123" },
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("token");
      expect(res.data.user.role).toBe("OWNER");
      ownerToken = res.data.token;
    });

    it("should successfully log in Staff Member and return assigned branch & permissions", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/auth/login", {
        method: "POST",
        body: { email: testWorkerEmail, password: testWorkerPassword },
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("token");
      expect(res.data.user.role).toBe("WORKER");
      expect(Array.isArray(res.data.user.permissions)).toBe(true);
      workerToken = res.data.token;
    });

    it("should verify token identity via GET /auth/me", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/auth/me", {
        token: ownerToken,
      });

      expect(res.status).toBe(200);
      expect(res.data.email).toBe("owner@autopartspro.com");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. STORE BRANCHES & MULTI-STORE DIRECTORY
  // ─────────────────────────────────────────────────────────────
  describe("2. Multi-Store Branch Directory", () => {
    it("should retrieve store branches list", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/branches", {
        token: ownerToken,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SPARE PARTS INVENTORY CATALOG OPERATIONS
  // ─────────────────────────────────────────────────────────────
  describe("3. Spare Parts Inventory & Stock Management", () => {
    it("should allow staff to fetch parts catalog", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/inventory", {
        token: workerToken,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("should allow adding a new spare part to inventory catalog", async () => {
      const timestamp = Date.now();
      const newPart = {
        name: `Ceramic Brake Pads HD-${timestamp}`,
        brand: "Brembo Racing",
        compatibility: "Toyota Hilux 2020-2024",
        category: "Brakes",
        sku: `BRK-${timestamp}`,
        costPrice: 45.0,
        sellingPrice: 75.0,
        stock: 30,
        minStock: 5,
        branchId: mainBranchId,
      };

      const res = await apiRequest(testEnv.baseUrl, "/inventory", {
        method: "POST",
        token: workerToken,
        body: newPart,
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty("id");
      expect(res.data.name).toBe(newPart.name);
      expect(Number(res.data.stock)).toBe(30);

      createdPartId = res.data.id;
    });

    it("should allow updating stock and selling price", async () => {
      const res = await apiRequest(testEnv.baseUrl, `/inventory/${createdPartId}`, {
        method: "PATCH",
        token: workerToken,
        body: {
          sellingPrice: 80.0,
          stock: 28,
        },
      });

      expect(res.status).toBe(200);
      expect(Number(res.data.sellingPrice)).toBe(80.0);
      expect(Number(res.data.stock)).toBe(28);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. POS SALES CHECKOUT & AUTOMATIC STOCK DECREMENT
  // ─────────────────────────────────────────────────────────────
  describe("4. POS Counter Sales & Inventory Deductions", () => {
    it("should process a POS Cash Sale and decrement inventory stock atomically", async () => {
      const salePayload = {
        customer: "Walk-in Counter Customer",
        paymentMethod: "CASH",
        branchId: mainBranchId,
        items: [
          {
            inventoryId: createdPartId,
            quantity: 3,
            unitPrice: 80.0,
          },
        ],
      };

      const res = await apiRequest(testEnv.baseUrl, "/sales", {
        method: "POST",
        token: workerToken,
        body: salePayload,
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty("id");
      expect(Number(res.data.totalAmount)).toBe(240.0);

      // Verify stock was decremented from 28 to 25
      const partCheck = await apiRequest(testEnv.baseUrl, `/inventory/${createdPartId}`, {
        token: workerToken,
      });
      expect(Number(partCheck.data.stock)).toBe(25);
    });

    it("should process a Credit Sale and automatically create a linked debt book entry", async () => {
      const creditSalePayload = {
        customer: "Abebe Auto Garage (Credit)",
        paymentMethod: "CREDIT",
        branchId: mainBranchId,
        items: [
          {
            inventoryId: createdPartId,
            quantity: 2,
            unitPrice: 80.0,
          },
        ],
      };

      const res = await apiRequest(testEnv.baseUrl, "/sales", {
        method: "POST",
        token: workerToken,
        body: creditSalePayload,
      });

      expect(res.status).toBe(201);
      expect(Number(res.data.totalAmount)).toBe(160.0);

      // Verify stock was decremented from 25 to 23
      const partCheck = await apiRequest(testEnv.baseUrl, `/inventory/${createdPartId}`, {
        token: workerToken,
      });
      expect(Number(partCheck.data.stock)).toBe(23);
    });

    it("should process a Customer Part Return and atomically restock inventory", async () => {
      // Create a sale of 2 items
      const saleRes = await apiRequest(testEnv.baseUrl, "/sales", {
        method: "POST",
        token: workerToken,
        body: {
          customer: "Test Return Customer",
          paymentMethod: "CASH",
          branchId: mainBranchId,
          items: [{ inventoryId: createdPartId, quantity: 2, unitPrice: 80.0 }],
        },
      });
      expect(saleRes.status).toBe(201);
      const testSaleId = saleRes.data.id;

      // Return 1 item from this sale
      const returnRes = await apiRequest(testEnv.baseUrl, `/sales/${testSaleId}/return`, {
        method: "POST",
        token: workerToken,
        body: {
          items: [{ inventoryId: createdPartId, quantity: 1, reason: "Wrong fitment" }],
          refundType: "CASH",
        },
      });

      expect(returnRes.status).toBe(200);
      expect(returnRes.data.totalRefundAmount).toBe(80.0);

      // Verify stock increased by 1 unit
      const partCheck = await apiRequest(testEnv.baseUrl, `/inventory/${createdPartId}`, {
        token: workerToken,
      });
      expect(Number(partCheck.data.stock)).toBe(22); // 23 - 2 + 1 = 22
    });
  });


  // ─────────────────────────────────────────────────────────────
  // 5. CUSTOMER CREDITS & PARTIAL PAYMENT SETTLEMENT
  // ─────────────────────────────────────────────────────────────
  describe("5. Customer Credits Book & Payment Processing", () => {
    it("should list active customer credit records", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/credits", {
        token: workerToken,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      const targetCredit = res.data.find(
        (c: any) => c.customerName === "Abebe Auto Garage (Credit)" && c.status === "UNPAID"
      );
      expect(targetCredit).toBeDefined();
      createdCreditId = targetCredit.id;
    });

    it("should record a partial cash payment and update remaining balance", async () => {
      const res = await apiRequest(testEnv.baseUrl, `/credits/${createdCreditId}/payments`, {
        method: "POST",
        token: workerToken,
        body: {
          amount: 60.0,
          paymentMethod: "CASH",
          note: "Partial deposit payment",
        },
      });

      expect(res.status).toBe(201);
      const creditData = res.data.credit || res.data;
      expect(Number(creditData.paidAmount)).toBe(60.0);
      expect(creditData.status).toBe("PARTIAL");
    });

  });

  // ─────────────────────────────────────────────────────────────
  // 6. INTER-BRANCH STOCK TRANSFERS
  // ─────────────────────────────────────────────────────────────
  describe("6. Inter-Branch Stock Transfers", () => {
    it("should transfer parts between branches atomically", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/branches/transfer", {
        method: "POST",
        token: workerToken,
        body: {
          inventoryId: createdPartId,
          fromBranchId: mainBranchId,
          toBranchId: secondBranchId,
          quantity: 5,
          notes: "Routine warehouse replenishment",
        },
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty("transfer");
      expect(res.data.transfer.quantity).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. CUSTOMER CONTACTS REGISTRATION
  // ─────────────────────────────────────────────────────────────
  describe("7. Customer Contacts Directory", () => {
    it("should allow staff to create customer contacts", async () => {
      const timestamp = Date.now();
      const newContact = {
        type: "customer",
        name: `Kenenisa Garage ${timestamp}`,
        phone: "+251 91 999 8877",
        companyName: "Kenenisa Express Motors",
        address: "Bole Medhanialem",
      };

      const res = await apiRequest(testEnv.baseUrl, "/contacts", {
        method: "POST",
        token: workerToken,
        body: newContact,
      });

      expect(res.status).toBe(201);
      expect(res.data.name).toBe(newContact.name);
    });

    it("should retrieve customers list", async () => {
      const res = await apiRequest(testEnv.baseUrl, "/contacts?type=customer", {
        token: workerToken,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. AUDIT ACTIVITY TIMELINE & DATE FILTERING
  // ─────────────────────────────────────────────────────────────
  describe("8. Employee Activity Logs & Audit Timeline", () => {
    it("should retrieve immutable audit logs for current date", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiRequest(testEnv.baseUrl, `/activity?date=${todayStr}`, {
        token: ownerToken,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);

      // Verify that activity logs recorded real actions
      const hasAction = res.data.some((l: any) => l.action && l.workerName);
      expect(hasAction).toBe(true);
    });
  });
});
