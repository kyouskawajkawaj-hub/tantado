"use client";

import { useState, useEffect, useCallback } from "react";
import { STORE_INFO, DELIVERY_OPTIONS, GCASH_APP } from "@/lib/menu-data";
import type { DeliveryInfo, CustomerInfo, CartItem } from "@/lib/order-store";
import { OrderReview } from "@/components/order-review";
import { 
  getCurrentPosition, 
  calculateDistanceFromStore, 
  calculateDeliveryFare,
  formatDistance,
  type Coordinates 
} from "@/lib/gps-utils";
import { 
  MapPin, 
  Bike, 
  Truck, 
  Package, 
  Navigation,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DeliverySectionProps {
  cart: CartItem[];
  subtotal: number;
  deliveryInfo: DeliveryInfo | null;
  setDeliveryInfo: React.Dispatch<React.SetStateAction<DeliveryInfo | null>>;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  onContinue: () => void;
}

// Deep link configurations for apps
const APP_DEEP_LINKS = {
  lalamove: {
    android: "intent://open#Intent;package=hk.easyvan.app.client;scheme=lalamove;end",
    ios: "lalamove://",
    fallback: "https://play.google.com/store/apps/details?id=hk.easyvan.app.client"
  },
  moveit: {
    android: "intent://open#Intent;package=com.moveit.app.customer;scheme=moveit;end",
    ios: "moveit://",
    fallback: "https://play.google.com/store/apps/details?id=com.moveit.app.customer"
  },
  gcash: {
    android: "intent://open#Intent;package=com.globe.gcash.android;scheme=gcash;end",
    ios: "gcash://",
    fallback: "https://play.google.com/store/apps/details?id=com.globe.gcash.android"
  }
};

export function DeliverySection({
  cart,
  subtotal,
  deliveryInfo,
  setDeliveryInfo,
  customerInfo,
  setCustomerInfo,
  onContinue
}: DeliverySectionProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Check if cart has chicken items (with safety check)
  const hasChickenItems = (cart || []).some(item => 
    item.name.toLowerCase().includes('chicken') ||
    item.comboChoiceA === 'chicken' ||
    item.comboChoiceB === 'chicken'
  );

  const total = subtotal + (deliveryInfo?.fee || 0);

  // Open app with deep link - tries app first, falls back to Play Store
  const openApp = (appName: 'lalamove' | 'moveit' | 'gcash') => {
    const links = APP_DEEP_LINKS[appName];
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isAndroid) {
      // Try Android intent first
      const intentLink = links.android;
      const start = Date.now();
      
      window.location.href = intentLink;
      
      // If app doesn't open within 2 seconds, go to Play Store
      setTimeout(() => {
        if (Date.now() - start < 2500) {
          window.location.href = links.fallback;
        }
      }, 2000);
    } else if (isIOS) {
      // Try iOS deep link
      window.location.href = links.ios;
      
      setTimeout(() => {
        // Fallback to App Store equivalent (using Play Store link as placeholder)
        window.location.href = links.fallback;
      }, 2000);
    } else {
      // Desktop - open Play Store link
      window.open(links.fallback, '_blank');
    }
  };

  // Track if we've already tried to detect location
  const [hasTriedLocation, setHasTriedLocation] = useState(false);

  // Detect location function
  const detectLocation = async () => {
    if (isLocating) return;
    
    setIsLocating(true);
    setLocationError(null);

    try {
      // Request permission explicitly
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            setLocationError("Location permission denied. Please enable location access in your browser settings.");
            setIsLocating(false);
            return;
          }
        } catch {
          // Permission API not supported, continue with geolocation
        }
      }

      const coords = await getCurrentPosition();
      const distance = calculateDistanceFromStore(coords);
      
      setCustomerInfo(prev => ({
        ...prev,
        coordinates: coords,
        distanceKm: distance
      }));
      
      setLocationPermissionGranted(true);

      // Auto-set delivery fee if Balong's rider is selected
      if (selectedMethod === "balong-rider") {
        const fee = calculateDeliveryFare(distance);
        setDeliveryInfo({
          method: "balong-rider",
          fee,
          estimatedTime: `${Math.ceil(distance * 5 + 15)} mins`
        });
      }
    } catch {
      setLocationError("Unable to detect location. Please enter your address manually and ensure GPS is enabled.");
    } finally {
      setIsLocating(false);
    }
  };

  // Auto-detect location only once on mount
  useEffect(() => {
    if (!hasTriedLocation) {
      setHasTriedLocation(true);
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);

    if (method === "balong-rider" && customerInfo.distanceKm) {
      const fee = calculateDeliveryFare(customerInfo.distanceKm);
      setDeliveryInfo({
        method: "balong-rider",
        fee,
        estimatedTime: `${Math.ceil(customerInfo.distanceKm * 5 + 15)} mins`
      });
    } else if (method === "pickup") {
      setDeliveryInfo({
        method: "pickup",
        fee: 0,
        estimatedTime: "15-20 mins"
      });
    } else if (method === "lalamove" || method === "move-it") {
      setDeliveryInfo({
        method: method as "lalamove" | "move-it",
        fee: 0,
        estimatedTime: "Varies"
      });
    }
  };

  const canContinue = 
    customerInfo.phone && 
    customerInfo.address && 
    deliveryInfo !== null;

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5" />
        Delivery Details
      </h2>

      {/* Order Review Summary */}
      <OrderReview 
        cart={cart}
        subtotal={subtotal}
        deliveryInfo={deliveryInfo}
        total={total}
        hasChickenItems={hasChickenItems}
      />

      {/* Location Detection */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Your Location
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MapPin className="w-3 h-3 mr-1" />
                Detect
              </>
            )}
          </Button>
        </div>

        {locationError && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {locationPermissionGranted && customerInfo.distanceKm !== undefined && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Location detected successfully</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distance from our store:</span>
              <span className="font-bold text-primary text-lg">
                {formatDistance(customerInfo.distanceKm)}
              </span>
            </div>
            {selectedMethod === "balong-rider" && deliveryInfo && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
                <span className="text-sm text-muted-foreground">Delivery fee (₱{STORE_INFO.baseFare} + ₱{STORE_INFO.perKmRate}/km):</span>
                <span className="font-bold text-primary">₱{deliveryInfo.fee.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Phone className="w-5 h-5 text-muted-foreground mt-2" />
              <Input
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">For delivery updates and rider contact</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Delivery Address <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground mt-2" />
              <Input
                type="text"
                placeholder="Complete address with landmark"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Include barangay and landmark for faster delivery</p>
          </div>
        </div>
      </Card>

      {/* Delivery Method Selection */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-3">Choose Delivery Method</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Balong's Rider */}
          <button
            onClick={() => handleMethodSelect("balong-rider")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "balong-rider"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Bike className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold text-sm">Balong&apos;s Rider</h4>
            <p className="text-xs text-muted-foreground">
              ₱{STORE_INFO.baseFare} base + ₱{STORE_INFO.perKmRate}/km
            </p>
            {selectedMethod === "balong-rider" && customerInfo.distanceKm && (
              <p className="text-xs font-bold text-primary mt-1">
                ₱{calculateDeliveryFare(customerInfo.distanceKm).toFixed(2)} total
              </p>
            )}
          </button>

          {/* Lalamove - Opens app directly */}
          <button
            onClick={() => {
              handleMethodSelect("lalamove");
              openApp('lalamove');
            }}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "lalamove"
                ? "border-orange-500 bg-orange-50"
                : "border-border hover:border-orange-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-6 h-6 text-orange-500" />
              <ExternalLink className="w-3 h-3 text-orange-500" />
            </div>
            <h4 className="font-semibold text-sm">Lalamove</h4>
            <p className="text-xs text-muted-foreground">Opens app directly</p>
          </button>

          {/* Move It - Opens app directly */}
          <button
            onClick={() => {
              handleMethodSelect("move-it");
              openApp('moveit');
            }}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "move-it"
                ? "border-blue-500 bg-blue-50"
                : "border-border hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-6 h-6 text-blue-500" />
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </div>
            <h4 className="font-semibold text-sm">Move It</h4>
            <p className="text-xs text-muted-foreground">Opens app directly</p>
          </button>

          {/* Self Pickup */}
          <button
            onClick={() => handleMethodSelect("pickup")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "pickup"
                ? "border-green-500 bg-green-50"
                : "border-border hover:border-green-300"
            }`}
          >
            <Package className="w-6 h-6 text-green-500 mb-2" />
            <h4 className="font-semibold text-sm">Self Pickup</h4>
            <p className="text-xs text-muted-foreground">No delivery fee</p>
          </button>
        </div>

        {/* Store Address for Pickup */}
        {selectedMethod === "pickup" && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">Pickup Location:</p>
            <p className="text-sm text-green-700">{STORE_INFO.address}</p>
          </div>
        )}
      </Card>

      {/* GCash Payment Button */}
      <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Pay with GCash</h3>
            <p className="text-xs text-blue-600">Send to: {STORE_INFO.gcashNumber}</p>
            <p className="text-xs font-bold text-blue-800 mt-1">Amount: ₱{total.toFixed(2)}</p>
          </div>
          <Button
            onClick={() => openApp('gcash')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open GCash
          </Button>
        </div>
      </Card>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full"
        size="lg"
      >
        {canContinue ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Continue to Payment Verification
          </>
        ) : (
          "Please complete all required fields"
        )}
      </Button>

      {!canContinue && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          {!customerInfo.phone && "Phone number required. "}
          {!customerInfo.address && "Address required. "}
          {!deliveryInfo && "Select a delivery method."}
        </p>
      )}
    </section>
  );
}
