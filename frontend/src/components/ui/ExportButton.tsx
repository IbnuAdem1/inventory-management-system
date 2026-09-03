// src/components/ui/ExportButton.tsx
import React from "react";
import { Download, FileText, Printer, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonProps {
  filename?: string;
  data?: Record<string, unknown>[];
  onPrint?: () => void;
  title?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  filename = "autoparts-export",
  data,
  onPrint,
  title = "Export",
}) => {
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((field) => {
              const val = row[field];
              if (val === null || val === undefined) return '""';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV file downloaded successfully!");
    } catch (e) {
      toast.error("Failed to generate CSV export");
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
          <Download className="h-3.5 w-3.5" />
          {title}
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Export as CSV / Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer gap-2">
          <Printer className="h-4 w-4 text-muted-foreground" />
          Print / Save PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
