// routes/productOverview.routes.js
import express from 'express';
import Inquiry from '../models/Inquiry.js';
// import Product from '../models/product.model.js';
// import Customer from '../models/customer.model.js';
// import Supplier from '../models/supplier.model.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({})
      .populate('customerId', 'companyName')
      .populate('supplierQuotes.supplierId', 'supplierName');

    const productMap = {};

    inquiries.forEach((inquiry) => {
      inquiry.products.forEach((product) => {
        const key = product.productId.toString();

        if (!productMap[key]) {
          productMap[key] = {
            productName: product.name,
            brand: product.brand,
            specification: product.specifications,
            inquiries: [],
          };
        }

        const quoteDetails = [];

        inquiry.supplierQuotes.forEach((sq) => {
          const quote = sq.quotes.find((q) => q.productId === key);
          if (quote) {
            quoteDetails.push({
              supplierName: sq.supplierId?.supplierName || 'N/A',
              price: quote.price,
              availability: quote.availability,
              expectedDelivery: quote.expectedDelivery,
            });
          }
        });

        productMap[key].inquiries.push({
          inquiryId: inquiry.inquiryId,
          customerName: inquiry.customerId?.companyName || 'N/A',
          quantity: product.quantity,
          quotes: quoteDetails,
        });
      });
    });

    res.json(Object.values(productMap));
  } catch (err) {
    console.error('Error fetching product overview', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
