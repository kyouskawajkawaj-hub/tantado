import { STORE_INFO } from "./menu-data";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TransformPosition {
  x: number;
  y: number;
}

// CSS Transform-based coordinate system
// Uses a local coordinate system centered on the store
const SCALE_FACTOR = 111.32; // km per degree at equator (approximate)

export function coordinatesToTransform(coords: Coordinates): TransformPosition {
  const deltaLat = coords.lat - STORE_INFO.coordinates.lat;
  const deltaLng = coords.lng - STORE_INFO.coordinates.lng;
  
  // Convert to km using CSS transform coordinates
  // X axis = longitude (East-West)
  // Y axis = latitude (North-South), inverted for screen coordinates
  const x = deltaLng * SCALE_FACTOR * Math.cos(STORE_INFO.coordinates.lat * Math.PI / 180);
  const y = -deltaLat * SCALE_FACTOR; // Negative because screen Y increases downward
  
  return { x, y };
}

export function transformToCoordinates(transform: TransformPosition): Coordinates {
  const deltaLng = transform.x / (SCALE_FACTOR * Math.cos(STORE_INFO.coordinates.lat * Math.PI / 180));
  const deltaLat = -transform.y / SCALE_FACTOR;
  
  return {
    lat: STORE_INFO.coordinates.lat + deltaLat,
    lng: STORE_INFO.coordinates.lng + deltaLng
  };
}

// Calculate distance using CSS Transform positions (Euclidean distance in km)
export function calculateDistanceTransform(pos1: TransformPosition, pos2: TransformPosition): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate distance from store using coordinates
export function calculateDistanceFromStore(customerCoords: Coordinates): number {
  const storeTransform = { x: 0, y: 0 }; // Store is at origin
  const customerTransform = coordinatesToTransform(customerCoords);
  return calculateDistanceTransform(storeTransform, customerTransform);
}

// Calculate delivery fare
export function calculateDeliveryFare(distanceKm: number): number {
  const baseFare = STORE_INFO.baseFare;
  const additionalKm = Math.max(0, distanceKm - 1); // First km included in base fare
  const additionalFare = Math.ceil(additionalKm) * STORE_INFO.perKmRate;
  return baseFare + additionalFare;
}

// Check if rider is within auto-call distance
export function isWithinAutoCallDistance(
  riderCoords: Coordinates,
  customerCoords: Coordinates
): boolean {
  const riderTransform = coordinatesToTransform(riderCoords);
  const customerTransform = coordinatesToTransform(customerCoords);
  const distance = calculateDistanceTransform(riderTransform, customerTransform);
  return distance <= STORE_INFO.autoCallDistance;
}

// Get current position using Geolocation API
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Watch position for real-time tracking
export function watchPosition(
  callback: (coords: Coordinates) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    console.error("[v0] Geolocation not supported");
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }
  );
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(2)}km`;
}

// Check if store is open
export function isStoreOpen(): boolean {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = manilaTime.getHours();
  const minutes = manilaTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Open: 14:00 (2 PM) = 840 minutes
  // Close: 01:00 (1 AM) = 60 minutes (next day)
  const openTime = 14 * 60; // 840
  const closeTime = 1 * 60; // 60
  
  // Store is open from 2 PM to 1 AM
  if (currentTime >= openTime || currentTime < closeTime) {
    return true;
  }
  return false;
}

// Get Manila time
export function getManilaTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

// Format Manila time
export function formatManilaTime(date: Date): string {
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}
