import { sendVerificationMail } from "@/util/sendMail";
// import { generateInvoice } from "@/util/invoice";

// Handles POST requests to /api

export async function POST(request) {
  const { billingDetails, productList } = await request.json();

  // Send verification mail
  // generateInvoice({ billingDetails, productList }).then(async (invoice) => {
  //   await sendVerificationMail({
  //     billingDetails,
  //     invoice,
  //   });
  // });
  return Response.json({
    to: "avinash97official@gmail.com",
    verifyLink: "Hello, World!",
  });
}
