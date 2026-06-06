// src/components/forms/EditInventoryForm.tsx
//
// Dialog form for editing an existing inventory item.
// Pre-fills all fields with current item data.
// On submit: calls updateItem() from InventoryContext.

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit } from "lucide-react";

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
import { useInventory } from "@/contexts/InventoryContext";
import type { InventoryItem } from "@/types";
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
// PROPS
// ─────────────────────────────────────────────

interface EditInventoryFormProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const EditInventoryForm = ({ item, open, onOpenChange }: EditInventoryFormProps) => {
  const { updateItem } = useInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item.name,
      brand: item.brand,
      compatibility: item.compatibility,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      stock: item.stock,
      minStock: item.minStock,
    },
  });

  // Re-populate form if the item changes (e.g. user clicks edit on a different row)
  useEffect(() => {
    form.reset({
      name: item.name,
      brand: item.brand,
      compatibility: item.compatibility,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      stock: item.stock,
      minStock: item.minStock,
    });
  }, [item, form]);

  const onSubmit = (values: FormValues) => {
    updateItem(item.id, values);
    toast.success(`"${values.name}" updated successfully.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
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
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Compatibility */}
            <FormField
              control={form.control}
              name="compatibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compatibility</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 2: Cost + Selling price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Stock + Min stock */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
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
                    <FormLabel>Min Stock (alert threshold)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Edit className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryForm;
