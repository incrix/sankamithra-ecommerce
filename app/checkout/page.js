"use client";
import {
  Stack, Typography, TextField, Button, Snackbar, Alert, Box,
  Divider, Chip, CircularProgress,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { Quicksand } from "next/font/google";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { pdf } from "@react-pdf/renderer";
import Template1 from "@/util/invoice/Template1/Template";
import { assetUrl } from "@/util/config";

const quicksand = Quicksand({ subsets: ["latin"] });

const MIN_ORDER = 3000;

const unit = (i) => Math.round(i.price - (i.price * (i.discount || 0)) / 100);
const line = (i) =>
  Math.round((i.price - (i.price * (i.discount || 0)) / 100) * (i.count || 0));
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** One definition drives labels, validation and the responsive grid. */
const FIELDS = [
  { name: "name", label: "Full name", span: 1, group: "contact" },
  { name: "email", label: "Email", span: 1, group: "contact", type: "email" },
  { name: "phone", label: "Phone", span: 1, group: "contact", inputMode: "numeric", maxLength: 10 },
  { name: "address", label: "Address", span: 2, group: "shipping", multiline: true, rows: 2 },
  { name: "city", label: "City", span: 1, group: "shipping" },
  { name: "state", label: "State", span: 1, group: "shipping" },
  { name: "zip", label: "PIN code", span: 1, group: "shipping", inputMode: "numeric", maxLength: 6 },
];

const validate = (b) => {
  const e = {};
  if (!b.name?.trim()) e.name = "Required";
  if (!b.email?.trim()) e.email = "Required";
  else if (!/^\S+@\S+\.\S+$/.test(b.email)) e.email = "Enter a valid email";
  if (!b.phone?.trim()) e.phone = "Required";
  else if (b.phone.replace(/\D/g, "").length !== 10) e.phone = "Must be 10 digits";
  if (!b.address?.trim()) e.address = "Required";
  if (!b.city?.trim()) e.city = "Required";
  if (!b.state?.trim()) e.state = "Required";
  if (!b.zip?.trim()) e.zip = "Required";
  else if (b.zip.replace(/\D/g, "").length !== 6) e.zip = "Must be 6 digits";
  return e;
};

export default function Page() {
  const [step, setStep] = useState("billing"); // billing | order | done
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [touched, setTouched] = useState({});
  const [result, setResult] = useState(null); // { emailSent, invoice, billing }

  const [billingDetails, setBillingDetails] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: "",
  });

  // Guards the save effect: without it the save fires on first mount with the
  // still-empty initial state and wipes previously saved details.
  const [billingLoaded, setBillingLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("billingDetails");
    if (stored) {
      try { setBillingDetails((p) => ({ ...p, ...JSON.parse(stored) })); } catch {}
    }
    setBillingLoaded(true);
  }, []);

  useEffect(() => {
    if (!billingLoaded) return;
    localStorage.setItem("billingDetails", JSON.stringify(billingDetails));
  }, [billingDetails, billingLoaded]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const errors = validate(billingDetails);

  const onChange = (e) => {
    let { name, value } = e.target;
    const f = FIELDS.find((x) => x.name === name);
    if (f?.inputMode === "numeric") value = value.replace(/\D/g, "").slice(0, f.maxLength);
    setBillingDetails((p) => ({ ...p, [name]: value }));
  };

  const toast = (message, severity = "error") => setSnackbar({ open: true, message, severity });

  const handleNext = () => {
    if (Object.keys(errors).length) {
      setTouched(Object.fromEntries(FIELDS.map((f) => [f.name, true])));
      toast("Please correct the highlighted fields");
      return;
    }
    setStep("order");
  };

  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth={1150}
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 3, md: 5 }}
        gap={{ xs: 2.5, md: 4 }}
      >
        <Stack gap={0.5} alignItems="center" textAlign="center">
          <Typography
            className={quicksand.className}
            variant="h1"
            fontSize={{ xs: 26, sm: 32, md: 38 }}
            fontWeight={800}
            color="var(--text-color)"
          >
            Checkout
          </Typography>
          <Typography fontSize={{ xs: 12.5, md: 14 }} color="var(--text-color-secondary)">
            We&apos;ll confirm your order by phone or WhatsApp within 24 hours.
          </Typography>
        </Stack>

        <StepIndicator step={step} />

        {step === "billing" && (
          <BillingDetails
            billingDetails={billingDetails}
            onChange={onChange}
            errors={errors}
            touched={touched}
            setTouched={setTouched}
            onNext={handleNext}
          />
        )}

        {step === "order" && (
          <OrderSummary
            billingDetails={billingDetails}
            onBack={() => setStep("billing")}
            onDone={(r) => { setResult(r); setStep("done"); }}
            toast={toast}
          />
        )}

        {step === "done" && <OrderPlaced result={result} />}
      </Stack>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </main>
  );
}

/* ------------------------------------------------------------------ steps */

function StepIndicator({ step }) {
  const steps = [
    { key: "billing", label: "Billing details" },
    { key: "order", label: "Review & place" },
    { key: "done", label: "Confirmed" },
  ];
  const idx = steps.findIndex((s) => s.key === step);

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" width="100%">
      {steps.map((s, i) => {
        const active = i === idx;
        const past = i < idx;
        return (
          <Stack key={s.key} direction="row" alignItems="center" flex={i < steps.length - 1 ? 1 : "0 0 auto"} minWidth={0}>
            <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
              <Box
                sx={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  display: "grid", placeItems: "center",
                  fontSize: 12.5, fontWeight: 800,
                  color: active || past ? "#fff" : "var(--text-color-trinary)",
                  backgroundColor: active || past ? "var(--primary-color)" : "#f0f0f0",
                }}
              >
                {past ? "✓" : i + 1}
              </Box>
              {/* Labels would crowd a phone; the numbered dots carry the state there */}
              <Typography
                sx={{ display: { xs: "none", sm: "block" } }}
                fontSize={13}
                fontWeight={active ? 800 : 600}
                color={active ? "var(--text-color)" : "var(--text-color-secondary)"}
                noWrap
              >
                {s.label}
              </Typography>
            </Stack>
            {i < steps.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mx: 1.25, borderRadius: 9, backgroundColor: past ? "var(--primary-color)" : "#ececec" }} />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

function Card({ children, sx }) {
  return (
    <Stack
      gap={2}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #ededed",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography fontSize={{ xs: 15, md: 17 }} fontWeight={800} color="var(--text-color)">
      {children}
    </Typography>
  );
}

/* ---------------------------------------------------------------- billing */

function BillingDetails({ billingDetails, onChange, errors, touched, setTouched, onNext }) {
  const field = (f) => {
    const bad = touched[f.name] && errors[f.name];
    return (
      <Box key={f.name} sx={{ gridColumn: { xs: "span 2", sm: `span ${f.span}` } }}>
        <TextField
          fullWidth
          size="small"
          label={f.label}
          name={f.name}
          type={f.type || "text"}
          value={billingDetails[f.name] || ""}
          onChange={onChange}
          onBlur={() => setTouched((t) => ({ ...t, [f.name]: true }))}
          multiline={f.multiline}
          rows={f.rows}
          error={Boolean(bad)}
          helperText={bad || " "}
          inputProps={{ inputMode: f.inputMode, maxLength: f.maxLength }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
            },
            "& label.Mui-focused": { color: "var(--primary-color)" },
            "& .MuiFormHelperText-root": { minHeight: 18, mt: 0.25 },
          }}
        />
      </Box>
    );
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(2, 1fr)" },
    columnGap: 2,
  };

  return (
    <Stack gap={{ xs: 2, md: 2.5 }}>
      <Card>
        <SectionTitle>Contact information</SectionTitle>
        <Box sx={grid}>{FIELDS.filter((f) => f.group === "contact").map(field)}</Box>
      </Card>

      <Card>
        <SectionTitle>Shipping address</SectionTitle>
        <Box sx={grid}>{FIELDS.filter((f) => f.group === "shipping").map(field)}</Box>
      </Card>

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between">
        <Button
          component={Link}
          href="/shop"
          startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: "none", fontWeight: 700, color: "var(--primary-color)",
            order: { xs: 2, sm: 1 },
            "&:hover": { backgroundColor: "#fff1ea" },
          }}
        >
          Back to shop
        </Button>
        <Button
          onClick={onNext}
          sx={{
            order: { xs: 1, sm: 2 },
            textTransform: "none", fontWeight: 800, fontSize: 15,
            py: 1.25, px: 4, borderRadius: "10px",
            width: { xs: "100%", sm: "auto" },
            color: "#fff", backgroundColor: "var(--primary-color)",
            "&:hover": { backgroundColor: "#e34100" },
          }}
        >
          Continue to review
        </Button>
      </Stack>
    </Stack>
  );
}

/* ----------------------------------------------------------- order review */

function OrderSummary({ billingDetails, onBack, onDone, toast }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("cart")) || []); } catch { setCart([]); }
    setReady(true);
  }, []);

  const total = cart.reduce((a, i) => a + line(i), 0);
  const mrp = cart.reduce((a, i) => a + Math.round(i.price * (i.count || 0)), 0);
  const belowMin = total <= MIN_ORDER;

  const handlePlaceOrder = async () => {
    if (belowMin) {
      toast(`Order total must be above ${inr(MIN_ORDER)} to place an order.`);
      return;
    }
    setLoading(true);
    try {
      // toBlob() is the browser API. (toBuffer() returns a Node stream whose
      // chunks needed Buffer.concat - Buffer does not exist in the browser.)
      const blob = await pdf(
        <Template1 billingDetails={billingDetails} productList={cart} />
      ).toBlob();

      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });

      // One call: it records the order, then emails the customer their invoice
      // and the shop its packing notice. Both carry the order reference.
      let ref = null;
      let mail = { customer: false, shop: false };
      try {
        const saved = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billingDetails, productList: cart, invoice: base64 }),
        });
        const j = await saved.json().catch(() => ({}));
        if (saved.ok) {
          ref = j.ref;
          mail = j.mail || mail;
        }
      } catch {
        /* keep going: the customer still gets their invoice below */
      }

      const recorded = Boolean(ref);
      if (recorded) localStorage.removeItem("cart");
      onDone({ emailSent: mail.customer, recorded, ref, mail, invoice: blob, billing: billingDetails, total, cart });
    } catch (err) {
      console.error("Place order failed:", err);
      toast("Could not prepare your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <Stack alignItems="center" py={6}><CircularProgress sx={{ color: "var(--primary-color)" }} /></Stack>
    );
  }

  return (
    <Stack gap={{ xs: 2, md: 2.5 }}>
      <Button
        onClick={onBack}
        startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
        sx={{
          textTransform: "none", fontWeight: 700, width: "fit-content",
          color: "var(--primary-color)", "&:hover": { backgroundColor: "#fff1ea" },
        }}
      >
        Edit billing details
      </Button>

      <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 2, md: 3 }} alignItems="flex-start">
        {/* Items */}
        <Stack flex={1} gap={2} width="100%" minWidth={0}>
          <Card>
            <SectionTitle>Your order ({cart.length} {cart.length === 1 ? "item" : "items"})</SectionTitle>

            {cart.length === 0 ? (
              <Stack alignItems="center" gap={1} py={3}>
                <Typography fontWeight={700} color="var(--text-color)">Your cart is empty</Typography>
                <Button component={Link} href="/shop" sx={{ textTransform: "none", fontWeight: 700, color: "var(--primary-color)" }}>
                  Browse crackers
                </Button>
              </Stack>
            ) : (
              <Stack divider={<Divider flexItem />} gap={1.25}>
                {/* Card rows, not a 700px-wide table - that forced sideways
                    scrolling on every phone. */}
                {cart.map((row) => (
                  <Stack key={row.id ?? row.name} direction="row" gap={1.5} alignItems="center" pt={1.25}>
                    <Box
                      component="img"
                      src={assetUrl(row.image?.[0])}
                      alt=""
                      sx={{ width: 52, height: 52, borderRadius: "8px", objectFit: "cover", flexShrink: 0, backgroundColor: "#f6f6f6" }}
                    />
                    <Stack flex={1} minWidth={0}>
                      <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)" sx={{ lineHeight: 1.3 }}>
                        {row.name}
                      </Typography>
                      <Typography fontSize={11.5} color="var(--text-color-secondary)" fontWeight={600}>
                        {inr(unit(row))} × {row.count}
                      </Typography>
                    </Stack>
                    <Typography fontSize={14} fontWeight={800} color="var(--text-color)" whiteSpace="nowrap">
                      {inr(line(row))}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Card>

          <Card>
            <SectionTitle>Delivering to</SectionTitle>
            <Stack gap={0.25}>
              <Typography fontSize={13.5} fontWeight={800} color="var(--text-color)">{billingDetails.name}</Typography>
              <Typography fontSize={13} color="var(--text-color-secondary)">{billingDetails.address}</Typography>
              <Typography fontSize={13} color="var(--text-color-secondary)">
                {billingDetails.city}, {billingDetails.state} — {billingDetails.zip}
              </Typography>
              <Typography fontSize={13} color="var(--text-color-secondary)" mt={0.5}>
                {billingDetails.phone} · {billingDetails.email}
              </Typography>
            </Stack>
          </Card>

          {/* Legal notice - wording unchanged */}
          <Stack direction="row" gap={1.25} sx={{ backgroundColor: "#fff7f3", border: "1px solid #ffe2d5", borderRadius: "12px", p: 2 }}>
            <InfoOutlinedIcon sx={{ color: "var(--primary-color)", fontSize: 20, flexShrink: 0, mt: "1px" }} />
            <Typography fontSize={12.5} lineHeight={1.6} color="var(--text-color)">
              As per 2018 supreme court order, online sale of firecrackers are not
              permitted! We value our customers and at the same time, respect
              jurisdiction. We request you to add your products to the cart and submit
              the required crackers through the place order button. We will contact
              you within 24 hrs and confirm the order through WhatsApp or phone call.
              Please add and submit your orders and enjoy your Diwali with Fire
              Crackers.
            </Typography>
          </Stack>
        </Stack>

        {/* Totals - sticky beside the list on desktop, stacked on mobile */}
        <Box sx={{ width: { xs: "100%", md: 330 }, flexShrink: 0, position: { md: "sticky" }, top: { md: 24 } }}>
          <Card>
            <SectionTitle>Payment summary</SectionTitle>

            <Stack gap={0.75}>
              <Row label={`Price (${cart.reduce((a, i) => a + (i.count || 0), 0)} items)`} value={inr(mrp)} strike />
              <Row label="Discount" value={`− ${inr(mrp - total)}`} green />
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontSize={15} fontWeight={800} color="var(--text-color)">Total</Typography>
                <Typography fontSize={20} fontWeight={800} color="var(--text-color)">{inr(total)}</Typography>
              </Stack>
            </Stack>

            {belowMin && cart.length > 0 && (
              <Stack direction="row" gap={1} alignItems="center" sx={{ backgroundColor: "#fff4f4", border: "1px solid #ffd4d4", borderRadius: "10px", px: 1.5, py: 1 }}>
                <ErrorOutlineRoundedIcon sx={{ color: "#e03131", fontSize: 18 }} />
                <Typography fontSize={12} fontWeight={700} color="#c92a2a">
                  Add {inr(MIN_ORDER - total + 1)} more — minimum order is {inr(MIN_ORDER)}
                </Typography>
              </Stack>
            )}

            <LoadingButton
              loading={loading}
              disabled={cart.length === 0 || belowMin}
              onClick={handlePlaceOrder}
              sx={{
                textTransform: "none", fontWeight: 800, fontSize: 15,
                py: 1.3, borderRadius: "10px",
                color: "#fff", backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "#e34100" },
                "&.Mui-disabled": { backgroundColor: "#ffd0bd", color: "#fff" },
              }}
            >
              Place Order
            </LoadingButton>

            <Typography fontSize={11} textAlign="center" color="var(--text-color-secondary)">
              You&apos;ll be able to download your proforma next.
            </Typography>
          </Card>
        </Box>
      </Stack>
    </Stack>
  );
}

function Row({ label, value, strike, green }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography fontSize={12.5} fontWeight={green ? 700 : 600} color={green ? "#1d9b53" : "var(--text-color-secondary)"}>
        {label}
      </Typography>
      <Typography
        fontSize={12.5}
        fontWeight={green ? 800 : 600}
        color={green ? "#1d9b53" : "var(--text-color-secondary)"}
        sx={strike ? { textDecoration: "line-through" } : undefined}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* --------------------------------------------------------------- confirmed */

function OrderPlaced({ result }) {
  const router = useRouter();
  const [downloaded, setDownloaded] = useState(false);
  if (!result) return null;

  const { emailSent, recorded, ref, mail, invoice, billing, total } = result;
  // Recorded in the order store counts as success even if the mail bounced -
  // the shop can see it in the admin panel either way.
  const received = emailSent || recorded;

  const fileName = `Sankamithra-Proforma-${ref || (billing?.name || "order")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")}.pdf`;

  const download = () => {
    const url = URL.createObjectURL(invoice);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setDownloaded(true);
  };

  return (
    <Stack alignItems="center" gap={2.5} py={{ xs: 1, md: 3 }}>
      <Stack alignItems="center" gap={1.5} textAlign="center" maxWidth={560}>
        {received ? (
          <>
            <CheckCircleRoundedIcon sx={{ fontSize: 60, color: "#1d9b53" }} />
            <Typography className={quicksand.className} fontSize={{ xs: 22, md: 27 }} fontWeight={800} color="var(--text-color)">
              Order placed 🎉
            </Typography>
            {ref && (
              <Chip
                label={`Order ${ref}`}
                sx={{ fontWeight: 800, backgroundColor: "#fff1ea", color: "var(--primary-color)" }}
              />
            )}
            <Typography fontSize={14} color="var(--text-color-secondary)">
              Thanks {billing?.name?.split(" ")[0] || "there"} — we&apos;ve received your order
              of <b>{inr(total)}</b>. Our team will call or WhatsApp you on{" "}
              <b>{billing?.phone}</b> within 24 hours to confirm.
            </Typography>

            {/* Say plainly whether the receipt actually sent, rather than
                implying an email that never left. */}
            <Typography fontSize={13} color={mail?.customer ? "var(--success)" : "var(--text-color-secondary)"} fontWeight={mail?.customer ? 700 : 600}>
              {mail?.customer
                ? `A copy of your proforma has been emailed to ${billing?.email}.`
                : "We couldn't email your proforma — download it below and keep a copy."}
            </Typography>
          </>
        ) : (
          <>
            <ErrorOutlineRoundedIcon sx={{ fontSize: 60, color: "var(--badge-color)" }} />
            <Typography className={quicksand.className} fontSize={{ xs: 22, md: 27 }} fontWeight={800} color="var(--text-color)">
              We couldn&apos;t record your order
            </Typography>
            <Typography fontSize={14} color="var(--text-color-secondary)">
              Neither our mail server nor our order system could be reached.
              <b> Download your proforma below</b> and send it to us on WhatsApp and
              we&apos;ll process it right away. Your cart has been kept.
            </Typography>
          </>
        )}
      </Stack>

      <Card sx={{ width: "100%" }}>
        <Stack gap={1.5} width="100%" maxWidth={480} mx="auto">
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack>
              <Typography fontSize={14} fontWeight={800} color="var(--text-color)">Your proforma</Typography>
              <Typography fontSize={12} color="var(--text-color-secondary)">
                PDF · {inr(total)} · {billing?.name}
              </Typography>
            </Stack>
            {downloaded && (
              <Chip label="Downloaded" size="small" sx={{ fontWeight: 700, fontSize: 11, backgroundColor: "#e9f8ef", color: "#14713c" }} />
            )}
          </Stack>

          <Button
            onClick={download}
            startIcon={<DownloadRoundedIcon />}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 15,
              py: 1.3, borderRadius: "10px",
              color: "#fff", backgroundColor: "var(--primary-color)",
              "&:hover": { backgroundColor: "#e34100" },
            }}
          >
            Download proforma
          </Button>

          <Button
            onClick={() => router.push("/shop")}
            sx={{
              textTransform: "none", fontWeight: 700, fontSize: 14,
              borderRadius: "10px", py: 1.1,
              color: "var(--primary-color)", border: "1.5px solid var(--primary-color)",
              "&:hover": { backgroundColor: "#fff1ea" },
            }}
          >
            Continue shopping
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
