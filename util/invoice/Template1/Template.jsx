"use client";
import { Document, Font } from "@react-pdf/renderer";
import PageRender from "./PageRender";

export default function Template1({ billingDetails, productList }) {
  Font.register({
    family: "Lato",
    src: `https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wWw.ttf`,
  });

  Font.register({
    family: "Lato Bold",
    src: `https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6UVSwiPHA.ttf`,
  });

  return (
    <Document>
      <PageRender billingDetails={billingDetails} productList={productList} />
    </Document>
  );
}
