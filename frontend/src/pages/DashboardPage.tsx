import { DollarSign, Package, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import RecentSalesTable from "@/components/RecentSalesTable";
import LowStockAlerts from "@/components/LowStockAlerts";
import { useInventory } from "@/contexts/InventoryContext";
import { useSales } from "@/contexts/SalesContext";
import { useReportSummaryQuery } from "@/hooks/useReports";

const DashboardPage = () => {
  const { totalItems, lowStockItems, isLoading: inventoryLoading } = useInventory();
  const { todayTotal, todaySales, isLoading: salesLoading } = useSales();
  const { data: summary, isLoading: summaryLoading } = useReportSummaryQuery();

  const isLoading = inventoryLoading || salesLoading || summaryLoading;

  // Latest month profit from reports
  const months = summary?.months || [];
  const latestMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];
  
  const profitChange = (latestMonth && prevMonth && prevMonth.profit !== 0)
    ? (((latestMonth.profit - prevMonth.profit) / Math.abs(prevMonth.profit)) * 100).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your business operations
          </p>
        </div>

        {/* Stats — all computed from real context data */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Revenue"
            value={`$${todayTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={`${todaySales.length} transaction${todaySales.length !== 1 ? "s" : ""} today`}
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Total Sales"
            value={String(todaySales.length)}
            change="Transactions today"
            changeType="positive"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Units in Stock"
            value={totalItems.toLocaleString()}
            change={
              lowStockItems.length > 0
                ? `${lowStockItems.length} low stock item${lowStockItems.length !== 1 ? "s" : ""}`
                : "All items adequately stocked"
            }
            changeType={lowStockItems.length > 0 ? "negative" : "positive"}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Monthly Profit"
            value={latestMonth ? `$${latestMonth.profit.toLocaleString()}` : "$0"}
            change={
              profitChange
                ? `${Number(profitChange) >= 0 ? "+" : ""}${profitChange}% vs last month`
                : "Current month overview"
            }
            changeType={profitChange && Number(profitChange) >= 0 ? "positive" : "negative"}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Two columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentSalesTable />
          </div>
          <div>
            <LowStockAlerts />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
