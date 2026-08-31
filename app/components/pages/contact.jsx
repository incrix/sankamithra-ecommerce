"use client";
import { Stack, Box, Typography, Button, Divider } from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

/**
 * Contact page. Same addresses and numbers as before, restructured into two
 * location cards with tappable phone links, plus the map.
 *
 * The previous version set every address in 20px type inside `<br />`-separated
 * blocks and put the phone numbers in plain text - not tappable on a phone,
 * which is how most people reach a fireworks shop.
 */

const LOCATIONS = [
  {
    label: "Office",
    lines: ["3/1427/G6", "Opposite PRC Bus Depot", "Sattur Road", "Sivakasi - 626123"],
    phones: ["+91 99446 95228", "+91 75488 20326"],
  },
  {
    label: "Factory",
    lines: ["9/241", "Kanmaisurangudi Village", "Sattur - 626203"],
    phones: ["+91 99620 66648", "+91 84892 92901"],
  },
];

const MAP_SRC = "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1340.1052666001385!2d77.87118833935341!3d9.298856736284566!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06b55da9401d09%3A0xb66acba031fbce0d!2sSankamithra%20Fireworks!5e1!3m2!1sen!2sin!4v1723530302527!5m2!1sen!2sin";
const digits = (s) => s.replace(/\D/g, "");

export default function ContactContent() {
  return (
    <main style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 3, md: 5 }}
        gap={{ xs: 3, md: 5 }}
      >
        <Stack gap={1} maxWidth={640}>
          <Typography component="h1" fontSize={{ xs: 27, sm: 32, md: 40 }} fontWeight={800} lineHeight={1.15} color="var(--text-color)">Contact us</Typography>
          <Typography fontSize={{ xs: 14, md: 15.5 }} color="var(--text-color-secondary)" lineHeight={1.7}>
            Questions about an order, bulk enquiries, or directions to the shop —
            call or message us and we&apos;ll get straight back to you.
          </Typography>
        </Stack>

        {/* Quick actions first: most people are here to call */}
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
          <Button href="tel:+919944695228" startIcon={<PhoneRoundedIcon />} sx={primaryBtn}>
            Call the shop
          </Button>
          <Button
            href="https://wa.me/919489239970?text=Hello%20Sankamithra%2C%20I%20have%20a%20question"
            target="_blank" rel="noopener noreferrer"
            startIcon={<WhatsAppIcon />}
            sx={waBtn}
          >
            WhatsApp us
          </Button>
          <Button href="mailto:sankamithrathunderworld@gmail.com" startIcon={<MailOutlineRoundedIcon />} sx={ghostBtn}>
            Email
          </Button>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, md: 3 } }}>
          {LOCATIONS.map((loc) => (
            <Stack key={loc.label} gap={1.5} sx={card}>
              <Stack direction="row" alignItems="center" gap={1}>
                <PlaceOutlinedIcon sx={{ color: "var(--primary-color)", fontSize: 20 }} />
                <Typography fontSize={16} fontWeight={800} color="var(--text-color)">{loc.label}</Typography>
              </Stack>

              <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.8}>
                {loc.lines.join(", ")}
              </Typography>

              <Divider />

              <Stack gap={0.75}>
                {loc.phones.map((ph) => (
                  <Stack
                    key={ph}
                    component="a"
                    href={`tel:${digits(ph)}`}
                    direction="row" alignItems="center" gap={1}
                    sx={{ "&:hover p": { color: "var(--primary-color)" } }}
                  >
                    <PhoneRoundedIcon sx={{ fontSize: 15, color: "var(--primary-color)" }} />
                    <Typography fontSize={14} fontWeight={700} color="var(--text-color)">{ph}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ))}
        </Box>

        <Stack direction="row" alignItems="center" gap={1.25} sx={{ ...card, flexDirection: "row" }}>
          <ScheduleRoundedIcon sx={{ color: "var(--primary-color)", fontSize: 20 }} />
          <Typography fontSize={14} color="var(--text-color)">
            <b>Open Mon–Sat, 9am – 7pm.</b>{" "}
            <Box component="span" sx={{ color: "var(--text-color-secondary)" }}>
              Orders placed online are confirmed by phone within 24 hours.
            </Box>
          </Typography>
        </Stack>

        <Stack gap={1.5}>
          <Typography component="h2" fontSize={{ xs: 19, md: 23 }} color="var(--text-color)">Find us</Typography>
          <Box
            sx={{
              width: "100%", height: { xs: 280, md: 420 },
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <Box
              component="iframe"
              src={MAP_SRC}
              title="Sankamithra location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          </Box>
        </Stack>
      </Stack>
    </main>
  );
}

const card = {
  p: { xs: 2, md: 2.5 },
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--surface)",
};

const base = {
  textTransform: "none", fontWeight: 800, fontSize: 14.5,
  py: 1.15, px: 2.75, borderRadius: "var(--radius-pill)",
};
const primaryBtn = { ...base, color: "#fff", backgroundColor: "var(--primary-color)", "&:hover": { backgroundColor: "var(--primary-dark)" } };
const waBtn = { ...base, color: "#fff", backgroundColor: "#128c7e", "&:hover": { backgroundColor: "#0f7568" } };
const ghostBtn = { ...base, color: "var(--text-color)", border: "1.5px solid var(--border-strong)", "&:hover": { borderColor: "var(--primary-color)", color: "var(--primary-color)", backgroundColor: "var(--primary-soft)" } };
