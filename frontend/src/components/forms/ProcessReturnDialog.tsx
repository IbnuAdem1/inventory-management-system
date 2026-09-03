// src/components/forms/ProcessReturnDialog.tsx
import { useState, useMemo } from "react";
import { RotateCcw, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Sale } from "@/types";

interface ProcessReturnDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReturnItemState {
  inventoryId: string;
  itemName: string;
  maxQty: number;
  qty: number;
  unitPrice: number;
  selected: boolean;
  reason: string;
}

const RETURN_REASONS = [
  "Wrong Vehicle Model / Year",
  "Defective Part (Warranty Claim)",
  "Mechanic Purchased Extra",
  "Customer Changed Mind",
  "Incorrect Fitment / Size",
  "Other Reason",
];

export const ProcessReturnDialog = ({
  sale,
  open,
  onOpenChange,
}: ProcessReturnDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundType, setRefundType] = useState<"CASH" | "CREDIT_ADJUSTMENT">("CASH");
  const [notes, setNotes] = useState("");

  // Initialize return items from sale
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>(() => {
    if (!sale) return [];
    const sourceItems =
      sale.items && sale.items.length > 0
        ? sale.items
        : [
            {
              inventoryId: sale.inventoryId || "inv-part",
              itemName: sale.item || "Spare Part",
              quantity: sale.qty || 1,
              unitPrice: sale.amount / (sale.qty || 1),
            },
          ];

    return sourceItems.map((it) => ({
      inventoryId: (it as any).inventoryId || sale.inventoryId || "inv-part",
      itemName: it.itemName || "Part",
      maxQty: it.quantity,
      qty: 1,
      unitPrice: it.unitPrice || 0,
      selected: true,
      reason: "Wrong Vehicle Model / Year",
    }));
  });

  // Recalculate when sale changes
  useMemo(() => {
    if (!sale) return;
    const sourceItems =
      sale.items && sale.items.length > 0
        ? sale.items
        : [
            {
              inventoryId: sale.inventoryId || "inv-part",
              itemName: sale.item || "Spare Part",
              quantity: sale.qty || 1,
              unitPrice: sale.amount / (sale.qty || 1),
            },
          ];

    setReturnItems(
      sourceItems.map((it) => ({
        inventoryId: (it as any).inventoryId || sale.inventoryId || "inv-part",
        itemName: it.itemName || "Part",
        maxQty: it.quantity,
        qty: 1,
        unitPrice: it.unitPrice || 0,
        selected: true,
        reason: "Wrong Vehicle Model / Year",
      }))
    );

    if (sale.payment === "Credit") {
      setRefundType("CREDIT_ADJUSTMENT");
    } else {
      setRefundType("CASH");
    }
  }, [sale]);

  if (!sale) return null;

  const selectedItems = returnItems.filter((i) => i.selected && i.qty > 0);
  const totalRefund = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );

  const canSubmit = selectedItems.length > 0 && !isSubmitting;

  const handleToggleItem = (index: number) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleQtyChange = (index: number, newQty: number) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const clamped = Math.max(1, Math.min(it.maxQty, newQty));
        return { ...it, qty: clamped };
      })
    );
  };

  const handleReasonChange = (index: number, reason: string) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, reason } : it))
    );
  };

  const handleSubmitReturn = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const payload = {
        items: selectedItems.map((i) => ({
          inventoryId: i.inventoryId,
          quantity: i.qty,
          reason: i.reason,
        })),
        refundType,
        notes: notes.trim() || undefined,
      };

      await apiFetch(`/sales/${sale.id}/return`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(
        `🎉 Return processed! ${selectedItems.length} item(s) restocked and $${totalRefund.toFixed(2)} refunded.`
      );

      // Invalidate relevant React Queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["activity"] }),
        queryClient.invalidateQueries({ queryKey: ["credits"] }),
      ]);

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to process customer return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Process Customer Return & Restock
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sale #{sale.id.slice(0, 8).toUpperCase()} • Customer: {sale.customer}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 flex-1 overflow-y-auto pr-1">
          {/* Sale Info Summary */}
          <div className="grid grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Original Date</span>
              <span className="font-semibold">{sale.date}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Payment Method</span>
              <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                {sale.payment}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Original Total</span>
              <span className="font-mono font-bold">${sale.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Return Items Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select Items to Return & Restock:</Label>

            <div className="space-y-2">
              {returnItems.map((it, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    it.selected
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border bg-card opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={it.selected}
                      onChange={() => handleToggleItem(idx)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {it.itemName}
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground">
                          ${(it.qty * it.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      {it.selected && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">
                              Return Qty (Max: {it.maxQty})
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={it.maxQty}
                              value={it.qty}
                              onChange={(e) =>
                                handleQtyChange(idx, parseInt(e.target.value) || 1)
                              }
                              className="h-8 text-xs bg-background"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-muted-foreground">
                              Return Reason
                            </Label>
                            <Select
                              value={it.reason}
                              onValueChange={(val) => handleReasonChange(idx, val)}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RETURN_REASONS.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Method & Notes */}
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Refund Settlement</Label>
              <Select
                value={refundType}
                onValueChange={(val) => setRefundType(val as any)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">💵 Cash / Bank Refund</SelectItem>
                  {sale.payment === "Credit" && (
                    <SelectItem value="CREDIT_ADJUSTMENT">
                      💳 Deduct from Customer Credit Balance
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Optional Note</Label>
              <Input
                placeholder="e.g. Mechanic exchanged for 2022 model"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Refund Calculation Banner */}
          <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 mt-2">
            <div>
              <span className="text-xs font-semibold text-rose-500 block">
                Total Refund & Restock Value:
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedItems.length} part type(s) will be returned to stock
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-rose-500">
              ${totalRefund.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmitReturn}
            disabled={!canSubmit}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restocking...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirm Return & Restock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessReturnDialog;
