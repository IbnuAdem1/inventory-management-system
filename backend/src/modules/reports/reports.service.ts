// src/modules/reports/reports.service.ts
import { prisma } from "../../lib/prisma";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const reportsService = {
  async getSummary(year: number, branchId?: string) {
    const saleWhere: any = {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    };
    if (branchId && branchId !== "all") {
      saleWhere.branchId = branchId;
    }

    const sales = await prisma.sale.findMany({
      where: saleWhere,
      include: { items: true },
    });

    const expenseWhere: any = { year };
    if (branchId && branchId !== "all") {
      expenseWhere.branchId = branchId;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
    });

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthSales = sales.filter(
        (s) => new Date(s.createdAt).getMonth() + 1 === monthNum
      );
      const revenue = monthSales.reduce(
        (sum, s) => sum + Number(s.totalAmount), 0
      );
      const monthExpenses = expenses
        .filter((e) => e.month === monthNum)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        month: monthNum,
        monthName: MONTH_NAMES[i],
        revenue,
        totalSales: monthSales.length,
        expenses: monthExpenses,
        profit: revenue - monthExpenses,
      };
    });

    const ytdRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const ytdSales = months.reduce((s, m) => s + m.totalSales, 0);
    const ytdExpenses = months.reduce((s, m) => s + m.expenses, 0);
    const ytdProfit = ytdRevenue - ytdExpenses;

    return {
      year,
      months,
      yearToDate: {
        revenue: ytdRevenue,
        totalSales: ytdSales,
        expenses: ytdExpenses,
        profit: ytdProfit,
      },
    };
  },

  async getTopItems(limit: number, branchId?: string) {
    const where: any = {};
    if (branchId && branchId !== "all") {
      where.sale = { branchId };
    }

    const grouped = await prisma.saleItem.groupBy({
      by: ["inventoryId", "itemName"],
      where,
      _sum: { quantity: true, amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    return grouped.map((g) => ({
      inventoryId: g.inventoryId,
      itemName: g.itemName,
      totalSold: g._sum.quantity ?? 0,
      totalRevenue: Number(g._sum.amount ?? 0),
    }));
  },

  async getPaymentBreakdown(branchId?: string) {
    const where: any = {};
    if (branchId && branchId !== "all") {
      where.branchId = branchId;
    }

    const grouped = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    return grouped.map((g) => ({
      method: g.paymentMethod,
      total: Number(g._sum.totalAmount ?? 0),
      count: g._count,
    }));
  },

  async getBranchComparison(year: number) {
    const branches = await prisma.branch.findMany().catch(() => [
      { id: "branch-main-store", name: "Main Store", code: "MAIN-01" },
      { id: "branch-second-store", name: "Downtown Branch", code: "DOWN-02" },
    ]);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      include: { items: true },
    });

    const comparison = branches.map((b) => {
      const branchSales = sales.filter(
        (s) => s.branchId === b.id || (!s.branchId && (b as any).isDefault)
      );
      const totalRevenue = branchSales.reduce(
        (sum, s) => sum + Number(s.totalAmount),
        0
      );

      return {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        totalSalesCount: branchSales.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      };
    });

    return {
      year,
      branches: comparison,
    };
  },
};
