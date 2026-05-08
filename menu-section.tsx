"use client";

import { useState } from "react";
import { MENU_ITEMS, MENU_CATEGORIES, COMBO_CHOICES, type MenuItem } from "@/lib/menu-data";
import type { CartItem } from "@/lib/order-store";
import { Plus, Minus, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MenuSectionProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export function MenuSection({ cart, setCart }: MenuSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(MENU_CATEGORIES);
  const [comboChoiceA, setComboChoiceA] = useState<string>("");
  const [comboChoiceB, setComboChoiceB] = useState<string>("");
  const [showReminder, setShowReminder] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const addToCart = (item: MenuItem, choiceA?: string, choiceB?: string) => {
    // Check for chicken reminder
    if (item.hasReminder && item.reminderText) {
      setShowReminder(item.reminderText);
      setTimeout(() => setShowReminder(null), 5000);
    }

    // Check if choosing chicken in combo
    if (choiceA === "chicken" || choiceB === "chicken") {
      setShowReminder("Reminder: Chicken takes 12-15 minutes to cook. Please wait patiently for your order.");
      setTimeout(() => setShowReminder(null), 6000);
    }

    const cartItemId = item.id === "combo-meal" 
      ? `${item.id}-${choiceA}-${choiceB}-${Date.now()}`
      : item.id;

    const existingIndex = cart.findIndex(ci => 
      ci.menuItemId === item.id && 
      ci.comboChoiceA === choiceA && 
      ci.comboChoiceB === choiceB
    );

    if (existingIndex >= 0 && item.id !== "combo-meal") {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const cartItem: CartItem = {
        id: cartItemId,
        menuItemId: item.id,
        name: item.id === "combo-meal" 
          ? `Combo Meal (${COMBO_CHOICES.find(c => c.id === choiceA)?.name} + ${COMBO_CHOICES.find(c => c.id === choiceB)?.name})`
          : item.name,
        price: item.price,
        quantity: 1,
        comboChoiceA: choiceA,
        comboChoiceB: choiceB
      };
      setCart([...cart, cartItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existingIndex = cart.findIndex(ci => ci.id === itemId);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity > 1) {
        newCart[existingIndex].quantity -= 1;
      } else {
        newCart.splice(existingIndex, 1);
      }
      setCart(newCart);
    }
  };

  const getItemQuantity = (itemId: string): number => {
    return cart
      .filter(ci => ci.menuItemId === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id);
    const isCombo = item.id === "combo-meal";
    const isFreebie = item.category === "Freebies";

    return (
      <Card key={item.id} className="p-3 flex items-center justify-between gap-2 hover:shadow-md transition-shadow">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
          <p className={`text-sm font-bold ${isFreebie ? "text-green-600" : "text-primary"}`}>
            {isFreebie ? "FREE" : `₱${item.price}`}
          </p>
        </div>

        {isCombo ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Choice A:</label>
              <select
                value={comboChoiceA}
                onChange={(e) => setComboChoiceA(e.target.value)}
                className="text-xs p-1 border rounded bg-background"
              >
                <option value="">Select first ulam</option>
                {COMBO_CHOICES.map(choice => (
                  <option 
                    key={choice.id} 
                    value={choice.id}
                    disabled={choice.id === comboChoiceB}
                  >
                    {choice.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Choice B:</label>
              <select
                value={comboChoiceB}
                onChange={(e) => setComboChoiceB(e.target.value)}
                className="text-xs p-1 border rounded bg-background"
              >
                <option value="">Select second ulam</option>
                {COMBO_CHOICES.map(choice => (
                  <option 
                    key={choice.id} 
                    value={choice.id}
                    disabled={choice.id === comboChoiceA}
                  >
                    {choice.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (comboChoiceA && comboChoiceB) {
                  addToCart(item, comboChoiceA, comboChoiceB);
                  setComboChoiceA("");
                  setComboChoiceB("");
                }
              }}
              disabled={!comboChoiceA || !comboChoiceB}
              className="text-xs"
            >
              Add Combo
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const cartItem = cart.find(ci => ci.menuItemId === item.id);
                    if (cartItem) removeFromCart(cartItem.id);
                  }}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-bold text-sm min-w-[20px] text-center">{quantity}</span>
              </>
            )}
            <Button
              variant={quantity > 0 ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => addToCart(item)}
              disabled={isFreebie && quantity > 0}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <section className="py-4">
      {/* Reminder Toast */}
      {showReminder && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up max-w-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{showReminder}</p>
        </div>
      )}

      <h2 className="text-xl font-bold text-foreground mb-4 px-4">Our Menu</h2>

      <div className="space-y-4">
        {MENU_CATEGORIES.map(category => {
          const items = MENU_ITEMS.filter(item => item.category === category);
          const isExpanded = expandedCategories.includes(category);

          return (
            <div key={category} className="px-4">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between bg-secondary text-secondary-foreground px-4 py-3 rounded-lg font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                <span>{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-70">{items.length} items</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {items.map(renderMenuItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
