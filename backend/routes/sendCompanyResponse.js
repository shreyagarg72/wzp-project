import express from "express";
import htmlPdfNode from "html-pdf-node";
import nodemailer from "nodemailer";
import Inquiry from "../models/Inquiry.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      toEmails,
      ccEmails,
      inquiryId,
      quoteData,
      deliveryCharges,
      subject,
      message,
    } = req.body;

    // 1. Fetch inquiry and customer info
    const inquiry = await Inquiry.findOne({ inquiryId }).populate("customerId");
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    const customer = inquiry.customerId;
    const companyName = customer.companyName;
    const address = customer.address || "";

    // 2. Prepare data & rows
    let subtotal = 0;
    let totalGstAmount = 0;
    let totalDiscount = 0;

    const rowsHtml = quoteData.map((item, index) => {
      const finalPrice = parseFloat(item.finalPrice || 0);
      const gstAmount = parseFloat(item.gstAmount || 0);
      const discount = parseFloat(item.discount || 0);
      const basePrice = (finalPrice - gstAmount) / (1 - discount / 100);
      const priceAfterDiscount = basePrice - (basePrice * discount / 100);

      subtotal += priceAfterDiscount;
      totalGstAmount += gstAmount;
      totalDiscount += basePrice - priceAfterDiscount;

      return `
        <tr style="background-color:${index % 2 === 0 ? "#f9f9f9" : "#ffffff"};">
          <td style="padding:8px;border:1px solid #ccc;">
            <strong>${item.name}</strong><br>
            <span style="font-weight: normal;">${item.brand || ""}</span>
          </td>
          <td style="padding:8px;border:1px solid #ccc;">${item.specifications || "-"}</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.uom || "-"}</td>
          <td style="padding:8px;border:1px solid #ccc;">₹${basePrice.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.discount}%</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.gstRate}%</td>
          <td style="padding:8px;border:1px solid #ccc;"><strong>₹${finalPrice.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join("");

    const delivery = parseFloat(deliveryCharges || 0);
    const total = subtotal + delivery + totalGstAmount;

    const myCompany = {
      name: "WZP Tech Pvt Ltd",
      address: "123 Industrial Park, Mumbai, MH, 400001",
      gstin: "27AAACW1234Z1Z5",
    };

    // 3. HTML for PDF
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h2 style="margin: 0;">${myCompany.name}</h2>
            <p style="margin: 4px 0;">${myCompany.address}</p>
            <p style="margin: 4px 0;"><strong>GSTIN:</strong> ${myCompany.gstin}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 14px;">
            <h3 style="margin-bottom: 4px;">Customer Details</h3>
            <p style="margin: 2px 0;"><strong>${companyName}</strong></p>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;"><strong>GSTIN:</strong> ${customer.gstin || "-"}</p>
          </div>
        </div>

        <!-- Title -->
        <h2 style="text-align: center; margin-top: 30px;">Quotation</h2>
        <p><strong>Inquiry ID:</strong> ${inquiryId}</p>

        <!-- Product Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th style="padding:8px;border:1px solid #ccc;">Product</th>
              <th style="padding:8px;border:1px solid #ccc;">Specifications</th>
              <th style="padding:8px;border:1px solid #ccc;">Qty</th>
              <th style="padding:8px;border:1px solid #ccc;">UOM</th>
              <th style="padding:8px;border:1px solid #ccc;">Unit Price</th>
              <th style="padding:8px;border:1px solid #ccc;">Discount</th>
              <th style="padding:8px;border:1px solid #ccc;">GST</th>
              <th style="padding:8px;border:1px solid #ccc;">Final Price</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="margin-top:20px;text-align:right;">
          <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
          <p><strong>Total Discount:</strong> -₹${totalDiscount.toFixed(2)}</p>
          <p><strong>GST:</strong> ₹${totalGstAmount.toFixed(2)}</p>
          <p><strong>Delivery Charges:</strong> ₹${delivery.toFixed(2)}</p>
          <hr />
          <p style="font-size:18px;"><strong>Total Amount:</strong> ₹${total.toFixed(2)}</p>
        </div>
      </div>
    `;

    // 4. Generate PDF
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdfNode.generatePdf(file, { format: "A4" });

    // 5. Send Email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: toEmails,
      cc: ccEmails,
      subject,
      text: message,
      attachments: [{
        filename: `Quotation-${inquiryId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    });

    // 6. Create Order
    const orderItems = quoteData.map(item => ({
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      category: item.category,
      description: item.description,
      specifications: item.specifications,
      uom: item.uom,
      basePrice: item.basePrice || 0,
      margin: item.margin || 0,
      discount :item.discount || 0,
      gstRate: item.gstRate,
      finalPrice: item.finalPrice,
    }));

    await Order.create({
      inquiryId,
      items: orderItems,
      deliveryCharges: delivery,
      totalPrice: total,
      status: "Open"
    });

    return res.status(200).json({ message: "Quote sent and order created!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send quote" });
  }
});

export default router;
