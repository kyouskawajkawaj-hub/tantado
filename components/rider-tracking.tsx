"use client";

import { useState, useEffect, useCallback } from "react";
import { STORE_INFO } from "@/lib/menu-data";
import type { CustomerInfo } from "@/lib/order-store";
import {
  coordinatesToTransform,
  calculateDistanceTransform,
  formatDistance,
  type Coordinates,
  type TransformPosition
} from "@/lib/gps-utils";
import { 
  Navigation, 
  Phone, 
  MapPin, 
  Bike,
  Store,
  CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RiderTrackingProps {
  customerInfo: CustomerInfo;
  orderStatus: string;
}

export function RiderTracking({ customerInfo, orderStatus }: RiderTrackingProps) {
  const [riderPosition, setRiderPosition] = useState<TransformPosition>({ x: 0, y: 0 });
  const [riderDistance, setRiderDistance] = useState<number>(0);
  const [shouldAutoCall, setShouldAutoCall] = useState(false);
  const [hasCalledCustomer, setHasCalledCustomer] = useState(false);

  // Simulate rider movement (in real app, this would come from rider's GPS)
  const simulateRiderMovement = useCallback(() => {
    if (!customerInfo.coordinates || orderStatus !== "delivery") return;

    const customerTransform = coordinatesToTransform(customerInfo.coordinates);
    
    // Simulate rider moving from store (0,0) towards customer
    setRiderPosition(prev => {
      const targetX = customerTransform.x;
      const targetY = customerTransform.y;
      
      // Move 10% closer each update
      const newX = prev.x + (targetX - prev.x) * 0.1;
      const newY = prev.y + (targetY - prev.y) * 0.1;
      
      return { x: newX, y: newY };
    });
  }, [customerInfo.coordinates, orderStatus]);

  // Calculate distance and check for auto-call
  useEffect(() => {
    if (!customerInfo.coordinates) return;

    const customerTransform = coordinatesToTransform(customerInfo.coordinates);
    const distance = calculateDistanceTransform(riderPosition, customerTransform);
    setRiderDistance(distance);

    // Auto-call trigger at 0.3km
    if (distance <= STORE_INFO.autoCallDistance && !hasCalledCustomer) {
      setShouldAutoCall(true);
    }
  }, [riderPosition, customerInfo.coordinates, hasCalledCustomer]);

  // Simulate movement every 3 seconds during delivery
  useEffect(() => {
    if (orderStatus !== "delivery") return;

    const interval = setInterval(simulateRiderMovement, 3000);
    return () => clearInterval(interval);
  }, [orderStatus, simulateRiderMovement]);

  // Handle auto-call
  const handleAutoCall = () => {
    if (customerInfo.phone) {
      window.location.href = `tel:${customerInfo.phone}`;
      setHasCalledCustomer(true);
      setShouldAutoCall(false);
    }
  };

  // Auto-trigger call when within range
  useEffect(() => {
    if (shouldAutoCall && !hasCalledCustomer) {
      handleAutoCall();
    }
  }, [shouldAutoCall, hasCalledCustomer]);

  if (orderStatus !== "delivery") return null;

  // Calculate map dimensions for CSS transform visualization
  const mapWidth = 300;
  const mapHeight = 200;
  const scale = 20; // pixels per km

  const storeMapPos = { x: mapWidth / 2, y: mapHeight / 2 };
  const riderMapPos = {
    x: storeMapPos.x + riderPosition.x * scale,
    y: storeMapPos.y + riderPosition.y * scale
  };
  
  const customerTransform = customerInfo.coordinates 
    ? coordinatesToTransform(customerInfo.coordinates)
    : { x: 0, y: 0 };
  const customerMapPos = {
    x: storeMapPos.x + customerTransform.x * scale,
    y: storeMapPos.y + customerTransform.y * scale
  };

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Navigation className="w-5 h-5" />
        Rider Tracking
      </h2>

      {/* Auto-Call Alert */}
      {shouldAutoCall && !hasCalledCustomer && (
        <Card className="p-4 mb-4 bg-green-50 border-green-200 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-800">Rider is nearby!</h3>
              <p className="text-sm text-green-700">
                Your rider is within {formatDistance(STORE_INFO.autoCallDistance)}
              </p>
            </div>
            <Button onClick={handleAutoCall} className="bg-green-600 hover:bg-green-700">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </div>
        </Card>
      )}

      {/* Map Visualization using CSS Transform */}
      <Card className="p-4 mb-4">
        <div 
          className="relative bg-secondary/30 rounded-lg overflow-hidden"
          style={{ width: mapWidth, height: mapHeight, margin: "0 auto" }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            {[...Array(7)].map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * (mapHeight / 6)}
                x2={mapWidth}
                y2={i * (mapHeight / 6)}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray="4"
              />
            ))}
            {[...Array(7)].map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * (mapWidth / 6)}
                y1={0}
                x2={i * (mapWidth / 6)}
                y2={mapHeight}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray="4"
              />
            ))}
          </svg>

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <line
              x1={storeMapPos.x}
              y1={storeMapPos.y}
              x2={customerMapPos.x}
              y2={customerMapPos.y}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="8"
              opacity={0.5}
            />
            <line
              x1={storeMapPos.x}
              y1={storeMapPos.y}
              x2={riderMapPos.x}
              y2={riderMapPos.y}
              stroke="var(--primary)"
              strokeWidth={3}
            />
          </svg>

          {/* Store marker */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              transform: `translate(${storeMapPos.x - 12}px, ${storeMapPos.y - 12}px)`
            }}
          >
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Store className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-[8px] font-bold mt-0.5 bg-background px-1 rounded">Store</span>
          </div>

          {/* Rider marker */}
          <div
            className="absolute flex flex-col items-center transition-transform duration-1000 ease-out"
            style={{
              transform: `translate(${riderMapPos.x - 12}px, ${riderMapPos.y - 12}px)`
            }}
          >
            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Bike className="w-3 h-3 text-accent-foreground" />
            </div>
            <span className="text-[8px] font-bold mt-0.5 bg-background px-1 rounded">Rider</span>
          </div>

          {/* Customer marker */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              transform: `translate(${customerMapPos.x - 12}px, ${customerMapPos.y - 12}px)`
            }}
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="text-[8px] font-bold mt-0.5 bg-background px-1 rounded">You</span>
          </div>
        </div>

        {/* Distance Info */}
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Rider distance from you:</p>
            <p className="text-xl font-bold text-primary">{formatDistance(riderDistance)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">ETA:</p>
            <p className="text-lg font-semibold">{Math.ceil(riderDistance * 5 + 2)} mins</p>
          </div>
        </div>
      </Card>

      {/* Status Updates */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Delivery Status</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Order Confirmed</p>
              <p className="text-xs text-muted-foreground">Your order is being prepared</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Picked Up</p>
              <p className="text-xs text-muted-foreground">Rider has your order</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              riderDistance <= STORE_INFO.autoCallDistance 
                ? "bg-green-500" 
                : "bg-primary animate-pulse"
            }`}>
              {riderDistance <= STORE_INFO.autoCallDistance ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <Bike className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                {riderDistance <= STORE_INFO.autoCallDistance 
                  ? "Arriving Soon!" 
                  : "On the Way"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(riderDistance)} away
              </p>
            </div>
          </div>
        </div>

        {/* Call Rider Button */}
        <Button
          onClick={() => window.location.href = `tel:${STORE_INFO.phone}`}
          variant="outline"
          className="w-full mt-4"
        >
          <Phone className="w-4 h-4 mr-2" />
          Call Store: {STORE_INFO.phone}
        </Button>
      </Card>
    </section>
  );
}
if(distance <= 0.3 && customerPhone){
   window.location.href = `tel:${customerPhone}`;
}
O

