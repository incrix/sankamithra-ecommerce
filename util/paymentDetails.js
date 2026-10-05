/**
 * How customers pay the shop: the UPI number and the bank account an order is
 * settled into.
 *
 * The shop takes no payment online. An order is placed, the customer pays by
 * PhonePe or a bank deposit, and the shop confirms it once the money shows up.
 * So these details go out in the order-received email and on the order-placed
 * screen, and the admin edits them - accounts change, and a wrong digit here
 * sends a customer's money somewhere else.
 *
 * No imports: read by the mailer on the server and by the admin and checkout
 * screens in the browser.
 */

export const DEFAULT_PAYMENT_DETAILS = {
  upi: { enabled: true, app: "PhonePe", number: "9489239970", upiId: "", payee: "Sankamithra Thunder World" },
  bank: { enabled: false, accountName: "", accountNumber: "", ifsc: "", bankName: "", branch: "" },
  // Where the customer sends proof of payment, and anything else the shop
  // wants said. Shown under the payment options.
  confirmTo: "9489239970",
  note: "",
};

const text = (v, max = 80) => String(v ?? "").trim().slice(0, max);
const digits = (v, max = 20) => String(v ?? "").replace(/\D/g, "").slice(0, max);

/** Coerces stored or submitted details into a complete, safe shape. */
export function normalisePaymentDetails(input) {
  const d = DEFAULT_PAYMENT_DETAILS;
  const upi = input?.upi || {};
  const bank = input?.bank || {};
  return {
    upi: {
      enabled: upi.enabled !== false,
      app: text(upi.app ?? d.upi.app, 30) || "UPI",
      number: digits(upi.number ?? d.upi.number, 12),
      upiId: text(upi.upiId, 60).replace(/\s+/g, ""),
      payee: text(upi.payee ?? d.upi.payee, 60),
    },
    bank: {
      enabled: bank.enabled === true,
      accountName: text(bank.accountName, 80),
      accountNumber: text(bank.accountNumber, 30).replace(/\s+/g, ""),
      ifsc: text(bank.ifsc, 15).replace(/\s+/g, "").toUpperCase(),
      bankName: text(bank.bankName, 60),
      branch: text(bank.branch, 60),
    },
    confirmTo: digits(input?.confirmTo ?? d.confirmTo, 12),
    note: text(input?.note, 300),
  };
}

/** What is wrong with the details, or null. Only switched-on options must be complete. */
export function paymentDetailsProblem(d) {
  if (!d.upi.enabled && !d.bank.enabled) return "Switch on at least one way to pay";
  if (d.upi.enabled && !d.upi.number && !d.upi.upiId) return "Enter the UPI phone number or UPI ID";
  if (d.upi.number && d.upi.number.length !== 10) return "The UPI phone number should be 10 digits";
  if (d.bank.enabled) {
    if (!d.bank.accountName || !d.bank.accountNumber || !d.bank.ifsc) {
      return "Bank deposit needs the account name, account number and IFSC";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(d.bank.ifsc)) return "That IFSC doesn't look right — it is 11 characters, like SBIN0001234";
  }
  return null;
}

/** The payment options the customer should be shown, in display order. */
export function paymentOptions(d) {
  const out = [];
  if (d?.upi?.enabled && (d.upi.number || d.upi.upiId)) {
    out.push({
      key: "upi",
      title: `${d.upi.app || "UPI"}${d.upi.app && !/upi/i.test(d.upi.app) ? " / UPI" : ""}`,
      rows: [
        d.upi.number && ["Number", d.upi.number],
        d.upi.upiId && ["UPI ID", d.upi.upiId],
        d.upi.payee && ["Name", d.upi.payee],
      ].filter(Boolean),
    });
  }
  if (d?.bank?.enabled && d.bank.accountNumber) {
    out.push({
      key: "bank",
      title: "Bank deposit / transfer",
      rows: [
        ["Account name", d.bank.accountName],
        ["Account no.", d.bank.accountNumber],
        ["IFSC", d.bank.ifsc],
        (d.bank.bankName || d.bank.branch) && ["Bank", [d.bank.bankName, d.bank.branch].filter(Boolean).join(", ")],
      ].filter(Boolean),
    });
  }
  return out;
}
