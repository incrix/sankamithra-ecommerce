"use client";
import { Stack, Box, Typography, Divider } from "@mui/material";
import Link from "next/link";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import logo from "../../public/images/logo.svg";
import green from "../../public/images/green.png";
import iso from "../../public/images/iso.png";

/**
 * Site footer.
 *
 * Layout now comes from CSS breakpoints rather than useWindowSize(): that hook
 * returns undefined on the first render, so the footer used to mount with the
 * wrong padding and visibly jump once JS measured the window.
 */

const COMPANY = [
  { href: "/", label: "Shop crackers" },
  { href: "/about", label: "About us" },
  { href: "/factory", label: "Our factory" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/safety", label: "Safety guide" },
  { href: "/contact", label: "Contact us" },
];

const CATEGORIES = [
  ["Flower Pots", "Flowerpots"],
  ["Ground Chakkars", "Ground Chakkar"],
  ["One Sound", "One Sound"],
  ["Special's", "Special’s"],
  ["Rockets", "Rocket"],
  ["Repeating shots", "Aerials"],
  ["Atom bombs", "Bombs"],
  ["Twinklers", "Twinklers"],
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        mt: { xs: 6, md: 10 },
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--surface-muted)",
      }}
    >
      <Stack
        width="100%"
        maxWidth="var(--max-width)"
        mx="auto"
        px={{ xs: 2, sm: 3, md: 4 }}
        py={{ xs: 4, md: 6 }}
        gap={4}
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3.5, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "1.4fr 1fr 1.2fr 0.8fr",
            },
          }}
        >
          {/* Brand + contact */}
          <Stack gap={1.5}>
            <Stack direction="row" gap={1.25} alignItems="center">
              <Box component="img" src={logo.src} alt="Sankamithra" sx={{ width: 62 }} />
              <Stack>
                <Typography fontSize={19} fontWeight={800} color="var(--text-color)" lineHeight={1.2}>
                  Sankamithra
                </Typography>
                <Typography fontSize={11.5} fontWeight={600} color="var(--text-color-secondary)">
                  Fireworks &amp; Crackers
                </Typography>
              </Stack>
            </Stack>

            <Typography fontSize={13.5} color="var(--text-color-secondary)" lineHeight={1.7}>
              Fireworks and crackers manufacturer in Sivakasi, Tamil Nadu. Buy Diwali
              crackers online direct from our Sattur factory at up to 90% off, with
              delivery across India.
            </Typography>

            <Stack gap={0.75} mt={0.5}>
              <ContactLine icon={<PhoneRoundedIcon sx={ic} />} href="tel:+917548820326">
                +91 75488 20326
              </ContactLine>
              <ContactLine icon={<MailOutlineRoundedIcon sx={ic} />} href="mailto:sankamithrathunderworld@gmail.com">
                sankamithrathunderworld@gmail.com
              </ContactLine>
              <ContactLine icon={<PlaceOutlinedIcon sx={ic} />}>
                Sattur, Tamil Nadu 626203
              </ContactLine>
            </Stack>
          </Stack>

          <FooterCol title="Company">
            {COMPANY.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Categories">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr" }, gap: 1 }}>
              {CATEGORIES.map(([cat, label]) => (
                <FooterLink key={cat} href={`/?category=${encodeURIComponent(cat)}`}>
                  {label}
                </FooterLink>
              ))}
            </Box>
          </FooterCol>

          <FooterCol title="Certified">
            <Stack direction="row" gap={1.5} flexWrap="wrap">
              <Box component="img" src={green.src} alt="Green certified" sx={{ width: 78 }} />
              <Box component="img" src={iso.src} alt="ISO certified" sx={{ width: 78 }} />
            </Stack>
          </FooterCol>
        </Box>

        <Divider />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1.5}
        >
          <Typography fontSize={12.5} color="var(--text-color-secondary)" lineHeight={1.7}>
            © {year}{" "}
            <Box component="span" sx={{ color: "var(--primary-color)", fontWeight: 700 }}>
              Sankamithra Fireworks
            </Box>
            . All rights reserved.
          </Typography>

          <Stack direction="row" alignItems="center" gap={1}>
            <Typography fontSize={12.5} color="var(--text-color-secondary)">Designed by</Typography>
            <Box
              component="a"
              href="https://incrix.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontSize: 13, fontWeight: 800, color: "var(--text-color)", "&:hover": { color: "var(--primary-color)" } }}
            >
              Incrix
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

const ic = { fontSize: 15, color: "var(--primary-color)", flexShrink: 0 };

function FooterCol({ title, children }) {
  return (
    <Stack gap={1.5}>
      <Typography fontSize={14} fontWeight={800} color="var(--text-color)" textTransform="uppercase" letterSpacing={0.5}>
        {title}
      </Typography>
      <Stack gap={1}>{children}</Stack>
    </Stack>
  );
}

function FooterLink({ href, children }) {
  return (
    <Typography
      component={Link}
      href={href}
      fontSize={13.5}
      color="var(--text-color-secondary)"
      sx={{ transition: "color var(--transition)", "&:hover": { color: "var(--primary-color)" } }}
    >
      {children}
    </Typography>
  );
}

function ContactLine({ icon, href, children }) {
  const body = (
    <Stack direction="row" gap={1} alignItems="center">
      {icon}
      <Typography fontSize={12.5} color="var(--text-color-secondary)" sx={{ wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Stack>
  );
  if (!href) return body;
  return (
    <Box component="a" href={href} sx={{ "&:hover p": { color: "var(--primary-color)" } }}>
      {body}
    </Box>
  );
}
