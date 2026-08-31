import nodemailer from "nodemailer";

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

/** The From header: a readable name in front of the authenticated mailbox. */
const FROM = (label) =>
  `"${label || process.env.MAIL_NAME || "Sankamithra Thunder World"}" <${process.env.MAIL_USER}>`;

/**
 * One pooled transporter, reused across sends.
 *
 * Cached on globalThis because a warm serverless container reuses module state:
 * a new transporter per send meant a fresh TCP connect + TLS + AUTH every time.
 * With two emails per order that was four full round trips to the mail server,
 * pushing an order POST to ~9s - against Vercel's 10s function limit.
 */
function transport() {
  if (globalThis.__sankamithraMailer) return globalThis.__sankamithraMailer;
  const port = Number(process.env.MAIL_PORT) || 465;
  const t = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    // Deliberately no `name`: that option is the HELO/EHLO hostname, not a
    // display name. Passing a human name with spaces produces an invalid HELO
    // that stricter servers refuse. MAIL_NAME is used in the From header below.
    port,
    // Implicit TLS on 465; STARTTLS on 587 and everything else. Hardcoding
    // `secure: true` breaks any host that uses 587, which many do.
    secure: port === 465,
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
      : undefined,
    tls: { rejectUnauthorized: process.env.MAIL_TLS_INSECURE !== "true" },
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
  });
  globalThis.__sankamithraMailer = t;
  return t;
}

const SHELL = (title, body) => `
<main style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#253d4e;background:#f7f8f9;padding:24px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ededed;">
    <div style="background:#ff4800;padding:18px 24px;">
      <div style="color:#fff;font-size:19px;font-weight:800;">Sankamithra Thunder World</div>
      <div style="color:rgba(255,255,255,.85);font-size:12px;">Fireworks &amp; Crackers &middot; Sivakasi</div>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#253d4e;">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #ededed;color:#7e7e7e;font-size:12px;">
      Questions? Call +91 94892 39970 or reply to this email.
    </div>
  </div>
</main>`;

const itemRows = (order) =>
  (order.items || [])
    .map((i) => {
      if (i.substitute) {
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><s style="color:#999;">${i.name}</s><br><b>${i.substitute.name}</b> <span style="color:#b26a00;font-size:12px;">(replacement)</span></td><td align="right" style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.substitute.count} &times; ${inr(i.substitute.unitPrice)}</td></tr>`;
      }
      if (i.unavailable) {
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;color:#999;"><s>${i.name}</s> <span style="font-size:12px;">(out of stock, not supplied)</span></td><td align="right" style="padding:6px 0;border-bottom:1px solid #f0f0f0;color:#999;">&mdash;</td></tr>`;
      }
      return `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.name}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.count} &times; ${inr(i.unitPrice)}</td></tr>`;
    })
    .join("");

/**
 * Customer-facing mail sent from the admin panel.
 *
 * `kind` selects the wording: a confirmation, a dispatch note, or a plain
 * invoice re-send. All three carry the current invoice PDF.
 */
export async function sendCustomerMail({ order, invoice, kind = "invoice" }) {
  // No verify() here: sendMail surfaces an auth failure by itself, and a
  // pre-flight check doubles the connections per message.
  const t = transport();

  const adjusted = order.originalTotal != null && order.originalTotal !== order.total;

  const COPY = {
    confirm: {
      subject: `Your Sankamithra order ${order.ref} is confirmed`,
      title: `Thanks ${order.customer.name?.split(" ")[0] || ""}, your order is confirmed`,
      lead: `We have your order <b>${order.ref}</b> and it is being packed now.`,
    },
    dispatch: {
      subject: `Your Sankamithra order ${order.ref} has been dispatched`,
      title: "Your order is on its way",
      lead: `Order <b>${order.ref}</b> has left our shop and is on its way. We'll be in touch with delivery details.`,
    },
    invoice: {
      subject: `Proforma for your Sankamithra order ${order.ref}`,
      title: "Here is your proforma",
      lead: `A copy of the proforma for order <b>${order.ref}</b> is attached.`,
    },
    packing: {
      subject: `We're packing your Sankamithra order ${order.ref}`,
      title: "Your order is being packed",
      lead: `Good news — we've started packing order <b>${order.ref}</b>. We'll let you know the moment it is on its way.`,
    },
    packed: {
      subject: `Your Sankamithra order ${order.ref} is packed and ready`,
      title: "Packed and ready to go",
      lead: `Order <b>${order.ref}</b> is packed and waiting for dispatch. It will be on its way shortly.`,
    },
    cancelled: {
      subject: `Your Sankamithra order ${order.ref} has been cancelled`,
      title: "Your order has been cancelled",
      lead: `Order <b>${order.ref}</b> has been cancelled. If this wasn't expected, please call us on +91 94892 39970 and we'll sort it out.`,
    },
  }[kind] || {};

  const body = `
    <p style="margin:0 0 16px;">${COPY.lead}</p>
    ${adjusted ? `<p style="margin:0 0 16px;padding:12px;background:#fff8e1;border-radius:8px;font-size:14px;color:#b26a00;">
      Some items were out of stock and have been replaced or removed. Your total is now
      <b>${inr(order.total)}</b> (originally ${inr(order.originalTotal)}). The details are below.
    </p>` : ""}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">${itemRows(order)}</table>
    <table style="width:100%;font-size:15px;">
      <tr><td><b>Total</b></td><td align="right"><b>${inr(order.total)}</b></td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#7e7e7e;">
      Delivering to: ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.zip}
    </p>`;

  const info = {
    from: FROM(),
    to: order.customer.email,
    // The shop keeps a copy of what a customer is told, so there is one place
    // to check. Skipped for the checkout confirmation, where sendShopMail
    // already delivers a fuller packing notice - two mails would be noise.
    bcc: kind === "confirm" ? undefined : process.env.ORDER_MAIL || undefined,
    // The sender is a noreply mailbox, so send replies where they can be read.
    replyTo: process.env.ORDER_MAIL || undefined,
    bcc: process.env.ORDER_MAIL,
    subject: COPY.subject,
    html: SHELL(COPY.title, body),
    attachments: invoice
      ? [{ filename: `Sankamithra-Proforma-${order.ref}.pdf`, content: invoice, encoding: "base64" }]
      : [],
  };

  await new Promise((res, rej) => t.sendMail(info, (e, i) => (e ? rej(e) : res(i))));
}


/**
 * The shop's own copy of a new order: everything needed to start packing.
 *
 * Deliberately different from the customer's email - it leads with the address
 * and phone number, and lists quantities in packing order rather than selling
 * the purchase back to them.
 */
export async function sendShopMail({ order, invoice }) {
  const to = process.env.ORDER_MAIL;
  if (!to) throw new Error("ORDER_MAIL is not set");

  // No verify() here: sendMail surfaces an auth failure by itself, and a
  // pre-flight check doubles the connections per message.
  const t = transport();

  const c = order.customer;
  const rows = (order.items || [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.name}</td>` +
        `<td align="center" style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><b>${i.count}</b></td>` +
        `<td align="right" style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${inr(i.total)}</td></tr>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 16px;">A new order came in through the website. The proforma is attached.</p>

    <div style="padding:14px;background:#fff7f3;border-radius:8px;margin:0 0 16px;">
      <div style="font-size:13px;color:#7e7e7e;">Deliver to</div>
      <div style="font-size:16px;font-weight:bold;">${c.name}</div>
      <div>${c.address}<br>${c.city}, ${c.state} - ${c.zip}</div>
      <div style="margin-top:8px;">
        <a href="tel:${String(c.phone).replace(/\D/g, "")}" style="color:#ff4800;font-weight:bold;">${c.phone}</a>
        &nbsp;·&nbsp; ${c.email}
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 12px;">
      <thead><tr>
        <th align="left" style="padding:6px 0;border-bottom:2px solid #253d4e;">Item</th>
        <th align="center" style="padding:6px 0;border-bottom:2px solid #253d4e;">Qty</th>
        <th align="right" style="padding:6px 0;border-bottom:2px solid #253d4e;">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;font-size:15px;">
      <tr><td><b>Order total</b></td><td align="right"><b>${inr(order.total)}</b></td></tr>
      <tr><td style="color:#7e7e7e;font-size:13px;">${order.items.length} lines · ${order.itemCount} units</td><td></td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#7e7e7e;">
      Open the admin panel to pack it, or call the customer to confirm.
    </p>`;

  const info = {
    from: FROM("Sankamithra Orders"),
    to,
    cc: process.env.ORDER_MAIL_CC || undefined,
    replyTo: c.email || undefined, // replying goes straight to the customer
    subject: `New order ${order.ref} — ${c.name} — ${inr(order.total)}`,
    html: SHELL(`Start packing: order ${order.ref}`, body),
    attachments: invoice
      ? [{ filename: `Sankamithra-Proforma-${order.ref}.pdf`, content: invoice, encoding: "base64" }]
      : [],
  };

  await new Promise((res, rej) => t.sendMail(info, (e, i) => (e ? rej(e) : res(i))));
}

/**
 * Sends both copies of a newly placed order.
 *
 * Independent: one failing must not stop the other, because the shop losing its
 * copy and the customer losing theirs are separate problems. Errors are
 * returned rather than thrown so the order itself is never rolled back over a
 * mail problem.
 */
export async function sendOrderMails({ order, invoice }) {
  const results = { customer: false, shop: false, errors: {} };

  const [customer, shop] = await Promise.allSettled([
    sendCustomerMail({ order, invoice, kind: "confirm" }),
    sendShopMail({ order, invoice }),
  ]);

  results.customer = customer.status === "fulfilled";
  results.shop = shop.status === "fulfilled";
  if (customer.status === "rejected") results.errors.customer = customer.reason?.message;
  if (shop.status === "rejected") results.errors.shop = shop.reason?.message;

  return results;
}


/**
 * Checks the mail configuration without sending anything.
 *
 * Separates the two failure modes that look identical from the outside: bad
 * credentials (the login is refused) versus a working login that still can't
 * send — which is what a full mailbox or an over-quota hosting account looks
 * like, and no amount of application code will fix.
 */
export async function mailDiagnostics() {
  const config = {
    host: process.env.MAIL_HOST || null,
    port: Number(process.env.MAIL_PORT) || null,
    user: process.env.MAIL_USER || null,
    orderMail: process.env.ORDER_MAIL || null,
    orderMailCc: process.env.ORDER_MAIL_CC || null,
  };

  const missing = ["host", "port", "user"].filter((k) => !config[k]);
  if (missing.length) {
    return { ok: false, stage: "config", error: `Missing: ${missing.map((m) => "MAIL_" + m.toUpperCase()).join(", ")}`, config };
  }

  try {
    await new Promise((res, rej) => transport().verify((e, ok) => (e ? rej(e) : res(ok))));
    return { ok: true, stage: "authenticated", message: "Connected and signed in. Send a test message to confirm delivery.", config };
  } catch (err) {
    return {
      ok: false,
      stage: err.responseCode === 535 ? "authentication" : "connection",
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
      config,
    };
  }
}

/** Sends a plain test message so delivery can be confirmed for real. */
export async function sendTestMail(to) {
  const recipient = to || process.env.ORDER_MAIL;
  if (!recipient) throw new Error("No recipient: pass one, or set ORDER_MAIL");

  // No verify() here: sendMail surfaces an auth failure by itself, and a
  // pre-flight check doubles the connections per message.
  const t = transport();

  const info = await new Promise((res, rej) =>
    t.sendMail(
      {
        from: FROM(),
        to: recipient,
        subject: "Sankamithra mail test",
        html: SHELL(
          "Mail is working",
          `<p style="margin:0 0 12px;">If you are reading this, order confirmations and packing
           notices will send correctly.</p>
           <p style="margin:0;font-size:13px;color:#7e7e7e;">Sent ${new Date().toLocaleString("en-IN")}
           from ${process.env.MAIL_HOST}.</p>`
        ),
      },
      (e, i) => (e ? rej(e) : res(i))
    )
  );

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response, sentTo: recipient };
}
