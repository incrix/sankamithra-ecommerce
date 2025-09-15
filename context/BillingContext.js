"use client";
import { createContext, useContext, useState } from "react";

const BillingContext = createContext();

export function BillingProvider({ children }) {
    const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    paymentMethod: "cod", // default: Cash on Delivery
  });

  // ✅ Update single field
  const updateBillingField = (field, value) => {
    setBillingDetails((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Reset billing after order
  const resetBilling = () => {
    setBillingDetails({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      paymentMethod: "cod",
    });
  };

  return (
    <BillingContext.Provider
      value={{ billingDetails, setBillingDetails, updateBillingField, resetBilling }}
    >
      {children}
    </BillingContext.Provider>
  );
  
}

export function useBilling() {
  return useContext(BillingContext);
}
