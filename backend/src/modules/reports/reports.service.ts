// src/modules/reports/reports.service.ts
import { prisma } from "../../lib/prisma";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const reportsService = {
  async getSummary(year: number) {
    // Fetch all sales for the year with their items
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      include: { items: true },
    });

    // Fetch expenses for the year
    const expenses = await prisma.expense.findMany({
      where: { year },
    });

    // Build monthly buckets
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
    const ytdProfit = months.reduce((s, m) => s + m.profit, 0);

    return {
      year,
      months,
      yearToDate: { revenue: ytdRevenue, totalSales: ytdSales, profit: ytdProfit },
    };
  },

  async getTopItems(limit: number) {
    // Aggregate sale_items to find best sellers
    const grouped = await prisma.saleItem.groupBy({
      by: ["inventoryId", "itemName"],
      _sum: { quantity: true, amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    return grouped.map((g) => ({
      inventoryId: g.inventoryId,
      itemName: g.itemName,
      totalSold: g._sum.quantity ?? 0,
      totalRevenue: g._sum.amount ?? 0,
    }));
  },

  async getPaymentBreakdown() {
    const grouped = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      _count: true,
    });

    return grouped.map((g) => ({
      method: g.paymentMethod,
      total: g._sum.totalAmount ?? 0,
      count: g._count,
    }));
  },
};
