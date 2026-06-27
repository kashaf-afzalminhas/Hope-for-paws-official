const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// Fetch orders containing items for the logged-in seller
exports.getSellerOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    // Find orders where at least one item belongs to this seller
    const orders = await Order.find({ 'items.seller': seller._id })
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .lean();

    // Format for frontend
    const formattedOrders = orders.map(order => {
      // Filter items specifically for this seller
      const sellerItems = order.items.filter(item => item.seller.toString() === seller._id.toString());
      const amount = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemsCount = sellerItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const status = sellerItems.length > 0 ? sellerItems[0].status : 'Pending';

      return {
        id: order._id,
        customer: order.customerName || 'Guest',
        items: itemsCount,
        amount,
        status,
        date: order.createdAt.toISOString().split('T')[0]
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update status of a specific order for the seller's items
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update status only for items belonging to this seller
    let updated = false;
    order.items.forEach(item => {
      if (item.seller.toString() === seller._id.toString()) {
        item.status = status;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(403).json({ message: 'No items found for this seller in this order' });
    }

    await order.save();
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dashboard Stats Aggregation
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    // 1. Get Products Stats
    const products = await Product.find({ sellerId: seller._id }).select('countInStock').lean();
    const activeProducts = products.filter(p => p.countInStock > 0).length;
    const lowStock = products.filter(p => p.countInStock > 0 && p.countInStock <= 5).length;

    // 2. Get Orders & Revenue Aggregation
    const sellerId = seller._id;
    
    // Aggregate Total Revenue & Orders count
    const statsAgg = await Order.aggregate([
      { $match: { 'items.seller': sellerId } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { 
        $group: {
          _id: '$_id',
          orderTotal: {
            $sum: {
              $cond: [
                { $ne: ['$items.status', 'Cancelled'] },
                { $multiply: ['$items.price', '$items.quantity'] },
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$orderTotal' }
        }
      }
    ]);

    const totalOrders = statsAgg.length > 0 ? statsAgg[0].totalOrders : 0;
    const totalRevenue = statsAgg.length > 0 ? statsAgg[0].totalRevenue : 0;

    // 3. Aggregate Monthly Revenue (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, 'items.seller': sellerId } },
      { $unwind: '$items' },
      { $match: { 
          'items.seller': sellerId,
          'items.status': { $ne: 'Cancelled' }
      } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize exactly 6 months
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      revenueByMonth.push({
        month: monthNames[d.getMonth()],
        value: 0,
        monthNum: d.getMonth() + 1,
        year: d.getFullYear()
      });
    }

    // Map aggregated data
    monthlyAgg.forEach(item => {
      const target = revenueByMonth.find(r => r.monthNum === item._id.month && r.year === item._id.year);
      if (target) {
        target.value = item.revenue;
      }
    });

    // 4. Get Recent Orders (Limit 5)
    const recentOrdersRaw = await Order.find({ 'items.seller': sellerId })
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrders = recentOrdersRaw.map(order => {
      const sellerItems = order.items.filter(item => item.seller.toString() === sellerId.toString());
      const amount = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemsCount = sellerItems.reduce((sum, item) => sum + item.quantity, 0);
      const status = sellerItems.length > 0 ? sellerItems[0].status : 'Pending';

      return {
        id: order._id,
        customer: order.customerName || 'Guest',
        items: itemsCount,
        amount,
        status,
        date: order.createdAt.toISOString().split('T')[0]
      };
    });

    // 5. Get Top Products (Limit 4)
    const topProductsAgg = await Order.aggregate([
      { $match: { 'items.seller': sellerId } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId, 'items.status': { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 4 }
    ]);

    const topProducts = await Promise.all(topProductsAgg.map(async (p) => {
      const product = await Product.findById(p._id).select('title images price countInStock').lean();
      if (product) {
        return {
          id: product._id,
          title: product.title,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          price: product.price,
          stock: product.countInStock,
          totalSold: p.totalSold,
          revenue: p.revenue
        };
      }
      return null;
    })).then(results => results.filter(r => r !== null));

    res.json({
      totalRevenue,
      totalOrders,
      activeProducts,
      lowStock,
      revenueByMonth: revenueByMonth.map(r => ({ month: r.month, value: r.value })),
      recentOrders,
      topProducts
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new order for a buyer checkout
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totals } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const order = new Order({
      userId: req.user.userId,
      items,
      shippingAddress,
      paymentMethod,
      totals,
      status: 'Pending'
    });

    await order.save();

    // Empty the user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { items: [] } }
    );

    res.status(201).json({ success: true, order, message: 'Order placed successfully' });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};
