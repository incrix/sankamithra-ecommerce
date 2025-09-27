"use client";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// Define styles for the table
const styles = StyleSheet.create({
  table: {
    width: "100%",
    border: "1px solid #333",
    borderTop: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #333",
    fontFamily: "Lato Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #333",
  },
  cell: {
    padding: 5,
    fontSize: 8,
    textAlign: "right",
  },
  s_no: {
    width: "7%",
    padding: 5,
    fontSize: 8,
    textAlign: "center",
    borderRight: "1px solid #333",
  },
  item_name: {
    width: "38%",
    padding: 5,
    fontSize: 8,
    borderRight: "1px solid #333",
  },
  rate: {
    width: "15%",
    padding: 5,
    fontSize: 8,
    textAlign: "right",
    borderRight: "1px solid #333",
  },
  qty: {
    width: "10%",
    padding: 5,
    fontSize: 8,
    textAlign: "center",
    borderRight: "1px solid #333",
  },
  discount: {
    width: "15%",
    padding: 5,
    fontSize: 8,
    textAlign: "right",
    borderRight: "1px solid #333",
  },
  total: {
    width: "15%",
    padding: 5,
    fontSize: 8,
    textAlign: "right",
  },
});

export default function RenderItems({ productList }) {
  return (
    <View style={styles.table}>
      {/* Table Header */}
      <View style={styles.tableHeader} fixed>
        <View style={styles.s_no}><Text>S.No</Text></View>
        <View style={styles.item_name}><Text>Item</Text></View>
        <View style={styles.rate}><Text>Rate / Item</Text></View>
        <View style={styles.qty}><Text>Qty</Text></View>
        <View style={styles.discount}><Text>Discount Rate</Text></View>
        <View style={styles.total}><Text>Total</Text></View>
      </View>

      {/* Table Body */}
      {productList.map((product, index) => {
        // De-structure properties for easier access
        const { name: title, price, count, discount } = product;

        // --- NEW LOGIC ---
        // 1. Calculate the price of a single item AFTER the discount
        const priceAfterDiscount = price * (1 - discount / 100);

        // 2. Calculate the total for the row (price after discount * quantity)
        const totalAmount = priceAfterDiscount * count;
        // --- END OF NEW LOGIC ---

        return (
          <View key={index} style={styles.tableRow} wrap={false}>
            {/* S.No */}
            <View style={styles.s_no}>
              <Text>{index + 1}</Text>
            </View>
            {/* Item Name */}
            <View style={styles.item_name}>
              <Text>{title}</Text>
            </View>
            {/* Rate / Item */}
            <View style={styles.rate}>
              <Text>{price.toFixed(2)}</Text>
            </View>
            {/* Qty */}
            <View style={styles.qty}>
              <Text>{count}</Text>
            </View>
            {/* Discount Column (Updated) */}
            <View style={styles.discount}>
              <Text>
                {`${priceAfterDiscount.toFixed(2)} (${discount}%)`}
              </Text>
            </View>
            {/* Total Column (Updated) */}
            <View style={styles.total}>
              <Text>{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}