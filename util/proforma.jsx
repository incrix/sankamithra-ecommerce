"use client";
import { pdf } from "@react-pdf/renderer";
import Template1 from "@/util/invoice/Template1/Template";

/**
 * Builds the proforma PDF for an order, in the browser.
 *
 * Rendered client-side because the template is a "use client" component:
 * importing it into a server route yields a client reference rather than a
 * component (React error #130). Lines reflect what will actually ship —
 * replacements swapped in, unfillable lines dropped — so a proforma re-issued
 * after packing matches the order as it now stands.
 */
export function proformaLines(order) {
  return (order.items || [])
    .map((i) => {
      if (i.substitute) {
        return {
          name: `${i.substitute.name} (replaces ${i.name})`,
          price: i.substitute.mrp || i.substitute.unitPrice,
          discount: i.substitute.mrp
            ? Math.round((1 - i.substitute.unitPrice / i.substitute.mrp) * 100)
            : 0,
          count: i.substitute.count,
        };
      }
      if (i.unavailable) return null;
      return { name: i.name, price: i.mrp, discount: i.discount, count: i.count };
    })
    .filter(Boolean);
}

export const buildProformaBlob = (order) =>
  pdf(<Template1 billingDetails={order.customer} productList={proformaLines(order)} />).toBlob();

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Current proforma as base64, ready to attach to a mail request. */
export async function buildProformaBase64(order) {
  return blobToBase64(await buildProformaBlob(order));
}
