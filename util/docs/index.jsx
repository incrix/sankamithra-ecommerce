"use client";
import { pdf } from "@react-pdf/renderer";
import PackingListDoc from "./PackingList";
import DeliveryChallanDoc from "./DeliveryChallan";

/**
 * Order paperwork, built in the browser.
 *
 * Same reason as the proforma: these templates are "use client" components and
 * cannot be rendered from a server route.
 */

export const buildPackingListBlob = (order) => pdf(<PackingListDoc order={order} />).toBlob();
export const buildDeliveryChallanBlob = (order) => pdf(<DeliveryChallanDoc order={order} />).toBlob();

export const DOCS = {
  packing: { label: "Packing list", build: buildPackingListBlob, file: (o) => `packing-list-${o.ref}.pdf` },
  challan: { label: "Delivery challan", build: buildDeliveryChallanBlob, file: (o) => `delivery-challan-${o.ref}.pdf` },
};

/** Saves the PDF to disk. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Sends the PDF straight to the printer.
 *
 * Printed from a hidden iframe rather than a popup, so the packer gets the
 * print dialog immediately instead of a blocked window or an extra tab to
 * close. If the browser refuses to print the frame, the PDF is opened instead
 * so the job is never simply lost.
 */
export function printBlob(blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };
  document.body.appendChild(frame);
  // Kept alive well past the dialog: removing the frame cancels the print job.
  setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 120000);
}
