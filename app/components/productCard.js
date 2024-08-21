"use client";
import { Stack, Paper, Typography, Button, ButtonGroup } from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
import { useState } from "react";
import useWindowSize from "@/util/windowSize";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function ProductCard({ product }) {
  const { width } = useWindowSize();
  const [count, setCount] = useState(1);
  const router = useRouter();
  const path = usePathname().split("/")[1];

  const handleIncrement = () => setCount(count + 1);
  const handleDecrement = () => count > 1 && setCount(count - 1);

  return (
    <Paper
      sx={{
        width: "230px",
        position: "relative",
        p: 2,
        borderRadius: "15px",
      }}
    >
      <Stack>
        {product.badge && (
          <div
            style={{
              position: "absolute",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              top: 0,
              left: 0,
              width: "60px",
              height: "30px",
              borderRadius: "15px 0 15px  0",
              background: "var(--badge-color)",
              fontSize: "10px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            {product.badge}
          </div>
        )}
        {/* <img
          onClick={() => {
            router.push(`shop/product?id=${product.id}`);
          }}
          style={{
            width: "200px",
            height: "200px",
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "2px",
          }}
          src={`https://e-com.incrix.com/Sankamithra%20Products/${product.image[0]}`}
          alt="pr"
        /> */}
        <Image
          onClick={() => {
            path === "shop"
              ? router.push(`product?id=${product.id}`)
              : router.push(`shop/product?id=${product.id}`);
          }}
          src={`https://e-com.incrix.com/Sankamithra%20Products/${product.image[0]}`}
          alt="pr"
          width={200}
          height={200}
          objectFit="cover"
          objectPosition="center"
          style={{
            borderRadius: "2px",
            cursor: "pointer",
          }}
        />
        <Typography
          variant="p"
          color={"var(--text-color-trinary)"}
          fontSize={"12px"}
          padding={"10px 0 0 0"}
        >
          {product.category}
        </Typography>
        <Typography
          variant="p"
          color={"var(--text-color)"}
          fontSize={"16px"}
          fontWeight={"bold"}
          padding={"10px 0 0 0"}
          sx={{
            cursor: "pointer",
          }}
          onClick={() => {
            path === "shop"
              ? router.push(`product?id=${product.id}`)
              : router.push(`shop/product?id=${product.id}`);
          }}
        >
          {product.name}
        </Typography>
        <Typography
          variant="p"
          color={"var(--text-color-secondary)"}
          fontSize={"14px"}
          padding={"10px 0 0 0"}
        >
          By <font style={{ color: "var(--primary-color)" }}>Sankamithra</font>
        </Typography>
        <Stack direction={"row"} gap={1} padding={"10px 0 0 0"}>
          <Typography
            variant="p"
            color={"var(--primary-color)"}
            fontSize={"14px"}
            fontWeight={"bold"}
          >
            ₹
            {Math.ceil(
              product.price - (product.discount / 100) * product.price
            )}
          </Typography>
          {product.discount && (
            <Typography
              variant="p"
              color={"var(--text-color-trinary)"}
              fontSize={"14px"}
              fontWeight={"bold"}
            >
              <s>₹{product.price}</s>
            </Typography>
          )}
          {product.discount && (
            <Typography
              variant="p"
              color={"var(--primary-color)"}
              fontSize={"14px"}
              fontWeight={"bold"}
            >
              (off %{product.discount})
            </Typography>
          )}
        </Stack>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          paddingTop={2}
          gap={1}
        >
          <Button
            variant="contained"
            sx={{
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "none",
              backgroundColor: "var(--primary-color)",
              "&:hover": {
                backgroundColor: "var(--primary-color)",
              },
            }}
            startIcon={<ShoppingCart />}
            onClick={() => {
              let cart = JSON.parse(localStorage.getItem("cart")) || [];
              let item = cart.filter((item) => item.id == product.id)[0];
              if (item) {
                item.count += count;
              } else {
                cart.push({ ...product, count: count });
              }
              localStorage.setItem("cart", JSON.stringify(cart));
            }}
          >
            Add
          </Button>
          <ButtonGroup size="small">
            <Button
              variant="contained"
              sx={{
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "none",
                backgroundColor: "var(--primary-color)",
                "&:hover": {
                  backgroundColor: "var(--primary-color)",
                },
              }}
              onClick={handleIncrement}
            >
              +
            </Button>
            <Typography
              color={"white"}
              sx={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "14px",
                fontWeight: "bold",
                backgroundColor: "var(--primary-color)",
                width: "40px",
              }}
            >
              {count}
            </Typography>
            <Button
              variant="contained"
              sx={{
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "none",
                backgroundColor: "var(--primary-color)",
                "&:hover": {
                  backgroundColor: "var(--primary-color)",
                },
              }}
              onClick={handleDecrement}
            >
              -
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>
    </Paper>
  );
}
