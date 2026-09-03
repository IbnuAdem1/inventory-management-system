// src/pages/InventoryPage.tsx
import { useState } from "react";
import { Search, Edit, Trash2, Store, Package, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddInventoryForm from "@/components/forms/AddInventoryForm";
import EditInventoryForm from "@/components/forms/EditInventoryForm";
import StockTransferDialog from "@/components/forms/StockTransferDialog";
import AiInvoiceParserDialog from "@/components/ai/AiInvoiceParserDialog";
import SupplierReorderDialog from "@/components/forms/SupplierReorderDialog";
import DateRangeFilter, { DateFilterPreset } from "@/components/ui/DateRangeFilter";


import ExportButton from "@/components/ui/ExportButton";
import { useInventory } from "@/contexts/InventoryContext";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import type { InventoryItem } from "@/types";
import { toast } from "sonner";

const CATEGORIES = [
  "All",
  "Brakes",
  "Filters & Fluids",
  "Electrical",
  "Suspension",
  "Engine",
];

const InventoryPage = () => {
  const { inventory, deleteItem, isLoading, error } = useInventory();
  const { activeBranch } = useBranch();
  const { user } = useAuth();
  const userPermissions = user?.permissions || ["sales", "inventory_view", "credits", "customers"];
  const isOwner = user?.role === "owner";

  const canManageInventory = isOwner || userPermissions.includes("inventory_manage") || userPermissions.includes("inventory");
  const canAiScan = isOwner || userPermissions.includes("ai_scanner");
  const canTransfer = isOwner || userPermissions.includes("transfers");
  const canViewCostPrice = isOwner || userPermissions.includes("reports");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Edit dialog state
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Supplier reorder dialog state
  const [reorderOpen, setReorderOpen] = useState(false);

  // Filter items

  const filtered = inventory
    .filter((item) => {
      if (selectedCategory !== "All") {
        if (selectedCategory === "Brakes" && !/brake|pad|rotor|disc/i.test(item.name)) return false;
        if (selectedCategory === "Filters & Fluids" && !/filter|oil|fluid/i.test(item.name)) return false;
        if (selectedCategory === "Electrical" && !/plug|spark|starter|battery|light/i.test(item.name)) return false;
        if (selectedCategory === "Suspension" && !/shock|strut|spring|bushing/i.test(item.name)) return false;
        if (selectedCategory === "Engine" && !/engine|belt|piston|gasket/i.test(item.name)) return false;
      }
      return true;
    })

    .filter((item) => {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.compatibility.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    });

  const handleEditClick = (item: InventoryItem) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" removed from inventory.`);
      setDeleteTarget(null);
      setDeleteOpen(false);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete part.";
      toast.error(message);
    }
  };

  const exportData = filtered.map((item) => ({
    "Part Name": item.name,
    Brand: item.brand,
    Compatibility: item.compatibility,
    Category: item.category || "General",
    Stock: item.stock,
    "Min Stock": item.minStock,
    "Selling Price ($)": item.sellingPrice,
    ...(canViewCostPrice ? { "Cost Price ($)": item.costPrice } : {}),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Spare Parts Inventory</h1>
              {activeBranch && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Store className="h-3 w-3 text-primary" />
                  {activeBranch.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {inventory.length} part{inventory.length !== 1 ? "s" : ""} cataloged • Real-time stock counts & AI restock predictions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canTransfer && <StockTransferDialog />}
            {canAiScan && <AiInvoiceParserDialog />}
            {canManageInventory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReorderOpen(true)}
                className="gap-1.5 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 hover:text-emerald-700 h-9"
              >
                <Send className="h-3.5 w-3.5" />
                Supplier Reorder
              </Button>
            )}
            {canManageInventory && <AddInventoryForm />}
            <ExportButton filename="inventory-catalog" data={exportData} />
          </div>

        </div>


        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search and Date Filter Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search parts, brand, model, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <DateRangeFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading parts catalog...</p>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        )}

        {/* Inventory Table */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Part Details</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Vehicle Compatibility</th>
                {canViewCostPrice && (
                  <th className="px-5 py-3 font-medium text-right">Cost Price</th>
                )}
                <th className="px-5 py-3 font-medium text-right">Selling Price</th>
                <th className="px-5 py-3 font-medium text-right">Stock Level</th>
                {canManageInventory && (
                  <th className="px-5 py-3 font-medium text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canViewCostPrice ? (canManageInventory ? 7 : 6) : (canManageInventory ? 6 : 5)}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No matching spare parts found. Try changing your search or category filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  const isOut = item.stock === 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-semibold text-foreground">{item.name}</div>
                        {item.sku && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-xs font-normal">
                          {item.brand}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {item.compatibility}
                      </td>
                      {canViewCostPrice && (
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                          ${item.costPrice.toFixed(2)}
                        </td>
                      )}
                      <td className="px-5 py-3 text-right font-mono font-medium text-foreground">
                        ${item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-mono font-bold ${
                            isOut
                              ? "text-destructive"
                              : isLow
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {item.stock}
                        </span>
                      </td>
                      {canManageInventory && (
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditClick(item)}
                              title="Edit Part"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete Part"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditInventoryForm
        item={editItem}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditItem(null);
        }}
      />


      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part from Inventory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 1-Click Supplier Reorder Dialog */}
      <SupplierReorderDialog
        items={
          inventory.filter((i) => i.stock <= i.minStock).length > 0
            ? inventory.filter((i) => i.stock <= i.minStock)
            : inventory
        }
        open={reorderOpen}
        onOpenChange={setReorderOpen}
      />
    </DashboardLayout>
  );
};

export default InventoryPage;

