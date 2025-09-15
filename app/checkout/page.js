"use client";
import {
  Stack,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { styled } from "@mui/material/styles";
import { Quicksand } from "next/font/google";
import { useState } from "react";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { pdf } from "@react-pdf/renderer";
import Template1 from "@/util/invoice/Template1/Template";

// ✅ import hooks instead of contexts
import { useCart } from "@/context/CartContext";
import { useBilling } from "@/context/BillingContext";

const quicksand = Quicksand({ subsets: ["latin"] });

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--text-color-trinary)",
    color: theme.palette.common.white,
    fontWeight: 800,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  "& td, & th": {
    borderBottom: "1px solid var(--text-color-trinary)",
  },
}));

export default function Page() {
  const [checkoutState, setCheckoutState] = useState("billing");
  const [open, setOpen] = useState(false);

  // ✅ use billing hook
  const { billingDetails, setBillingDetails } = useBilling();

  const onBillingDetailsChange = (e) => {
    setBillingDetails({ ...billingDetails, [e.target.name]: e.target.value });
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleClick = () => {
    if (
      !billingDetails.name ||
      !billingDetails.email ||
      !billingDetails.phone ||
      !billingDetails.address ||
      !billingDetails.city ||
      !billingDetails.state ||
      !billingDetails.zip
    ) {
      setOpen(true);
      return;
    }
    if (billingDetails.phone.length !== 10) {
      setOpen(true);
      return;
    }
    if (billingDetails.zip.length !== 6) {
      setOpen(true);
      return;
    }
    if (billingDetails.email.indexOf("@") === -1) {
      setOpen(true);
      return;
    }
    setCheckoutState("order");
  };

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
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Fill the details!
        </Alert>
      </Snackbar>
      <Stack
        sx={{
          width: "100%",
          maxWidth: "var(--max-width)",
          padding: "40px 0",
          gap: 5,
        }}
      >
        <Typography
          className={quicksand.className}
          variant="h1"
          fontSize={40}
          fontWeight={800}
          textAlign={"center"}
        >
          Checkout
        </Typography>
        <StepIndicator checkoutState={checkoutState} />
        {checkoutState === "billing" && (
          <BillingDetails
            handleClick={handleClick}
            billingDetails={billingDetails}
            onBillingDetailsChange={onBillingDetailsChange}
          />
        )}
        {checkoutState === "order" && (
          <OrderSummary setCheckoutState={setCheckoutState} />
        )}
      </Stack>
    </main>
  );
}

function OrderSummary({ setCheckoutState }) {
  const { cart, clearCart } = useCart(); // ✅ use cart hook
  const { billingDetails } = useBilling();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <Stack gap={2}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={open}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
      <Button
        variant="text"
        sx={{
          textTransform: "none",
          width: "fit-content",
          color: "var(--primary-color)",
          "&:hover": {
            color: "var(--primary-color)",
            backgroundColor: "white",
          },
        }}
        startIcon={<ArrowBackIosNewRoundedIcon />}
        onClick={() => setCheckoutState("billing")}
      >
        Billing details
      </Button>
      <Typography
        className={quicksand.className}
        variant="h2"
        fontSize={24}
        color={"var(--primary-color)"}
        fontWeight={500}
      >
        Order Summary
      </Typography>
      <Stack gap={2}>
        <TableContainer>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Products</StyledTableCell>
                <StyledTableCell>Quantity</StyledTableCell>
                <StyledTableCell align="right">Unit price</StyledTableCell>
                <StyledTableCell align="right">Subtotal</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.length === 0 && (
                <StyledTableRow>
                  <StyledTableCell colSpan={5} align="center">
                    Your cart is empty
                  </StyledTableCell>
                </StyledTableRow>
              )}
              {cart.map((row) => (
                <StyledTableRow key={row.name}>
                  <StyledTableCell>{row.name}</StyledTableCell>
                  <StyledTableCell>{row.count}</StyledTableCell>
                  <StyledTableCell align="right">
                    {Math.round(row.price - (row.price * row.discount) / 100)}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {Math.round(
                      (row.price - (row.price * row.discount) / 100) * row.count
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack justifyContent={"flex-end"} direction={"row"} gap={5}>
          <Typography fontWeight={"bold"}>Total:</Typography>
          <Typography fontSize={20} fontWeight={"bold"}>
            ₹{" "}
            {cart.reduce(
              (acc, item) =>
                acc +
                Math.round(
                  (item.price - (item.price * item.discount) / 100) * item.count
                ),
              0
            )}
          </Typography>
        </Stack>
      </Stack>
      <Typography
        className={quicksand.className}
        fontWeight={"bold"}
        color={"#000"}
      >
        As per 2018 supreme court order, online sale of firecrackers are not
        permitted! We value our customers and at the same time, respect
        jurisdiction. We request you to add your products to the cart and submit
        the required crackers through the place order button. We will contact
        you within 24 hrs and confirm the order through WhatsApp or phone call.
        Please add and submit your orders and enjoy your Diwali with Fast
        Crackers.
      </Typography>

      <Stack direction={"row"} justifyContent={"flex-end"}>
        <LoadingButton
          variant="contained"
          loading={loading}
          disabled={cart.length === 0}
          sx={{
            backgroundColor: "var(--primary-color)",
            width: "150px",
            "&:hover": {
              backgroundColor: "var(--primary-color)",
            },
            textTransform: "none",
          }}
          onClick={async () => {
            setLoading(true);
            const pdfStream = await pdf(
              <Template1 billingDetails={billingDetails} productList={cart} />
            ).toBuffer();
            const chunks = [];
            pdfStream.on("data", (chunk) => chunks.push(chunk));
            pdfStream.on("end", async () => {
              const pdfBuffer = Buffer.concat(chunks);
              const base64String = pdfBuffer.toString("base64");
              fetch("/api/sendmail", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  billingDetails,
                  productList: cart,
                  invoice: base64String,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.status === "success") {
                    setAlertMessage("Order placed successfully");
                    setOpen(true);
                    clearCart();
                    setCheckoutState("billing");
                    setLoading(false);
                  }
                });
            });
          }}
        >
          Place Order
        </LoadingButton>
      </Stack>
    </Stack>
  );
}

function StepIndicator({ checkoutState }) {
  return (
    <Stack direction={"row"} width={"100%"}>
      <Typography
        width={"100%"}
        fontSize={{ xs: 12, sm: 16, md: 18 }}
        fontWeight={800}
        textAlign={"center"}
        sx={{
          backgroundColor: "var(--primary-color)",
          padding: "10px",
          color: "white",
        }}
      >
        Checkout Progress
      </Typography>
      <Typography
        width={"100%"}
        fontSize={{ xs: 12, sm: 16, md: 18 }}
        fontWeight={800}
        textAlign={"center"}
        sx={{
          border:
            checkoutState === "billing"
              ? "1px solid var(--primary-color)"
              : "1px solid var(--text-color-trinary)",
          padding: "10px",
          color:
            checkoutState === "billing"
              ? "var(--primary-color)"
              : "var(--text-color-trinary)",
          backgroundColor: checkoutState === "billing" ? "#FFDACC" : "white",
        }}
      >
        Billing Details
      </Typography>
      <Typography
        width={"100%"}
        fontSize={{ xs: 12, sm: 16, md: 18 }}
        fontWeight={800}
        textAlign={"center"}
        sx={{
          border:
            checkoutState === "order"
              ? "1px solid var(--primary-color)"
              : "1px solid var(--text-color-trinary)",
          padding: "10px",
          color: checkoutState === "order" ? "var(--primary-color)" : "black",
          backgroundColor: checkoutState === "order" ? "#FFDACC" : "white",
        }}
      >
        Place Order
      </Typography>
    </Stack>
  );
}

function BillingDetails({
  handleClick,
  billingDetails,
  onBillingDetailsChange,
}) {
  return (
    <Stack gap={5}>
      <Typography
        variant="h2"
        fontSize={24}
        color={"var(--primary-color)"}
        fontWeight={500}
      >
        Contact Information
      </Typography>
      <Stack gap={2}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
          <TextField
            label="Name"
            variant="outlined"
            name="name"
            value={billingDetails.name}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
          <TextField
            label="Email"
            variant="outlined"
            name="email"
            value={billingDetails.email}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
        </Stack>
        <TextField
          label="Phone"
          variant="outlined"
          name="phone"
          value={billingDetails.phone}
          onChange={onBillingDetailsChange}
          sx={{
            width: {
              xs: "100%",
              sm: "350px",
            },
          }}
        />
      </Stack>
      <Typography
        variant="h2"
        fontSize={24}
        color={"var(--primary-color)"}
        fontWeight={500}
      >
        Shipping Address
      </Typography>
      <Stack gap={2}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
          <TextField
            label="Address"
            variant="outlined"
            name="address"
            value={billingDetails.address}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
          <TextField
            label="City"
            variant="outlined"
            name="city"
            value={billingDetails.city}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
          <TextField
            label="State"
            variant="outlined"
            name="state"
            value={billingDetails.state}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
          <TextField
            label="Zip"
            variant="outlined"
            name="zip"
            value={billingDetails.zip}
            onChange={onBillingDetailsChange}
            sx={{
              width: {
                xs: "100%",
                sm: "350px",
              },
            }}
          />
        </Stack>
      </Stack>
      <Stack>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "var(--primary-color)",
            width: "150px",
            "&:hover": { backgroundColor: "var(--primary-color)" },
          }}
          onClick={handleClick}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
