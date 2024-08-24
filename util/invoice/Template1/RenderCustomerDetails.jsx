import { Text, View } from "@react-pdf/renderer";

export default function RenderCustomerDetails({ billingDetails }) {
  return (
    <View
      fixed
      style={{
        fontSize: 8,
        color: "#333",
        width: "100%",
        minHeight: 90,
        fontFamily: "Lato",
        border: "1px solid #333",
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 0,
        margin: 0,
        marginTop: "10px",
      }}
    >
      <View style={{ gap: 2, padding: 10 }}>
        <Text style={{ fontFamily: "Lato Bold" }}>To:</Text>
        <Text style={{ fontFamily: "Lato Bold" }}>{billingDetails.name}</Text>
        <Text style={{ maxWidth: 200 }}>{billingDetails.address}</Text>
        <Text style={{ maxWidth: 200 }}>
          {billingDetails.city} , {billingDetails.state} - {billingDetails.zip}
        </Text>
        <Text style={{ maxWidth: 200 }}>Ph: {billingDetails.phone}</Text>
        <Text style={{ maxWidth: 200 }}>{billingDetails.email}</Text>
      </View>
      <View
        style={{
          width: "250px",
          borderLeft: 1,
          height: "100%",
          fontFamily: "Lato Bold",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              border: "1px solid #333",
              borderTop: 0,
              borderLeft: 0,
              width: "50%",
              padding: 5,
              gap: 2,
            }}
          >
            <Text>Invoice No:</Text>
            <Text>Online Order</Text>
          </View>
          <View
            style={{
              borderBottom: "1px solid #333",
              width: "50%",
              padding: 5,
              gap: 2,
            }}
          >
            <Text>Date:</Text>
            <Text>{new Date().toLocaleString()}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              border: "1px solid #333",
              width: "50%",
              padding: 5,
              gap: 2,
              borderTop: 0,
              borderLeft: 0,
            }}
          >
            <Text>Place of supply:</Text>
            <Text>{"Tamil Nadu"}</Text>
          </View>
          <View
            style={{
              borderBottom: "1px solid #333",
              width: "50%",
              padding: 5,
              gap: 2,
            }}
          >
            <Text>Due Date:</Text>
            <Text>{new Date().toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
