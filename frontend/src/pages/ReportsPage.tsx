import { DollarSign, TrendingUp, TrendingDown, ArrowDownToLine } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { mockMonthlyReports, mockExpenses } from "@/data/mockData";

const ReportsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
            <p className="text-sm text-muted-foreground">Profit & loss overview</p>
          </div>
          <Button variant="outline">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Revenue"
            value="$24,800"
            change="+15.3% vs last month"
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Cost of Goods"
            value="$12,900"
            change="52% of revenue"
            changeType="neutral"
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <StatCard
            title="Operating Expenses"
            value="$4,700"
            change="19% of revenue"
            changeType="neutral"
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <StatCard
            title="Net Profit"
            value="$7,200"
            change="+24.1% vs last month"
            changeType="positive"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly breakdown */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-card-foreground">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Month</th>
                    <th className="px-5 py-3 font-medium text-right">Revenue</th>
                    <th className="px-5 py-3 font-medium text-right">COGS</th>
                    <th className="px-5 py-3 font-medium text-right">Expenses</th>
                    <th className="px-5 py-3 font-medium text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMonthlyReports.map((row) => (
                    <tr key={row.month} className="border-b border-border/50 last:border-0">
                      <td className="px-5 py-3 font-medium text-card-foreground">{row.month} 2026</td>
                      <td className="px-5 py-3 text-right font-mono text-card-foreground">${row.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">${row.cost.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">${row.expenses.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-success">${row.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-card-foreground">Monthly Expenses</h3>
              <p className="text-xs text-muted-foreground">March 2026</p>
            </div>
            <div className="divide-y divide-border/50">
              {mockExpenses.map((exp) => (
                <div key={exp.category} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-card-foreground">{exp.category}</span>
                  <span className="font-mono text-sm font-medium text-card-foreground">${exp.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
                <span className="text-sm font-semibold text-card-foreground">Total</span>
                <span className="font-mono text-sm font-bold text-primary">
                  ${mockExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
