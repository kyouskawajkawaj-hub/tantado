"use client";

import type { CartItem } from "@/lib/order-store";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CartSectionProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
}

export function CartSection({ cart, setCart, onCheckout }: CartSectionProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const index = newCart.findIndex(item => item.id === itemId);
      if (index >= 0) {
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
          newCart.splice(index, 1);
        }
      }
      return newCart;
    });
  };

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  if (cart.length === 0) {
    return (
      <section className="px-4 py-6">
        <Card className="p-8 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground">Add items from the menu above</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Your Order
        <span className="text-sm font-normal text-muted-foreground">
          ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
        </span>
      </h2>

      <Card className="divide-y divide-border">
        {cart.map(item => (
          <div key={item.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
              <p className="text-sm text-primary font-semibold">
                ₱{item.price} × {item.quantity} = ₱{item.price * item.quantity}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.id, -1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.id, 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        <div className="p-4 bg-secondary/50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-foreground">Subtotal:</span>
            <span className="text-xl font-bold text-primary">₱{subtotal.toFixed(2)}</span>
          </div>
          <Button onClick={onCheckout} className="w-full" size="lg">
            Proceed to Checkout
          </Button>
        </div>
      </Card>
    </section>
  );
}
