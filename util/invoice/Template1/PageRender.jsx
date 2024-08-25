"use client";
import { Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import Rupee from "@/public/images/rupee.png";
import RenderItems from "./RenderItems";
import RenderCustomerDetails from "./RenderCustomerDetails";
import RenderInvoiceHeader from "./RenderInvoiceHeader";
import RenderInvoiceFooter from "./RenderInvoiceFooter";

export default function PageRender({ billingDetails, productList }) {
  return (
    <Page
      size="A4"
      style={{
        position: "relative",
        padding: 20,
      }}
    >
      {/* //Header */}
      <RenderInvoiceHeader />
      {/* //Customer Details & Invoice Details */}
      <RenderCustomerDetails billingDetails={billingDetails} />
      {/* //Render Item Table */}
      <RenderItems productList={productList} />
      {/* //Total Amount */}
      <View
        wrap={false}
        style={{
          border: "1px solid #333",
          borderTop: 0,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            fontSize: 8,
            width: "50%",
            borderRight: "1px solid #333",
            gap: 2,
            padding: 10,
          }}
        >
          <Text>
            Total Items / Qty : {productList.length}/
            {productList.reduce((a, { count }) => a + count, 0)}
          </Text>
        </View>
        <View style={{ width: "50%" }}>
          <View style={{ padding: 5, gap: 5, borderBottom: "1px solid #333" }}>
            <View
              style={{
                fontSize: 8,
                fontFamily: "Lato Bold",
                flexDirection: "row",
              }}
            >
              <Text style={{ width: "50%", textAlign: "right" }}>
                Sub Total :
              </Text>
              <Text style={{ width: "50%", textAlign: "right" }}>
                <Image
                  src={Rupee.src}
                  style={{ width: 6, objectFit: "contain" }}
                />
                {productList
                  .reduce((a, { price, count }) => a + price * count, 0)
                  .toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                fontSize: 8,
                fontFamily: "Lato Bold",
                flexDirection: "row",
              }}
            >
              <Text style={{ width: "50%", textAlign: "right" }}>
                Discount :
              </Text>
              <Text style={{ width: "50%", textAlign: "right" }}>
                <Image
                  src={Rupee.src}
                  style={{ width: 6, objectFit: "contain" }}
                />
                {productList
                  .reduce(
                    (a, { discount, price, count }) =>
                      a + ((price * discount) / 100) * count,
                    0
                  )
                  .toFixed(2)}
              </Text>
            </View>
          </View>
          <View
            style={{
              padding: 5,
              flexDirection: "row",
              borderBottom: "1px solid #333",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Lato Bold",
                width: "50%",
                textAlign: "right",
              }}
            >
              Total Amount :
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Lato Bold",
                width: "50%",
                textAlign: "right",
              }}
            >
              <Image
                src={Rupee.src}
                style={{ width: 8, objectFit: "contain" }}
              />
              {productList.reduce(
                (a, { price, discount, count }) =>
                  a + (price - (price * discount) / 100) * count,
                0
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* //Page Number && Footer */}
      <RenderInvoiceFooter />
    </Page>
  );
}
