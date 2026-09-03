// src/pages/DashboardPage.tsx
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Store,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import RecentSalesTable from "@/components/RecentSalesTable";
import LowStockAlerts from "@/components/LowStockAlerts";
import StockTransferDialog from "@/components/forms/StockTransferDialog";
import AiInvoiceParserDialog from "@/components/ai/AiInvoiceParserDialog";
import NewSaleForm from "@/components/forms/NewSaleForm";
import AddInventoryForm from "@/components/forms/AddInventoryForm";
import { useInventory } from "@/contexts/InventoryContext";
import { useSales } from "@/contexts/SalesContext";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReportSummaryQuery } from "@/hooks/useReports";

const DashboardPage = () => {
  const { totalItems, lowStockItems, isLoading: inventoryLoading } = useInventory();
  const { todayTotal, todaySales, isLoading: salesLoading } = useSales();
  const { activeBranch, activeBranchId } = useBranch();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const userPermissions = user?.permissions || ["sales", "inventory_view", "credits", "customers"];

  const canManageInventory = isOwner || userPermissions.includes("inventory_manage") || userPermissions.includes("inventory");
  const canAiScan = isOwner || userPermissions.includes("ai_scanner");
  const canTransfer = isOwner || userPermissions.includes("transfers");
  const canSale = isOwner || userPermissions.includes("sales");
  const canViewFinancials = isOwner || userPermissions.includes("reports");

  const { data: summary, isLoading: summaryLoading } = useReportSummaryQuery(
    new Date().getFullYear(),
    activeBranchId
  );

  const isLoading = inventoryLoading || salesLoading || (canViewFinancials && summaryLoading);

  const months = summary?.months || [];
  const latestMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];

  const profitChange =
    latestMonth && prevMonth && prevMonth.profit !== 0
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
        {/* Header with Title & Quick Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              {activeBranch && (
                <span className="flex items-center gap-1 text-xs font-semibold rounded-md bg-primary/10 text-primary px-2.5 py-0.5 border border-primary/20">
                  <Store className="h-3 w-3" />
                  {activeBranch.name}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Shortcuts (Only Permitted Actions) */}
          <div className="flex flex-wrap items-center gap-2">
            {canTransfer && <StockTransferDialog />}
            {canAiScan && <AiInvoiceParserDialog />}
            {canManageInventory && <AddInventoryForm />}
            {canSale && <NewSaleForm />}
          </div>
        </div>

        {/* Core Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Revenue"
            value={`$${todayTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={`${todaySales.length} transaction${todaySales.length !== 1 ? "s" : ""} recorded`}
            changeType="positive"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Transactions Today"
            value={String(todaySales.length)}
            change="Sales counter visits"
            changeType="positive"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Units in Stock"
            value={totalItems.toLocaleString()}
            change={
              lowStockItems.length > 0
                ? `${lowStockItems.length} part${lowStockItems.length !== 1 ? "s" : ""} need restock`
                : "All items well stocked"
            }
            changeType={lowStockItems.length > 0 ? "negative" : "positive"}
            icon={<Package className="h-5 w-5" />}
          />
          {canViewFinancials ? (
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
          ) : (
            <StatCard
              title="Critical Low Stock"
              value={String(lowStockItems.length)}
              change={lowStockItems.length > 0 ? "Parts need reorder" : "All parts stocked"}
              changeType={lowStockItems.length > 0 ? "negative" : "positive"}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          )}
        </div>

        {/* Main Content Two Columns */}
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
