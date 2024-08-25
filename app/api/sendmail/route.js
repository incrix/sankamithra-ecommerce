import { sendVerificationMail } from "@/util/sendMail";
import { pdf } from "@react-pdf/renderer";
import Template1 from "@/util/invoice/Template1/Template";

export async function POST(request) {
  const { billingDetails, productList, invoice } = await request.json();
  await sendVerificationMail({
    billingDetails,
    invoice,
  });
  return Response.json({
    message: "Order placed successfully",
    status: "success",
  });
}
