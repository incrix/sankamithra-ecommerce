import { Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

export default function RenderItems({ productList }) {
  return (
    <View>
      {/* //Table Header */}
      <GenerateTableHeader />
      {/* //Table Items */}
      <View>
        <GenerateItem productList={productList} />
      </View>
    </View>
  );
}

function GenerateTableHeader() {
  return (
    <View
      fixed
      style={{
        flexDirection: "row",
        margin: 0,
        border: "1px solid #333",
        borderTop: 0,
        fontSize: 8,
        fontFamily: "Lato Bold",
      }}
    >
      <Text
        style={{
          padding: "8px 4px",
          width: "10%",
          borderRight: "1px solid #333",
        }}
      >
        S.No
      </Text>
      <Text
        style={{
          padding: "8px 4px",
          width: "30%",
          borderRight: "1px solid #333",
        }}
      >
        Item
      </Text>
      <Text
        style={{
          padding: "8px 4px",
          width: "15%",
          borderRight: "1px solid #333",
        }}
      >
        Rate / Item
      </Text>
      <Text
        style={{
          padding: "8px 4px",
          width: "15%",
          borderRight: "1px solid #333",
        }}
      >
        Qty
      </Text>
      <Text
        style={{
          padding: "8px 4px",
          width: "15%",
          borderRight: "1px solid #333",
        }}
      >
        Discount
      </Text>
      <Text
        style={{
          padding: "8px 4px",
          width: "15%",
          borderRight: "1px solid #333",
        }}
      >
        Total
      </Text>
    </View>
  );
}

function GenerateItem({ productList }) {
  return productList.map((item, index) => {
    return (
      <View
        wrap={false}
        key={index}
        style={{
          flexDirection: "row",
          margin: 0,
          border: "1px solid #333",
          borderTop: 0,
          fontSize: 8,
          fontFamily: "Lato",
        }}
      >
        <Text
          style={{
            padding: "8px 4px",
            width: "10%",
            borderRight: "1px solid #333",
          }}
        >
          {index + 1}
        </Text>
        <Text
          style={{
            padding: "8px 4px",
            width: "30%",
            borderRight: "1px solid #333",
          }}
        >
          {item.name}
        </Text>
        <Text
          style={{
            padding: "8px 4px",
            width: "15%",
            borderRight: "1px solid #333",
          }}
        >
          {item.price.toFixed(2)}
        </Text>
        <Text
          style={{
            padding: "8px 4px",
            width: "15%",
            borderRight: "1px solid #333",
          }}
        >
          {item.count}
        </Text>
        <Text
          style={{
            padding: "8px 4px",
            width: "15%",
            borderRight: "1px solid #333",
          }}
        >
          {((item.price * item.discount) / 100).toFixed(2)} ({item.discount}%)
        </Text>
        <Text
          style={{
            padding: "8px 4px",
            width: "15%",
            borderRight: "1px solid #333",
          }}
        >
          {(
            (item.price - (item.price * item.discount) / 100) *
            item.count
          ).toFixed(2)}
        </Text>
      </View>
    );
  });
}
