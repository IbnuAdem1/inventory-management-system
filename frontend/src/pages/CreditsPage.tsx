import { useState } from "react";
import { CreditCard, Plus, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreditsQuery,
  useAddCreditPaymentMutation,
  type Credit,
} from "@/hooks/useCredits";

// ── Status badge ─────────────────────────────────────────────────────────────

const statusConfig = {
  UNPAID:  { label: "Unpaid",  className: "bg-destructive/15 text-destructive" },
  PARTIAL: { label: "Partial", className: "bg-yellow-500/15 text-yellow-500" },
  PAID:    { label: "Paid",    className: "bg-success/15 text-success" },
} as const;

function StatusBadge({ status }: { status: Credit["status"] }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ── Payment modal ─────────────────────────────────────────────────────────────

interface PaymentModalProps {
  credit: Credit;
  onClose: () => void;
}

function PaymentModal({ credit, onClose }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [note, setNote] = useState("");

  const mutation = useAddCreditPaymentMutation(credit.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }
    if (parsed > credit.remainingAmount) {
      toast.error(`Amount cannot exceed the remaining balance of $${credit.remainingAmount.toFixed(2)}.`);
      return;
    }

    try {
      await mutation.mutateAsync({
        amount: parsed,
        paymentMethod: method,
        note: note.trim() || undefined,
      });
      toast.success(`Payment of $${parsed.toFixed(2)} recorded for ${credit.customerName}.`);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment.";
      toast.error(message);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Add Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Read-only summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <p className="text-sm font-medium text-foreground">{credit.customerName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Remaining Balance</Label>
              <p className="text-sm font-mono font-bold text-destructive">
                ${credit.remainingAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payment-amount"
              type="number"
              min="0.01"
              step="0.01"
              max={credit.remainingAmount}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              aria-describedby="amount-hint"
            />
            <p id="amount-hint" className="text-xs text-muted-foreground">
              Max: ${credit.remainingAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-method">
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as "CASH" | "TRANSFER")}
            >
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea
              id="payment-note"
              placeholder="e.g. Paid half, rest next week"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Recording…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Filter = "ALL" | "UNPAID" | "PARTIAL" | "PAID";

const filterTabs: { label: string; value: Filter }[] = [
  { label: "All",     value: "ALL" },
  { label: "Unpaid",  value: "UNPAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Paid",    value: "PAID" },
];

const CreditsPage = () => {
  const { data: credits = [], isLoading, error } = useCreditsQuery();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  // Summary stats
  const totalOutstanding = credits
    .filter((c) => c.status !== "PAID")
    .reduce((sum, c) => sum + c.remainingAmount, 0);
  const unpaidCount  = credits.filter((c) => c.status === "UNPAID").length;
  const partialCount = credits.filter((c) => c.status === "PARTIAL").length;
  const paidCount    = credits.filter((c) => c.status === "PAID").length;

  const filtered = credits.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.customerName.toLowerCase().includes(q) ||
      c.sale.items.some((i) => i.itemName.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credits</h1>
          <p className="text-sm text-muted-foreground">
            Track outstanding credit sales and record payments
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="mt-1 font-mono text-lg font-bold text-destructive">
              ${totalOutstanding.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Credits</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {credits.length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Unpaid / Partial</p>
            <p className="mt-1 font-mono text-lg font-bold text-yellow-500">
              {unpaidCount} / {partialCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="mt-1 font-mono text-lg font-bold text-success">
              {paidCount}
            </p>
          </div>
        </div>

        {/* Filter tabs + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full sm:w-auto">
            <Input
              placeholder="Search customer or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading credits...</p>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load credits."}
          </p>
        )}

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right">Paid</th>
                <th className="px-5 py-3 font-medium text-right">Remaining</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    {credits.length === 0
                      ? "No credits yet. Credits are created automatically when a sale uses Credit payment."
                      : "No credits match your current filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((credit) => {
                  const itemsSummary = credit.sale.items
                    .map((i) => `${i.itemName} x${i.quantity}`)
                    .join(", ");

                  return (
                    <tr
                      key={credit.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-card-foreground">
                        {credit.customerName}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground max-w-[220px] truncate">
                        {itemsSummary}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-card-foreground">
                        ${credit.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-success">
                        ${credit.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-destructive">
                        ${credit.remainingAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={credit.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(credit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          aria-label={`Add payment for ${credit.customerName}`}
                          disabled={credit.status === "PAID"}
                          onClick={() => setSelectedCredit(credit)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            credit.status === "PAID"
                              ? "cursor-not-allowed text-muted-foreground opacity-40"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          <Plus className="h-3 w-3" />
                          Add Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment modal */}
      {selectedCredit && (
        <PaymentModal
          credit={selectedCredit}
          onClose={() => setSelectedCredit(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default CreditsPage;
