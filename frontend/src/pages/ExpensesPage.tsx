import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Receipt, DollarSign, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  type ExpenseCreateInput,
} from "@/hooks/useExpenses";
import type { Expense } from "@/types";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PRESET_CATEGORIES = [
  "Rent","Salaries","Utilities","Transport","Supplies","Maintenance","Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Rent:        "bg-blue-500/15 text-blue-400",
  Salaries:    "bg-green-500/15 text-green-400",
  Utilities:   "bg-yellow-500/15 text-yellow-400",
  Transport:   "bg-purple-500/15 text-purple-400",
  Supplies:    "bg-orange-500/15 text-orange-400",
  Maintenance: "bg-red-500/15 text-red-400",
  Other:       "bg-muted text-muted-foreground",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground";
}

// ─────────────────────────────────────────────
// ZOD SCHEMA
// ─────────────────────────────────────────────

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

type FormValues = z.infer<typeof expenseSchema>;

// ─────────────────────────────────────────────
// EXPENSE FORM (shared by Add + Edit)
// ─────────────────────────────────────────────

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValues: FormValues;
  title: string;
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void>;
  yearOptions: number[];
}

function ExpenseForm({
  open, onOpenChange, defaultValues, title, submitLabel, onSubmit, yearOptions,
}: ExpenseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  // Reset form when dialog opens with new defaultValues
  const handleOpenChange = (v: boolean) => {
    if (v) form.reset(defaultValues);
    else form.reset();
    onOpenChange(v);
  };

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
    form.reset();
  };

  const [customCategory, setCustomCategory] = useState(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {customCategory ? (
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter custom category" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setCustomCategory(false); field.onChange(""); }}
                      >
                        Presets
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(val) => {
                          if (val === "__custom__") { setCustomCategory(true); field.onChange(""); }
                          else field.onChange(val);
                        }}
                        value={PRESET_CATEGORIES.includes(field.value) ? field.value : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRESET_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">
                            <span className="text-muted-foreground">Custom...</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Month + Year row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTH_NAMES.map((name, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-indexed

const yearOptions = [
  currentYear + 1,
  currentYear,
  currentYear - 1,
  currentYear - 2,
];

const ExpensesPage = () => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Fetch all expenses for the selected year (unfiltered — for summary + tab badges)
  const { data: allYearExpenses = [], isLoading } = useExpensesQuery(selectedYear);

  // Filtered to selected month for the table
  const monthExpenses = allYearExpenses.filter((e) => e.month === selectedMonth);

  // ── Summary calculations ──
  const totalAnnual = allYearExpenses.reduce((s, e) => s + e.amount, 0);
  const totalCurrentMonth = allYearExpenses
    .filter((e) => e.month === currentMonth)
    .reduce((s, e) => s + e.amount, 0);

  const categoryTotals: Record<string, number> = {};
  for (const e of allYearExpenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  }
  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Tab badge counts
  const countByMonth: Record<number, number> = {};
  for (const e of allYearExpenses) {
    countByMonth[e.month] = (countByMonth[e.month] ?? 0) + 1;
  }

  // Month total for footer
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Mutations ──
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();

  // ── Dialog state ──
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const handleCreate = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values as ExpenseCreateInput);
      toast.success("Expense added");
      setAddOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add expense");
    }
  };

  const handleUpdate = async (values: FormValues) => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, updates: values });
      toast.success("Expense updated");
      setEditTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update expense");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Expense deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete expense");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
            <p className="text-sm text-muted-foreground">Track monthly business expenses</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Annual Expenses"
            value={`$${totalAnnual.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={`${selectedYear}`}
            changeType="neutral"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title={`${MONTH_NAMES[currentMonth - 1]} Expenses`}
            value={`$${totalCurrentMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change="Current month"
            changeType="neutral"
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <StatCard
            title="Top Category"
            value={topCategory}
            change={
              topCategory !== "—"
                ? `$${(categoryTotals[topCategory] ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} this year`
                : "No data"
            }
            changeType="neutral"
            icon={<Receipt className="h-5 w-5" />}
          />
        </div>

        {/* ── Month tabs ── */}
        <div className="flex flex-wrap gap-1 border-b border-border pb-0">
          {MONTH_SHORT.map((name, i) => {
            const month = i + 1;
            const count = countByMonth[month] ?? 0;
            const isActive = selectedMonth === month;
            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`
                  relative flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium
                  transition-colors border-b-2
                  ${isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                {name}
                {count > 0 && (
                  <span className={`
                    inline-flex h-4 min-w-4 items-center justify-center rounded-full
                    px-1 text-[10px] font-bold
                    ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading expenses...</p>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Date Added</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No expenses recorded for {MONTH_NAMES[selectedMonth - 1]}.{" "}
                      <button
                        onClick={() => setAddOpen(true)}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Click '+ Add Expense' to get started.
                      </button>
                    </td>
                  </tr>
                ) : (
                  <>
                    {monthExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(expense.category)}`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-medium text-card-foreground">
                          ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {MONTH_SHORT[expense.month - 1]} {expense.year}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              aria-label={`Edit ${expense.category} expense`}
                              onClick={() => setEditTarget(expense)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              aria-label={`Delete ${expense.category} expense`}
                              onClick={() => setDeleteTarget(expense)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Month total footer */}
                    <tr className="border-t border-border bg-muted/20">
                      <td className="px-5 py-3 text-sm font-semibold text-card-foreground">
                        Total for {MONTH_NAMES[selectedMonth - 1]}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-primary">
                        ${monthTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Expense dialog ── */}
      <ExpenseForm
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Expense"
        submitLabel="Add Expense"
        defaultValues={{ category: "", amount: 0, month: selectedMonth, year: selectedYear }}
        onSubmit={handleCreate}
        yearOptions={yearOptions}
      />

      {/* ── Edit Expense dialog ── */}
      {editTarget && (
        <ExpenseForm
          open={editTarget !== null}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          title="Edit Expense"
          submitLabel="Save Changes"
          defaultValues={{
            category: editTarget.category,
            amount: editTarget.amount,
            month: editTarget.month,
            year: editTarget.year,
          }}
          onSubmit={handleUpdate}
          yearOptions={yearOptions}
        />
      )}

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.category}</span>{" "}
              expense of{" "}
              <span className="font-semibold text-foreground font-mono">
                ${deleteTarget?.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ExpensesPage;
