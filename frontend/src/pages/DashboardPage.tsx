import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import RecentSalesTable from "@/components/RecentSalesTable";
import LowStockAlerts from "@/components/LowStockAlerts";

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your business operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Revenue"
            value="$2,450"
            change="+12% from yesterday"
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Total Sales"
            value="34"
            change="+5 from yesterday"
            changeType="positive"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Items in Stock"
            value="1,248"
            change="18 low stock items"
            changeType="negative"
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Monthly Profit"
            value="$18,430"
            change="+8.2% this month"
            changeType="positive"
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
