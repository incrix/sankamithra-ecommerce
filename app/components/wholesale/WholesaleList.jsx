"use client";
import { useMemo, useState } from "react";
import { Stack, Box, Typography, InputBase, Chip } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import { BUSINESS } from "@/util/site";
import { assetUrl } from "@/util/config";

/**
 * The dealer catalogue.
 *
 * Reads as a price list rather than a shop: no cart, no add buttons, because
 * a wholesale order is agreed on the phone and this page exists so the dealer
 * knows what to ask for. The three numbers a dealer actually needs - box rate,
 * what a case holds, and how many cases are left - lead every card.
 */

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const WA = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(
  "Hello Sankamithra, I would like to place a wholesale order:"
)}`;

export default function WholesaleList({ categories, count }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return categories
      .filter((c) => cat === "All" || c.name === cat)
      .map((c) => ({ ...c, items: c.items.filter((i) => !term || i.name.toLowerCase().includes(term)) }))
      .filter((c) => c.items.length);
  }, [categories, q, cat]);

  const visible = shown.reduce((n, c) => n + c.items.length, 0);

  return (
    <Box sx={{ minHeight: "100dvh", backgroundColor: "var(--surface)" }}>
      {/* The whole masthead: a name and what the page is. No logo, no
          navigation, no cart - a dealer opening this wants the rates, and
          anything else is a door back into a shop they are not shopping. */}
      <Stack maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, md: 4 }} pt={{ xs: 3, md: 4 }} gap={0.5}>
        <Typography component="h1" fontSize={{ xs: 21, md: 26 }} fontWeight={800} color="var(--text-color)">
          Sankamithra Fireworks
        </Typography>
        <Typography fontSize={13} color="var(--text-color-secondary)">
          Wholesale price list 2026 · effective 1 May 2026
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
          <Action href={WA} icon={<WhatsAppIcon sx={{ fontSize: 16 }} />} label="Order on WhatsApp" primary />
          <Action href={`tel:+91${BUSINESS.whatsapp.slice(2)}`} icon={<PhoneRoundedIcon sx={{ fontSize: 16 }} />} label={BUSINESS.phone[0]} />
        </Stack>
      </Stack>

      <Stack maxWidth="var(--max-width)" mx="auto" px={{ xs: 2, md: 4 }} pt={{ xs: 2, md: 2.5 }} pb={{ xs: 2.5, md: 3.5 }} gap={2}>
        <Stack direction="row" alignItems="center" gap={1}
          sx={{ px: 1.75, py: 1, borderRadius: "var(--radius-pill)", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--text-color-trinary)" }} />
          <InputBase placeholder="Search an item…" value={q} onChange={(e) => setQ(e.target.value)}
            sx={{ flex: 1, fontSize: 14.5 }} />
        </Stack>

        <Stack direction="row" gap={0.75} flexWrap="wrap">
          <Filter label={`All (${count})`} on={cat === "All"} onClick={() => setCat("All")} />
          {categories.map((c) => (
            <Filter key={c.name} label={`${c.name} (${c.items.length})`} on={cat === c.name} onClick={() => setCat(c.name)} />
          ))}
        </Stack>

        {visible === 0 ? (
          <Typography fontSize={14} color="var(--text-color-secondary)" textAlign="center" py={6}>
            {count === 0 ? "Nothing is in stock right now. Please call us." : "Nothing matches that."}
          </Typography>
        ) : (
          shown.map((c) => (
            <Stack key={c.name} gap={1.25}>
              <Stack direction="row" alignItems="baseline" gap={1} sx={{ pt: 1 }}>
                <Typography component="h2" fontSize={{ xs: 16, md: 18 }} fontWeight={800} color="var(--text-color)">
                  {c.name}
                </Typography>
                <Typography fontSize={12} color="var(--text-color-secondary)">
                  {c.items.length} {c.items.length === 1 ? "item" : "items"}
                </Typography>
              </Stack>

              <Box sx={{ display: "grid", gap: 1.25,
                         gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" } }}>
                {c.items.map((i) => <Card key={i.id} item={i} />)}
              </Box>
            </Stack>
          ))
        )}

        <Typography fontSize={11.5} color="var(--text-color-secondary)" textAlign="center" sx={{ pt: 2, pb: 4 }}>
          Prices are ex-factory. Handling &amp; forwarding @3%, GST and bank commission extra.
          Rates are subject to revision without notice. 100% advance with order. Subject to Sivakasi jurisdiction.
        </Typography>
      </Stack>
    </Box>
  );
}

function Card({ item }) {
  const low = item.stock != null && item.stock <= 5;
  return (
    <Stack gap={1.25} sx={{ p: 1.5, borderRadius: "var(--radius)", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <Stack direction="row" gap={1.25} alignItems="flex-start">
        {item.image && (
          // Large enough to tell two similar fountains apart across a phone
          // screen - at thumbnail size a dealer was reading the name to work
          // out what the picture was, which defeats having one.
          <Box component="img" src={assetUrl(item.image)} alt="" loading="lazy"
            sx={{ width: { xs: 88, sm: 96 }, height: { xs: 88, sm: 96 },
                  borderRadius: "var(--radius)", objectFit: "cover", flexShrink: 0,
                  backgroundColor: "#f6f6f6", border: "1px solid var(--border)" }} />
        )}
        <Stack flex={1} minWidth={0} gap={0.25}>
          <Typography fontSize={14.5} fontWeight={800} color="var(--text-color)" lineHeight={1.3}>{item.name}</Typography>
          <Typography fontSize={11} color="var(--text-color-trinary)" fontFamily="monospace">{item.code}</Typography>
        </Stack>
      </Stack>

      <Stack direction="row" gap={1}>
        {item.contents ? <Cell label="Box contents" value={item.contents} /> : null}
        <Cell label={`Price / ${item.per}`} value={inr(item.price)} accent />
        <Cell label="Cs / Cont" value={`${item.caseQty} ${item.caseUnit}`} />
      </Stack>

      {item.stock != null && (
        <Typography fontSize={11.5} fontWeight={700} color={low ? "#b26a00" : "var(--text-color-secondary)"}>
          {item.stock} {item.stock === 1 ? "case" : "cases"} in stock
        </Typography>
      )}
    </Stack>
  );
}

const Cell = ({ label, value, accent, warn }) => (
  <Stack flex={1} minWidth={0} gap={0.15}>
    <Typography fontSize={9.5} fontWeight={800} textTransform="uppercase" letterSpacing={0.4} color="var(--text-color-trinary)">
      {label}
    </Typography>
    <Typography fontSize={14} fontWeight={800} noWrap
      color={accent ? "var(--primary-color)" : warn ? "#b26a00" : "var(--text-color)"}>
      {value}
    </Typography>
  </Stack>
);

const Filter = ({ label, on, onClick }) => (
  <Chip label={label} onClick={onClick} size="small"
    sx={{ fontWeight: 800, fontSize: 11.5, cursor: "pointer",
          backgroundColor: on ? "var(--primary-color)" : "var(--surface)",
          color: on ? "#fff" : "var(--text-color-secondary)",
          border: "1px solid", borderColor: on ? "var(--primary-color)" : "var(--border)",
          "&:hover": { backgroundColor: on ? "var(--primary-color)" : "var(--surface-muted)" } }} />
);

const Action = ({ href, icon, label, primary }) => (
  <Stack component="a" href={href} target="_blank" rel="noopener noreferrer"
    direction="row" alignItems="center" gap={0.75}
    sx={{ px: 1.75, py: 0.9, borderRadius: "var(--radius-pill)", textDecoration: "none",
          fontSize: 13, fontWeight: 800,
          border: "1px solid", borderColor: primary ? "var(--primary-color)" : "var(--border)",
          backgroundColor: primary ? "var(--primary-color)" : "transparent",
          color: primary ? "#fff" : "var(--text-color-secondary)" }}>
    {icon}{label}
  </Stack>
);
