// src/context/CartContext.js
"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

/**
 * Cart item shape:
 * - If you store snapshot: { id, name, price, image, count, ... }
 * - If you store minimal: { id, count }
 */

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // array of items

  // Add product (product can be object or id). By default we store the snapshot so UI shows details.
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const id = typeof product === "object" ? product.id : product;
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, count: i.count + qty } : i
        );
      }
      const newItem =
        typeof product === "object"
          ? { ...product, count: qty }
          : { id, count: qty };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateCount = (id, newCount) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, count: newCount } : i))
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (item.count || 0), 0),
    [cart]
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (item.count || 0) * (item.price ? Number(item.price) : 0),
        0
      ),
    [cart]
  );

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateCount,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
