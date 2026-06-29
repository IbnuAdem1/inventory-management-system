import { useQuery } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";
import type { MonthlyReport } from "@/types";

interface ApiReportMonth {
  month: number;
  monthName: string;
  revenue: number;
  totalSales: number;
  expenses: number;
  profit: number;
}

interface ApiReportSummary {
  year: number;
  months: ApiReportMonth[];
  yearToDate: {
    revenue: number;
    totalSales: number;
    profit: number;
  };
}

interface ApiTopItem {
  inventoryId: string;
  itemName: string;
  totalSold: number;
  totalRevenue: string | number;
}

interface ApiPaymentBreakdown {
  method: "CASH" | "TRANSFER" | "CREDIT";
  total: string | number;
  count: number;
}

export interface ReportSummary {
  year: number;
  months: MonthlyReport[];
  yearToDate: ApiReportSummary["yearToDate"];
}

export function useReportSummaryQuery(year = new Date().getFullYear()) {
  return useQuery({
    queryKey: ["reports", "summary", year],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const summary = await apiFetch<ApiReportSummary>(`/reports/summary?year=${year}`);
      return {
        year: summary.year,
        months: summary.months.map((month) => ({
          month: month.monthName.slice(0, 3),
          revenue: Number(month.revenue),
          cost: 0,
          expenses: Number(month.expenses),
          profit: Number(month.profit),
          totalSales: month.totalSales,
        })),
        yearToDate: {
          revenue: Number(summary.yearToDate.revenue),
          totalSales: summary.yearToDate.totalSales,
          profit: Number(summary.yearToDate.profit),
        },
      } satisfies ReportSummary;
    },
  });
}

export function useTopItemsQuery(limit = 5) {
  return useQuery({
    queryKey: ["reports", "top-items", limit],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const items = await apiFetch<ApiTopItem[]>(`/reports/top-items?limit=${limit}`);
      return items.map((item) => ({
        ...item,
        totalRevenue: Number(item.totalRevenue),
      }));
    },
  });
}

export function usePaymentBreakdownQuery() {
  return useQuery({
    queryKey: ["reports", "payment-breakdown"],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const breakdown = await apiFetch<ApiPaymentBreakdown[]>("/reports/payment-breakdown");
      return breakdown.map((item) => ({
        ...item,
        total: Number(item.total),
      }));
    },
  });
}
