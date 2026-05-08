"use client";

import type { CartItem, DeliveryInfo } from "@/lib/order-store";
import { ShoppingBag, Truck, CreditCard, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OrderReviewProps {
  cart: CartItem[];
  subtotal: number;
  deliveryInfo: DeliveryInfo | null;
  total: number;
  hasChickenItems: boolean;
}

export function OrderReview({ 
  cart, 
  subtotal, 
  deliveryInfo, 
  total,
  hasChickenItems 
}: OrderReviewProps) {
  return (
    <Card className="p-4 mb-4">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        Review Your Order
      </h3>

      {/* Chicken Reminder */}
      {hasChickenItems && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Chicken Cooking Time</p>
            <p className="text-amber-700 text-xs">
              Your order contains chicken items. Please note that chicken takes 12-15 minutes to cook. 
              Thank you for your patience!
            </p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order Details
        </h4>
        <div className="divide-y divide-border rounded-lg border overflow-hidden">
          {(cart || []).map((item, index) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-background">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                    x{item.quantity}
                  </span>
                  <span className="font-medium text-sm text-foreground">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity} x ₱{item.price.toFixed(2)}
                </p>
              </div>
              <span className="font-semibold text-foreground">
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-2 pt-4 border-t">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order Summary
        </h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({(cart || []).reduce((sum, item) => sum + item.quantity, 0)} items)</span>
            <span className="font-medium">₱{subtotal.toFixed(2)}</span>
          </div>

          {deliveryInfo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Delivery Fee 
                {deliveryInfo.method === "balong-rider" && (
                  <span className="text-xs">(Balong&apos;s Rider)</span>
                )}
                {deliveryInfo.method === "pickup" && (
                  <span className="text-xs">(Self Pickup)</span>
                )}
                {(deliveryInfo.method === "lalamove" || deliveryInfo.method === "move-it") && (
                  <span className="text-xs">(Via {deliveryInfo.method === "lalamove" ? "Lalamove" : "Move It"})</span>
                )}
              </span>
              <span className="font-medium">
                {deliveryInfo.fee > 0 ? `₱${deliveryInfo.fee.toFixed(2)}` : "FREE"}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-dashed">
            <span className="font-bold text-foreground flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Total Amount
            </span>
            <span className="text-xl font-bold text-primary">₱{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Reminder */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Payment Note:</span> Please send exactly{" "}
          <span className="font-bold">₱{total.toFixed(2)}</span> to our GCash number. 
          The OCR system will verify your payment amount matches this total.
        </p>
      </div>
    </Card>
  );
}
