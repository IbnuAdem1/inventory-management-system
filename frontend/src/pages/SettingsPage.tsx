import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Users,
  Bell,
  Loader2,
  Plus,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  Store,
  ShoppingCart,
  Package,
  Sparkles,
  CreditCard,
  Receipt,
  BarChart3,
  RefreshCw,
  Edit3,
  Check,
  UserRound,
  Building2,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
  type WorkerUser,
} from "@/hooks/useUsers";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// PERMISSION DEFINITIONS & ROLE PRESETS
// ─────────────────────────────────────────────

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
  category: "Core POS & Sales" | "Inventory Operations" | "Contacts & Financials";
  icon: any;
}

export const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  // 1. Core POS & Sales
  {
    id: "sales",
    label: "Sales & POS Counter",
    description: "Create sales and view transaction records for assigned branch",
    category: "Core POS & Sales",
    icon: ShoppingCart,
  },
  {
    id: "inventory_view",
    label: "View Inventory Catalog",
    description: "Search parts, view stock levels and counter selling prices",
    category: "Core POS & Sales",
    icon: Package,
  },
  {
    id: "credits",
    label: "My Customer Credit Book",
    description: "Manage debts and repayments only for sales made by this worker",
    category: "Core POS & Sales",
    icon: CreditCard,
  },
  {
    id: "customers",
    label: "My Customer Contacts",
    description: "View and add customer directory contacts created by this worker",
    category: "Core POS & Sales",
    icon: UserRound,
  },

  // 2. Inventory Operations
  {
    id: "inventory_manage",
    label: "Add / Edit / Delete Inventory",
    description: "Manually register new parts, adjust stock counts, or update catalog",
    category: "Inventory Operations",
    icon: Edit3,
  },
  {
    id: "ai_scanner",
    label: "AI Supplier Invoice Scanner",
    description: "Scan supplier bills via Camera / OCR to auto-import items",
    category: "Inventory Operations",
    icon: Sparkles,
  },
  {
    id: "transfers",
    label: "Multi-Branch Stock Transfers",
    description: "Transfer spare parts inventory between store branches",
    category: "Inventory Operations",
    icon: RefreshCw,
  },

  // 3. Contacts & Financials
  {
    id: "credits_all",
    label: "View All Store Credits",
    description: "Access customer credit records across all workers and branches",
    category: "Contacts & Financials",
    icon: CreditCard,
  },
  {
    id: "customers_all",
    label: "View All Customer Contacts",
    description: "Access entire shop customer directory across all workers",
    category: "Contacts & Financials",
    icon: Users,
  },
  {
    id: "suppliers",
    label: "Supplier Directory Contacts",
    description: "Access wholesaler & parts vendor contacts directory",
    category: "Contacts & Financials",
    icon: Building2,
  },
  {
    id: "bank_accounts",
    label: "Store Bank Accounts",
    description: "View shop banking accounts and transfer payment details",
    category: "Contacts & Financials",
    icon: Landmark,
  },
  {
    id: "expenses",
    label: "Shop Expense Tracker",
    description: "View and record store operational overheads and monthly expenses",
    category: "Contacts & Financials",
    icon: Receipt,
  },
  {
    id: "reports",
    label: "Financial & Profit Reports",
    description: "Access business revenue, cost breakdowns, and profit margins",
    category: "Contacts & Financials",
    icon: BarChart3,
  },
];

export const ROLE_PRESETS = [
  {
    id: "cashier",
    title: "Counter Sales Clerk (Default)",
    description: "POS Counter sales, inventory search, own credits & customers only.",
    permissions: ["sales", "inventory_view", "credits", "customers"],
  },
  {
    id: "stock_keeper",
    title: "Warehouse / Stock Keeper",
    description: "View catalog, add/edit parts, AI invoice scanner & stock transfers.",
    permissions: ["inventory_view", "inventory_manage", "ai_scanner", "transfers", "suppliers"],
  },
  {
    id: "manager",
    title: "Branch Assistant Manager",
    description: "Counter sales, full inventory, all store credits, expenses & transfers.",
    permissions: [
      "sales",
      "inventory_view",
      "inventory_manage",
      "ai_scanner",
      "credits_all",
      "customers_all",
      "expenses",
      "transfers",
    ],
  },
  {
    id: "full_access",
    title: "Full Store Admin (All Access)",
    description: "Grants access to every single feature, tool, and report.",
    permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
  },
];

const addWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchId: z.string().optional(),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AddWorkerValues = z.infer<typeof addWorkerSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const SettingsPage = () => {
  const { user: currentUser } = useAuth();
  const { branches } = useBranch();
  const { data: users, isLoading, isError } = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const statusMutation = useUpdateUserStatusMutation();
  const resetPasswordMutation = useResetUserPasswordMutation();
  const deleteMutation = useDeleteUserMutation();

  const [addOpen, setAddOpen] = useState(false);
  // Default permissions: Counter Sales Clerk
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "sales",
    "inventory_view",
    "credits",
    "customers",
  ]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // Edit worker state
  const [editTarget, setEditTarget] = useState<WorkerUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editBranchId, setEditBranchId] = useState<string>("all");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const [resetTarget, setResetTarget] = useState<WorkerUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerUser | null>(null);

  const addForm = useForm<AddWorkerValues>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: { name: "", email: "", password: "", branchId: "all" },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (addOpen) {
      addForm.reset({ name: "", email: "", password: "", branchId: "all" });
      setSelectedPermissions(["sales", "inventory_view", "credits", "customers"]);
      setSelectedBranchId("all");
    }
  }, [addOpen, addForm]);

  useEffect(() => {
    if (editTarget) {
      setEditName(editTarget.name);
      setEditBranchId(editTarget.branchId || "all");
      setEditPermissions(
        editTarget.permissions && editTarget.permissions.length > 0
          ? editTarget.permissions
          : ["sales", "inventory_view", "credits", "customers"]
      );
    }
  }, [editTarget]);

  useEffect(() => {
    if (resetTarget) {
      resetForm.reset({ password: "", confirmPassword: "" });
    }
  }, [resetTarget, resetForm]);

  const canManage = (target: WorkerUser) =>
    target.role === "WORKER" && target.id !== currentUser?.id;

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId]
    );
  };

  const toggleEditPermission = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId]
    );
  };

  const applyPreset = (presetPerms: string[]) => {
    setSelectedPermissions(presetPerms);
  };

  const applyEditPreset = (presetPerms: string[]) => {
    setEditPermissions(presetPerms);
  };

  const onAddWorker = async (values: AddWorkerValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        branchId: selectedBranchId !== "all" ? selectedBranchId : null,
        permissions: selectedPermissions,
      });
      toast.success(`${values.name} added as a worker with assigned privileges.`);
      setAddOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add worker.";
      toast.error(message);
    }
  };

  const onSaveEditWorker = async () => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        input: {
          name: editName,
          branchId: editBranchId !== "all" ? editBranchId : null,
          permissions: editPermissions,
        },
      });
      toast.success(`Updated ${editName}'s branch and privileges.`);
      setEditTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update worker.";
      toast.error(message);
    }
  };

  const onToggleStatus = async (target: WorkerUser) => {
    try {
      await statusMutation.mutateAsync({
        id: target.id,
        input: { isActive: !target.isActive },
      });
      toast.success(
        target.isActive
          ? `${target.name} has been deactivated.`
          : `${target.name} has been activated.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update status.";
      toast.error(message);
    }
  };

  const onResetPassword = async (values: ResetPasswordValues) => {
    if (!resetTarget) return;
    try {
      await resetPasswordMutation.mutateAsync({
        id: resetTarget.id,
        input: { password: values.password },
      });
      toast.success(`Password reset for ${resetTarget.name}.`);
      setResetTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password.";
      toast.error(message);
    }
  };

  const onDeleteWorker = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete worker.";
      toast.error(message);
    }
  };

  const categories = ["Core POS & Sales", "Inventory Operations", "Contacts & Financials"] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings & User Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure store staff accounts, assigned branches, role presets, and granular feature privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User Management Section */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Staff & Workers Directory
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage store branch allocation and fine-grained permissions
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Worker
              </Button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading accounts...
                </div>
              ) : isError ? (
                <p className="text-xs text-destructive py-4">
                  Failed to load users. Please refresh the page.
                </p>
              ) : !users || users.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  No worker accounts found. Click "Add Worker" to invite staff.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {users.map((worker) => (
                    <div
                      key={worker.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {worker.name}
                          </span>
                          {worker.id === currentUser?.id && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              You
                            </Badge>
                          )}
                          {/* Branch badge */}
                          {worker.branch ? (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 bg-primary/5 text-primary border-primary/20">
                              <Store className="h-2.5 w-2.5" />
                              {worker.branch.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground">
                              All Stores
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {worker.email}
                        </p>
                        {/* Permissions pills */}
                        {worker.role === "WORKER" && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(worker.permissions || ["sales", "inventory_view", "credits", "customers"]).map((p) => {
                              const permInfo = AVAILABLE_PERMISSIONS.find((ap) => ap.id === p);
                              return (
                                <span
                                  key={p}
                                  className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                  {permInfo?.label || p}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={cn(
                            "text-[10px] border-0",
                            worker.role === "OWNER"
                              ? "bg-purple-500/15 text-purple-400 hover:bg-purple-500/15"
                              : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/15"
                          )}
                        >
                          {worker.role}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-[10px] border-0",
                            worker.isActive
                              ? "bg-success/15 text-success hover:bg-success/15"
                              : "bg-destructive/15 text-destructive hover:bg-destructive/15"
                          )}
                        >
                          {worker.isActive ? "Active" : "Inactive"}
                        </Badge>

                        {canManage(worker) && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => setEditTarget(worker)}
                              title="Edit Branch & Privileges"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Privileges
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              disabled={statusMutation.isPending}
                              onClick={() => void onToggleStatus(worker)}
                              title={
                                worker.isActive
                                  ? "Deactivate worker"
                                  : "Activate worker"
                              }
                            >
                              {worker.isActive ? (
                                <UserX className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                              )}
                              {worker.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => setResetTarget(worker)}
                              title="Reset password"
                            >
                              <KeyRound className="h-3.5 w-3.5 mr-1" />
                              Reset
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(worker)}
                              title="Delete worker"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Workers operate strictly within their assigned store branch and granted functional scopes.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Enterprise Data Isolation
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By default, worker accounts can only register POS sales for their assigned branch and search catalog stock. Wholesale cost prices, financial analytics, store overhead expenses, and bank credentials remain strictly protected.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Audit & Activity Logging
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Worker Identity Attribution
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every sale, inventory decrement, customer credit debt issuance, and stock transfer records the responsible worker's ID and timestamp for complete store accountability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Worker Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Worker Account</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit(onAddWorker)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Dawit Tadesse" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Login Username)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="worker@example.com"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch Assignment Selector */}
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-primary" />
                  Assigned Store Branch
                </FormLabel>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Store Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores (Multi-Store Access)</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The employee will only be able to create POS sales and decrement inventory for this branch.
                </p>
              </div>

              {/* Role Presets */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1-Click Role Presets
                  </FormLabel>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((preset) => {
                    const isMatches =
                      preset.permissions.length === selectedPermissions.length &&
                      preset.permissions.every((p) => selectedPermissions.includes(p));
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => applyPreset(preset.permissions)}
                        className={cn(
                          "flex flex-col text-left p-2.5 rounded-lg border transition-all",
                          isMatches
                            ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                            : "border-border bg-card hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{preset.title}</span>
                          {isMatches && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Privileges Checklist by Category */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold">
                    Custom Feature Privileges
                  </FormLabel>
                  <span className="text-xs text-primary font-semibold">
                    {selectedPermissions.length} active privileges
                  </span>
                </div>

                {categories.map((cat) => (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground">{cat}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_PERMISSIONS.filter((p) => p.category === cat).map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        const Icon = perm.icon;
                        return (
                          <button
                            type="button"
                            key={perm.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePermission(perm.id);
                            }}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-2.5 text-left transition-all focus:outline-none",
                              isChecked
                                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                                : "border-border bg-card hover:bg-muted/40"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                isChecked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-transparent"
                              )}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-0.5 select-none">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <Icon className={cn("h-3.5 w-3.5", isChecked ? "text-primary" : "text-muted-foreground")} />
                                {perm.label}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-tight">
                                {perm.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || addForm.formState.isSubmitting
                  }
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Worker Account
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Worker Privileges & Branch Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Worker Privileges & Store Branch</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Worker Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Worker Name"
              />
            </div>

            {/* Branch Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" />
                Assigned Store Branch
              </label>
              <Select
                value={editBranchId}
                onValueChange={setEditBranchId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Store Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores (Multi-Store Access)</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Presets in Edit Dialog */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apply Role Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const isMatches =
                    preset.permissions.length === editPermissions.length &&
                    preset.permissions.every((p) => editPermissions.includes(p));
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => applyEditPreset(preset.permissions)}
                      className={cn(
                        "flex flex-col text-left p-2.5 rounded-lg border transition-all",
                        isMatches
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border bg-card hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{preset.title}</span>
                        {isMatches && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privileges checklist */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Feature & Page Access Privileges
                </label>
                <span className="text-xs text-primary font-semibold">
                  {editPermissions.length} active
                </span>
              </div>

              {categories.map((cat) => (
                <div key={cat} className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground">{cat}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.filter((p) => p.category === cat).map((perm) => {
                      const isChecked = editPermissions.includes(perm.id);
                      const Icon = perm.icon;
                      return (
                        <button
                          type="button"
                          key={perm.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleEditPermission(perm.id);
                          }}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border p-2.5 text-left transition-all focus:outline-none",
                            isChecked
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                              : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40 bg-transparent"
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="space-y-0.5 select-none">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Icon className={cn("h-3.5 w-3.5", isChecked ? "text-primary" : "text-muted-foreground")} />
                              {perm.label}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {perm.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={onSaveEditWorker}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ── */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onResetPassword)}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    resetPasswordMutation.isPending ||
                    resetForm.formState.isSubmitting
                  }
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void onDeleteWorker();
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SettingsPage;
