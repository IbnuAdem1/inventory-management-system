// src/components/forms/AddInventoryForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Store } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useInventory } from "@/contexts/InventoryContext";
import { useBranch } from "@/contexts/BranchContext";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Part name is required"),
  brand: z.string().min(1, "Brand is required"),
  compatibility: z.string().min(1, "Compatibility is required"),
  costPrice: z.coerce.number().min(0, "Cost price must be 0 or more"),
  sellingPrice: z.coerce.number().min(0.01, "Selling price must be greater than 0"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  minStock: z.coerce.number().int().min(1, "Minimum stock must be at least 1"),
});

type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const AddInventoryForm = () => {
  const [open, setOpen] = useState(false);
  const { addItem } = useInventory();
  const { activeBranch } = useBranch();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      brand: "",
      compatibility: "",
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 5,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await addItem({
        ...values,
        branchId: activeBranch ? activeBranch.id : undefined,
      });
      toast.success(`"${values.name}" added to inventory.`);
      form.reset();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add part.";
      toast.error(message);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Part
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add New Part</DialogTitle>
              {activeBranch && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Store className="h-3 w-3 text-primary" />
                  {activeBranch.name}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1: Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Brake Pads" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Brembo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Compatibility */}
              <FormField
                control={form.control}
                name="compatibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Compatibility</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota Camry 2018-2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 3: Cost Price + Selling Price */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="35.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="85.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Initial Stock + Min Stock */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Part</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddInventoryForm;
