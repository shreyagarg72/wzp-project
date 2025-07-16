import express from "express";
import nodemailer from "nodemailer";
import htmlPdfNode from "html-pdf-node"; // ✅ correct default import

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      toEmails,
      ccEmails,
      companyName,
      inquiryId,
      quoteData,
      deliveryCharges,
      subject,
      message,
    } = req.body;

    let subtotal = 0;
    let totalGstAmount = 0;

    const rowsHtml = quoteData.map((item) => {
      const final = parseFloat(item.finalPrice || 0);
      const gstRate = parseFloat(item.gstRate || 0);
      const gstAmount = (final * gstRate) / (100 + gstRate); // GST back-calculated from inclusive finalPrice

      subtotal += final;
      totalGstAmount += gstAmount;

      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${item.quantity}</td>
          <td>${item.margin}%</td>
          <td>${item.gstRate}%</td>
          <td><strong style="color: green;">₹${final.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join("");

    const delivery = parseFloat(deliveryCharges || 0);
    const grandTotal = subtotal + delivery;

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h2 {
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            td small {
              display: block;
              color: #555;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <h2>Quotation for Inquiry ID: ${inquiryId}</h2>
          <p><strong>Company:</strong> ${companyName}</p>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Margin %</th>
                <th>GST %</th>
                <th>Final Price</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <br/>
          <p><strong>Subtotal (incl. GST):</strong> ₹${subtotal.toFixed(2)}</p>
          <p><strong>Total GST:</strong> ₹${totalGstAmount.toFixed(2)}</p>
          <p><strong>Delivery Charges:</strong> ₹${delivery.toFixed(2)}</p>
          <hr/>
          <p><strong>Total Amount:</strong> ₹${grandTotal.toFixed(2)}</p>

          <p style="margin-top: 20px;">Thank you for doing business with us.</p>
        </body>
      </html>
    `;

    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdfNode.generatePdf(file, { format: "A4" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmails,
      cc: ccEmails,
      subject,
      text: message,
      attachments: [
        {
          filename: `Quotation-${inquiryId}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Quotation sent successfully!" });
  } catch (error) {
    console.error("Send quote error:", error);
    res.status(500).json({ success: false, error: "Failed to send quotation." });
  }
});

export default router;
