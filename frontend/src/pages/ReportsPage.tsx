// src/pages/ReportsPage.tsx
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  Package,
  Store,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ExportButton from "@/components/ui/ExportButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useReportSummaryQuery,
  useTopItemsQuery,
  usePaymentBreakdownQuery,
  useBranchComparisonQuery,
} from "@/hooks/useReports";
import { useBranch } from "@/contexts/BranchContext";

const ReportsPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { activeBranch, activeBranchId } = useBranch();

  const { data: summary, isLoading: summaryLoading, isError: summaryError } =
    useReportSummaryQuery(selectedYear, activeBranchId);
  const { data: topItems, isLoading: topItemsLoading } =
    useTopItemsQuery(5, activeBranchId);
  const { data: payments, isLoading: paymentsLoading } =
    usePaymentBreakdownQuery(activeBranchId);
  const { data: branchComp } = useBranchComparisonQuery(selectedYear);

  if (summaryLoading || topItemsLoading || paymentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (summaryError || !summary) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center text-destructive">
          Failed to load financial report data. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const ytd = summary.yearToDate;
  const currentMonth = summary.months[summary.months.length - 1] || {
    revenue: 0,
    expenses: 0,
    profit: 0,
    totalSales: 0,
  };

  const chartData = summary.months.map((m) => ({
    month: m.month,
    Revenue: m.revenue,
    Expenses: m.expenses,
    Profit: m.profit,
  }));

  const exportMonthlyData = summary.months.map((m) => ({
    Month: `${m.month} ${summary.year}`,
    "Revenue ($)": m.revenue,
    "Expenses ($)": m.expenses,
    "Net Profit ($)": m.profit,
    "Total Transactions": m.totalSales || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                Financial & Branch Reports
              </h1>
              {activeBranch && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Store className="h-3 w-3 text-primary" />
                  {activeBranch.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Profit & Loss, top performing items, and store branch comparison for {summary.year}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
            >
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
                <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
                <SelectItem value={String(currentYear - 2)}>{currentYear - 2}</SelectItem>
              </SelectContent>
            </Select>

            <ExportButton
              filename={`financial-report-${summary.year}`}
              data={exportMonthlyData}
              title="Export Report"
            />
          </div>
        </div>

        {/* Top Financial Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Revenue"
            value={`$${currentMonth.revenue.toLocaleString()}`}
            change={`${currentMonth.totalSales} sales this month`}
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="YTD Total Revenue"
            value={`$${ytd.revenue.toLocaleString()}`}
            change={`Year ${summary.year} to date`}
            changeType="neutral"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Monthly Expenses"
            value={`$${currentMonth.expenses.toLocaleString()}`}
            change="Operating costs"
            changeType="neutral"
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <StatCard
            title="Monthly Profit"
            value={`$${currentMonth.profit.toLocaleString()}`}
            change={`${((currentMonth.profit / (currentMonth.revenue || 1)) * 100).toFixed(1)}% margin`}
            changeType={currentMonth.profit >= 0 ? "positive" : "negative"}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Multi-Branch Performance Comparison Section */}
        {branchComp && branchComp.branches.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Multi-Branch Performance Comparison ({summary.year})
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Live branch totals
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {branchComp.branches.map((b) => (
                <div
                  key={b.branchId}
                  className="rounded-lg border border-border/80 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-foreground">
                      {b.branchName}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {b.branchCode}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Total Revenue</div>
                      <div className="font-mono font-bold text-base text-primary">
                        ${b.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Transactions</div>
                      <div className="font-mono font-semibold text-base text-foreground">
                        {b.totalSalesCount} sales
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Revenue & Expense Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Monthly Revenue vs Expenses vs Net Profit ({summary.year})
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" textAnchor="middle" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Columns: Monthly Table and Top Items */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Breakdown Table */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-card-foreground">
                Monthly Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Month</th>
                    <th className="px-5 py-3 font-medium text-right">Revenue</th>
                    <th className="px-5 py-3 font-medium text-right">Expenses</th>
                    <th className="px-5 py-3 font-medium text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.months.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-card-foreground">
                        {row.month} {summary.year}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-card-foreground">
                        ${row.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                        ${row.expenses.toLocaleString()}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono font-bold ${
                          row.profit >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ${row.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {/* Top Selling Items */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-card-foreground">
                  Top Best-Selling Items
                </h3>
              </div>
              <div className="divide-y divide-border/50">
                {topItems?.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-primary/10 p-2 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {item.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalSold} units sold
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-medium text-card-foreground">
                      ${item.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-card-foreground">
                  Payment Method Distribution
                </h3>
              </div>
              <div className="divide-y divide-border/50">
                {payments?.map((pm) => (
                  <div
                    key={pm.method}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-muted p-2 text-foreground">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize text-card-foreground">
                          {pm.method.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pm.count} transaction{pm.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-medium text-card-foreground">
                      ${pm.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
