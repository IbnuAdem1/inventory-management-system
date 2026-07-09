// src/components/ui/InvoiceModal.tsx
// Pure UI component — no API calls.
// Renders a print-friendly invoice for a single sale and exposes a Print button.

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Sale } from "@/types";

interface InvoiceModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

const InvoiceModal = ({ sale, open, onClose }: InvoiceModalProps) => {
  if (!sale) return null;

  return (
    <>
      {/* Print-only styles — scoped to this component */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-printable, .invoice-printable * { visibility: visible; }
          .invoice-printable { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">

          {/* Invoice content — white bg for clean printing */}
          <div className="invoice-printable bg-white text-black p-8 rounded-lg">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-black">
                  AutoPartsPro
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Spare Parts Management System
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                <p className="text-sm font-medium text-black">{sale.date}</p>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="mt-5 border-b border-gray-200 pb-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Invoice</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Customer: </span>
                  <span className="font-medium text-black">{sale.customer}</span>
                </div>
                <div>
                  <span className="text-gray-500">Payment: </span>
                  <span className="font-medium text-black">{sale.payment}</span>
                </div>
                <div>
                  <span className="text-gray-500">Worker: </span>
                  <span className="font-medium text-black">{sale.worker}</span>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="mt-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="pb-2 text-left font-medium">Item</th>
                    <th className="pb-2 text-center font-medium w-16">Qty</th>
                    <th className="pb-2 text-right font-medium w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-black font-medium">{sale.item}</td>
                    <td className="py-3 text-center text-gray-700">{sale.qty}</td>
                    <td className="py-3 text-right font-mono text-black">
                      ${sale.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mt-5 border-t-2 border-black pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-black">Total</span>
              <span className="text-xl font-bold font-mono text-black">
                ${sale.amount.toFixed(2)}
              </span>
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-gray-400">
              Thank you for your business.
            </p>
          </div>

          {/* Action buttons — hidden on print */}
          <div className="no-print flex items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceModal;
