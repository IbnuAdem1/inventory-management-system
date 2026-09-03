// src/components/receipts/ReceiptModal.tsx
import { useState, useRef } from "react";
import { Printer, FileText, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBranch } from "@/contexts/BranchContext";
import type { Sale } from "@/types";


interface ReceiptModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReceiptFormat = "thermal" | "a4";

export const ReceiptModal = ({ sale, open, onOpenChange }: ReceiptModalProps) => {
  const [format, setFormat] = useState<ReceiptFormat>("thermal");
  const { activeBranch } = useBranch();
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const saleDate = sale.date ? new Date(sale.date) : new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(saleDate);

  const receiptId = `INV-${sale.id.slice(0, 8).toUpperCase()}`;
  const branchName = sale.branchName || activeBranch?.name || "AutoPartsPro Main Store";
  const branchAddress = activeBranch?.address || "Bole Road, Central Auto Parts District";
  const branchPhone = activeBranch?.phone || "+251 91 123 4567";

  const items = sale.items && sale.items.length > 0
    ? sale.items
    : [{ itemName: sale.item || "Spare Part", quantity: sale.qty || 1, unitPrice: sale.amount / (sale.qty || 1), amount: sale.amount }];

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = sale.discount || 0;
  const total = sale.amount || subtotal - discount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Receipt className="h-4 w-4 text-primary" />
              Receipt & Tax Invoice Generator
            </DialogTitle>

            {/* Format Toggle & Print Action */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium border border-border/80">
                <button
                  type="button"
                  onClick={() => setFormat("thermal")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all ${
                    format === "thermal"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Thermal (80mm)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("a4")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all ${
                    format === "a4"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  A4 Tax Invoice
                </button>
              </div>

              <Button
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Now
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Area Wrapper */}
        <div className="flex-1 overflow-y-auto py-4 px-2 flex justify-center bg-muted/30 rounded-lg border border-border/60">
          <div
            id="printable-receipt"
            ref={printRef}
            className={`bg-white text-neutral-900 transition-all ${
              format === "thermal"
                ? "w-[340px] p-5 font-mono text-xs shadow-md rounded border border-neutral-300"
                : "w-full max-w-[620px] p-8 font-sans text-sm shadow-md rounded border border-neutral-300"
            }`}
          >
            {/* ────────────────────────────────────────────────────────── */}
            {/* THERMAL 80mm LAYOUT                                       */}
            {/* ────────────────────────────────────────────────────────── */}
            {format === "thermal" && (
              <div className="space-y-3 leading-relaxed">
                {/* Header */}
                <div className="text-center space-y-1 pb-2 border-b border-dashed border-neutral-400">
                  <h2 className="text-base font-extrabold tracking-wider text-black">
                    AUTOPARTS PRO
                  </h2>
                  <p className="text-[11px] font-semibold text-neutral-700">{branchName}</p>
                  <p className="text-[10px] text-neutral-500">{branchAddress}</p>
                  <p className="text-[10px] text-neutral-500">Tel: {branchPhone}</p>
                </div>

                {/* Metadata */}
                <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-neutral-400">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Receipt #:</span>
                    <span className="font-bold">{receiptId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Date:</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Cashier:</span>
                    <span>{sale.worker || "Staff"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer:</span>
                    <span className="font-semibold">{sale.customer || "Walk-in"}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="space-y-1.5 pb-2 border-b border-dashed border-neutral-400">
                  <div className="flex justify-between font-bold text-[11px] text-neutral-700 border-b border-neutral-200 pb-1">
                    <span>ITEM & QTY</span>
                    <span>AMOUNT</span>
                  </div>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <div className="pr-2">
                        <div className="font-semibold text-neutral-900">{it.itemName}</div>
                        <div className="text-[10px] text-neutral-500">
                          {it.quantity} x ${Number(it.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <span className="font-bold shrink-0">
                        ${Number(it.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-black border-t border-b border-neutral-800 py-1 mt-1">
                    <span>TOTAL:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-600 pt-1">
                    <span>Payment Method:</span>
                    <span className="font-bold text-black uppercase">{sale.payment}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-3 space-y-1 text-[10px] text-neutral-500 border-t border-dashed border-neutral-400">
                  <p className="font-bold text-neutral-700">THANK YOU FOR YOUR BUSINESS!</p>
                  <p>Parts warranty valid within 7 days with original receipt.</p>
                  <p className="text-[9px] tracking-widest text-neutral-400">*** KEEP FOR WARRANTY ***</p>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* A4 FORMAL TAX INVOICE LAYOUT                              */}
            {/* ────────────────────────────────────────────────────────── */}
            {format === "a4" && (
              <div className="space-y-6 text-neutral-800">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-4">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
                      AUTOPARTS PRO
                    </h1>
                    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Automotive Spare Parts & Commercial Supplies
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{branchName} • {branchAddress}</p>
                    <p className="text-xs text-neutral-500">Phone: {branchPhone} • TIN: 0098471234</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-neutral-900 text-white text-xs font-bold px-3 py-1 rounded tracking-wider uppercase">
                      Tax Invoice
                    </span>
                    <p className="text-sm font-bold text-neutral-900 mt-2">{receiptId}</p>
                    <p className="text-xs text-neutral-500">Date: {formattedDate}</p>
                  </div>
                </div>

                {/* Bill To & Order Summary */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded border border-neutral-200 text-xs">
                  <div>
                    <span className="font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Billed To Customer:
                    </span>
                    <p className="text-sm font-bold text-neutral-900">{sale.customer || "Walk-in Customer"}</p>
                    <p className="text-neutral-500 mt-0.5">Account: Retail & Counter Sales</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Payment Details:
                    </span>
                    <p className="text-xs font-semibold text-neutral-800">
                      Method: <span className="font-bold uppercase">{sale.payment}</span>
                    </p>
                    <p className="text-xs text-neutral-500">Cashier: {sale.worker || "Staff"}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-300 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Item & Description</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2 text-right">Unit Price</th>
                      <th className="py-2.5 px-2 text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-2 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-2">
                          <span className="font-semibold text-neutral-900 block">{it.itemName}</span>
                          <span className="text-[11px] text-neutral-500">Genuine Replacement Part</span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">${Number(it.unitPrice).toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-neutral-900">
                          ${Number(it.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Table */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-mono">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>VAT / Tax (Included):</span>
                      <span className="font-mono">15%</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-base text-neutral-900 border-t-2 border-neutral-800 pt-2 mt-2">
                      <span>Grand Total:</span>
                      <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Terms */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-300 text-[11px] text-neutral-500">
                  <div>
                    <p className="font-bold text-neutral-800 mb-1">Terms & Warranty Policy:</p>
                    <p>1. Unopened electrical & mechanical items are returnable within 7 business days.</p>
                    <p>2. Installed or altered electrical components are non-refundable.</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 border-b border-neutral-400 mb-1" />
                    <p className="font-semibold text-neutral-700">Authorized Signature & Store Stamp</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: fixed;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
