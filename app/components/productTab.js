"use client";
import { Stack, Typography } from "@mui/material";
import ProductCard from "./productCard";
import useWindowSize from "@/util/windowSize";
import { use, useEffect, useState } from "react";

export default function ProductTab() {
  let productFromLocalStorage = JSON.parse(
    window.localStorage.getItem("productList")
  );
  const [productList, setProductList] = useState(productFromLocalStorage || []);
  useEffect(() => {
    productList.length === 0 &&
      fetch("https://e-com.incrix.com/Sankamithra%20Products/productData.json")
        .then((response) => response.json())
        .then((data) => {
          window.localStorage.setItem("productList", JSON.stringify(data));
          setProductList(data);
        });
  }, [productList.length]);
  const { width } = useWindowSize();
  return (
    <Stack margin={"40px 0 0 0"} width={"100%"}>
      <h4 style={{ fontSize: "32px", fontWeight: "bold" }}>Our Products</h4>
      <Stack
        width={"100%"}
        padding={"40px 0 0 0"}
        display={"flex"}
        direction={"row"}
        flexWrap={"wrap"}
        gap={2}
        justifyContent={width < 1024 ? "center" : "flex-start"}
      >
        {productList.length != 0 &&
          productList.map((product, index) => {
            return <ProductCard key={index} product={product} />;
          })}
      </Stack>
    </Stack>
  );
}
