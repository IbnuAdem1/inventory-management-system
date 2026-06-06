import { AlertTriangle } from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";

const LowStockAlerts = () => {
  const { lowStockItems } = useInventory();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <AlertTriangle className="h-4 w-4 text-primary animate-pulse-glow" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Low Stock Alerts</h3>
          <p className="text-xs text-muted-foreground">
            {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} need restocking
          </p>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {lowStockItems.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            All items are adequately stocked.
          </p>
        ) : (
          lowStockItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
              </div>
              <span className="font-mono text-sm font-bold text-destructive">
                {item.stock}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LowStockAlerts;
