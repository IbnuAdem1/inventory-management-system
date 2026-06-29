import { DollarSign, TrendingUp, TrendingDown, ArrowDownToLine, Loader2, Package } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useReportSummaryQuery, useTopItemsQuery, usePaymentBreakdownQuery } from "@/hooks/useReports";

const ReportsPage = () => {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useReportSummaryQuery();
  const { data: topItems, isLoading: topItemsLoading } = useTopItemsQuery();
  const { data: payments, isLoading: paymentsLoading } = usePaymentBreakdownQuery();

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
          Failed to load report data. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const ytd = summary.yearToDate;
  const currentMonth = summary.months[summary.months.length - 1] || {
    revenue: 0,
    expenses: 0,
    profit: 0,
    totalSales: 0
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
            <p className="text-sm text-muted-foreground">Profit & loss overview for {summary.year}</p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Revenue"
            value={`$${currentMonth.revenue.toLocaleString()}`}
            change={`${currentMonth.totalSales} sales this month`}
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="YTD Revenue"
            value={`$${ytd.revenue.toLocaleString()}`}
            change="Year to date"
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly breakdown */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-card-foreground">Monthly Performance</h3>
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
                    <tr key={row.month} className="border-b border-border/50 last:border-0">
                      <td className="px-5 py-3 font-medium text-card-foreground">{row.month} {summary.year}</td>
                      <td className="px-5 py-3 text-right font-mono text-card-foreground">${row.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">${row.expenses.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-success">${row.profit.toLocaleString()}</td>
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
                <h3 className="text-sm font-semibold text-card-foreground">Top Selling Items</h3>
              </div>
              <div className="divide-y divide-border/50">
                {topItems?.map((item) => (
                  <div key={item.inventoryId} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-primary/10 p-2 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">{item.totalSold} units sold</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-medium text-card-foreground">${item.totalRevenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-card-foreground">Payment Methods</h3>
              </div>
              <div className="divide-y divide-border/50">
                {payments?.map((p) => (
                  <div key={p.method} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-card-foreground capitalize">{p.method.toLowerCase()}</span>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-card-foreground">${p.total.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{p.count} transactions</p>
                    </div>
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
