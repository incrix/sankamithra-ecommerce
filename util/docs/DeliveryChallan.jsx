"use client";
import { Document, Page, Text, View, Font } from "@react-pdf/renderer";
import { s, DocHeader, Field, packedLines, inr, when, MUTED, INK, LINE } from "./shared";
import { BUSINESS } from "@/util/site";

/**
 * The document that travels with the goods.
 *
 * A challan accompanies a consignment rather than demanding payment, so it
 * names both parties, states quantities and the value of what is moving, and
 * leaves room for the receiver to sign. Lines the shop could not supply are
 * omitted entirely - the challan must describe what is physically in the
 * vehicle, not what was ordered.
 */
export default function DeliveryChallanDoc({ order }) {
  Font.register({ family: "Lato", src: "https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wWw.ttf" });
  Font.register({ family: "Lato Bold", src: "https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6UVSwiPHA.ttf" });

  const c = order.customer || {};
  const shipped = packedLines(order).filter((l) => l.state !== "dropped");
  const units = shipped.reduce((n, l) => n + (l.count || 0), 0);
  const value = shipped.reduce((n, l) => n + (l.total || 0), 0);
  const challanNo = `DC-${String(order.ref || "").replace(/^STW-/, "") || order.id?.slice(0, 6)}`;

  return (
    <Document title={`Delivery challan ${order.ref}`}>
      <Page size="A4" style={s.page}>
        <DocHeader title="Delivery challan" subtitle={`${challanNo} · ${when(Date.now())}`} />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Field label="Consignor">
            <Text style={{ fontFamily: "Lato Bold", fontSize: 10 }}>{BUSINESS.name}</Text>
            <Text style={{ color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
              {BUSINESS.office.street}, {BUSINESS.office.locality},{"\n"}
              {BUSINESS.office.region} — {BUSINESS.office.postalCode}
            </Text>
            <Text style={{ color: MUTED }}>{BUSINESS.phone[0]}</Text>
          </Field>
          <Field label="Consignee">
            <Text style={{ fontFamily: "Lato Bold", fontSize: 10 }}>{c.name || "—"}</Text>
            <Text style={{ color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
              {c.address ? `${c.address},\n` : ""}
              {[c.city, c.state].filter(Boolean).join(", ")}
              {c.zip ? ` — ${c.zip}` : ""}
            </Text>
            <Text style={{ color: MUTED }}>{c.phone || ""}</Text>
          </Field>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Field label="Challan no."><Text style={{ fontFamily: "Lato Bold" }}>{challanNo}</Text></Field>
          <Field label="Order ref"><Text style={{ fontFamily: "Lato Bold" }}>{order.ref}</Text></Field>
          <Field label="Date"><Text style={{ fontFamily: "Lato Bold" }}>{new Date().toLocaleDateString("en-IN")}</Text></Field>
          <Field label="Packages"><Text style={{ fontFamily: "Lato Bold" }}>{shipped.length} lines</Text></Field>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 26 }]}>#</Text>
            <Text style={[s.th, { flex: 1 }]}>Description of goods</Text>
            <Text style={[s.th, { width: 46, textAlign: "center" }]}>Qty</Text>
            <Text style={[s.th, { width: 64, textAlign: "right" }]}>Rate</Text>
            <Text style={[s.th, { width: 72, textAlign: "right" }]}>Value</Text>
          </View>

          {shipped.map((l, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={{ width: 26, color: MUTED }}>{i + 1}</Text>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 9.5 }}>{l.name}</Text>
                {l.state === "replaced" && (
                  <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>replaces {l.replaces}</Text>
                )}
              </View>
              <Text style={{ width: 46, textAlign: "center", fontFamily: "Lato Bold" }}>{l.count}</Text>
              <Text style={{ width: 64, textAlign: "right", color: MUTED }}>{inr(l.unitPrice)}</Text>
              <Text style={{ width: 72, textAlign: "right", fontFamily: "Lato Bold" }}>{inr(l.total)}</Text>
            </View>
          ))}

          <View style={{ flexDirection: "row", paddingVertical: 7, paddingHorizontal: 6, borderBottomWidth: 2, borderBottomColor: INK }}>
            <Text style={{ flex: 1, fontFamily: "Lato Bold" }}>Total</Text>
            <Text style={{ width: 46, textAlign: "center", fontFamily: "Lato Bold" }}>{units}</Text>
            <Text style={{ width: 64 }} />
            <Text style={{ width: 72, textAlign: "right", fontFamily: "Lato Bold", fontSize: 11 }}>{inr(value)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 12, borderWidth: 1, borderColor: LINE, borderRadius: 3, padding: 8 }}>
          <Text style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.6 }}>
            Value stated is for the movement of goods only and is not a demand for payment.
            Goods are to be transported and stored in accordance with the Explosives Act and the
            conditions of the relevant licence. Please examine the consignment before signing.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 30, marginTop: 40 }}>
          <View style={{ flex: 1 }}>
            <View style={s.hair} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>Received in good condition (consignee)</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.hair} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>For {BUSINESS.name}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>
          {challanNo} · {BUSINESS.name} · Not a tax invoice
        </Text>
      </Page>
    </Document>
  );
}
