// src/components/ui/DateRangeFilter.tsx
import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DateFilterPreset =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "thisMonth"
  | "thisYear"
  | "custom";

interface DateRangeFilterProps {
  preset: DateFilterPreset;
  onPresetChange: (preset: DateFilterPreset) => void;
  selectedDate?: Date;
  onDateChange: (date?: Date) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  onPresetChange,
  selectedDate,
  onDateChange,
  className,
}) => {
  const handlePresetSelect = (val: string) => {
    const p = val as DateFilterPreset;
    onPresetChange(p);

    const now = new Date();
    if (p === "all") {
      onDateChange(undefined);
    } else if (p === "today") {
      onDateChange(now);
    } else if (p === "yesterday") {
      onDateChange(subDays(now, 1));
    } else if (p === "last7days") {
      onDateChange(subDays(now, 7));
    } else if (p === "thisMonth") {
      onDateChange(startOfMonth(now));
    } else if (p === "thisYear") {
      onDateChange(startOfYear(now));
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={preset} onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-36 h-9 text-xs">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="custom">Pick Specific Date...</SelectItem>
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-36 justify-start text-left font-normal text-xs",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Choose date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  onDateChange(d);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <button
              onClick={() => {
                onDateChange(undefined);
                onPresetChange("all");
              }}
              aria-label="Clear date filter"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
