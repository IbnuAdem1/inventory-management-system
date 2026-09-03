// src/components/ai/AiInvoiceParserDialog.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Receipt,
  Sparkles,
  Loader2,
  Check,
  Plus,
  Camera,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Store,
  CheckCircle2,
  Scan,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiParseInvoiceMutation } from "@/hooks/useAi";

import { useInventory } from "@/contexts/InventoryContext";
import { useBranch } from "@/contexts/BranchContext";
import type { AiParsedInvoiceItem } from "@/types";
import { toast } from "sonner";



interface AiInvoiceParserDialogProps {
  onItemImported?: () => void;
  trigger?: React.ReactNode;
}

export const AiInvoiceParserDialog: React.FC<AiInvoiceParserDialogProps> = ({
  onItemImported,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "text">("upload");
  const parseMutation = useAiParseInvoiceMutation();
  const { addItem } = useInventory();
  const { branches, activeBranch, activeBranchId } = useBranch();

  const [supplierName, setSupplierName] = useState("Dubai Global Auto Wholesale");
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranch?.id || "");

  // Text Tab State
  const [invoiceText, setInvoiceText] = useState(
    `Brembo Ceramic Front Brake Pads Toyota Camry 2018-2023 - 15 pcs @ $28.00\nDenso Engine Oil Filter Toyota / Lexus Universal - 30 units @ $6.50\nBosch Platinum Spark Plugs Pack of 4 Nissan Altima - 20 sets @ $16.50\nGates Alternator Serpentine Belt BMW 320i - 8 pcs @ $34.00`
  );

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Camera Live Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Extracted Parsed Items List (Editable)
  const [parsedItems, setParsedItems] = useState<AiParsedInvoiceItem[]>([]);
  const [importedIndices, setImportedIndices] = useState<number[]>([]);
  const [isImportingAll, setIsImportingAll] = useState(false);

  // Camera Lifecycle
  useEffect(() => {
    if (open && activeTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, activeTab, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "No camera device found or camera in use by another app."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);
      setImageBase64(dataUrl);
      stopCamera();
      toast.success("Receipt photo captured! Click 'Scan & Extract' to analyze.");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setImageBase64(null);
    startCamera();
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(file);
    } else {
      // Text or PDF file
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setInvoiceText(result);
        setImagePreview(null);
        setImageBase64(null);
      };
      reader.readAsText(file);
    }
    toast.success(`Loaded "${file.name}"`);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setImageBase64(null);
  };

  // Run AI Extraction
  const handleParse = async () => {
    let payloadText = invoiceText;
    let payloadImage = imageBase64;

    if (activeTab === "camera" && capturedImage) {
      payloadImage = capturedImage;
    }

    if (!payloadText.trim() && !payloadImage) {
      toast.error("Please provide invoice text, upload a document, or capture a receipt photo.");
      return;
    }

    try {
      const res = await parseMutation.mutateAsync({
        invoiceText: payloadText,
        supplierName,
        imageBase64: payloadImage || undefined,
        branchId: selectedBranchId || undefined,
      });

      setParsedItems(res.items);
      setImportedIndices([]);
      toast.success(`✨ Extracted ${res.itemsFound} parts from supplier invoice!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse invoice with AI");
    }
  };

  // Edit item in extracted list
  const handleItemFieldChange = (index: number, field: keyof AiParsedInvoiceItem, value: any) => {
    setParsedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate selling price if cost price changes
      if (field === "costPrice") {
        const cost = parseFloat(value) || 0;
        updated[index].suggestedSellingPrice = Number((cost * 1.35).toFixed(2));
      }
      return updated;
    });
  };

  const handleDeleteParsedItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
    setImportedIndices((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const handleAddBlankRow = () => {
    setParsedItems((prev) => [
      ...prev,
      {
        name: "New Spare Part",
        brand: "OEM Direct",
        compatibility: "Universal Fit",
        quantity: 10,
        costPrice: 20.0,
        suggestedSellingPrice: 30.0,
        category: "General Parts",
      },
    ]);
  };

  // Import single part into Inventory
  const handleImportSingle = async (item: AiParsedInvoiceItem, index: number) => {
    try {
      await addItem({
        name: item.name,
        brand: item.brand,
        compatibility: item.compatibility,
        costPrice: item.costPrice,
        sellingPrice: item.suggestedSellingPrice,
        stock: item.quantity,
        minStock: 5,
        branchId: selectedBranchId || (activeBranchId !== "all" ? activeBranchId : undefined),
      });

      setImportedIndices((prev) => [...prev, index]);
      toast.success(`Added "${item.name}" (${item.quantity} units) to Inventory!`);
      if (onItemImported) onItemImported();
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    }
  };

  // Import all parts into Inventory
  const handleImportAll = async () => {
    setIsImportingAll(true);
    let count = 0;
    const targetBranch = selectedBranchId || (activeBranchId !== "all" ? activeBranchId : undefined);
    for (let i = 0; i < parsedItems.length; i++) {
      if (importedIndices.includes(i)) continue;
      try {
        const item = parsedItems[i];
        await addItem({
          name: item.name,
          brand: item.brand,
          compatibility: item.compatibility,
          costPrice: item.costPrice,
          sellingPrice: item.suggestedSellingPrice,
          stock: item.quantity,
          minStock: 5,
          branchId: targetBranch,
        });
        count++;
        setImportedIndices((prev) => [...prev, i]);
      } catch (e) {
        console.warn("Import error:", e);
      }
    }
    setIsImportingAll(false);
    toast.success(`🎉 Successfully imported ${count} parts into inventory!`);
    if (onItemImported) onItemImported();
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="default"
            size="sm"
            className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Camera className="h-3.5 w-3.5" />
            AI Invoice Scanner
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[780px] max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </div>
              AI Supplier Invoice & Camera Scanner
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan physical paper receipts with your camera, upload invoice documents/images, or paste supplier lists to extract parts automatically into stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {/* Supplier & Destination Branch Configuration */}
          <div className="grid gap-3 sm:grid-cols-2 bg-muted/40 p-3 rounded-lg border border-border/60">
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Supplier / Vendor Name
              </Label>
              <Input
                placeholder="e.g. Dubai Global Parts Wholesale"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                Destination Branch
              </Label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Branches / Main Warehouse</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Method Tabs */}
          <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "camera" | "upload" | "text")} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="camera" className="gap-1.5 text-xs">
                <Camera className="h-3.5 w-3.5" />
                Live Camera Scan
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5 text-xs">
                <Upload className="h-3.5 w-3.5" />
                Upload File / Image
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                Paste Invoice Text
              </TabsTrigger>
            </TabsList>

            {/* 📷 Live Camera Scanner Tab */}
            <TabsContent value="camera" className="mt-3 space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-border bg-black aspect-video flex items-center justify-center shadow-inner">
                {capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Captured Receipt"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRetake}
                        className="h-8 gap-1.5 text-xs bg-black/70 hover:bg-black text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {cameraError ? (
                      <div className="p-4 text-center text-xs text-destructive max-w-sm">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold mb-1">Camera Not Available</p>
                        <p className="text-muted-foreground mb-3">{cameraError}</p>
                        <Button size="sm" variant="outline" onClick={startCamera} className="text-xs">
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Scanner Viewfinder Reticle */}
                        <div className="absolute inset-8 border-2 border-dashed border-primary/70 rounded-lg pointer-events-none flex items-center justify-center">
                          <div className="w-full h-0.5 bg-primary/80 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                        </div>
                        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-auto">
                          <Button
                            type="button"
                            onClick={handleCapturePhoto}
                            className="h-10 px-5 gap-2 text-xs font-semibold rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
                          >
                            <Scan className="h-4 w-4" /> Capture & Scan Receipt
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </TabsContent>

            {/* 📁 Upload File / Image Tab */}
            <TabsContent value="upload" className="mt-3 space-y-3">
              {imagePreview ? (
                <div className="relative rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Uploaded Invoice"
                      className="h-16 w-16 rounded-md object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {uploadedFile?.name || "Uploaded Invoice Image"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Ready for AI Extraction
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearFile}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 p-6 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-primary mb-2 opacity-80" />
                  <span className="text-xs font-semibold text-foreground">
                    Click or Drag & Drop Invoice / Bill
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Supports PNG, JPG, JPEG, WEBP, PDF, TXT, CSV
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </TabsContent>

            {/* ✍️ Paste Text Tab */}
            <TabsContent value="text" className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Raw Invoice / Receipt Lines</Label>
                <button
                  type="button"
                  onClick={() =>
                    setInvoiceText(
                      `Brembo Ceramic Front Brake Pads Toyota Camry 2018-2023 - 15 pcs @ $28.00\nDenso Engine Oil Filter Toyota / Lexus Universal - 30 units @ $6.50\nBosch Platinum Spark Plugs Pack of 4 Nissan Altima - 20 sets @ $16.50\nGates Alternator Serpentine Belt BMW 320i - 8 pcs @ $34.00`
                    )
                  }
                  className="text-[11px] text-primary hover:underline"
                >
                  Load Demo Items
                </button>
              </div>
              <Textarea
                rows={4}
                placeholder="Paste supplier bill, WhatsApp message, or line items here..."
                value={invoiceText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvoiceText(e.target.value)}
                className="text-xs font-mono"
              />
            </TabsContent>
          </Tabs>

          {/* Trigger Scan Button */}
          <Button
            type="button"
            onClick={handleParse}
            disabled={parseMutation.isPending}
            className="w-full gap-2 text-xs font-semibold bg-primary text-primary-foreground h-9 shadow-sm"
          >
            {parseMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is Reading & Extracting Auto Parts...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract Parts with AI Engine
              </>
            )}
          </Button>

          {/* Extracted Parts Table (Editable) */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Extracted Parts ({parsedItems.length})
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    Editable before import
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddBlankRow}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Row
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleImportAll}
                    disabled={isImportingAll || importedIndices.length === parsedItems.length}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                  >
                    {isImportingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Import All ({parsedItems.length})
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => {
                  const isImported = importedIndices.includes(idx);
                  const margin =
                    item.costPrice > 0
                      ? (((item.suggestedSellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(0)
                      : "0";

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 text-xs transition-colors ${
                        isImported
                          ? "bg-muted/40 border-muted opacity-75"
                          : "bg-card border-border/80 hover:border-primary/40 shadow-sm"
                      }`}
                    >
                      <div className="grid gap-2 sm:grid-cols-12 items-center">
                        {/* Part Name & Brand */}
                        <div className="sm:col-span-5 space-y-1">
                          <Input
                            value={item.name}
                            disabled={isImported}
                            onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                            placeholder="Part Name"
                            className="h-7 text-xs font-semibold"
                          />
                          <div className="flex gap-1.5">
                            <Input
                              value={item.brand}
                              disabled={isImported}
                              onChange={(e) => handleItemFieldChange(idx, "brand", e.target.value)}
                              placeholder="Brand"
                              className="h-6 text-[11px] w-28"
                            />
                            <Input
                              value={item.compatibility}
                              disabled={isImported}
                              onChange={(e) => handleItemFieldChange(idx, "compatibility", e.target.value)}
                              placeholder="Vehicle Compatibility"
                              className="h-6 text-[11px] flex-1"
                            />
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Qty (Stock)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            disabled={isImported}
                            onChange={(e) => handleItemFieldChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                            className="h-7 text-xs font-mono"
                          />
                        </div>

                        {/* Cost & Selling Price */}
                        <div className="sm:col-span-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground">Cost ($) ➔ Sell ($)</Label>
                            <span className="text-[10px] font-semibold text-success">+{margin}%</span>
                          </div>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              step="0.5"
                              value={item.costPrice}
                              disabled={isImported}
                              onChange={(e) => handleItemFieldChange(idx, "costPrice", parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs font-mono"
                              placeholder="Cost"
                            />
                            <Input
                              type="number"
                              step="0.5"
                              value={item.suggestedSellingPrice}
                              disabled={isImported}
                              onChange={(e) => handleItemFieldChange(idx, "suggestedSellingPrice", parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs font-mono text-primary font-semibold"
                              placeholder="Price"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-3 sm:pt-0">
                          <Button
                            size="sm"
                            variant={isImported ? "ghost" : "default"}
                            disabled={isImported}
                            onClick={() => handleImportSingle(item, idx)}
                            className="h-7 text-xs px-2.5 bg-primary text-primary-foreground"
                          >
                            {isImported ? (
                              <span className="flex items-center gap-1 text-success font-medium">
                                <Check className="h-3.5 w-3.5" /> Added
                              </span>
                            ) : (
                              "Add Part"
                            )}
                          </Button>
                          {!isImported && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteParsedItem(idx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex sm:justify-between items-center">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            {parsedItems.length > 0 ? `${parsedItems.length} parts ready for stock entry` : "Select an input method to begin"}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiInvoiceParserDialog;
