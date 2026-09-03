// src/components/forms/StockTransferDialog.tsx
import React, { useState } from "react";
import { ArrowLeftRight, Loader2, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useTransferStockMutation } from "@/hooks/useBranches";
import { toast } from "sonner";
import type { InventoryItem } from "@/types";

interface StockTransferDialogProps {
  initialItem?: InventoryItem;
  trigger?: React.ReactNode;
}

export const StockTransferDialog: React.FC<StockTransferDialogProps> = ({
  initialItem,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const { branches } = useBranch();
  const { inventory } = useInventory();
  const transferMutation = useTransferStockMutation();

  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || inventory[0]?.id || ""
  );
  const [fromBranchId, setFromBranchId] = useState<string>(
    branches[0]?.id || "branch-main-store"
  );
  const [toBranchId, setToBranchId] = useState<string>(
    branches[1]?.id || "branch-second-store"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  const activeItem =
    inventory.find((i) => i.id === selectedItemId) || initialItem;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error("Please select a part to transfer");
      return;
    }
    if (fromBranchId === toBranchId) {
      toast.error("Source and destination branch cannot be the same");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (activeItem && quantity > activeItem.stock) {
      toast.error(`Cannot transfer more than total stock (${activeItem.stock})`);
      return;
    }

    try {
      await transferMutation.mutateAsync({
        inventoryId: selectedItemId,
        fromBranchId,
        toBranchId,
        quantity,
        notes: notes.trim() || undefined,
      });

      const fromName = branches.find((b) => b.id === fromBranchId)?.name || "Store 1";
      const toName = branches.find((b) => b.id === toBranchId)?.name || "Store 2";

      toast.success(
        `Successfully transferred ${quantity}x "${activeItem?.name}" from ${fromName} to ${toName}!`
      );
      setOpen(false);
      setQuantity(1);
      setNotes("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to transfer stock";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
            Transfer Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleTransfer}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              Transfer Stock Between Branches
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Move spare parts from one store branch to another. Stock counts and
              history will update immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-sm">
            {/* Part selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Spare Part</Label>
              <Select
                value={selectedItemId}
                onValueChange={(val) => {
                  setSelectedItemId(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a part..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({item.brand} — {item.stock} in stock)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From and To branch grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">From (Source)</Label>
                <Select value={fromBranchId} onValueChange={setFromBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="From Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">To (Destination)</Label>
                <Select value={toBranchId} onValueChange={setToBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="To Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Transfer Quantity</Label>
                {activeItem && (
                  <span className="text-xs text-muted-foreground">
                    Available in system:{" "}
                    <strong className="text-foreground">{activeItem.stock}</strong> units
                  </span>
                )}
              </div>
              <Input
                type="number"
                min="1"
                max={activeItem ? activeItem.stock : 9999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>

            {/* Transfer Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Reason (Optional)</Label>
              <Input
                placeholder="e.g., Requested by counter worker for customer order"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={transferMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockTransferDialog;
