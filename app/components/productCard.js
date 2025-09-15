// components/ProductCard.jsx (update import path as needed)
"use client";

import {
  Stack,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import useWindowSize from "@/util/windowSize";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const router = useRouter();
  const pathArray = usePathname().split("/");
  const { width } = useWindowSize();
  const isMobile = width <= 380;

  const { cart, addToCart, removeFromCart, updateCount } = useCart();

  // derive item presence from cart (no extra persistent state required)
  const cartItem = cart.find((i) => i.id == product.id);
  const isAdded = !!cartItem;

  useEffect(() => {
    if (cartItem) {
      setCount(cartItem.count);
    } else {
      setCount(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItem]); // re-run when the item in cart changes

  const handleIncrement = () => {
    if (isAdded) {
      updateCount(product.id, cartItem.count + 1);
    } else {
      setCount((c) => c + 1);
    }
  };

  const handleDecrement = () => {
    if (isAdded) {
      if (cartItem.count > 1) {
        updateCount(product.id, cartItem.count - 1);
      } else {
        removeFromCart(product.id);
        setSnackMsg(`${product.name} removed from cart`);
        setOpen(true);
      }
    } else {
      setCount((c) => (c > 1 ? c - 1 : c));
    }
  };

  const handleAddRemoveClick = () => {
    if (!isAdded) {
      addToCart(product, count);
      setSnackMsg(`${product.name} added to cart`);
      setOpen(true);
    } else {
      removeFromCart(product.id);
      setSnackMsg(`${product.name} removed from cart`);
      setOpen(true);
      setCount(1);
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <Paper
      sx={{
        margin: isMobile ? "0 10px" : "0",
        width: {
          xs: isMobile ? "100%" : "180px",
          sm: "250px",
        },
        position: "relative",
        p: {
          xs: "10px",
        },
        borderRadius: "15px",
      }}
    >
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={isAdded ? "success" : "info"} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>

      <Stack direction={isMobile ? "row" : "column"} gap={isMobile ? 2 : 0}>
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
        <Stack>
          <img
            onClick={() => {
              pathArray.length > 2
                ? router.push(`product?id=${product.id}`)
                : router.push(`shop/product?id=${product.id}`);
            }}
            src={`https://e-com.incrix.com/Sankamithra%20Products/${product.image[0]}`}
            alt="pr"
            width={"100%"}
            height={"100%"}
            style={{
              borderRadius: "2px",
              cursor: "pointer",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </Stack>

        <Stack>
          <Typography variant="p" color={"var(--text-color-trinary)"} fontSize={"12px"} pt={{ xs: "5px", sm: "10px" }}>
            {product.category}
          </Typography>

          <Typography
            variant="p"
            color={"var(--text-color)"}
            fontSize={"16px"}
            fontWeight={"bold"}
            pt={{ xs: "5px", sm: "10px" }}
            sx={{ cursor: "pointer" }}
            onClick={() => {
              pathArray.length > 2 && pathArray[2] === "shop"
                ? router.push(`product?id=${product.id}`)
                : router.push(`shop/product?id=${product.id}`);
            }}
          >
            {product.name}
          </Typography>

          <Typography variant="p" color={"var(--text-color-secondary)"} fontSize={"14px"} pt={{ xs: "5px", sm: "10px" }}>
            By <font style={{ color: "var(--primary-color)" }}>Sankamithra</font>
          </Typography>

          <Stack direction={"row"} gap={1} pt={{ xs: "5px", sm: "10px" }}>
            <Typography variant="p" color={"var(--primary-color)"} fontSize={"14px"} fontWeight={"bold"}>
              ₹{Math.round(product.price - (product.discount / 100) * product.price)}
            </Typography>

            {product.discount && (
              <Typography variant="p" color={"var(--text-color-trinary)"} fontSize={"14px"} fontWeight={"bold"}>
                <s>₹{product.price}</s>
              </Typography>
            )}

            {product.discount && (
              <Typography variant="p" color={"var(--primary-color)"} fontSize={"14px"} fontWeight={"bold"}>
                (off %{product.discount})
              </Typography>
            )}
          </Stack>

          <Stack width={"100%"} direction={{ xs: "column-reverse", md: "row" }} justifyContent={"space-between"} paddingTop={2} gap={1}>
            <Button
              variant="contained"
              sx={{
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "none",
                backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-color)" },
              }}
              startIcon={!isAdded && <ShoppingCart />}
              onClick={handleAddRemoveClick}
            >
              {isAdded ? "Remove" : "Add"}
            </Button>

            <Stack direction={"row"}>
              <Button
                variant="contained"
                fullWidth={false}
                sx={{
                  width: { xs: "50px", sm: "50px", md: "20px" },
                  color: "white",
                  fontSize: "14px",
                  borderRadius: "0 5px 5px 0",
                  fontWeight: "bold",
                  textTransform: "none",
                  backgroundColor: "var(--primary-color)",
                  "&:hover": { backgroundColor: "var(--primary-color)" },
                }}
                onClick={handleDecrement}
              >
                <RemoveRoundedIcon />
              </Button>

              <Stack
                width={"100%"}
                justifyContent={"center"}
                sx={{
                  backgroundColor: "var(--primary-color)",
                  minWidth: "30px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {count}
              </Stack>

              <Button
                variant="contained"
                fullWidth={false}
                sx={{
                  width: { xs: "50px", sm: "50px", md: "20px" },
                  color: "white",
                  borderRadius: "5px 0 0 5px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textTransform: "none",
                  backgroundColor: "var(--primary-color)",
                  "&:hover": { backgroundColor: "var(--primary-color)" },
                }}
                onClick={handleIncrement}
              >
                <AddRoundedIcon />
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
