"use client";
import { Document, Page, Text, View, Font } from "@react-pdf/renderer";
import { s, DocHeader, Field, packedLines, when, MUTED, LINE, INK } from "./shared";

/**
 * The sheet the packer carries to the shelves.
 *
 * Deliberately has no prices: it is a checklist, and money on it only invites
 * the wrong document going into the customer's parcel. Quantities are the
 * largest thing on the page, and every line has a box to tick by hand.
 */
export default function PackingListDoc({ order }) {
  Font.register({ family: "Lato", src: "https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wWw.ttf" });
  Font.register({ family: "Lato Bold", src: "https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6UVSwiPHA.ttf" });

  const c = order.customer || {};
  const lines = packedLines(order);
  const units = lines.reduce((n, l) => n + (l.count || 0), 0);
  const dropped = lines.filter((l) => l.state === "dropped").length;

  return (
    <Document title={`Packing list ${order.ref}`}>
      <Page size="A4" style={s.page}>
        <DocHeader title="Packing list" subtitle={`${order.ref} · ${when(order.createdAt)}`} />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Field label="Pack for">
            <Text style={{ fontFamily: "Lato Bold", fontSize: 10 }}>{c.name || "—"}</Text>
            <Text style={{ color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
              {[c.city, c.state].filter(Boolean).join(", ")}
            </Text>
            <Text style={{ color: MUTED }}>{c.phone || ""}</Text>
          </Field>
          <Field label="Order">
            <Text style={{ fontFamily: "Lato Bold", fontSize: 10 }}>{order.ref}</Text>
            <Text style={{ color: MUTED, marginTop: 2 }}>
              {order.source === "pos" ? "Counter bill" : "Website order"}
            </Text>
          </Field>
          <Field label="To pack">
            <Text style={{ fontFamily: "Lato Bold", fontSize: 10 }}>{units} units</Text>
            <Text style={{ color: MUTED, marginTop: 2 }}>
              {lines.length} lines{dropped ? ` · ${dropped} not supplied` : ""}
            </Text>
          </Field>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 24 }]}>OK</Text>
            <Text style={[s.th, { width: 26 }]}>#</Text>
            <Text style={[s.th, { flex: 1 }]}>Item</Text>
            <Text style={[s.th, { width: 60, textAlign: "center" }]}>Qty</Text>
          </View>

          {lines.map((l, i) => {
            const out = l.state === "dropped";
            return (
              <View key={i} style={s.row} wrap={false}>
                <View style={{ width: 24 }}>
                  <View style={{ width: 11, height: 11, borderWidth: 1, borderColor: out ? LINE : INK, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 26, color: MUTED }}>{i + 1}</Text>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[{ fontSize: 10, fontFamily: "Lato Bold" }, out && s.strike]}>{l.name}</Text>
                  {l.state === "replaced" && (
                    <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>
                      replaces {l.replaces}
                    </Text>
                  )}
                  {out && (
                    <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>
                      out of stock — do not pack
                    </Text>
                  )}
                </View>
                <Text style={{ width: 60, textAlign: "center", fontSize: 13, fontFamily: "Lato Bold", color: out ? MUTED : INK }}>
                  {out ? "—" : l.count}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 6 }}>
          <Text style={{ fontFamily: "Lato Bold" }}>{lines.length - dropped} lines to pack</Text>
          <Text style={{ fontFamily: "Lato Bold" }}>{units} units total</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 30, marginTop: 34 }}>
          <View style={{ flex: 1 }}>
            <View style={s.hair} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>Packed by</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.hair} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>Checked by</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.hair} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>Date</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>
          Internal packing document — not a bill. {order.ref}
        </Text>
      </Page>
    </Document>
  );
}
