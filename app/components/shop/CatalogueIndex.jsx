import Link from "next/link";
import { Stack, Box, Typography } from "@mui/material";
import { productSlug, categorySlug, priceOf } from "@/util/site";

/**
 * Server-rendered index of the catalogue.
 *
 * The shop grid above is client-rendered - its products are fetched in the
 * browser, so a crawler that does not execute JavaScript sees an empty page and
 * none of the 145 product URLs. This section puts every one of them into the
 * HTML as a real anchor, which is how they get discovered and how link equity
 * reaches them. It is a genuine index for people too.
 */
export default function CatalogueIndex({ products, categories }) {
  const byCategory = categories.map((c) => ({
    ...c,
    items: products.filter((p) => p.category === c.name),
  }));

  return (
    <Stack component="section" gap={2.5} aria-labelledby="catalogue-index-heading">
      <Stack gap={0.5}>
        <Typography id="catalogue-index-heading" component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} color="var(--text-color)">
          All crackers by category
        </Typography>
        <Typography fontSize={14} color="var(--text-color-secondary)" lineHeight={1.7}>
          The full Sankamithra Thunder World price list — {products.length} crackers across{" "}
          {categories.length} categories, stocked from licensed makers around Sivakasi and sold
          direct at up to 90% off.
        </Typography>
      </Stack>

      <Stack gap={1.5}>
        {byCategory.map((c) => (
          <Box
            key={c.name}
            component="details"
            id={categorySlug(c.name)}
            sx={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              p: { xs: 1.75, md: 2 },
              backgroundColor: "var(--surface)",
            }}
          >
            <Box component="summary" sx={{ cursor: "pointer", listStyle: "none", "&::-webkit-details-marker": { display: "none" } }}>
              <Typography component="h3" fontSize={15} fontWeight={800} color="var(--text-color)" display="inline">
                {c.name} crackers
              </Typography>
              <Typography component="span" fontSize={13} color="var(--text-color-secondary)" ml={1}>
                {c.count} items
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 0.75, mt: 1.5 }}>
              {c.items.map((p) => (
                <Typography
                  key={p.id}
                  component={Link}
                  href={`/product/${productSlug(p)}`}
                  fontSize={13}
                  color="var(--text-color-secondary)"
                  sx={{ "&:hover": { color: "var(--primary-color)", textDecoration: "underline" } }}
                >
                  {p.name} — ₹{priceOf(p)}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
