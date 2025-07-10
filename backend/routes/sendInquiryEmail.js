import express from "express";
import nodemailer from "nodemailer";
import Supplier from "../models/Supplier.js";
import Inquiry from "../models/Inquiry.js";
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

// SMTP Setup (Use test credentials or Gmail for now)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { inquiryId, customer, expectedDelivery, supplierProductMap } =
    req.body;

  try {
    for (const supplierId in supplierProductMap) {
      const supplier = await Supplier.findById(supplierId);
      console.log("EMAIL_USER:", process.env.EMAIL_USER);
      console.log(
        "EMAIL_PASS:",
        process.env.EMAIL_PASS ? "***loaded***" : "NOT LOADED"
      );
      if (!supplier) continue;

      const productDetails = supplierProductMap[supplierId]
        .map(
          (p, idx) => `
        <p><strong>Product ${idx + 1}</strong></p>
        <ul>
          <li><strong>Name:</strong> ${p.name}</li>
          <li><strong>Brand:</strong> ${p.brand}</li>
          <li><strong>Quantity:</strong> ${p.quantity}</li>
          <li><strong>UOM:</strong> ${p.uom}</li>
          <li><strong>Specs:</strong> ${p.specifications}</li>
        </ul>
      `
        )
        .join("<br/>");

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: supplier.email,
        subject: `Request for Quote - Inquiry ${inquiryId}`,
        html: `
          <p>Dear ${supplier.supplierName},</p>
          <p>Please provide a quote for the following products under inquiry <strong>${inquiryId}</strong>.</p>
          <p><strong>Expected Delivery:</strong> ${new Date(
            expectedDelivery
          ).toLocaleDateString()}</p>
          ${productDetails}
          <p>Please respond at your earliest with availability and pricing.</p>
          <p>Regards,<br/>${customer.companyName} Procurement Team</p>
        `,
      };

      // Send Mail
      await transporter.sendMail(mailOptions);

      // Update Supplier's inquirySent list
      if (!supplier.inquirySent.includes(inquiryId)) {
        supplier.inquirySent.push(inquiryId);
        await supplier.save();
      }
    }

    // Optionally update Inquiry status to "Processing"
    await Inquiry.updateOne({ inquiryId }, { $set: { status: "Processing" } });

    res.json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending mails:", error);
    res.status(500).json({ message: "Failed to send emails", error });
  }
});

export default router;
