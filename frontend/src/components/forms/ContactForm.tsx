import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRoundPlus, Pencil } from "lucide-react";
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
import { useCreateContactMutation, useUpdateContactMutation } from "@/hooks/useContacts";
import type { Contact, ContactType } from "@/types";

const schema = z.object({
  type: z.enum(["customer", "supplier"]),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ContactFormProps {
  mode: "create" | "edit";
  type: ContactType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
}

const ContactForm = ({ mode, type, open, onOpenChange, contact }: ContactFormProps) => {
  const createMutation = useCreateContactMutation();
  const updateMutation = useUpdateContactMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type,
      name: "",
      phone: "",
      email: "",
      companyName: "",
      address: "",
    },
  });

  useEffect(() => {
    form.reset({
      type: contact?.type ?? type,
      name: contact?.name ?? "",
      phone: contact?.phone ?? "",
      email: contact?.email ?? "",
      companyName: contact?.companyName ?? "",
      address: contact?.address ?? "",
    });
  }, [contact, form, type, open]);

  const submitLabel = mode === "create" ? "Create Contact" : "Save Changes";
  const dialogTitle = mode === "create" ? `Add ${type === "customer" ? "Customer" : "Supplier"} Contact` : "Edit Contact";

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`${values.name} added to contacts.`);
      } else if (contact) {
        await updateMutation.mutateAsync({ id: contact.id, updates: values });
        toast.success(`${values.name} updated successfully.`);
      }

      form.reset({
        type,
        name: "",
        phone: "",
        email: "",
        companyName: "",
        address: "",
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save contact.";
      toast.error(message);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company / Business</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, city, country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === "create" ? <UserRoundPlus className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactForm;
