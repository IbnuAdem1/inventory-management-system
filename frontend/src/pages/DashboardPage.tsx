import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import RecentSalesTable from "@/components/RecentSalesTable";
import LowStockAlerts from "@/components/LowStockAlerts";
import { useInventory } from "@/contexts/InventoryContext";
import { useSales } from "@/contexts/SalesContext";
import { mockMonthlyReports } from "@/data/mockData";

const DashboardPage = () => {
  const { totalItems, lowStockItems, totalStockValue } = useInventory();
  const { todayTotal, todaySales } = useSales();

  // Latest month profit from reports
  const latestMonth = mockMonthlyReports[mockMonthlyReports.length - 1];
  const prevMonth = mockMonthlyReports[mockMonthlyReports.length - 2];
  const profitChange = prevMonth
    ? (((latestMonth.profit - prevMonth.profit) / prevMonth.profit) * 100).toFixed(1)
    : null;

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
            value={`$${latestMonth.profit.toLocaleString()}`}
            change={
              profitChange
                ? `${Number(profitChange) >= 0 ? "+" : ""}${profitChange}% vs last month`
                : "No previous data"
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
