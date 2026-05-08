"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { MenuSection } from "@/components/menu-section";
import { CartSection } from "@/components/cart-section";
import { DeliverySection } from "@/components/delivery-section";
import { PaymentSection } from "@/components/payment-section";
import { OrderStatus } from "@/components/order-status";
import { RiderTracking } from "@/components/rider-tracking";
import { isStoreOpen } from "@/lib/gps-utils";
import { 
  type CartItem, 
  type CustomerInfo, 
  type DeliveryInfo, 
  type PaymentVerification,
  type Order,
  generateOrderId,
  submitOrderToSheet
} from "@/lib/order-store";
import { AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type OrderStep = "menu" | "checkout" | "payment" | "status";

export default function Home() {
  const [step, setStep] = useState<OrderStep>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: ""
  });
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [paymentVerification, setPaymentVerification] = useState<PaymentVerification>({
    status: "pending"
  });
  const [order, setOrder] = useState<Order | null>(null);
  const [storeOpen, setStoreOpen] = useState(true);

  // Check store hours
  useEffect(() => {
    setStoreOpen(isStoreOpen());
    const interval = setInterval(() => {
      setStoreOpen(isStoreOpen());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (deliveryInfo?.fee || 0);

  const handleCheckout = () => {
    if (cart.length > 0) {
      setStep("checkout");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleContinueToPayment = () => {
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentVerified = async () => {
    const newOrder: Order = {
      id: generateOrderId(),
      items: cart,
      customer: customerInfo,
      delivery: deliveryInfo!,
      payment: paymentVerification,
      subtotal,
      total,
      status: "verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrder(newOrder);
    setStep("status");

    // Submit to Google Sheet via sheet.best
    try {
      await submitOrderToSheet(newOrder);
      console.log("[v0] Order submitted to Google Sheet");
    } catch (error) {
      console.error("[v0] Failed to submit order:", error);
    }

    // Simulate order progress
    setTimeout(() => {
      setOrder(prev => prev ? { ...prev, status: "cooking" } : null);
    }, 3000);

    setTimeout(() => {
      if (deliveryInfo?.method === "balong-rider") {
        setOrder(prev => prev ? { ...prev, status: "delivery" } : null);
      } else {
        setOrder(prev => prev ? { ...prev, status: "completed" } : null);
      }
    }, 8000);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentRejected = (reason: string) => {
    const rejectedOrder: Order = {
      id: generateOrderId(),
      items: cart,
      customer: customerInfo,
      delivery: deliveryInfo!,
      payment: {
        ...paymentVerification,
        status: "rejected",
        ocrResult: {
          ...paymentVerification.ocrResult!,
          rejectionReason: reason
        }
      },
      subtotal,
      total,
      status: "rejected",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrder(rejectedOrder);
    setStep("status");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step === "checkout") {
      setStep("menu");
    } else if (step === "payment") {
      setStep("checkout");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Store closed warning
  if (!storeOpen) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">We&apos;re Currently Closed</h2>
            <p className="text-muted-foreground mb-4">
              Our operating hours are 2:00 PM - 1:00 AM (Manila Time)
            </p>
            <p className="text-sm text-muted-foreground">
              Please come back during our business hours to place an order.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto pb-24">
        {/* Navigation Breadcrumb */}
        {step !== "menu" && step !== "status" && (
          <div className="px-4 py-3 bg-secondary/50 border-b sticky top-[76px] z-40">
            <div className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => setStep("menu")}
                className="text-muted-foreground hover:text-foreground"
              >
                Menu
              </button>
              <span className="text-muted-foreground">/</span>
              <button 
                onClick={() => step === "payment" && setStep("checkout")}
                className={step === "checkout" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}
              >
                Checkout
              </button>
              {step === "payment" && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold text-foreground">Payment</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        {(step === "checkout" || step === "payment") && (
          <div className="px-4 pt-4">
            <Button variant="ghost" onClick={goBack} className="text-sm">
              ← Back
            </Button>
          </div>
        )}

        {/* Step Content */}
        {step === "menu" && (
          <>
            <MenuSection cart={cart} setCart={setCart} />
            <CartSection 
              cart={cart} 
              setCart={setCart} 
              onCheckout={handleCheckout} 
            />
          </>
        )}

        {step === "checkout" && (
          <DeliverySection
            cart={cart}
            subtotal={subtotal}
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            onContinue={handleContinueToPayment}
          />
        )}

        {step === "payment" && (
          <PaymentSection
            total={total}
            paymentVerification={paymentVerification}
            setPaymentVerification={setPaymentVerification}
            onVerified={handlePaymentVerified}
            onRejected={handlePaymentRejected}
          />
        )}

        {step === "status" && order && (
          <>
            <OrderStatus order={order} />
            {order.status === "delivery" && order.delivery.method === "balong-rider" && (
              <RiderTracking 
                customerInfo={order.customer}
                orderStatus={order.status}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Cart Summary for Menu Step */}
      {step === "menu" && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
              <p className="font-bold text-lg text-primary">₱{subtotal.toFixed(2)}</p>
            </div>
            <Button onClick={handleCheckout} size="lg">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-100 border-t border-amber-300 p-2 text-center text-xs text-amber-800 z-40" style={{ bottom: cart.length > 0 && step === "menu" ? "76px" : "0" }}>
        <AlertTriangle className="w-3 h-3 inline mr-1" />
        Fraudulent orders will be automatically rejected. Please use legitimate GCash receipts only.
      </div>
    </div>
  );
}
