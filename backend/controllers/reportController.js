const Report = require('../models/Report');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

exports.createProductReport = async (req, res) => {
  try {
    const { targetProduct, reason } = req.body;
    const reporterId = req.user.id || req.user.userId;

    if (!targetProduct || !reason) {
      return res.status(400).json({ message: 'Target product and reason are required.' });
    }

    // Security Check: Has the user already reported this product?
    const existingReport = await Report.findOne({ reporter: reporterId, targetProduct });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this product.' });
    }

    // Create Report
    const report = new Report({
      reporter: reporterId,
      targetProduct,
      reason
    });
    await report.save();

    // Find and update Product
    const product = await Product.findById(targetProduct);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    product.reportCount += 1;
    let thresholdCrossed = false;

    // Threshold Engine
    if (product.reportCount >= 5 && !product.isHidden) {
      product.isHidden = true;
      thresholdCrossed = true;

      // Update Seller warning count
      const seller = await Seller.findById(product.sellerId);
      if (seller) {
        seller.warningCount += 1;
        await seller.save();

        // Automated Emails
        try {
          const sellerUser = await User.findById(seller.userId);
          
          if (sellerUser && sellerUser.email) {
            const { subject, html } = emailTemplates.buildProductHiddenEmail({ productTitle: product.title });
            await transporter.sendMail({
              from: process.env.GMAIL_USER,
              to: sellerUser.email,
              subject,
              html,
            });
          }

          const { subject: adminSubject, html: adminHtml } = emailTemplates.buildAdminAlertEmail({
            productTitle: product.title,
            storeName: seller.storeName || 'Seller',
          });
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
            subject: adminSubject,
            html: adminHtml,
          });
        } catch (emailErr) {
          console.error('Automated Moderation Email Error:', emailErr);
          // Non-fatal error, continue processing
        }
      }
    }

    await product.save();

    res.status(201).json({ 
      message: 'Report submitted successfully.', 
      thresholdCrossed 
    });

  } catch (err) {
    console.error('createProductReport Error:', err);
    res.status(500).json({ message: 'Server error while processing report.' });
  }
};

// Admin: Get all reported products
exports.getReportedProducts = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id || req.user.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const reportedProducts = await Product.find({ reportCount: { $gt: 0 } })
      .populate('sellerId', 'storeName name userId')
      .sort({ reportCount: -1 })
      .lean();

    // Optionally fetch all reports for these products to send along
    const productIds = reportedProducts.map(p => p._id);
    const reports = await Report.find({ targetProduct: { $in: productIds } })
      .populate('reporter', 'name email')
      .lean();

    // Attach reports to their respective products
    const productsWithReports = reportedProducts.map(product => {
      product.reportsList = reports.filter(r => r.targetProduct.toString() === product._id.toString());
      return product;
    });

    res.json(productsWithReports);
  } catch (err) {
    console.error('getReportedProducts Error:', err);
    res.status(500).json({ message: 'Server error fetching reported products.' });
  }
};

// Admin: Reinstate a hidden product
exports.reinstateProduct = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id || req.user.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Reset moderation flags
    product.isHidden = false;
    product.reportCount = 0;
    await product.save();

    // Optionally, mark all associated reports as 'reviewed' or 'dismissed'
    await Report.updateMany(
      { targetProduct: productId }, 
      { $set: { status: 'dismissed' } }
    );

    res.json({ message: 'Product successfully reinstated.', product });
  } catch (err) {
    console.error('reinstateProduct Error:', err);
    res.status(500).json({ message: 'Server error reinstating product.' });
  }
};
