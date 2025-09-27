"use client";
import { Stack } from "@mui/material";
import ProductCard from "./productCard";
import { useEffect, useState } from "react";
import { useProducts } from "@/context/ProductContext";

export default function ProductTab({ category, searchTerm }) {
  const { productList, loading } = useProducts();
  const [filteredProductList, setFilteredProductList] = useState([]);
  useEffect(() => {
    if (!loading) {
      let filtered = productList;

      if (category) {
        filtered = productList.filter((product) =>
          category === "Atom bombs"
            ? product.category === "Atom bombs" ||
              product.category === "Bijili crackers"
            : category === "Twinklers"
            ? product.category === "Twinkling stars" ||
              product.category === "Pencils"
            : product.category === category
        );
      }

      if (searchTerm) {
        filtered = filtered.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredProductList(filtered);
    }
  }, [category, searchTerm, productList, loading]);

  if (loading) return <p>Loading products...</p>;

  return (
    <Stack
      margin={{
        xs: "40px 0 0 0",
        sm: "20px",
        md: "20px 0 0 0",
      }}
      width={"100%"}
    >
      <h4
        id="product"
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginLeft: "10px",
        }}
      >
        {searchTerm
          ? `Showing results for "${searchTerm}"`
          : category
          ? category === "Atom bombs"
            ? "Atom bombs & Bijili"
            : category
          : "Our Products"}
      </h4>
      <Stack
        width={"100%"}
        padding={"40px 0 0 0"}
        display={"flex"}
        direction={"row"}
        flexWrap={"wrap"}
        gap={2}
        justifyContent={{
          xs: "center",
          sm: "center",
          md: "center",
          lg: "flex-start",
        }}
      >
        {filteredProductList.length > 0 ? (
          filteredProductList.map((product, index) => {
            return <ProductCard key={index} product={product} />;
          })
        ) : (
          <p style={{ textAlign: "center", width: "100%" }}>
            No products found.
          </p>
        )}
      </Stack>
    </Stack>
  );
}
