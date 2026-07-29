import { useState } from "react";
import { Search, Receipt, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InvoiceModal from "@/components/ui/InvoiceModal";
import NewSaleForm from "@/components/forms/NewSaleForm";
import { useSales } from "@/contexts/SalesContext";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types";

const SalesPage = () => {
  const { sales, todayTotal, isLoading, error } = useSales();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null);

  // Format selected date as YYYY-MM-DD to match sale.date
  const selectedDateStr = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const filtered = sales
    .filter((s) => !selectedDateStr || s.date === selectedDateStr)
    .filter(
      (s) =>
        s.item.toLowerCase().includes(search.toLowerCase()) ||
        s.worker.toLowerCase().includes(search.toLowerCase()) ||
        s.customer.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales</h1>
              <p className="text-sm text-muted-foreground">
                Today's total:{" "}
                <span className="font-mono font-bold text-primary">
                  ${todayTotal.toFixed(2)}
                </span>
              </p>
            </div>
            <NewSaleForm />
          </div>

          {/* Search + Date filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date picker */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-44 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selectedDate
                      ? format(selectedDate, "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Clear date button — only visible when a date is selected */}
              {selectedDate && (
                <button
                  aria-label="Clear date filter"
                  onClick={() => setSelectedDate(undefined)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading sales...</p>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}

          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium text-center">Qty</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Bank Account</th>
                  <th className="px-5 py-3 font-medium">Worker</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {selectedDateStr
                        ? `No sales found for ${format(selectedDate!, "MMM d, yyyy")}.`
                        : "No sales found matching your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-xs text-muted-foreground">{sale.date}</td>
                      <td className="px-5 py-3 text-card-foreground">{sale.item}</td>
                      <td className="px-5 py-3 text-center font-mono">{sale.qty}</td>
                      <td className="px-5 py-3 text-right font-mono font-medium text-card-foreground">
                        ${sale.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {sale.payment}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {sale.payment === "Transfer" && sale.bankAccount
                          ? `${sale.bankAccount.accountName} — ${sale.bankAccount.bankName}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{sale.worker}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{sale.customer}</td>
                      <td className="px-5 py-3">
                        <button
                          aria-label={`View invoice for sale on ${sale.date}`}
                          onClick={() => setInvoiceSale(sale)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>

      <InvoiceModal
        sale={invoiceSale}
        open={invoiceSale !== null}
        onClose={() => setInvoiceSale(null)}
      />
    </>
  );
};

export default SalesPage;
