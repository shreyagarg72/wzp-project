// // import express from "express";
// // import htmlPdfNode from "html-pdf-node";
// // import nodemailer from "nodemailer";
// // import Inquiry from "../models/Inquiry.js";
// // import Customer from "../models/Customer.js";
// // import Order from "../models/Order.js";

// // const router = express.Router();

// // router.post("/", async (req, res) => {
// //   try {
// //     const {
// //       toEmails,
// //       ccEmails,
// //       inquiryId,
// //       quoteData,
// //       deliveryCharges,
// //       subject,
// //       message,
// //     } = req.body;

// //     // 1. Fetch inquiry and customer info
// //     const inquiry = await Inquiry.findOne({ inquiryId }).populate("customerId");
// //     if (!inquiry) {
// //       return res.status(404).json({ error: "Inquiry not found" });
// //     }

// //     // Check if inquiry is already fulfilled to prevent duplicate orders
// //     if (inquiry.status === "Fulfilled") {
// //       return res.status(400).json({
// //         error:
// //           "This inquiry has already been fulfilled. Cannot send quotation again.",
// //       });
// //     }

// //     // Check if order already exists for this inquiry
// //     const existingOrder = await Order.findOne({ inquiryId });
// //     if (existingOrder) {
// //       return res.status(400).json({
// //         error: "An order already exists for this inquiry.",
// //       });
// //     }

// //     const customer = inquiry.customerId;
// //     const companyName = customer.companyName;
// //     const address = customer.address || "";

// //     // 2. Prepare data & calculate totals
// //     let subtotal = 0;
// //     let totalGstAmount = 0;
// //     let totalDiscount = 0;
// //     const rowsHtml = quoteData
// //       .map((item, index) => {
// //         const finalPrice = parseFloat(item.finalPrice || 0);
// //         const gstAmount = parseFloat(item.gstAmount || 0);
// //         const discount = parseFloat(item.discount || 0);
// //         const basePrice = (finalPrice - gstAmount) / (1 - discount / 100);
// //         const priceAfterDiscount = basePrice - (basePrice * discount) / 100;

// //         subtotal += priceAfterDiscount;
// //         totalGstAmount += gstAmount;
// //         totalDiscount += basePrice - priceAfterDiscount;

// //         return `
// //         <tr style="background-color:${
// //           index % 2 === 0 ? "#f9f9f9" : "#ffffff"
// //         };">
// //           <td style="padding:8px;border:1px solid #ccc;">
// //             <strong>${item.name}</strong><br>
// //             <span style="font-weight: normal;">${item.brand || ""}</span>
// //           </td>
// //           <td style="padding:8px;border:1px solid #ccc;">${
// //             item.specifications || "-"
// //           }</td>
// //           <td style="padding:8px;border:1px solid #ccc;">${item.quantity}</td>
// //           <td style="padding:8px;border:1px solid #ccc;">${item.uom || "-"}</td>
// //           <td style="padding:8px;border:1px solid #ccc;">₹${basePrice.toFixed(
// //             2
// //           )}</td>
// //           <td style="padding:8px;border:1px solid #ccc;">${item.discount}%</td>
// //           <td style="padding:8px;border:1px solid #ccc;">${item.gstRate}%</td>
// //           <td style="padding:8px;border:1px solid #ccc;"><strong>₹${finalPrice.toFixed(
// //             2
// //           )}</strong></td>
// //         </tr>
// //       `;
// //       })
// //       .join("");
// //     const delivery = parseFloat(deliveryCharges || 0);
// //     const total = subtotal + delivery + totalGstAmount;

// //     const myCompany = {
// //       name: "WZP Tech Pvt Ltd",
// //       address: "123 Industrial Park, Mumbai, MH, 400001",
// //       gstin: "27AAACW1234Z1Z5",
// //       phone: "+91 9876543210",
// //       email: "info@wzptech.com",
// //     };

// //     const htmlContent = `
// //       <div style="font-family: Arial, sans-serif; padding: 20px;">
// //         <!-- Header -->
// //         <div style="display: flex; justify-content: space-between; align-items: flex-start;">
// //           <div style="flex: 1;">
// //             <h2 style="margin: 0;">${myCompany.name}</h2>
// //             <p style="margin: 4px 0;">${myCompany.address}</p>
// //             <p style="margin: 4px 0;"><strong>GSTIN:</strong> ${
// //               myCompany.gstin
// //             }</p>
// //           </div>
// //           <div style="flex: 1; text-align: right; font-size: 14px;">
// //             <h3 style="margin-bottom: 4px;">Customer Details</h3>
// //             <p style="margin: 2px 0;"><strong>${companyName}</strong></p>
// //             <p style="margin: 2px 0;">${address}</p>
// //             <p style="margin: 2px 0;"><strong>GSTIN:</strong> ${
// //               customer.gstin || "-"
// //             }</p>
// //           </div>
// //         </div>

// //         <!-- Title -->
// //         <h2 style="text-align: center; margin-top: 30px;">Quotation</h2>
// //         <p><strong>Inquiry ID:</strong> ${inquiryId}</p>

// //         <!-- Product Table -->
// //         <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
// //           <thead style="background-color: #f2f2f2;">
// //             <tr>
// //               <th style="padding:8px;border:1px solid #ccc;">Product</th>
// //               <th style="padding:8px;border:1px solid #ccc;">Specifications</th>
// //               <th style="padding:8px;border:1px solid #ccc;">Qty</th>
// //               <th style="padding:8px;border:1px solid #ccc;">UOM</th>
// //               <th style="padding:8px;border:1px solid #ccc;">Unit Price</th>
// //               <th style="padding:8px;border:1px solid #ccc;">Discount</th>
// //               <th style="padding:8px;border:1px solid #ccc;">GST</th>
// //               <th style="padding:8px;border:1px solid #ccc;">Final Price</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             ${rowsHtml}
// //           </tbody>
// //         </table>

// //         <!-- Totals -->
// //         <div style="margin-top:20px;text-align:right;">
// //           <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
// //           <p><strong>Total Discount:</strong> -₹${totalDiscount.toFixed(2)}</p>
// //           <p><strong>GST:</strong> ₹${totalGstAmount.toFixed(2)}</p>
// //           <p><strong>Delivery Charges:</strong> ₹${delivery.toFixed(2)}</p>
// //           <hr />
// //           <p style="font-size:18px;"><strong>Total Amount:</strong> ₹${total.toFixed(
// //             2
// //           )}</p>
// //         </div>
// //       </div>
// //     `;
// //     // 4. Generate PDF
// //     const file = { content: htmlContent };
// //     const options = {
// //       format: "A4",
// //       border: {
// //         top: "10mm",
// //         right: "10mm",
// //         bottom: "10mm",
// //         left: "10mm",
// //       },
// //     };
// //     const pdfBuffer = await htmlPdfNode.generatePdf(file, options);

// //     // 5. Send Email
// //     const transporter = nodemailer.createTransport({
// //       service: "Gmail",
// //       auth: {
// //         user: process.env.EMAIL_USER,
// //         pass: process.env.EMAIL_PASS,
// //       },
// //     });

// //     await transporter.sendMail({
// //       from: process.env.EMAIL_USER,
// //       to: toEmails,
// //       cc: ccEmails,
// //       subject,
// //       text: message,
// //       html: `
// //         <div style="font-family: Arial, sans-serif;">
// //           <p>${message.replace(/\n/g, "<br>")}</p>
// //           <p>Please find the attached quotation for your review.</p>
// //           <br>
// //           <p>Best regards,<br>
// //           ${myCompany.name}<br>
// //           ${myCompany.phone}<br>
// //           ${myCompany.email}</p>
// //         </div>
// //       `,
// //       attachments: [
// //         {
// //           filename: `Quotation-${inquiryId}.pdf`,
// //           content: pdfBuffer,
// //           contentType: "application/pdf",
// //         },
// //       ],
// //     });

// //     // 6. Create Order record
// //     const orderItems = quoteData.map((item) => ({
// //       name: item.name,
// //       brand: item.brand,
// //       quantity: item.quantity,
// //       category: item.category,
// //       description: item.description,
// //       specifications: item.specifications,
// //       uom: item.uom,
// //       basePrice: parseFloat(item.basePrice || 0),
// //       margin: parseFloat(item.margin || 0),
// //       discount: parseFloat(item.discount || 0),
// //       gstRate: parseFloat(item.gstRate || 0),
// //       gstAmount: parseFloat(item.gstAmount || 0),
// //       finalPrice: parseFloat(item.finalPrice || 0),
// //     }));

// //     const newOrder = await Order.create({
// //       inquiryId,
// //       customerId: inquiry.customerId._id,
// //       items: orderItems,
// //       deliveryCharges: delivery,
// //       subtotal: subtotal,
// //       totalDiscount: totalDiscount,
// //       totalGstAmount: totalGstAmount,
// //       totalPrice: total,
// //       status: "Open",
// //       quotationSentAt: new Date(),
// //       emailDetails: {
// //         toEmails: Array.isArray(toEmails) ? toEmails : [toEmails],
// //         ccEmails: Array.isArray(ccEmails)
// //           ? ccEmails
// //           : ccEmails
// //           ? [ccEmails]
// //           : [],
// //         subject,
// //         message,
// //       },
// //     });

// //     // 7. Update inquiry status to Fulfilled
// //     await Inquiry.updateOne(
// //       { inquiryId },
// //       {
// //         status: "Fulfilled",
// //         fulfilledAt: new Date(),
// //         orderId: newOrder._id,
// //       }
// //     );

// //     return res.status(200).json({
// //       message: "Quotation sent successfully and order created!",
// //       orderId: newOrder._id,
// //     });
// //   } catch (err) {
// //     console.error("Error in sendQuoteResponse:", err);
// //     return res.status(500).json({
// //       error: "Failed to send quotation. Please try again.",
// //       details: process.env.NODE_ENV === "development" ? err.message : undefined,
// //     });
// //   }
// // });

// // export default router;
// import express from "express";
// import htmlPdfNode from "html-pdf-node";
// import nodemailer from "nodemailer";
// import jwt from 'jsonwebtoken';
// import Inquiry from "../models/Inquiry.js";
// import Customer from "../models/Customer.js";
// import Order from "../models/Order.js";
// import logActivity from '../utils/logActivity.js';
// const router = express.Router();

// router.post("/", async (req, res) => {
//   try {

//     // 1. Extract user from JWT
//     const authHeader = req.header('Authorization');
//     const token = authHeader?.replace('Bearer ', '');
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     let decodedUser;
//     try {
//       decodedUser = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     const {
//       toEmails,
//       ccEmails,
//       inquiryId,
//       quoteData,
//       deliveryCharges,
//       subject,
//       message,
//     } = req.body;

//     // 1. Fetch inquiry and customer info
//     const inquiry = await Inquiry.findOne({ inquiryId }).populate("customerId");
//     if (!inquiry) {
//       return res.status(404).json({ error: "Inquiry not found" });
//     }

//     const customer = inquiry.customerId;
//     const companyName = customer.companyName;
//     const address = customer.address || "";

//     // 2. Check if order already exists (for editing case)
//     const existingOrder = await Order.findOne({ inquiryId });
    
//     // Allow re-sending if order is in negotiation status or doesn't exist
//     if (existingOrder && existingOrder.status !== 'Negotiation') {
//       return res.status(400).json({
//         error: "This order has already been processed and cannot be modified.",
//       });
//     }

//     // 3. Prepare data & calculate totals
//     let subtotal = 0;
//     let totalGstAmount = 0;
//     let totalDiscount = 0;
//     const rowsHtml = quoteData
//       .map((item, index) => {
//         const finalPrice = parseFloat(item.finalPrice || 0);
//         const gstAmount = parseFloat(item.gstAmount || 0);
//         const discount = parseFloat(item.discount || 0);
//         const basePrice = (finalPrice - gstAmount) / (1 - discount / 100);
//         const priceAfterDiscount = basePrice - (basePrice * discount) / 100;

//         subtotal += priceAfterDiscount;
//         totalGstAmount += gstAmount;
//         totalDiscount += basePrice - priceAfterDiscount;

//         return `
//         <tr style="background-color:${
//           index % 2 === 0 ? "#f9f9f9" : "#ffffff"
//         };">
//           <td style="padding:8px;border:1px solid #ccc;">
//             <strong>${item.name}</strong><br>
//             <span style="font-weight: normal;">${item.brand || ""}</span>
//           </td>
//           <td style="padding:8px;border:1px solid #ccc;">${
//             item.specifications || "-"
//           }</td>
//           <td style="padding:8px;border:1px solid #ccc;">${item.quantity}</td>
//           <td style="padding:8px;border:1px solid #ccc;">${item.uom || "-"}</td>
//           <td style="padding:8px;border:1px solid #ccc;">₹${basePrice.toFixed(
//             2
//           )}</td>
//           <td style="padding:8px;border:1px solid #ccc;">${item.discount}%</td>
//           <td style="padding:8px;border:1px solid #ccc;">${item.gstRate}%</td>
//           <td style="padding:8px;border:1px solid #ccc;"><strong>₹${finalPrice.toFixed(
//             2
//           )}</strong></td>
//         </tr>
//       `;
//       })
//       .join("");
//     const delivery = parseFloat(deliveryCharges || 0);
//     const total = subtotal + delivery + totalGstAmount;

//     const myCompany = {
//       name: "WZP Tech Pvt Ltd",
//       address: "123 Industrial Park, Mumbai, MH, 400001",
//       gstin: "27AAACW1234Z1Z5",
//       phone: "+91 9876543210",
//       email: "info@wzptech.com",
//     };

//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; padding: 20px;">
//         <!-- Header -->
//         <div style="display: flex; justify-content: space-between; align-items: flex-start;">
//           <div style="flex: 1;">
//             <h2 style="margin: 0;">${myCompany.name}</h2>
//             <p style="margin: 4px 0;">${myCompany.address}</p>
//             <p style="margin: 4px 0;"><strong>GSTIN:</strong> ${
//               myCompany.gstin
//             }</p>
//           </div>
//           <div style="flex: 1; text-align: right; font-size: 14px;">
//             <h3 style="margin-bottom: 4px;">Customer Details</h3>
//             <p style="margin: 2px 0;"><strong>${companyName}</strong></p>
//             <p style="margin: 2px 0;">${address}</p>
//             <p style="margin: 2px 0;"><strong>GSTIN:</strong> ${
//               customer.gstin || "-"
//             }</p>
//           </div>
//         </div>

//         <!-- Title -->
//         <h2 style="text-align: center; margin-top: 30px;">${existingOrder ? 'REVISED QUOTATION' : 'QUOTATION'}</h2>
//         <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
//         ${existingOrder ? '<p style="color: #ff6b35;"><strong>Note:</strong> This is a revised quotation with updated pricing.</p>' : ''}

//         <!-- Product Table -->
//         <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
//           <thead style="background-color: #f2f2f2;">
//             <tr>
//               <th style="padding:8px;border:1px solid #ccc;">Product</th>
//               <th style="padding:8px;border:1px solid #ccc;">Specifications</th>
//               <th style="padding:8px;border:1px solid #ccc;">Qty</th>
//               <th style="padding:8px;border:1px solid #ccc;">UOM</th>
//               <th style="padding:8px;border:1px solid #ccc;">Unit Price</th>
//               <th style="padding:8px;border:1px solid #ccc;">Discount</th>
//               <th style="padding:8px;border:1px solid #ccc;">GST</th>
//               <th style="padding:8px;border:1px solid #ccc;">Final Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${rowsHtml}
//           </tbody>
//         </table>

//         <!-- Totals -->
//         <div style="margin-top:20px;text-align:right;">
//           <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
//           <p><strong>Total Discount:</strong> -₹${totalDiscount.toFixed(2)}</p>
//           <p><strong>GST:</strong> ₹${totalGstAmount.toFixed(2)}</p>
//           <p><strong>Delivery Charges:</strong> ₹${delivery.toFixed(2)}</p>
//           <hr />
//           <p style="font-size:18px;"><strong>Total Amount:</strong> ₹${total.toFixed(
//             2
//           )}</p>
//         </div>
//       </div>
//     `;

//     // 4. Generate PDF
//     const file = { content: htmlContent };
//     const options = {
//       format: "A4",
//       border: {
//         top: "10mm",
//         right: "10mm",
//         bottom: "10mm",
//         left: "10mm",
//       },
//     };
//     const pdfBuffer = await htmlPdfNode.generatePdf(file, options);

//     // 5. Send Email
//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const emailSubject = existingOrder 
//       ? `REVISED ${subject}` 
//       : subject;

//     const emailMessage = existingOrder 
//       ? `${message}\n\nPlease note: This is a revised quotation with updated pricing and terms.`
//       : message;

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: toEmails,
//       cc: ccEmails,
//       subject: emailSubject,
//       text: emailMessage,
//       html: `
//         <div style="font-family: Arial, sans-serif;">
//           <p>${emailMessage.replace(/\n/g, "<br>")}</p>
//           <p>Please find the attached ${existingOrder ? 'revised ' : ''}quotation for your review.</p>
//           <br>
//           <p>Best regards,<br>
//           ${myCompany.name}<br>
//           ${myCompany.phone}<br>
//           ${myCompany.email}</p>
//         </div>
//       `,
//       attachments: [
//         {
//           filename: `${existingOrder ? 'Revised-' : ''}Quotation-${inquiryId}.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         },
//       ],
//     });

//     // 6. Create or Update Order record
//     const orderItems = quoteData.map((item) => ({
//       name: item.name,
//       brand: item.brand,
//       quantity: item.quantity,
//       category: item.category,
//       description: item.description,
//       specifications: item.specifications,
//       uom: item.uom,
//       basePrice: parseFloat(item.basePrice || 0),
//       margin: parseFloat(item.margin || 0),
//       discount: parseFloat(item.discount || 0),
//       gstRate: parseFloat(item.gstRate || 0),
//       gstAmount: parseFloat(item.gstAmount || 0),
//       finalPrice: parseFloat(item.finalPrice || 0),
//     }));

//     let order;
//     if (existingOrder) {
//       // Update existing order
//       existingOrder.items = orderItems;
//       existingOrder.deliveryCharges = delivery;
//       existingOrder.subtotal = subtotal;
//       existingOrder.totalDiscount = totalDiscount;
//       existingOrder.totalGstAmount = totalGstAmount;
//       existingOrder.totalPrice = total;
//       existingOrder.status = 'Open';
//       existingOrder.quotationSentAt = new Date();
//       existingOrder.emailDetails = {
//         toEmails: Array.isArray(toEmails) ? toEmails : [toEmails],
//         ccEmails: Array.isArray(ccEmails) ? ccEmails : ccEmails ? [ccEmails] : [],
//         subject: emailSubject,
//         message: emailMessage,
//       };
//       existingOrder.revisionCount = (existingOrder.revisionCount || 0) + 1;
//       await existingOrder.save();
//       order = existingOrder;
//     } else {
//       // Create new order
//       order = await Order.create({
//         inquiryId,
//         customerId: inquiry.customerId._id,
//         items: orderItems,
//         deliveryCharges: delivery,
//         subtotal: subtotal,
//         totalDiscount: totalDiscount,
//         totalGstAmount: totalGstAmount,
//         totalPrice: total,
//         status: "Open",
//         quotationSentAt: new Date(),
//         emailDetails: {
//           toEmails: Array.isArray(toEmails) ? toEmails : [toEmails],
//           ccEmails: Array.isArray(ccEmails) ? ccEmails : ccEmails ? [ccEmails] : [],
//           subject: emailSubject,
//           message: emailMessage,
//         },
//         revisionCount: 0,
//       });
//     }
//     // 7. Update inquiry status to Fulfilled
//     await Inquiry.updateOne(
//       { inquiryId },
//       {
//         status: "Fulfilled",
//         fulfilledAt: new Date(),
//         orderId: order._id,
//       }
//     );

//     return res.status(200).json({
//       message: existingOrder 
//         ? "Revised quotation sent successfully!" 
//         : "Quotation sent successfully and order created!",
//       orderId: order._id,
//       isRevision: !!existingOrder,
//     });
//   } catch (err) {
//     console.error("Error in sendQuoteResponse:", err);
//     return res.status(500).json({
//       error: "Failed to send quotation. Please try again.",
//       details: process.env.NODE_ENV === "development" ? err.message : undefined,
//     });
//   }
  
// });

// export default router;
import express from "express";
import htmlPdfNode from "html-pdf-node";
import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';
import Inquiry from "../models/Inquiry.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import {logActivity} from '../utils/logActivity.js';

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // 1. Extract user from JWT
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const {
      toEmails,
      ccEmails,
      inquiryId,
      quoteData,
      deliveryCharges,
      subject,
      message,
    } = req.body;

    // 2. Fetch inquiry and customer info
    const inquiry = await Inquiry.findOne({ inquiryId }).populate("customerId");
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const customer = inquiry.customerId;
    const companyName = customer.companyName;
    const address = customer.address || "";

    // 3. Check if order already exists (for editing case)
    const existingOrder = await Order.findOne({ inquiryId });
    
    // Allow re-sending if order is in negotiation status or doesn't exist
    if (existingOrder && existingOrder.status !== 'Negotiation') {
      return res.status(400).json({
        error: "This order has already been processed and cannot be modified.",
      });
    }

    // 4. Prepare data & calculate totals
    let subtotal = 0;
    let totalGstAmount = 0;
    let totalDiscount = 0;
    const rowsHtml = quoteData
      .map((item, index) => {
        const finalPrice = parseFloat(item.finalPrice || 0);
        const gstAmount = parseFloat(item.gstAmount || 0);
        const discount = parseFloat(item.discount || 0);
        const basePrice = (finalPrice - gstAmount) / (1 - discount / 100);
        const priceAfterDiscount = basePrice - (basePrice * discount) / 100;

        subtotal += priceAfterDiscount;
        totalGstAmount += gstAmount;
        totalDiscount += basePrice - priceAfterDiscount;

        return `
        <tr style="background-color:${
          index % 2 === 0 ? "#f9f9f9" : "#ffffff"
        };">
          <td style="padding:8px;border:1px solid #ccc;">
            <strong>${item.name}</strong><br>
            <span style="font-weight: normal;">${item.brand || ""}</span>
          </td>
          <td style="padding:8px;border:1px solid #ccc;">${
            item.specifications || "-"
          }</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.uom || "-"}</td>
          <td style="padding:8px;border:1px solid #ccc;">₹${basePrice.toFixed(
            2
          )}</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.discount}%</td>
          <td style="padding:8px;border:1px solid #ccc;">${item.gstRate}%</td>
          <td style="padding:8px;border:1px solid #ccc;"><strong>₹${finalPrice.toFixed(
            2
          )}</strong></td>
        </tr>
      `;
      })
      .join("");
    const delivery = parseFloat(deliveryCharges || 0);
    const total = subtotal + delivery + totalGstAmount;

    const myCompany = {
      name: "WZP Tech Pvt Ltd",
      address: "123 Industrial Park, Mumbai, MH, 400001",
      gstin: "27AAACW1234Z1Z5",
      phone: "+91 9876543210",
      email: "info@wzptech.com",
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h2 style="margin: 0;">${myCompany.name}</h2>
            <p style="margin: 4px 0;">${myCompany.address}</p>
            <p style="margin: 4px 0;"><strong>GSTIN:</strong> ${
              myCompany.gstin
            }</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 14px;">
            <h3 style="margin-bottom: 4px;">Customer Details</h3>
            <p style="margin: 2px 0;"><strong>${companyName}</strong></p>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;"><strong>GSTIN:</strong> ${
              customer.gstin || "-"
            }</p>
          </div>
        </div>

        <!-- Title -->
        <h2 style="text-align: center; margin-top: 30px;">${existingOrder ? 'REVISED QUOTATION' : 'QUOTATION'}</h2>
        <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
        ${existingOrder ? '<p style="color: #ff6b35;"><strong>Note:</strong> This is a revised quotation with updated pricing.</p>' : ''}

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
          <p style="font-size:18px;"><strong>Total Amount:</strong> ₹${total.toFixed(
            2
          )}</p>
        </div>
      </div>
    `;

    // 5. Generate PDF
    const file = { content: htmlContent };
    const options = {
      format: "A4",
      border: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    };
    const pdfBuffer = await htmlPdfNode.generatePdf(file, options);

    // 6. Send Email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailSubject = existingOrder 
      ? `REVISED ${subject}` 
      : subject;

    const emailMessage = existingOrder 
      ? `${message}\n\nPlease note: This is a revised quotation with updated pricing and terms.`
      : message;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmails,
      cc: ccEmails,
      subject: emailSubject,
      text: emailMessage,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>${emailMessage.replace(/\n/g, "<br>")}</p>
          <p>Please find the attached ${existingOrder ? 'revised ' : ''}quotation for your review.</p>
          <br>
          <p>Best regards,<br>
          ${myCompany.name}<br>
          ${myCompany.phone}<br>
          ${myCompany.email}</p>
        </div>
      `,
      attachments: [
        {
          filename: `${existingOrder ? 'Revised-' : ''}Quotation-${inquiryId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    // 7. Create or Update Order record
    const orderItems = quoteData.map((item) => ({
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      category: item.category,
      description: item.description,
      specifications: item.specifications,
      uom: item.uom,
      basePrice: parseFloat(item.basePrice || 0),
      margin: parseFloat(item.margin || 0),
      discount: parseFloat(item.discount || 0),
      gstRate: parseFloat(item.gstRate || 0),
      gstAmount: parseFloat(item.gstAmount || 0),
      finalPrice: parseFloat(item.finalPrice || 0),
    }));

    let order;
    if (existingOrder) {
      // Update existing order
      existingOrder.items = orderItems;
      existingOrder.deliveryCharges = delivery;
      existingOrder.subtotal = subtotal;
      existingOrder.totalDiscount = totalDiscount;
      existingOrder.totalGstAmount = totalGstAmount;
      existingOrder.totalPrice = total;
      existingOrder.status = 'Open';
      existingOrder.quotationSentAt = new Date();
      existingOrder.emailDetails = {
        toEmails: Array.isArray(toEmails) ? toEmails : [toEmails],
        ccEmails: Array.isArray(ccEmails) ? ccEmails : ccEmails ? [ccEmails] : [],
        subject: emailSubject,
        message: emailMessage,
      };
      existingOrder.revisionCount = (existingOrder.revisionCount || 0) + 1;
      await existingOrder.save();
      order = existingOrder;
    } else {
      // Create new order
      order = await Order.create({
        inquiryId,
        customerId: inquiry.customerId._id,
        items: orderItems,
        deliveryCharges: delivery,
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        totalGstAmount: totalGstAmount,
        totalPrice: total,
        status: "Open",
        quotationSentAt: new Date(),
        emailDetails: {
          toEmails: Array.isArray(toEmails) ? toEmails : [toEmails],
          ccEmails: Array.isArray(ccEmails) ? ccEmails : ccEmails ? [ccEmails] : [],
          subject: emailSubject,
          message: emailMessage,
        },
        revisionCount: 0,
      });
    }

    // 8. Update inquiry status to Fulfilled
    await Inquiry.updateOne(
      { inquiryId },
      {
        status: "Fulfilled",
        fulfilledAt: new Date(),
        orderId: order._id,
      }
    );

    // 9. Log Activity - Add this after all database operations are complete
    await logActivity({
      userId: decodedUser.id,
      action: existingOrder ? 'Sent Revised Quotation' : 'Sent Quotation to Company',
      targetType: 'Order',
      targetId: order._id,
      details: {
        inquiryId,
        orderId: order._id,
        subject: emailSubject,
        recipientCount: Array.isArray(toEmails) ? toEmails.length : 1,
        total: total.toFixed(2),
        revision: existingOrder ? order.revisionCount : 0,
        customerCompany: companyName,
      },
    });

    // 10. Return success response
    return res.status(200).json({
      message: existingOrder 
        ? "Revised quotation sent successfully!" 
        : "Quotation sent successfully and order created!",
      orderId: order._id,
      isRevision: !!existingOrder,
    });

  } catch (err) {
    console.error("Error in sendQuoteResponse:", err);
    return res.status(500).json({
      error: "Failed to send quotation. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

export default router;