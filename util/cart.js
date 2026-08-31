"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Cart engine.
 *
 * Reads and writes the SAME localStorage["cart"] key and the same item shape
 * ({ ...product, count }) as the existing shop, so /checkout keeps working and
 * a customer can move between the old and new pages without losing their cart.
 *
 * Every mutation broadcasts `cart:updated`, so the grid, the cart rail and the
 * mobile bar all stay in sync without prop-drilling or a page reload.
 */

export const MIN_ORDER = 3000;
const KEY = "cart";
const EVENT = "cart:updated";

export const readCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const writeCart = (cart) => {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: cart }));
};

/** Unit price after discount, rounded for display. */
export const unitPrice = (item) =>
  Math.round(item.price - (item.price * (item.discount || 0)) / 100);

/**
 * Line subtotal. Deliberately mirrors the formula in /checkout
 * (round the line, not the unit) so the ₹3000 gate shown here can never
 * disagree with the one enforced at checkout.
 */
export const lineTotal = (item) =>
  Math.round(
    (item.price - (item.price * (item.discount || 0)) / 100) * (item.count || 0)
  );

export const cartTotal = (cart) => cart.reduce((a, i) => a + lineTotal(i), 0);

/** What they'd have paid without the Diwali discount - drives "you saved". */
export const cartMrp = (cart) =>
  cart.reduce((a, i) => a + Math.round(i.price * (i.count || 0)), 0);

export function useCart() {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setReady(true);
    const sync = () => setCart(readCart());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((product, qty = 1) => {
    const next = readCart();
    const i = next.findIndex((x) => x.id === product.id);
    if (i > -1) next[i] = { ...next[i], count: next[i].count + qty };
    else next.push({ ...product, count: qty });
    writeCart(next);
  }, []);

  const setQty = useCallback((id, qty) => {
    const next = readCart()
      .map((x) => (x.id === id ? { ...x, count: Math.max(0, qty) } : x))
      .filter((x) => x.count > 0); // hitting 0 removes the line
    writeCart(next);
  }, []);

  /**
   * Relative change, resolved against storage at write time.
   *
   * The +/- buttons must not compute `count + 1` from the count captured in
   * their last render: several quick taps would all read the same stale value
   * and collapse into a single increment.
   */
  const adjust = useCallback((id, delta) => {
    const next = readCart()
      .map((x) => (x.id === id ? { ...x, count: Math.max(0, x.count + delta) } : x))
      .filter((x) => x.count > 0);
    writeCart(next);
  }, []);

  const remove = useCallback((id) => {
    writeCart(readCart().filter((x) => x.id !== id));
  }, []);

  /** Put a removed line back at its original position, for undo. */
  const restore = useCallback((item, index) => {
    const next = readCart();
    next.splice(Math.min(index, next.length), 0, item);
    writeCart(next);
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const total = cartTotal(cart);
  const mrp = cartMrp(cart);

  return {
    cart,
    ready,
    add,
    setQty,
    adjust,
    remove,
    restore,
    clear,
    total,
    mrp,
    saved: mrp - total,
    itemCount: cart.reduce((a, i) => a + (i.count || 0), 0),
    shortBy: Math.max(0, MIN_ORDER - total),
    meetsMinimum: total > MIN_ORDER,
    inCart: (id) => cart.find((x) => x.id === id),
  };
}
