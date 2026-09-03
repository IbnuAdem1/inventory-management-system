// src/hooks/useReports.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
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
    expenses?: number;
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

export interface ApiBranchComparison {
  year: number;
  branches: Array<{
    branchId: string;
    branchName: string;
    branchCode: string;
    totalSalesCount: number;
    totalRevenue: number;
  }>;
}

export interface ReportSummary {
  year: number;
  months: MonthlyReport[];
  yearToDate: ApiReportSummary["yearToDate"];
}

export function useReportSummaryQuery(year = new Date().getFullYear(), branchId?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reports", "summary", year, branchId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (branchId && branchId !== "all") params.set("branchId", branchId);

      const summary = await apiFetch<ApiReportSummary>(`/reports/summary?${params.toString()}`);
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

export function useTopItemsQuery(limit = 5, branchId?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reports", "top-items", limit, branchId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (branchId && branchId !== "all") params.set("branchId", branchId);

      const items = await apiFetch<ApiTopItem[]>(`/reports/top-items?${params.toString()}`);
      return items.map((item) => ({
        ...item,
        totalRevenue: Number(item.totalRevenue),
      }));
    },
  });
}

export function usePaymentBreakdownQuery(branchId?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reports", "payment-breakdown", branchId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId && branchId !== "all") params.set("branchId", branchId);

      const breakdown = await apiFetch<ApiPaymentBreakdown[]>(
        `/reports/payment-breakdown?${params.toString()}`
      );
      return breakdown.map((item) => ({
        ...item,
        total: Number(item.total),
      }));
    },
  });
}

export function useBranchComparisonQuery(year = new Date().getFullYear()) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reports", "branch-comparison", year],
    enabled: isAuthenticated,
    queryFn: () =>
      apiFetch<ApiBranchComparison>(`/reports/branch-comparison?year=${year}`),
  });
}
