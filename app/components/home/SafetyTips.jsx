"use client";
import { Stack, Box, Typography } from "@mui/material";

/**
 * Fire safety guidance. Content is unchanged - it's safety copy - but it now
 * reads as two clear columns (do / don't) instead of one long undifferentiated
 * list, so the prohibitions stand out.
 */

const DO = [
  ["shop-vector.svg", "Purchase fireworks from licensed merchants."],
  ["adult-vector.svg", "Have a responsible adult in charge."],
  ["clean-vector.svg", "Prepare a safe, outdoor environment clear of other fireworks, dried wood, long grass and buildings."],
  ["water-vector.svg", "Have water, such as a garden hose, bucket or portable water pump, readily available in case of fire."],
  ["light-vector.svg", "Light fireworks one at a time and away from your body (and other people)."],
  ["instruct-vector.svg", "Display fireworks as per the warnings and instructions mentioned on the pack."],
];

const DONT = [
  ["illegal-vector.svg", "Never discharge illegal fireworks."],
  ["child-vector.svg", "Never give fireworks to children."],
  ["bomb-vector.svg", "Never try to extinguish live fireworks that are on fire."],
  ["pocket-vector.svg", "Never carry fireworks in your pocket."],
  ["animal-vector.svg", "Do not point fireworks on people or animals."],
  ["glass-vector.svg", "Never use metal or glass containers to launch fireworks."],
];

export default function SafetyTips() {
  return (
    <Stack gap={{ xs: 2, md: 3 }}>
      <Stack gap={0.5}>
        <Typography component="h2" fontSize={{ xs: 20, md: 26 }} fontWeight={800} lineHeight={1.25} color="var(--text-color)">Play it safe</Typography>
        <Typography fontSize={13.5} color="var(--text-color-secondary)">
          A few minutes of care keeps the celebration a happy one.
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, md: 3 } }}>
        <Column title="Do" tone="success" items={DO} />
        <Column title="Don't" tone="danger" items={DONT} />
      </Box>
    </Stack>
  );
}

function Column({ title, tone, items }) {
  const ink = tone === "success" ? "var(--success-ink)" : "var(--danger-ink)";
  const bg = tone === "success" ? "var(--success-soft)" : "var(--danger-soft)";

  return (
    <Stack
      gap={1.5}
      sx={{
        p: { xs: 2, md: 2.5 },
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--surface)",
      }}
    >
      <Box sx={{ alignSelf: "flex-start", px: 1.5, py: 0.4, borderRadius: "var(--radius-pill)", backgroundColor: bg, color: ink, fontSize: 12.5, fontWeight: 800 }}>
        {title}
      </Box>

      <Stack gap={1.5}>
        {items.map(([icon, text]) => (
          <Stack key={text} direction="row" gap={1.5} alignItems="flex-start">
            <Box
              component="img"
              src={`/images/${icon}`}
              alt=""
              sx={{ width: 26, height: 26, flexShrink: 0, mt: "1px" }}
            />
            <Typography fontSize={13.5} color="var(--text-color)" lineHeight={1.6}>
              {text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
