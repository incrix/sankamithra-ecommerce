import nodemailer from "nodemailer";

export const sendVerificationMail = async ({ billingDetails, invoice }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    name: process.env.MAIL_NAME,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  await new Promise((resolve, reject) => {
    transporter.verify(function (error, success) {
      if (error) {
        reject(error);
      } else {
        resolve(success);
      }
    });
  });

  const mailInfo = {
    from: '"no-reply" <no-reply@incrix.com>',
    to: process.env.ORDER_MAIL,
    cc: process.env.ORDER_MAIL_CC,
    subject: `Online Order List for ${billingDetails.name}`,
    html: `
    <main style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; font-size: 16px; line-height: 1.5; color: #333;">
            <div style="text-align: center;">
                <h1>Start Packing, Order has arrived</h1>
                <p style="padding: 10px 20px;">Order list is attached below</p>
                <p style="padding: 10px 20px;">Thank you for using Slipze powered by Incrix Techlutions LLP</p>
            </div>
           <div style="padding: 20px;">
                <h2>Customer Details</h2>
                <p>Name: ${billingDetails.name}</p>
                <p>Email: ${billingDetails.email}</p>
                <p>Phone: ${billingDetails.phone}</p>
                <p>Address: ${billingDetails.address}</p>
                <p>City: ${billingDetails.city}</p>
                <p>State: ${billingDetails.state}</p>
                <p>Zip: ${billingDetails.zip}</p>
            </div> 
        </main>
        `,
    attachments: [
      {
        filename: "invoice.pdf",
        content: invoice,
        encoding: "base64",
      },
    ],
  };

  await new Promise((resolve, reject) => {
    // transporter.sendMail(mailInfo);
    transporter.sendMail(mailInfo, function (error, info) {
      if (error) {
        console.log("Error: ", error);
        reject(error);
        return error;
      } else {
        console.log("Email sent: " + info.response);
        resolve(info);
        return info;
      }
    });
  });
};
