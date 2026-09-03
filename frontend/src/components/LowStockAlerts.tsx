import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/contexts/InventoryContext";
import { SupplierReorderDialog } from "@/components/forms/SupplierReorderDialog";

const LowStockAlerts = () => {
  const { lowStockItems } = useInventory();
  const [reorderOpen, setReorderOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse-glow" />
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Low Stock Alerts</h3>
              <p className="text-xs text-muted-foreground">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} need restocking
              </p>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReorderOpen(true)}
              className="gap-1.5 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 hover:text-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              Reorder
            </Button>
          )}
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
                  <p className="text-sm text-card-foreground font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand} • Min Stock: {item.minStock}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-destructive">
                  {item.stock} in stock
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Supplier Reorder Modal */}
      {lowStockItems.length > 0 && (
        <SupplierReorderDialog
          items={lowStockItems}
          open={reorderOpen}
          onOpenChange={setReorderOpen}
        />
      )}
    </>
  );
};

export default LowStockAlerts;
