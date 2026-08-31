import { Stack, Typography, Box } from "@mui/material";

/**
 * Server-rendered FAQ. Plain <details> elements rather than a JS accordion, so
 * the answers exist in the HTML for search and answer engines to read even
 * before any JavaScript runs.
 */
export default function Faq({ heading = "Frequently asked questions", intro, faqs }) {
  return (
    <Stack gap={2} component="section" aria-labelledby="faq-heading">
      <Stack gap={0.5}>
        <Typography id="faq-heading" component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} color="var(--text-color)">
          {heading}
        </Typography>
        {intro && (
          <Typography fontSize={14} color="var(--text-color-secondary)">{intro}</Typography>
        )}
      </Stack>

      <Stack gap={1.25}>
        {faqs.map((f) => (
          <Box
            key={f.q}
            component="details"
            sx={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              p: { xs: 1.75, md: 2 },
              backgroundColor: "var(--surface)",
              "&[open]": { borderColor: "var(--primary-border)", backgroundColor: "var(--primary-softer)" },
            }}
          >
            <Box component="summary" sx={{ fontWeight: 800, fontSize: 15, cursor: "pointer", color: "var(--text-color)", listStyle: "none", "&::-webkit-details-marker": { display: "none" } }}>
              {f.q}
            </Box>
            <Typography component="p" mt={1.25} fontSize={14} lineHeight={1.8} color="var(--text-color-secondary)">
              {f.a}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
