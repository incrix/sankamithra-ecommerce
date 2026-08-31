"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { PRODUCT_DATA_URL } from "@/util/config";

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(PRODUCT_DATA_URL);
        const data = await response.json();
        // The local SortedJSON file has no sort_id and is already in display
        // order, so only sort when the field is actually present.
        if (data.every((p) => typeof p.sort_id === "number")) {
          data.sort((a, b) => a.sort_id - b.sort_id);
        }
        setProductList(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const value = {
    productList,
    setProductList,
    loading,
    searchTerm,
    setSearchTerm,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
