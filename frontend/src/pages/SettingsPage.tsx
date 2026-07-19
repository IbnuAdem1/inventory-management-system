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
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/DashboardLayout";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
  type WorkerUser,
} from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const addWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
  const { data: users, isLoading, isError } = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const statusMutation = useUpdateUserStatusMutation();
  const resetPasswordMutation = useResetUserPasswordMutation();
  const deleteMutation = useDeleteUserMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<WorkerUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerUser | null>(null);

  const addForm = useForm<AddWorkerValues>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (addOpen) {
      addForm.reset({ name: "", email: "", password: "" });
    }
  }, [addOpen, addForm]);

  useEffect(() => {
    if (resetTarget) {
      resetForm.reset({ password: "", confirmPassword: "" });
    }
  }, [resetTarget, resetForm]);

  const canManage = (target: WorkerUser) =>
    target.role === "WORKER" && target.id !== currentUser?.id;

  const onAddWorker = async (values: AddWorkerValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success(`${values.name} added as a worker.`);
      setAddOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add worker.";
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
      toast.success(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete worker.";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            System configuration & management
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Management Section */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">
                    User Management
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage workers and permissions
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <p className="text-sm text-destructive text-center py-8">
                  Failed to load users.
                </p>
              ) : !users || users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workers yet. Click Add to create one.
                </p>
              ) : (
                <div className="divide-y divide-border/50 border rounded-md overflow-hidden">
                  {users.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex flex-col gap-3 px-4 py-3 bg-card/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {worker.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {worker.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] border-0",
                            worker.role === "OWNER"
                              ? "bg-primary/20 text-primary hover:bg-primary/20"
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
              Add or remove workers, reset passwords, and activate or deactivate
              accounts.
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
                    Security
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Password & authentication settings
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure password policies, two-factor authentication, and
                session management.
              </p>
              <Button className="mt-4 w-full" variant="outline" size="sm" disabled>
                Update Security Settings
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Alert preferences
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure low-stock alerts, daily summary reports, and suspicious
                activity notifications.
              </p>
              <Button className="mt-4 w-full" variant="outline" size="sm" disabled>
                Manage Alerts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Worker</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit(onAddWorker)}
              className="space-y-4"
            >
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Worker name" autoComplete="off" {...field} />
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
                    <FormLabel>Email</FormLabel>
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
              <FormField
                control={addForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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
              <div className="space-y-2">
                <FormLabel>Role</FormLabel>
                <Input value="WORKER" disabled readOnly className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  New accounts are always created as workers.
                </p>
              </div>
              <DialogFooter>
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
                  Add Worker
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onResetPassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <FormLabel>Worker</FormLabel>
                <Input
                  value={resetTarget?.name ?? ""}
                  disabled
                  readOnly
                  className="bg-muted"
                />
              </div>
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
                        placeholder="Re-enter password"
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete worker?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
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
              Delete Worker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SettingsPage;
