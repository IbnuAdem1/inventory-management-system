import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
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
import { useInventory, getMarginPercent } from "@/contexts/InventoryContext";
import type { InventoryItem } from "@/types";
import { toast } from "sonner";

const InventoryPage = () => {
  const { inventory, deleteItem, isLoading, error } = useInventory();
  const [search, setSearch] = useState("");

  // Edit dialog state
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.compatibility.toLowerCase().includes(search.toLowerCase())
  );

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
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete part.";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              {inventory.length} part{inventory.length !== 1 ? "s" : ""} in stock
            </p>
          </div>
          {/* Add Part button — opens dialog internally */}
          <AddInventoryForm />
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

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        )}

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
                    {inventory.length === 0
                      ? "No parts in inventory yet. Click \"Add Part\" to get started."
                      : "No parts found matching your search."}
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
                            onClick={() => handleEditClick(item)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label={`Delete ${item.name}`}
                            onClick={() => handleDeleteClick(item)}
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

      {/* Edit dialog — rendered outside table to avoid nesting issues */}
      {editItem && (
        <EditInventoryForm
          item={editItem}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditItem(null);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this part?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              ({deleteTarget?.brand}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default InventoryPage;
