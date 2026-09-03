// src/pages/SalesPage.tsx
import { useState } from "react";
import { Search, Receipt, Store, RotateCcw, Printer } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal } from "@/components/receipts/ReceiptModal";
import { ProcessReturnDialog } from "@/components/forms/ProcessReturnDialog";
import NewSaleForm from "@/components/forms/NewSaleForm";
import DateRangeFilter, { DateFilterPreset } from "@/components/ui/DateRangeFilter";
import ExportButton from "@/components/ui/ExportButton";
import { useSales } from "@/contexts/SalesContext";
import { useBranch } from "@/contexts/BranchContext";
import type { Sale } from "@/types";

const SalesPage = () => {
  const { sales, todayTotal, isLoading, error } = useSales();
  const { activeBranch } = useBranch();
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);

  const selectedDateStr = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const filtered = sales
    .filter((s) => !selectedDateStr || s.date === selectedDateStr)
    .filter(
      (s) =>
        s.item.toLowerCase().includes(search.toLowerCase()) ||
        s.worker.toLowerCase().includes(search.toLowerCase()) ||
        s.customer.toLowerCase().includes(search.toLowerCase()) ||
        (s.payment && s.payment.toLowerCase().includes(search.toLowerCase()))
    );

  const exportData = filtered.map((s) => ({
    "Sale Date": s.date,
    "Item(s)": s.item,
    Quantity: s.qty,
    "Total Amount ($)": s.amount,
    "Payment Method": s.payment,
    "Counter Worker": s.worker,
    Customer: s.customer,
  }));

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Sales Transactions</h1>
                {activeBranch && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Store className="h-3 w-3 text-primary" />
                    {activeBranch.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Today's sales total:{" "}
                <span className="font-mono font-bold text-primary">
                  ${todayTotal.toFixed(2)}
                </span>{" "}
                ({sales.length} transactions recorded)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton filename="sales-history" data={exportData} />
              <NewSaleForm />
            </div>
          </div>

          {/* Search + Date filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by part, customer, worker, or payment..."
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
            <p className="text-sm text-muted-foreground">Loading sales records...</p>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Item(s)</th>
                  <th className="px-5 py-3 text-center">Qty</th>
                  <th className="px-5 py-3 text-right">Total ($)</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Worker</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                    >
                      {selectedDateStr
                        ? `No sales found for ${format(selectedDate!, "MMM d, yyyy")}.`
                        : "No sales found matching your criteria."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {sale.date}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {sale.item}
                      </td>
                      <td className="px-5 py-3 text-center font-mono">{sale.qty}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-foreground">
                        ${sale.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize font-medium ${
                            sale.payment === "Credit"
                              ? "border-warning/40 text-warning bg-warning/10"
                              : sale.payment === "Transfer"
                              ? "border-primary/40 text-primary bg-primary/10"
                              : "border-success/40 text-success bg-success/10"
                          }`}
                        >
                          {sale.payment}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {sale.worker}
                      </td>
                      <td className="px-5 py-3 text-foreground text-xs font-medium">
                        {sale.customer}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setReceiptSale(sale)}
                            title="Print Thermal Receipt / Tax Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                            onClick={() => setReturnSale(sale)}
                            title="Process Return & Restock"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>

      {/* 1-Click Printable Receipt & Tax Invoice Modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          open={Boolean(receiptSale)}
          onOpenChange={(open) => {
            if (!open) setReceiptSale(null);
          }}
        />
      )}

      {/* Customer Return & Restock Dialog */}
      {returnSale && (
        <ProcessReturnDialog
          sale={returnSale}
          open={Boolean(returnSale)}
          onOpenChange={(open) => {
            if (!open) setReturnSale(null);
          }}
        />
      )}
    </>
  );
};

export default SalesPage;
