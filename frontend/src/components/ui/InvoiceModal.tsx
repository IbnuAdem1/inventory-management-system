// src/components/ui/InvoiceModal.tsx
// Pure UI component — no API calls.
// Uses a React Portal to render the print content directly on document.body,
// outside the modal stacking context, so window.print() captures it cleanly.

import { createPortal } from "react-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Sale } from "@/types";

interface InvoiceModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

// ── Shared invoice content ────────────────────────────────────────────────────
// Rendered both inside the modal (for preview) and in the portal (for printing).

function InvoiceContent({ sale }: { sale: Sale }) {
  const invoiceNumber = sale.id.slice(0, 8).toUpperCase();
  const unitPrice = sale.qty > 0 ? sale.amount / sale.qty : sale.amount;

  return (
    <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            AutoPartsPro
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
            Spare Parts Management System
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#9ca3af" }}>
            Invoice #{invoiceNumber}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>
            Date: {sale.date}
          </p>
        </div>
      </div>

      {/* Customer + Payment */}
      <div style={{ marginTop: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem" }}>
          <div>
            <span style={{ color: "#6b7280" }}>Customer: </span>
            <span style={{ fontWeight: 600, color: "#111827" }}>{sale.customer}</span>
          </div>
          <div>
            <span style={{ color: "#6b7280" }}>Payment: </span>
            <span style={{ fontWeight: 600, color: "#111827" }}>{sale.payment}</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ marginTop: "1.25rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ paddingBottom: "0.5rem", textAlign: "left",   fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af" }}>Item</th>
              <th style={{ paddingBottom: "0.5rem", textAlign: "center", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", width: "3.5rem" }}>Qty</th>
              <th style={{ paddingBottom: "0.5rem", textAlign: "right",  fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", width: "7rem"  }}>Unit Price</th>
              <th style={{ paddingBottom: "0.5rem", textAlign: "right",  fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", width: "7rem"  }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.75rem 0", color: "#111827", fontWeight: 500 }}>{sale.item}</td>
              <td style={{ padding: "0.75rem 0", textAlign: "center", color: "#374151" }}>{sale.qty}</td>
              <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "monospace", color: "#374151" }}>${unitPrice.toFixed(2)}</td>
              <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "monospace", color: "#111827", fontWeight: 600 }}>${sale.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div style={{ marginTop: "1rem", borderTop: "2px solid #111827", paddingTop: "1rem", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1.5rem" }}>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Total</span>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>${sale.amount.toFixed(2)}</span>
      </div>

      {/* Footer */}
      <p style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
        Thank you for your business.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const InvoiceModal = ({ sale, open, onClose }: InvoiceModalProps) => {
  if (!sale) return null;

  const handlePrint = () => {
    const printRoot = document.getElementById("invoice-print-root");
    if (printRoot) {
      printRoot.style.display = "block";
      window.print();
      printRoot.style.display = "none";
    }
  };

  return (
    <>
      {/* Print styles — hides everything except the portal div */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print-root { display: block !important; }
          #invoice-print-root * { display: revert; }

          /* Hide the modal overlay and backdrop */
          [role="dialog"],
          [data-radix-dialog-overlay],
          [data-radix-dialog-content],
          .fixed,
          [data-state="open"] {
            display: none !important;
          }

          /* Only show the portal invoice content */
          #invoice-print-root {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
          }

          /* Force white background on entire page */
          html, body {
            background: white !important;
            background-color: white !important;
          }
        }
      `}</style>

      {/* Portal — renders invoice directly on body for clean printing */}
      {createPortal(
        <div id="invoice-print-root" style={{ display: "none" }}>
          <InvoiceContent sale={sale} />
        </div>,
        document.body
      )}

      {/* Modal — for on-screen preview */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">

          {/* Scrollable invoice preview */}
          <div className="max-h-[70vh] overflow-y-auto">
            <InvoiceContent sale={sale} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={handlePrint}>
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
