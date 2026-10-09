import { Text, View, Image } from "@react-pdf/renderer";
import { OFFICIAL_NOTICE } from "@/util/site";

export default function RenderInvoiceFooter() {
  return (
    <View
      fixed
      style={{
        marginTop: "auto",
      }}
      render={({ pageNumber, totalPages }) => (
        <View style={{ marginTop: 10, fontSize: 8, gap: 6 }}>
        <Text style={{ fontSize: 7.5, color: "#555" }}>{OFFICIAL_NOTICE}</Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ gap: 2 }}>
            <Text>
              Page:{pageNumber}/{totalPages}
            </Text>
            <Text style={{ marginLeft: "auto" }}>
              Generated on: {new Date().toLocaleString()}
            </Text>
          </View>
          <View style={{ marginLeft: "auto", gap: 2 }}>
            <Text style={{ fontFamily: "Lato Bold" }}>Powered by:</Text>
            <Text style={{ fontFamily: "Lato Bold" }}>Slipze</Text>
          </View>
        </View>
        </View>
      )}
    />
  );
}
