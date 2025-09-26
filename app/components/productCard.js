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
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import useWindowSize from "@/util/windowSize";

export default function ProductCard({ product }) {
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const router = useRouter();
  const pathArray = usePathname().split("/");
  const { width } = useWindowSize();
  const isMobile = width <= 380;

  const [cart, setCart] = useState([]);
  const [isAdded, setIsAdded] = useState(false);

  const handleIncrement = () => {
    if (isAdded) {
      cart.map((item) => {
        if (item.id == product.id) {
          item.count += 1;
          setCount(item.count);
          localStorage.setItem("cart", JSON.stringify(cart));
        }
      });
    } else {
      setCount(count + 1);
    }
  };
  const handleDecrement = () => {
    if (isAdded) {
      cart.map((item) => {
        if (item.id == product.id) {
          if (item.count > 1) {
            item.count -= 1;
            setCount(item.count);
            localStorage.setItem("cart", JSON.stringify(cart));
          } else {
            let newCart = cart.filter((item) => item.id != product.id);
            localStorage.setItem("cart", JSON.stringify(newCart));
            setIsAdded(false);
            handleOpen();
            setCount(1);
          }
        }
      });
    } else {
      if (count > 1) {
        setCount(count - 1);
      }
    }
  };
  const handleClose = () => setSnackbar({ ...snackbar, open: false });
  const handleOpen = () => setOpen(true);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  const isProductAdded = useCallback(() => {
    let item = cart.filter((item) => item.id == product.id)[0];
    if (item) {
      setIsAdded(true);
      setCount(item.count);
    } else {
      setIsAdded(false);
      setCount(1);
    }
  }, [cart, product.id]);

  useEffect(() => {
    isProductAdded();
  }, [cart, isProductAdded]);

  const handleAddToCart = () => {
    // 1. Check if the product is in stock
    if (product.countInStock <= 0) {
      setSnackbar({
        open: true,
        message: "Sorry, this item is out of stock.",
        severity: "error",
      });
      return; // Prevent adding to cart
    }

    // 2. If in stock, proceed to add
    if (!isAdded) {
      let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
      currentCart.push({ ...product, count: count });
      localStorage.setItem("cart", JSON.stringify(currentCart));
      setCart(currentCart); // Update state to trigger re-render
      setIsAdded(true);
      setSnackbar({
        open: true,
        message: `${product.name} added to cart`,
        severity: "success",
      });
    } else {
      // Remove item from cart
      let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
      let newCart = currentCart.filter((item) => item.id !== product.id);
      localStorage.setItem("cart", JSON.stringify(newCart));
      setCart(newCart); // Update state to trigger re-render
      setIsAdded(false);
      setSnackbar({
        open: true,
        message: `${product.name} removed from cart`,
        severity: "info",
      });
    }
  };

  const isOutOfStock = product.countInStock <= 0;

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
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
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
          <Typography
            variant="p"
            color={"var(--text-color-trinary)"}
            fontSize={"12px"}
            pt={{ xs: "5px", sm: "10px" }}
          >
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

          <Typography
            variant="p"
            color={"var(--text-color-secondary)"}
            fontSize={"14px"}
            pt={{ xs: "5px", sm: "10px" }}
          >
            By{" "}
            <font style={{ color: "var(--primary-color)" }}>Sankamithra</font>
          </Typography>

          <Stack direction={"row"} gap={1} pt={{ xs: "5px", sm: "10px" }}>
            <Typography
              variant="p"
              color={"var(--primary-color)"}
              fontSize={"14px"}
              fontWeight={"bold"}
            >
              ₹
              {Math.round(
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
                ({product.discount}% off)
              </Typography>
            )}
          </Stack>

          <Stack
            width={"100%"}
            direction={{ xs: "column-reverse", md: "row" }}
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
                "&:hover": { backgroundColor: "var(--primary-color)" },
              }}
              startIcon={!isAdded && !isOutOfStock && <ShoppingCart />}
              onClick={handleAddToCart}
              disabled={isOutOfStock && !isAdded}
            >
              {isOutOfStock
                ? isAdded
                  ? "Remove"
                  : "Out of Stock"
                : isAdded
                ? "Remove"
                : "Add"}
            </Button>

            <Stack direction={"row"}>
              <Button
                variant="contained"
                fullWidth={false}
                sx={{
                  width: { xs: "50px", sm: "50px", md: "20px" },
                  color: "white",
                  fontSize: "14px",
                  borderRadius: "5px 0 0 5px",
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
                  borderRadius: "0 5px 5px 0",
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
