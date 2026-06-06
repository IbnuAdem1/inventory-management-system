import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventory, getMarginPercent } from "@/contexts/InventoryContext";

const InventoryPage = () => {
  const { inventory } = useInventory();
  const [search, setSearch] = useState("");

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.compatibility.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage your spare parts stock
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search parts, brands, models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Part Name</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Compatibility</th>
                <th className="px-5 py-3 font-medium text-right">Cost</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
                <th className="px-5 py-3 font-medium text-right">Stock</th>
                <th className="px-5 py-3 font-medium text-right">Margin</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No parts found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const margin = getMarginPercent(item).toFixed(0);
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-card-foreground">{item.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{item.brand}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{item.compatibility}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                        ${item.costPrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-medium text-card-foreground">
                        ${item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-mono font-bold ${isLow ? "text-destructive" : "text-success"}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-success">{margin}%</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            aria-label={`Edit ${item.name}`}
                            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label={`Delete ${item.name}`}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
