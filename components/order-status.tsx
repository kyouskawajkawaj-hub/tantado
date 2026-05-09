"use client";

import type { Order } from "@/lib/order-store";
import { STORE_INFO } from "@/lib/menu-data";
import { 
  CheckCircle, 
  Clock, 
  ChefHat, 
  Bike, 
  Package,
  Phone,
  MapPin,
  XCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderStatusProps {
  order: Order;
}

const STATUS_STEPS = [
  { key: "verified", label: "Payment Verified", icon: CheckCircle },
  { key: "cooking", label: "Cooking", icon: ChefHat },
  { key: "delivery", label: "On Delivery", icon: Bike },
  { key: "completed", label: "Delivered", icon: Package }
];

export function OrderStatus({ order }: OrderStatusProps) {
  const currentStepIndex = STATUS_STEPS.findIndex(step => step.key === order.status);
  
  if (order.status === "rejected") {
    return (
      <section className="px-4 py-6">
        <Card className="p-6 bg-red-50 border-red-200 text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Order Rejected</h2>
          <p className="text-red-700 mb-4">
            {order.payment.ocrResult?.rejectionReason || "Payment verification failed"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Start New Order
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Order Status
      </h2>

      {/* Order ID */}
      <Card className="p-4 mb-4 bg-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-mono font-bold text-primary">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-lg">₱{order.total.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Progress Steps */}
      <Card className="p-4 mb-4">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div 
            className="absolute left-4 top-0 w-0.5 bg-primary transition-all duration-500"
            style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="space-y-6">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-4 relative">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center z-10
                    ${isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                    }
                    ${isCurrent ? "ring-4 ring-primary/30 animate-pulse" : ""}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary">In progress...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Order Details */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-3">Order Details</h3>
        
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>₱{order.delivery.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>Total</span>
              <span className="text-primary">₱{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Delivery Info */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-3">Delivery Information</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>{order.customer.phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span>{order.customer.address}</span>
          </div>
          {order.customer.distanceKm && (
            <div className="flex items-start gap-2">
              <Bike className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>{order.customer.distanceKm.toFixed(2)} km from store</span>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Store */}
      <Card className="p-4 bg-secondary/50">
        <p className="text-sm text-muted-foreground mb-2">Need help with your order?</p>
        <Button
          onClick={() => window.location.href = `tel:${STORE_INFO.phone}`}
          variant="outline"
          className="w-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          Call Store: {STORE_INFO.phone}
        </Button>
      </Card>
    </section>
  );
}
