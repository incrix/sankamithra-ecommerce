"use client";
import { Stack } from "@mui/material";
import ProductCard from "./productCard";
import { useEffect, useState } from "react";

export default function ProductTab({ category }) {
  const [productList, setProductList] = useState([]);
  const [filteredProductList, setFilteredProductList] = useState([]);
  useEffect(() => {
    let productFromLocalStorage = JSON.parse(
      localStorage.getItem("productList")
    );
    if (
      productFromLocalStorage == null ||
      productFromLocalStorage.length === 0
    ) {
      fetch("https://e-com.incrix.com/Sankamithra%20Products/productData.json")
        .then((response) => response.json())
        .then((data) => {
          localStorage.setItem("productList", JSON.stringify(data));
          setProductList(data);
        });
    } else {
      setProductList(productFromLocalStorage);
    }
    if (category) {
      setFilteredProductList(
        productList.filter((product) =>
          category === "Atom bombs"
            ? product.category === "Atom bombs" ||
              product.category === "Bijili crackers"
            : category === "Twinklers"
            ? product.category === "Twinkling stars" ||
              product.category === "Pencils"
            : product.category === category
        )
      );
    } else {
      setFilteredProductList(productList);
    }
  }, [productList.length, category]);

  return (
    <Stack
      margin={{
        xs: "0",
        sm: "20px",
        md: "20px 0 0 0",
      }}
      width={"100%"}
    >
      <h4
        id="product"
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginLeft: "10px",
        }}
      >
        {category
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
        {filteredProductList.length != 0 &&
          filteredProductList.map((product, index) => {
            return <ProductCard key={index} product={product} />;
          })}
      </Stack>
    </Stack>
  );
}
