import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';

import dotenv from 'dotenv';
dotenv.config();
import sendCompanyResponse from './routes/sendCompanyResponse.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customerRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import sendInquiryEmail from './routes/sendInquiryEmail.js';
import sendQuoteRoute from './routes/sendQuoteRoute.js';
import activityLogRoute from './routes/activityLogRoute.js';
import productOverviewRoute from './routes/productOverviewRoute.js';
import orderRoutes from './routes/orderRoutes.js';
import admin , { checkAndCreateNotifications }from './routes/admin.js';
import delayedNotificationsRoute from './routes/delayedNotificationsRoute.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://wzp-project.netlify.app',
];

// ✅ Fixed CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // ✅ Explicitly allow methods
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'Cache-Control',
      'X-Auth-Token'
    ], // ✅ Explicitly allow headers
    preflightContinue: false, // ✅ Handle preflight internally
    optionsSuccessStatus: 200 // ✅ Support legacy browsers
  })
);

// ✅ Alternative: Manual preflight handling (if the above doesn't work)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Auth-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use('/api', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/send-inquiry-mails',sendInquiryEmail);
app.use('/api/activitylogs',activityLogRoute);
app.use('/api/products',productOverviewRoute);
app.use('/api/orders',orderRoutes);
app.use('/api/admin',admin);

// Cron jobs
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled notification check...');
  await checkAndCreateNotifications();
});

cron.schedule('0 */6 * * *', async () => {
  console.log('Running periodic notification check...');
  await checkAndCreateNotifications();
});

app.use('/api/sendQuoteResponse',sendCompanyResponse);
app.use('/api/notifications', delayedNotificationsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Notification scheduler initialized');
  
  // Run initial notification check on server start
  setTimeout(async () => {
    console.log('Running initial notification check...');
    await checkAndCreateNotifications();
  }, 5000);
});