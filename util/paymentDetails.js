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
  // Several UPI accounts may be listed; the customer sees each one.
  upi: {
    enabled: true,
    accounts: [{ app: "PhonePe", number: "9489239970", upiId: "", payee: "Sankamithra Thunder World" }],
  },
  bank: { enabled: false, accountName: "", accountNumber: "", ifsc: "", bankName: "", branch: "" },
  // Where the customer sends proof of payment, and anything else the shop
  // wants said. Shown under the payment options.
  confirmTo: "9489239970",
  note: "",
};

export const MAX_UPI_ACCOUNTS = 5;
export const EMPTY_UPI_ACCOUNT = { app: "", number: "", upiId: "", payee: "" };

const text = (v, max = 80) => String(v ?? "").trim().slice(0, max);
const digits = (v, max = 20) => String(v ?? "").replace(/\D/g, "").slice(0, max);

/** Coerces stored or submitted details into a complete, safe shape. */
export function normalisePaymentDetails(input) {
  const d = DEFAULT_PAYMENT_DETAILS;
  const upi = input?.upi || {};
  const bank = input?.bank || {};
  // Details saved before multiple accounts existed kept one account's fields
  // directly on `upi`.
  const raw = Array.isArray(upi.accounts) ? upi.accounts : input?.upi ? [upi] : d.upi.accounts;
  const accounts = raw.slice(0, MAX_UPI_ACCOUNTS).map((a) => ({
    app: text(a?.app, 30),
    number: digits(a?.number, 12),
    upiId: text(a?.upiId, 60).replace(/\s+/g, ""),
    payee: text(a?.payee, 60),
  }));
  return {
    upi: {
      enabled: upi.enabled !== false,
      accounts: accounts.length ? accounts : [{ ...EMPTY_UPI_ACCOUNT }],
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
  if (d.upi.enabled) {
    const many = d.upi.accounts.length > 1;
    for (const [i, a] of d.upi.accounts.entries()) {
      const which = many ? ` for UPI ${i + 1}` : "";
      if (!a.number && !a.upiId) return `Enter the UPI phone number or UPI ID${which}`;
      if (a.number && a.number.length !== 10) return `The UPI phone number${which} should be 10 digits`;
    }
  }
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
  if (d?.upi?.enabled) {
    (d.upi.accounts || []).forEach((a, i) => {
      if (!a.number && !a.upiId) return;
      out.push({
        key: `upi-${i}`,
        title: `${a.app || "UPI"}${a.app && !/upi/i.test(a.app) ? " / UPI" : ""}`,
        rows: [
          a.number && ["Number", a.number],
          a.upiId && ["UPI ID", a.upiId],
          a.payee && ["Name", a.payee],
        ].filter(Boolean),
      });
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
