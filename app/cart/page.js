"use client";
import {
  Stack,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Button,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import { Quicksand } from "next/font/google";
const quicksand = Quicksand({ subsets: ["latin"] });
import EmailSubscribe from "../components/emailSubscribe";
import { Delete } from "@mui/icons-material";
import { useState, useEffect } from "react";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--primary-color)",
    color: theme.palette.common.white,
    fontWeight: 800,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  "& td, & th": {
    borderBottom: "1px solid var(--primary-color)",
  },
}));

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const cartList = localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
    setCart(cartList);
  }, []);
  const handleIncrement = (index) => {
    const newCart = [...cart];
    newCart[index].count += 1;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleDecrement = (index) => {
    if (cart[index].count === 1) {
      return;
    }
    const newCart = [...cart];
    newCart[index].count -= 1;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleRemove = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  // compute total with discount same as your old logic
  const total = cart.reduce(
    (acc, item) =>
      acc +
      Math.round(item.price - (item.price * (item.discount || 0)) / 100) *
        (item.count || 0),
    0
  );

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 40px",
      }}
    >
      <Stack
        sx={{
          width: "100%",
          minHeight: "50vh",
          maxWidth: "var(--max-width)",
          padding: "40px 0",
          gap: 5,
        }}
      >
        <Stack gap={2}>
          <Typography
            className={quicksand.className}
            variant="h1"
            fontSize={40}
            fontWeight={800}
          >
            Your Cart
          </Typography>
        </Stack>
        <Stack
          direction={{
            sm: "column",
            md: "row",
          }}
          gap={10}
        >
          <Stack
            width={{
              sm: "100%",
              md: "70%",
            }}
          >
            <TableContainer>
              <Table sx={{ minWidth: 700 }} aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell className={quicksand.className}>
                      Products
                    </StyledTableCell>
                    <StyledTableCell className={quicksand.className}>
                      Quantity
                    </StyledTableCell>
                    <StyledTableCell
                      className={quicksand.className}
                      align="right"
                    >
                      Unit price
                    </StyledTableCell>
                    <StyledTableCell
                      className={quicksand.className}
                      align="right"
                    >
                      Subtotal
                    </StyledTableCell>
                    <StyledTableCell
                      className={quicksand.className}
                      align="right"
                    >
                      Remove
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.length === 0 && (
                    <StyledTableRow>
                      <StyledTableCell colSpan={5} align={"left"}>
                        Your cart is empty
                      </StyledTableCell>
                    </StyledTableRow>
                  )}
                  {cart.map((row, index) => (
                    <StyledTableRow key={row.id}>
                      <StyledTableCell component="th" scope="row">
                        {row.name}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack direction={"row"}>
                          <IconButton
                            sx={{
                              color: "white",
                              fontSize: "14px",
                              fontWeight: "bold",
                              width: "30px",
                              height: "30px",
                              backgroundColor: "var(--text-color-trinary)",
                              "&:hover": {
                                backgroundColor: "var(--text-color-trinary)",
                              },
                            }}
                            onClick={() => handleDecrement(index)}
                          >
                            -
                          </IconButton>
                          <Typography
                            sx={{
                              textAlign: "center",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "14px",
                              fontWeight: "bold",
                              width: "40px",
                            }}
                          >
                            {row.count}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{
                              color: "white",
                              fontSize: "14px",
                              fontWeight: "bold",
                              width: "30px",
                              height: "30px",
                              backgroundColor: "var(--text-color-trinary)",
                              "&:hover": {
                                backgroundColor: "var(--text-color-trinary)",
                              },
                            }}
                            onClick={() => handleIncrement(index)}
                          >
                            +
                          </IconButton>
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {Math.round(row.price - (row.price * (row.discount || 0)) / 100)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {Math.round(
                          row.price - (row.price * (row.discount || 0)) / 100
                        ) * row.count}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <IconButton
                          size="small"
                          sx={{
                            color: "red",
                          }}
                          onClick={() => handleRemove(index)}
                        >
                          <Delete />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
          <Stack
            width={{
              sm: "100%",
              md: "30%",
            }}
          >
            <Paper sx={{ padding: 2 }}>
              <Stack gap={2}>
                <Typography
                  className={quicksand.className}
                  variant="h3"
                  fontSize={20}
                  fontWeight={800}
                >
                  Cart Summary
                </Typography>
                <Stack gap={2}>
                  <Typography
                    className={quicksand.className}
                    fontSize={14}
                    fontWeight={700}
                  >
                    Total: ₹{total}
                  </Typography>
                </Stack>
                <Stack gap={2}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "var(--primary-color)",
                      },
                    }}
                    disabled={cart.length === 0}
                  >
                    <Link
                      style={{
                        textDecoration: "none",
                        color: "white",
                      }}
                      href="/checkout"
                    >
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      border: "1px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      textTransform: "none",
                      "&:hover": {
                        border: "1px solid var(--primary-color)",
                      },
                    }}
                  >
                    <Link
                      style={{
                        textDecoration: "none",
                        color: "var(--primary-color)",
                      }}
                      href="/shop"
                    >
                      Continue Shopping
                    </Link>
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
        <EmailSubscribe />
      </Stack>
    </main>
  );
}
