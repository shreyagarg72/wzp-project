import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';

import dotenv from 'dotenv';
dotenv.config();
import sendCompanyResponse from './routes/sendCompanyResponse.js';
import authRoutes from './routes/auth.js'; // ✅ import auth route
import customerRoutes from './routes/customerRoutes.js'; // ✅ import auth route
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
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use('/api', authRoutes); // ✅ use /api prefix
app.use('/api/customers', customerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/suppliers', supplierRoutes);
// app.use('/api/inquiries',sendQuoteRoute)
app.use('/api/send-inquiry-mails',sendInquiryEmail);
app.use('/api/activitylogs',activityLogRoute);
app.use('/api/products',productOverviewRoute);
app.use('/api/orders',orderRoutes);
app.use('/api/admin',admin);
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled notification check...');
  await checkAndCreateNotifications();
});

// Also run notification check every 6 hours for more frequent monitoring
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
