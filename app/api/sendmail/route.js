import { sendVerificationMail } from "@/util/sendMail";
import { pdf } from "@react-pdf/renderer";
import Template1 from "@/util/invoice/Template1/Template";

export async function POST(request) {
  const { billingDetails, productList } = await request.json();
  await sendVerificationMail({
    billingDetails,
    // invoice: base64String,
  });
  // const pdfStream = await pdf(
  //   <Template1 billingDetails={billingDetails} productList={productList} />
  // ).toBuffer();
  // const chunks = [];
  // pdfStream.on("data", (chunk) => chunks.push(chunk));
  // pdfStream.on("end", async () => {
  //   // Combine chunks into a single Buffer
  //   const pdfBuffer = Buffer.concat(chunks);
  //   // Convert the Buffer to a Base64 string
  //   const base64String = pdfBuffer.toString("base64");
  //   await sendVerificationMail({
  //     billingDetails,
  //     invoice: base64String,
  //   });
  // });
  return Response.json({
    to: "avinash97official@gmail.com",
  });
}
