// routes/productOverview.routes.js
import express from 'express';
import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).select('productId productName brand category description specifications uom');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    const { productName, brand, category, description, specifications, uom } = req.body;
    
    const product = new Product({
      productName,
      brand,
      category,
      description,
      specifications,
      uom
    });
    
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

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
