// src/components/forms/SupplierReorderDialog.tsx
import { useState, useMemo } from "react";
import {
  Send,
  Printer,
  Copy,
  Check,
  Package,
  Store,
  Building2,
  Phone,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
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
import { useBranch } from "@/contexts/BranchContext";
import { useContactsQuery } from "@/hooks/useContacts";
import { toast } from "sonner";
import type { InventoryItem } from "@/types";

interface SupplierReorderDialogProps {
  items: InventoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReorderRow {
  item: InventoryItem;
  orderQty: number;
  selected: boolean;
}

export const SupplierReorderDialog = ({
  items,
  open,
  onOpenChange,
}: SupplierReorderDialogProps) => {
  const { activeBranch } = useBranch();
  const { data: contacts = [] } = useContactsQuery();
  const suppliers = contacts.filter((c) => c.type === "supplier");

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [customPhone, setCustomPhone] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Initialize reorder rows
  const [reorderRows, setReorderRows] = useState<ReorderRow[]>(() =>
    items.map((it) => ({
      item: it,
      orderQty: Math.max(10, it.minStock * 2 - it.stock),
      selected: true,
    }))
  );

  // Update rows when items prop changes
  useMemo(() => {
    setReorderRows(
      items.map((it) => ({
        item: it,
        orderQty: Math.max(10, it.minStock * 2 - it.stock),
        selected: true,
      }))
    );
  }, [items]);

  const selectedRows = reorderRows.filter((r) => r.selected && r.orderQty > 0);

  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const supplierName = activeSupplier?.name || "Auto Parts Supplier";
  const targetPhone = customPhone || activeSupplier?.phone || "";

  const estimatedCost = selectedRows.reduce(
    (sum, r) => sum + r.orderQty * (r.item.costPrice || 0),
    0
  );

  // Generate WhatsApp formatted message
  const whatsappMessage = useMemo(() => {
    const branchName = activeBranch?.name || "AutoPartsPro Main Store";
    const branchAddress = activeBranch?.address || "Bole Road";
    const dateStr = new Date().toLocaleDateString("en-US", {
      dateStyle: "medium",
    });

    const itemListText = selectedRows
      .map(
        (r, idx) =>
          `${idx + 1}. *${r.orderQty}x* ${r.item.name} (${r.item.brand}) — SKU: ${r.item.sku || "N/A"} [${r.item.compatibility}]`
      )
      .join("\n");

    return (
      `*📦 AUTOPARTS PRO — PURCHASE ORDER REORDER*\n\n` +
      `*Store Branch:* ${branchName}\n` +
      `*Delivery Address:* ${branchAddress}\n` +
      `*Order Date:* ${dateStr}\n` +
      `*Attention:* ${supplierName}\n\n` +
      `*Requested Spare Parts:*\n` +
      `${itemListText}\n\n` +
      `*Estimated PO Cost:* ~$${estimatedCost.toFixed(2)}\n\n` +
      `Please confirm parts availability, proforma invoice, and estimated delivery time.\n` +
      `Thank you!`
    );
  }, [selectedRows, activeBranch, supplierName, estimatedCost]);

  const handleLaunchWhatsApp = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one item to reorder");
      return;
    }

    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(whatsappMessage);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, "_blank");
    toast.success("Launching WhatsApp with pre-filled reorder draft!");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      toast.success("Order message copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  const handlePrintPO = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  1-Click Supplier Reorder & WhatsApp PO
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Generate restock purchase orders for low-stock catalog items
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="gap-1 text-xs">
              <Store className="h-3 w-3 text-primary" />
              {activeBranch?.name || "Main Store"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 flex-1 overflow-y-auto pr-1">
          {/* Supplier Selector */}
          <div className="grid sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Registered Supplier</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={(val) => {
                  setSelectedSupplierId(val);
                  const supp = suppliers.find((s) => s.id === val);
                  if (supp?.phone) setCustomPhone(supp.phone);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Choose supplier (or type below)..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} {s.companyName ? `(${s.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">WhatsApp / Phone Number</Label>
              <Input
                placeholder="e.g. +251 91 122 3344"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Low Stock Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Items to Restock ({selectedRows.length} selected):</Label>
              <span className="text-xs text-muted-foreground font-mono">
                Est. Cost: <strong className="text-foreground font-bold">${estimatedCost.toFixed(2)}</strong>
              </span>
            </div>

            <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border sticky top-0">
                  <tr>
                    <th className="p-2 w-8 text-center">✓</th>
                    <th className="p-2">Part & SKU</th>
                    <th className="p-2 text-center">Current</th>
                    <th className="p-2 text-center">Min Stock</th>
                    <th className="p-2 text-right">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reorderRows.map((r, idx) => (
                    <tr
                      key={r.item.id}
                      className={`hover:bg-muted/20 ${r.selected ? "bg-card" : "opacity-40"}`}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          onChange={() =>
                            setReorderRows((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, selected: !row.selected } : row
                              )
                            )
                          }
                          className="rounded border-border text-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-semibold text-foreground">{r.item.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {r.item.brand} • SKU: {r.item.sku || "N/A"}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-destructive">
                        {r.item.stock}
                      </td>
                      <td className="p-2 text-center font-mono text-muted-foreground">
                        {r.item.minStock}
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          min={1}
                          disabled={!r.selected}
                          value={r.orderQty}
                          onChange={(e) =>
                            setReorderRows((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, orderQty: parseInt(e.target.value) || 1 }
                                  : row
                              )
                            )
                          }
                          className="h-7 w-20 text-xs text-right font-mono ml-auto"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600">
                <Send className="h-3.5 w-3.5" />
                Live WhatsApp Draft Preview:
              </Label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
            <pre className="p-3 bg-muted/50 rounded-lg text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-36 overflow-y-auto border border-border/80">
              {whatsappMessage}
            </pre>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="gap-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy Text"}
          </Button>

          <Button
            type="button"
            onClick={handleLaunchWhatsApp}
            disabled={selectedRows.length === 0}
            className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierReorderDialog;
