export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  comboChoiceA?: string;
  comboChoiceB?: string;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
}

export interface DeliveryInfo {
  method: 'balong-rider' | 'lalamove' | 'move-it' | 'pickup';
  fee: number;
  estimatedTime?: string;
}

export interface PaymentVerification {
  receiptImage?: string;
  ocrResult?: {
    name: string;
    amount: number;
    referenceNumber: string;
    dateTime: string;
    isValid: boolean;
    rejectionReason?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  payment: PaymentVerification;
  subtotal: number;
  total: number;
  status: 'cart' | 'checkout' | 'payment' | 'verified' | 'cooking' | 'delivery' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Sheet.best API URL
export const SHEET_BEST_URL = "https://api.sheetbest.com/sheets/2e1c1dfc-eeee-449a-a2ec-2e65a998db95";

export async function submitOrderToSheet(order: Order): Promise<boolean> {
  try {
    const orderData = {
      OrderID: order.id,
      CustomerName: order.customer.name,
      CustomerPhone: order.customer.phone,
      CustomerAddress: order.customer.address,
      Items: order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
      Subtotal: order.subtotal,
      DeliveryFee: order.delivery.fee,
      Total: order.total,
      DeliveryMethod: order.delivery.method,
      PaymentRefNumber: order.payment.ocrResult?.referenceNumber || "",
      PaymentAmount: order.payment.ocrResult?.amount || 0,
      PaymentDateTime: order.payment.ocrResult?.dateTime || "",
      PaymentName: order.payment.ocrResult?.name || "",
      Status: order.status,
      DistanceKm: order.customer.distanceKm || 0,
      CreatedAt: order.createdAt,
      VerifiedAt: new Date().toISOString()
    };

    const response = await fetch(SHEET_BEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    return response.ok;
  } catch (error) {
    console.error("[v0] Error submitting to sheet:", error);
    return false;
  }
}

// Check for duplicate reference numbers
export async function checkDuplicateReference(refNumber: string): Promise<boolean> {
  try {
    const response = await fetch(`${SHEET_BEST_URL}/search?PaymentRefNumber=${refNumber}`);
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error("[v0] Error checking duplicate:", error);
    return false;
  }
}

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PNB-${timestamp}-${random}`;
}
