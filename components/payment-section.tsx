"use client";

import { useState, useRef } from "react";
import { STORE_INFO, GCASH_APP } from "@/lib/menu-data";
import type { PaymentVerification } from "@/lib/order-store";
import { 
  extractReceiptData, 
  parseGCashReceipt, 
  verifyReceipt,
  validateReceiptImage 
} from "@/lib/ocr-utils";
import { formatManilaTime, getManilaTime } from "@/lib/gps-utils";
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Shield,
  CreditCard,
  Image as ImageIcon,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface PaymentSectionProps {
  total: number;
  paymentVerification: PaymentVerification;
  setPaymentVerification: React.Dispatch<React.SetStateAction<PaymentVerification>>;
  onVerified: () => void;
  onRejected: (reason: string) => void;
}

export function PaymentSection({
  total,
  paymentVerification,
  setPaymentVerification,
  onVerified,
  onRejected
}: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openGCash = () => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = GCASH_APP.appLink;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
      window.location.href = GCASH_APP.playStoreLink;
    }, 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateReceiptImage(file);
    if (!validation.valid) {
      setPaymentVerification(prev => ({
        ...prev,
        status: "rejected",
        ocrResult: {
          name: "",
          amount: 0,
          referenceNumber: "",
          dateTime: "",
          isValid: false,
          rejectionReason: validation.error
        }
      }));
      return;
    }

    // Show image preview
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setIsProcessing(true);
    setProcessingStep("Reading receipt...");

    try {
      // Step 1: Extract text from image using OCR
      setProcessingStep("Scanning receipt with OCR...");
      const { text, confidence } = await extractReceiptData(file);
      
      console.log("[v0] OCR Raw Text:", text);
      console.log("[v0] OCR Confidence:", confidence);

      if (confidence < 30) {
        throw new Error("Unable to read receipt clearly. Please upload a clearer image.");
      }

      // Step 2: Parse receipt data
      setProcessingStep("Extracting payment details...");
      const receiptData = parseGCashReceipt(text);

      console.log("[v0] Parsed Receipt Data:", receiptData);
      console.log("[v0] Extracted Name:", receiptData?.name);

      if (!receiptData) {
        throw new Error("Could not extract payment information from receipt. Please ensure this is a valid GCash receipt.");
      }

      

      // Step 3: Verify receipt
      setProcessingStep("Verifying payment authenticity...");
      const verificationResult = await verifyReceipt(receiptData, total);

      

      // Update payment verification state
      setPaymentVerification({
        receiptImage: imageUrl,
        ocrResult: {
          name: receiptData.name,
          amount: receiptData.amount,
          referenceNumber: receiptData.referenceNumber,
          dateTime: receiptData.dateTime,
          isValid: verificationResult.isValid,
          rejectionReason: verificationResult.rejectionReason
        },
        status: verificationResult.isValid ? "verified" : "rejected"
      });

      if (verificationResult.isValid) {
        setProcessingStep("Payment verified successfully!");
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setProcessingStep("Verification failed");
        setTimeout(() => {
          onRejected(verificationResult.rejectionReason || "Unknown error");
        }, 2000);
      }

    } catch (error) {
      console.error("[v0] Payment verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during verification";
      
      setPaymentVerification(prev => ({
        ...prev,
        status: "rejected",
        ocrResult: {
          name: "",
          amount: 0,
          referenceNumber: "",
          dateTime: "",
          isValid: false,
          rejectionReason: errorMessage
        }
      }));

      setTimeout(() => {
        onRejected(errorMessage);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const manilaTime = getManilaTime();

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Payment Verification
      </h2>

      {/* Payment Instructions */}
      <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">GCash Payment Instructions</h3>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Open GCash app and select &quot;Send Money&quot;</li>
          <li>Enter this number: <strong>{STORE_INFO.gcashNumber}</strong></li>
          <li>Enter amount: <strong>₱{total.toFixed(2)}</strong></li>
          <li>Complete the payment</li>
          <li>Take a screenshot of your receipt</li>
          <li>Upload the screenshot below</li>
        </ol>
        <Button
          onClick={openGCash}
          className="mt-3 bg-blue-600 hover:bg-blue-700 w-full"
        >
          Open GCash App
        </Button>
      </Card>

      {/* Current Time Display */}
      <Card className="p-3 mb-4 bg-secondary/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Manila Time:</span>
          <span className="font-mono font-medium">{formatManilaTime(manilaTime)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Receipts must be within 24 hours to be valid
        </p>
      </Card>

      {/* Upload Section */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Upload GCash Receipt
        </h3>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!uploadedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 hover:bg-secondary/30 transition-all"
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, or WebP (max 10MB)
            </p>
          </button>
        ) : (
          <div className="relative">
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-secondary">
              <Image
                src={uploadedImage}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
            {!isProcessing && paymentVerification.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute top-2 right-2"
              >
                Change
              </Button>
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-secondary/50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">{processingStep}</span>
          </div>
        )}
      </Card>

      {/* OCR Results - Protected Fields */}
      {paymentVerification.ocrResult && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Extracted Payment Details
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Protected</span>
          </h3>

          <div className="space-y-3">
            <div className="protected-field p-3 rounded-lg">
              <label className="text-xs text-muted-foreground block mb-1">Sender Name</label>
              <p className="font-medium text-foreground pr-8">
                {paymentVerification.ocrResult.name || "—"}
              </p>
            </div>

            <div className="protected-field p-3 rounded-lg">
              <label className="text-xs text-muted-foreground block mb-1">Amount</label>
              <p className="font-medium text-foreground pr-8">
                {paymentVerification.ocrResult.amount > 0 
                  ? `₱${paymentVerification.ocrResult.amount.toFixed(2)}`
                  : "—"
                }
              </p>
              {paymentVerification.ocrResult.amount > 0 && (
                <p className="text-xs mt-1">
                  {Math.abs(paymentVerification.ocrResult.amount - total) <= 1 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Matches order total
                    </span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Does not match order total (₱{total.toFixed(2)})
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="protected-field p-3 rounded-lg">
              <label className="text-xs text-muted-foreground block mb-1">Reference Number</label>
              <p className="font-mono font-medium text-foreground pr-8">
                {paymentVerification.ocrResult.referenceNumber || "—"}
              </p>
            </div>

            <div className="protected-field p-3 rounded-lg">
              <label className="text-xs text-muted-foreground block mb-1">Date & Time</label>
              <p className="font-medium text-foreground pr-8">
                {paymentVerification.ocrResult.dateTime || "—"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Verification Status */}
      {paymentVerification.status === "verified" && (
        <Card className="p-6 mb-4 bg-green-50 border-green-200 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
          <h3 className="text-lg font-bold text-green-800">Successful Verification!</h3>
          <p className="text-green-700 mt-1">
            Your order is now ready for cooking! Thank you for ordering!
          </p>
        </Card>
      )}

      {paymentVerification.status === "rejected" && paymentVerification.ocrResult?.rejectionReason && (
        <Card className="p-6 mb-4 bg-red-50 border-red-200 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
          <h3 className="text-lg font-bold text-red-800">Payment Verification Failed</h3>
          <p className="text-red-700 mt-2 text-sm">
            Sorry! Your payment verification failed due to:
          </p>
          <p className="text-red-800 font-medium mt-1 text-sm bg-red-100 p-2 rounded">
            {paymentVerification.ocrResult.rejectionReason}
          </p>
          <p className="text-red-600 mt-3 text-xs">Thank You!</p>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="p-3 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Anti-Fraud Protection Active</p>
            <ul className="mt-1 space-y-0.5">
              <li>• Receipts are validated for authenticity</li>
              <li>• Duplicate reference numbers are blocked</li>
              <li>• Only receipts within 24 hours are accepted</li>
              <li>• Edited or manipulated receipts will be rejected</li>
            </ul>
          </div>
        </div>
      </Card>
    </section>
  );
}
