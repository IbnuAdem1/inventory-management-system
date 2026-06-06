// src/components/forms/NewSaleForm.tsx
//
// Dialog form for recording a new sale.
// Selects a part from inventory, sets qty, payment, customer.
// On submit:
//   - Calls addSale() from SalesContext (which also decrements stock via InventoryContext)
//   - Shows a success toast

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory } from "@/contexts/InventoryContext";
import { useSales } from "@/contexts/SalesContext";
import { useAuth } from "@/contexts/AuthContext";
import { mockWorkers } from "@/data/mockData";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────

const schema = z.object({
  inventoryId: z.coerce.number().min(1, "Please select a part"),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  payment: z.enum(["Cash", "Transfer", "Credit"], {
    required_error: "Please select a payment method",
  }),
  worker: z.string().min(1, "Please select a worker"),
  customer: z.string().min(1, "Customer name is required"),
});

type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const NewSaleForm = () => {
  const [open, setOpen] = useState(false);
  const { inventory } = useInventory();
  const { addSale } = useSales();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      inventoryId: 0,
      qty: 1,
      payment: "Cash",
      worker: user?.name ?? "",
      customer: "Walk-in",
    },
  });

  // Watch inventoryId to compute amount and show max stock
  const selectedId = form.watch("inventoryId");
  const selectedQty = form.watch("qty");
  const selectedItem = inventory.find((i) => i.id === Number(selectedId));
  const totalAmount = selectedItem ? selectedItem.sellingPrice * (selectedQty || 0) : 0;

  const onSubmit = (values: FormValues) => {
    if (!selectedItem) return;

    // Guard: can't sell more than what's in stock
    if (values.qty > selectedItem.stock) {
      form.setError("qty", {
        message: `Only ${selectedItem.stock} unit${selectedItem.stock !== 1 ? "s" : ""} in stock.`,
      });
      return;
    }

    addSale({
      inventoryId: selectedItem.id,
      item: `${selectedItem.name} - ${selectedItem.compatibility}`,
      qty: values.qty,
      amount: totalAmount,
      payment: values.payment,
      worker: values.worker,
      customer: values.customer,
    });

    toast.success(
      `Sale recorded: ${selectedItem.name} x${values.qty} — $${totalAmount.toFixed(2)}`
    );
    form.reset({
      inventoryId: 0,
      qty: 1,
      payment: "Cash",
      worker: user?.name ?? "",
      customer: "Walk-in",
    });
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Sale
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Part selector */}
              <FormField
                control={form.control}
                name="inventoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a part..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inventory
                          .filter((i) => i.stock > 0)
                          .map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name} — {i.brand}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({i.stock} in stock · ${i.sellingPrice.toFixed(2)})
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity + live total */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantity
                        {selectedItem && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (max {selectedItem.stock})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={selectedItem?.stock}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col justify-end pb-1">
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-xl font-bold font-mono text-primary">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment method */}
              <FormField
                control={form.control}
                name="payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Worker */}
              <FormField
                control={form.control}
                name="worker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select worker..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockWorkers.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer */}
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Input placeholder="Walk-in" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedItem}>
                  Record Sale
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewSaleForm;
