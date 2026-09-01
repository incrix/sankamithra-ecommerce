"use client";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import Logo from "@/public/images/logo.png";
import { BUSINESS } from "@/util/site";

/**
 * Pieces shared by the packing list and the delivery challan, so the two
 * documents read as a matched pair rather than two unrelated printouts.
 */

export const INK = "#1a1a1a";
export const MUTED = "#666";
export const LINE = "#d8d8d8";
export const ACCENT = "#ff4800";

export const s = StyleSheet.create({
  page: { padding: 28, fontFamily: "Lato", fontSize: 9, color: INK },
  brandRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  logo: { width: 54, height: 54, objectFit: "contain" },
  brandName: { fontSize: 11, fontFamily: "Lato Bold", textTransform: "uppercase" },
  small: { fontSize: 7.5, color: MUTED, maxWidth: 230, lineHeight: 1.5 },
  docTitle: { fontSize: 15, fontFamily: "Lato Bold", textTransform: "uppercase", letterSpacing: 1 },
  rule: { borderBottomWidth: 1, borderBottomColor: INK, marginVertical: 10 },
  hair: { borderBottomWidth: 1, borderBottomColor: LINE },
  // flexBasis 0 so a row of these divides evenly regardless of how much
  // text each one holds - otherwise the wider fields squeeze their neighbours.
  box: { borderWidth: 1, borderColor: LINE, borderRadius: 3, padding: 8, flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  boxLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  th: { fontSize: 7.5, fontFamily: "Lato Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  headRow: { flexDirection: "row", backgroundColor: "#f2f2f2", paddingVertical: 5, paddingHorizontal: 6 },
  row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: LINE },
  strike: { textDecoration: "line-through", color: MUTED },
  footer: { position: "absolute", bottom: 20, left: 28, right: 28, fontSize: 7, color: MUTED, textAlign: "center" },
});

export const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

export const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/** Masthead: who the document is from, and what the document is. */
export function DocHeader({ title, subtitle }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={s.brandRow}>
          <Image src={Logo.src} style={s.logo} />
          <View style={{ gap: 2 }}>
            <Text style={s.brandName}>{BUSINESS.name}</Text>
            <Text style={s.small}>
              {BUSINESS.office.street}, {BUSINESS.office.locality} {BUSINESS.office.postalCode}
            </Text>
            <Text style={s.small}>
              {BUSINESS.phone[0]} · {BUSINESS.email}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 3 }}>
          <Text style={s.docTitle}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: 8, color: MUTED }}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={s.rule} />
    </View>
  );
}

/** One labelled block - order reference, a party's address, and so on. */
export function Field({ label, children, style }) {
  return (
    <View style={[s.box, style]}>
      <Text style={s.boxLabel}>{label}</Text>
      {children}
    </View>
  );
}

/** The lines of an order, resolved to what is actually going in the box. */
export function packedLines(order) {
  return (order.items || []).map((i) => {
    if (i.substitute) {
      return {
        name: i.substitute.name,
        replaces: i.name,
        count: i.substitute.count,
        unitPrice: i.substitute.unitPrice,
        total: Math.round((i.substitute.unitPrice || 0) * (i.substitute.count || 0)),
        state: "replaced",
      };
    }
    if (i.unavailable) {
      return { name: i.name, count: 0, unitPrice: i.unitPrice, total: 0, state: "dropped" };
    }
    return { name: i.name, count: i.count, unitPrice: i.unitPrice, total: i.total, state: "ok" };
  });
}
