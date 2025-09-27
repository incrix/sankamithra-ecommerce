"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(
          "https://e-com.incrix.com/Sankamithra%20Products/productData.json"
        );
        const data = await response.json();
        data.sort((a, b) => a.sort_id - b.sort_id);
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
