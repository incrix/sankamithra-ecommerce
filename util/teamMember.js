"use client";
import { useEffect, useState } from "react";

/**
 * Which member of the team is using this device.
 *
 * The admin has one shared password, so the session cannot say who is holding
 * the phone. Each person picks their name once and the browser remembers it;
 * that name is what goes on the orders they take and confirm.
 */
const KEY = "admin.me";
const EVENT = "admin-me-changed";

const read = () => {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
};

export function setMe(name) {
  const clean = String(name || "").replace(/\s+/g, " ").trim().slice(0, 40);
  try {
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  } catch {}
  // Every component showing "you" updates together, not just the one that asked.
  window.dispatchEvent(new Event(EVENT));
  return clean;
}

export function useMe() {
  const [me, setLocal] = useState("");
  useEffect(() => {
    const sync = () => setLocal(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return me;
}

export const sameName = (a, b) =>
  Boolean(a) && Boolean(b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/** Names already seen on orders, so a teammate picks theirs instead of typing it. */
export function knownNames(orders) {
  const seen = new Map();
  for (const o of orders || []) {
    for (const n of [o.handledBy?.name, o.confirmedBy?.name]) {
      if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
