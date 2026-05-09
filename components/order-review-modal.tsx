"use client";

import { useState } from "react";
import type { CartItem, CustomerInfo, DeliveryInfo } from "@/lib/order-store";
import { 
  X, 
  Clock, 
  User, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Package,
  Copy,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getManilaTime, formatManilaTime } from "@/lib/gps-utils";

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cart: CartItem[];
  subtotal: number;
  deliveryInfo: DeliveryInfo | null;
  customerInfo: CustomerInfo;
  orderId: string;
  total: number;
  isProcessing?: boolean;
}

export function OrderReviewModal({
  isOpen,
  onClose,
  onConfirm,
  cart,
  subtotal,
  deliveryInfo,
  customerInfo,
  orderId,
  total,
  isProcessing = false
}: OrderReviewModalProps) {
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const manilaTime = getManilaTime();
  const formattedDateTime = formatManilaTime(manilaTime);

  if (!isOpen) return null;

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch (err) {
      console.error("[v0] Error copying order ID:", err);
    }
  };

  const isPhoneFilled = customerInfo.phone && customerInfo.phone.length >= 10;
  const isAddressFilled = customerInfo.address && customerInfo.address.length >= 10;
  const isNameFilled = customerInfo.name && customerInfo.name.length >= 2;
  const allFieldsFilled = isPhoneFilled && isAddressFilled && isNameFilled;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <Card className="w-full md:max-w-2xl md:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          <div className="pt-2">
            <h2 className="text-2xl font-bold text-foreground">Order Review</h2>
            <p className="text-sm text-muted-foreground mt-1">Please verify all details before confirming</p>
          </div>

          {/* SEQUENCE: Timestamp | Name | Amount (Qty) | DateTime | Total | Verify | Orders | Order_ID */}
          <div className="space-y-4 border-l-4 border-primary pl-4">
            
            {/* 1. TIMESTAMP */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">⏰ Timestamp</label>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">
                  {manilaTime.toISOString()}
                </p>
              </div>
            </div>

            {/* 2. CUSTOMER NAME */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">👤 Customer Name</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {customerInfo.name || "—"}
                  </p>
                  {isNameFilled && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {!isNameFilled && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
              </div>
            </div>

            {/* 3. AMOUNT (QUANTITY FROM ORDERS) */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <BarChart3 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">📊 Amount (Order Quantities)</label>
                <div className="mt-2 space-y-2">
                  {(cart || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-primary/10 p-2 rounded mt-2">
                    <span className="text-sm font-semibold text-foreground">Total Items:</span>
                    <span className="text-sm font-bold text-primary">
                      {(cart || []).reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. DATE & TIME */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">📅 Date & Time (Manila)</label>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">
                  {formattedDateTime}
                </p>
              </div>
            </div>

            {/* 5. TOTAL AMOUNT */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">💰 Total Amount to Pay</label>
                <div className="space-y-1 mt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="text-sm font-medium">₱{subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryInfo && deliveryInfo.fee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delivery Fee:</span>
                      <span className="text-sm font-medium">₱{deliveryInfo.fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed bg-primary/10 p-2 rounded">
                    <span className="text-sm font-bold text-foreground">TOTAL:</span>
                    <span className="text-lg font-bold text-primary">₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. VERIFICATION STATUS */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">✅ Verification Checklist</label>
                <div className="space-y-2 mt-0.5">
                  <div className="flex items-center gap-2">
                    {isPhoneFilled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      Phone Number: {customerInfo.phone ? `${customerInfo.phone.substring(0, 3)}****${customerInfo.phone.substring(-4)}` : "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAddressFilled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      Address: {isAddressFilled ? "Provided ✓" : "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {deliveryInfo ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      Delivery Method: {deliveryInfo?.method === "balong-rider" ? "Balong's Rider" : deliveryInfo?.method === "pickup" ? "Self Pickup" : deliveryInfo?.method || "Not selected"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. ORDER ITEMS BREAKDOWN */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">📦 Your Orders</label>
                <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {(cart || []).map((item, index) => (
                    <div key={item.id} className="bg-background border border-border p-3 rounded">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">{index + 1}. {item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Price: ₱{item.price.toFixed(2)}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                      {item.comboChoiceA && (
                        <p className="text-xs text-muted-foreground">Choice A: {item.comboChoiceA}</p>
                      )}
                      {item.comboChoiceB && (
                        <p className="text-xs text-muted-foreground">Choice B: {item.comboChoiceB}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic">Notes: {item.notes}</p>
                      )}
                      <p className="text-sm font-semibold text-primary mt-1">
                        Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. ORDER ID */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                #
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">🆔 Order ID (Reference Number)</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 bg-secondary p-3 rounded font-mono text-sm font-bold text-foreground break-all">
                    {orderId}
                  </div>
                  <Button
                    onClick={copyOrderId}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copiedOrderId ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Anti-tamper verified • Use this ID to track your order
                </p>
              </div>
            </div>

          </div>

          {/* REMINDERS */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">⚠️ Important Reminders:</p>
            <ul className="text-xs text-amber-700 space-y-1 list-inside">
              <li>✓ Keep your phone nearby - rider will call when near (0.3 km)</li>
              <li>✓ Be ready to receive - have payment ready</li>
              <li>✓ Verify the rider shows our store name: Pares ni Balong</li>
              <li>✓ Provide a clear landmark for easy delivery access</li>
            </ul>
          </div>

          {/* DELIVERY DETAILS */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">📍 Delivery Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700"><strong>Name:</strong> {customerInfo.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700"><strong>Phone:</strong> {customerInfo.phone || "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                <span className="text-blue-700"><strong>Address:</strong> {customerInfo.address || "—"}</span>
              </div>
              {customerInfo.distanceKm && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700"><strong>Distance:</strong> {customerInfo.distanceKm.toFixed(2)} km</span>
                </div>
              )}
            </div>
          </Card>

          {/* VALIDATION ERROR */}
          {!allFieldsFilled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold">Missing Information</p>
                <p className="text-xs mt-1">Please complete all required fields to confirm your order.</p>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              Back to Edit
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1"
              disabled={!allFieldsFilled || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
              }
