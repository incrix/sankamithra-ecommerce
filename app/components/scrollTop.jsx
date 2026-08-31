"use client";
import { Fab, Zoom } from "@mui/material";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { useEffect, useState } from "react";

/**
 * Scroll-to-top.
 *
 * Replaces the old always-on floating button, which pulsed and glowed
 * continuously and sat on top of page content. This one only appears once
 * there's somewhere to scroll back to.
 */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Zoom in={show}>
      <Fab
        size="small"
        aria-label="scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        sx={{
          position: "fixed", bottom: 20, right: 20, zIndex: 900,
          color: "#fff", backgroundColor: "var(--primary-color)",
          boxShadow: "var(--shadow-lg)",
          "&:hover": { backgroundColor: "var(--primary-dark)" },
        }}
      >
        <KeyboardArrowUpRoundedIcon />
      </Fab>
    </Zoom>
  );
}
