import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateBankAccountMutation, useUpdateBankAccountMutation } from "@/hooks/useContacts";
import type { BankAccount } from "@/types";

const schema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscRoutingCode: z.string().min(1, "Routing code is required"),
  isActive: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface BankAccountFormProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount;
}

const BankAccountForm = ({ mode, open, onOpenChange, account }: BankAccountFormProps) => {
  const createMutation = useCreateBankAccountMutation();
  const updateMutation = useUpdateBankAccountMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscRoutingCode: "",
      isActive: false,
    },
  });

  useEffect(() => {
    form.reset({
      bankName: account?.bankName ?? "",
      accountHolderName: account?.accountHolderName ?? "",
      accountNumber: account?.accountNumber ?? "",
      ifscRoutingCode: account?.ifscRoutingCode ?? "",
      isActive: account?.isActive ?? false,
    });
  }, [account, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`${values.bankName} added.`);
      } else if (account) {
        await updateMutation.mutateAsync({ id: account.id, updates: values });
        toast.success(`${values.bankName} updated successfully.`);
      }

      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save bank account.";
      toast.error(message);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Bank Account" : "Edit Bank Account"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="National Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder</FormLabel>
                    <FormControl>
                      <Input placeholder="Shop Owner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ifscRoutingCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC / Routing Code</FormLabel>
                    <FormControl>
                      <Input placeholder="BK0001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="space-y-1">
                      <FormLabel>Active Account</FormLabel>
                      <p className="text-xs text-muted-foreground">Used as the shop's primary banking account.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === "create" ? <Landmark className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BankAccountForm;
