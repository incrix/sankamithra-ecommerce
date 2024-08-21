import easyinvoice from "easyinvoice";

export const dynamic = "force-dynamic";

export async function generateInvoice({ billingDetails, productList }) {
  const data = {
    images: {
      logo: "https://incrix.com/sankamithra-logo.png",
    //   background: "https://incrix.com/sankamithra-logo.png",
    },
    sender: {
      company: "Sankamithra Fireworks Factory",
      address: "3/1427/G6, Opposite PRC Bus Depot, Sattur Road",
      zip: "626123",
      city: "Sivakasi",
      country: "India",
      email: "info@sankamithra.com",
      phone: "98420 12345",
    },
    client: {
      company: billingDetails.name,
      address: billingDetails.address,
      zip: billingDetails.zip,
      city: billingDetails.city,
      state: billingDetails.state,
      country: "India",
      email: billingDetails.email,
      number: billingDetails.phone,
    },
    information: {
      number: "Online Order",
      date: new Date().toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    },
    products: productList.map((product) => ({
      quantity: product.count,
      description: product.name,
      price: Math.round(product.price - (product.price * product.discount) / 100),
    })),
    // products: [
    //   {
    //     quantity: "1",
    //     description: name,
    //     "tax-rate": 18,
    //     price: transaction.amount / 1.18,
    //   },
    // ],
    "bottom-notice": "Thank you for your Order!",
    settings: {
      currency: "INR",
      "tax-notation": "GST",
      "margin-top": 25,
      "margin-right": 25,
      "margin-left": 25,
      "margin-bottom": 25,
    },
  };

  const result = await easyinvoice.createInvoice(data);
  return result.pdf;
}
