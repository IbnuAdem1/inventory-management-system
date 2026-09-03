import { useMemo, useState } from "react";
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
import { useBankAccountsQuery } from "@/hooks/useBankAccounts";
import { useAuth } from "@/contexts/AuthContext";
import ExportButton from "@/components/ui/ExportButton";

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
  const [bankAccountId, setBankAccountId] = useState("");
  const [note, setNote] = useState("");
  const [bankError, setBankError] = useState(false);

  const mutation = useAddCreditPaymentMutation();
  const { data: bankAccounts = [] } = useBankAccountsQuery();
  const isTransfer = method === "TRANSFER";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransfer && !bankAccountId) {
      setBankError(true);
      return;
    }
    setBankError(false);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (parsedAmount > credit.remainingAmount) {
      toast.error(
        `Amount cannot exceed remaining balance of $${credit.remainingAmount.toFixed(2)}`
      );
      return;
    }

    try {
      await mutation.mutateAsync({
        creditId: credit.id,
        amount: parsedAmount,
        paymentMethod: method,
        bankAccountId: isTransfer ? bankAccountId : undefined,
        note: note.trim() || undefined,
      });
      toast.success(
        `Payment of $${parsedAmount.toFixed(2)} recorded for ${credit.customerName}`
      );
      onClose();
    } catch {
      toast.error("Failed to record payment. Please try again.");
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
              autoFocus
            />
            <p id="amount-hint" className="text-[11px] text-muted-foreground">
              Max: ${credit.remainingAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={method === "CASH" ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  setMethod("CASH");
                  setBankAccountId("");
                  setBankError(false);
                }}
              >
                Cash
              </Button>
              <Button
                type="button"
                size="sm"
                variant={method === "TRANSFER" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMethod("TRANSFER")}
              >
                Bank Transfer
              </Button>
            </div>
          </div>

          {/* Bank account picker (only if TRANSFER) */}
          {isTransfer && (
            <div className="space-y-1.5">
              <Label htmlFor="bank-account">
                Receiving Bank Account <span className="text-destructive">*</span>
              </Label>
              <Select
                value={bankAccountId}
                onValueChange={(val) => {
                  setBankAccountId(val);
                  setBankError(false);
                }}
              >
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Select bank account…" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No active bank accounts found
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
              {bankError && (
                <p className="text-xs text-destructive">
                  Please select a receiving bank account
                </p>
              )}
            </div>
          )}

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
            <Button
              type="submit"
              disabled={mutation.isPending || (isTransfer && !bankAccountId)}
            >
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
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const userPermissions = user?.permissions || ["sales", "inventory_view", "credits", "customers"];
  const canViewAllCredits = isOwner || userPermissions.includes("credits_all");

  const { data: credits = [], isLoading, error } = useCreditsQuery();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  // Scoped credits: worker only sees credits from sales created by themselves unless granted credits_all
  const accessibleCredits = useMemo(() => {
    if (canViewAllCredits) return credits;
    return credits.filter((c: any) => {
      if (c.userId && c.userId === user?.id) return true;
      if (c.sale && (c.sale.userId === user?.id || c.sale.user?.id === user?.id)) return true;
      // If sale has branchId and worker matches branch, allow if credit has no explicit other user
      return false;
    });
  }, [credits, canViewAllCredits, user?.id]);

  // Summary stats
  const totalOutstanding = accessibleCredits
    .filter((c) => c.status !== "PAID")
    .reduce((sum, c) => sum + c.remainingAmount, 0);
  const unpaidCount  = accessibleCredits.filter((c) => c.status === "UNPAID").length;
  const partialCount = accessibleCredits.filter((c) => c.status === "PARTIAL").length;
  const paidCount    = accessibleCredits.filter((c) => c.status === "PAID").length;

  const filtered = accessibleCredits.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.customerName.toLowerCase().includes(q) ||
      c.sale.items.some((i) => i.itemName.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const exportCreditsData = filtered.map((c) => ({
    "Customer Name": c.customerName,
    "Total Debt ($)": c.totalAmount,
    "Paid Amount ($)": c.paidAmount,
    "Remaining Balance ($)": c.remainingAmount,
    Status: c.status,
    "Date Recorded": c.saleDate,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customer Debts & Credits</h1>
            <p className="text-sm text-muted-foreground">
              Track outstanding customer credit balances and record partial/full payments
            </p>
          </div>
          <ExportButton filename="customer-debts-credits" data={exportCreditsData} />
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
