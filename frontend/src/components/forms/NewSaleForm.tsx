// src/components/forms/NewSaleForm.tsx
// Multi-item sale form. Starts with 1 item row, up to 10.
// Each row: part selector → unit price (read-only) → qty → row total.
// Running total updates live. Submit sends all items to the API.

import { useState, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSales } from "@/contexts/SalesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBankAccountsQuery } from "@/hooks/useBankAccounts";
import { useInventoryQuery } from "@/hooks/useInventory";
import { toast } from "sonner";
import type { PaymentMethod } from "@/types";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ItemRow {
  id: number;           // internal row key
  inventoryId: string;
  unitPrice: number;
  qty: number;
  maxQty: number;       // available stock for the selected item
}

const EMPTY_ROW = (id: number): ItemRow => ({
  id,
  inventoryId: "",
  unitPrice: 0,
  qty: 1,
  maxQty: 0,
});

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const NewSaleForm = () => {
  const [open, setOpen] = useState(false);

  // Form state
  const [rows, setRows] = useState<ItemRow[]>([EMPTY_ROW(1)]);
  const [nextId, setNextId] = useState(2);
  const [customer, setCustomer] = useState("Walk-in");
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addSale } = useSales();
  const { user } = useAuth();
  const { data: bankAccounts = [] } = useBankAccountsQuery();
  const { data: inventory = [] } = useInventoryQuery();

  // IDs already selected in other rows — used to disable duplicates
  const selectedIds = rows.map((r) => r.inventoryId).filter(Boolean);

  // ── Row operations ───────────────────────────────────────────────────────

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, EMPTY_ROW(nextId)]);
    setNextId((n) => n + 1);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = useCallback(
    (id: number, patch: Partial<ItemRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const handlePartSelect = (rowId: number, inventoryId: string) => {
    const item = inventory.find((i) => i.id === inventoryId);
    if (!item) return;
    updateRow(rowId, {
      inventoryId: item.id,
      unitPrice: item.sellingPrice,
      maxQty: item.stock,
      qty: 1,
    });
  };

  // ── Derived values ───────────────────────────────────────────────────────

  const rowTotal = (row: ItemRow) => row.unitPrice * row.qty;

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  // A row is invalid if qty > maxQty (and a part is selected)
  const hasStockError = rows.some(
    (r) => r.inventoryId !== "" && r.qty > r.maxQty
  );

  // All rows must have a part selected and qty >= 1
  const allRowsComplete = rows.every(
    (r) => r.inventoryId !== "" && r.qty >= 1
  );

  const canSubmit =
    allRowsComplete &&
    !hasStockError &&
    !isSubmitting &&
    (payment !== "Transfer" || bankAccountId !== "");

  // ── Handlers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setRows([EMPTY_ROW(1)]);
    setNextId(2);
    setCustomer("Walk-in");
    setPayment("Cash");
    setBankAccountId("");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    setOpen(val);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await addSale({
        items: rows.map((r) => ({
          inventoryId: r.inventoryId,
          qty: r.qty,
          amount: rowTotal(r),
        })),
        payment,
        customer,
        bankAccountId: payment === "Transfer" ? bankAccountId : undefined,
      });
      toast.success("Sale recorded");
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Sale
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* ── Item rows ── */}
            <div className="space-y-3">
              {rows.map((row, index) => {
                const selectedItem = inventory.find((i) => i.id === row.inventoryId);
                const qtyError =
                  row.inventoryId !== "" && row.qty > row.maxQty
                    ? `Only ${row.maxQty} available`
                    : null;

                return (
                  <div
                    key={row.id}
                    className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
                  >
                    {/* Row header with remove button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => removeRow(row.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Part selector */}
                    <div className="space-y-1">
                      <Label className="text-xs">Part</Label>
                      <Select
                        value={row.inventoryId}
                        onValueChange={(val) => handlePartSelect(row.id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a part..." />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => {
                            const isOutOfStock = item.stock === 0;
                            const isSelectedElsewhere =
                              selectedIds.includes(item.id) &&
                              item.id !== row.inventoryId;
                            const disabled = isOutOfStock || isSelectedElsewhere;
                            return (
                              <SelectItem
                                key={item.id}
                                value={item.id}
                                disabled={disabled}
                                className={disabled ? "opacity-40" : ""}
                              >
                                {item.name} — {item.brand}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({item.stock} available · ${item.sellingPrice.toFixed(2)})
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit price / Qty / Row total */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Unit price — read only */}
                      <div className="space-y-1">
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          readOnly
                          value={
                            selectedItem
                              ? `$${row.unitPrice.toFixed(2)}`
                              : "—"
                          }
                          className="bg-muted text-muted-foreground cursor-default"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Qty
                          {selectedItem && (
                            <span className="ml-1 text-muted-foreground">
                              (max {row.maxQty})
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={row.maxQty || undefined}
                          disabled={!row.inventoryId}
                          value={row.qty}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            updateRow(row.id, { qty: val });
                          }}
                          className={qtyError ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {qtyError && (
                          <p className="text-xs text-destructive">{qtyError}</p>
                        )}
                      </div>

                      {/* Row total — read only */}
                      <div className="space-y-1">
                        <Label className="text-xs">Row Total</Label>
                        <Input
                          readOnly
                          value={
                            selectedItem
                              ? `$${rowTotal(row).toFixed(2)}`
                              : "—"
                          }
                          className="bg-muted text-muted-foreground cursor-default"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Add Item button ── */}
            {rows.length < 10 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addRow}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            )}

            {/* ── Running total bar ── */}
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-2xl font-bold font-mono text-primary">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            {/* ── Customer ── */}
            <div className="space-y-1">
              <Label>Customer</Label>
              <Input
                placeholder="Walk-in"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>

            {/* ── Payment method ── */}
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select
                value={payment}
                onValueChange={(val) => {
                  setPayment(val as PaymentMethod);
                  if (val !== "Transfer") setBankAccountId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Bank account (Transfer only) ── */}
            {payment === "Transfer" && (
              <div className="space-y-1">
                <Label>
                  Receiving Bank Account{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No active bank accounts
                      </div>
                    ) : (
                      bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} — {account.bankName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {payment === "Transfer" && !bankAccountId && (
                  <p className="text-xs text-destructive">
                    Please select a receiving bank account
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title={
                hasStockError
                  ? "Fix item quantities before submitting"
                  : !allRowsComplete
                  ? "Select a part for all rows"
                  : undefined
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Sale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewSaleForm;
