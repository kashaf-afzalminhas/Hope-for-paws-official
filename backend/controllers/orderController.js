const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');

// ------------------------------------------------------------------
// BUYER CONTROLLERS
// ------------------------------------------------------------------

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const buyerId = req.user?.id || req.user?.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Group items by sellerId
    const itemsBySeller = {};
    for (const item of items) {
      const productId = item.productId || item.product?._id;
      if (!productId) continue;
      
      const product = await Product.findById(productId);
      if (!product) continue;
      
      const sellerId = product.sellerId.toString();
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      
      itemsBySeller[sellerId].push({
        productId: product._id,
        title: product.title,
        image: product.images && product.images.length > 0 ? product.images[0] : item.image,
        quantity: item.quantity,
        price: product.price
      });
    }

    const ordersToCreate = [];
    const shippingFeePerSeller = 15; // Example fixed shipping per seller

    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      const subtotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const finalTotal = subtotal + shippingFeePerSeller;
      
      ordersToCreate.push({
        buyerId,
        sellerId,
        items: sellerItems,
        shippingAddress,
        paymentMethod,
        totals: {
          subtotal,
          shippingFee: shippingFeePerSeller,
          finalTotal
        },
        status: 'Pending',
        statusHistory: [{ status: 'Pending', note: 'Order placed successfully' }]
      });
    }

    if (ordersToCreate.length === 0) {
      return res.status(400).json({ message: 'Invalid products in order' });
    }

    const createdOrders = await Order.insertMany(ordersToCreate);

    // Empty the user's cart
    await Cart.findOneAndUpdate(
      { userId: buyerId },
      { $set: { items: [] } }
    );

    res.status(201).json({ success: true, orders: createdOrders, message: 'Orders placed successfully' });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user?.id || req.user?.userId;
    const orders = await Order.find({ buyerId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user?.id || req.user?.userId;
    
    const order = await Order.findOne({ _id: id, buyerId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending orders can be cancelled' });
    }
    
    order.status = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      note: 'Cancelled by buyer'
    });
    
    await order.save();
    res.json({ success: true, order, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------------------------------------
// SELLER CONTROLLERS
// ------------------------------------------------------------------

// Fetch orders for the logged-in seller
exports.getSellerOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    
    const queryConditions = [{ sellerId: userId }];
    if (seller) {
      queryConditions.push({ sellerId: seller._id });
    }
    
    const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    require('fs').writeFileSync('seller_orders_error.log', String(error.stack || error));
    res.status(500).json({ message: 'Server error' });
  }
};

// Update status of a specific order
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const userId = req.user?.id || req.user?.userId;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Security Check 1: Ensure ownership
    const seller = await Seller.findOne({ userId });
    const isOwner = order.sellerId.toString() === userId || 
                    (seller && order.sellerId.toString() === seller._id.toString());
                    
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Security Check 2: State Machine Progression
    const STATUS_ORDER = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const currentIndex = STATUS_ORDER.indexOf(order.status);
    const newIndex = STATUS_ORDER.indexOf(newStatus);

    if (newIndex === -1) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (newStatus === 'Cancelled') {
      if (order.status !== 'Pending' && order.status !== 'Confirmed') {
        return res.status(400).json({ message: 'Cannot cancel order after processing has started' });
      }
    } else {
      if (newIndex <= currentIndex) {
        return res.status(400).json({ message: 'Invalid status progression' });
      }
    }

    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, date: Date.now() });
    await order.save();
    
    res.json(order);
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

    const products = await Product.find({ sellerId: seller._id }).select('countInStock').lean();
    const activeProducts = products.filter(p => p.countInStock > 0).length;
    const lowStock = products.filter(p => p.countInStock > 0 && p.countInStock <= 5).length;

    const sellerId = seller._id;
    
    const statsAgg = await Order.aggregate([
      { $match: { sellerId: sellerId } },
      { 
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'Cancelled'] },
                '$totals.subtotal',
                0
              ]
            }
          }
        }
      }
    ]);

    const totalOrders = statsAgg.length > 0 ? statsAgg[0].totalOrders : 0;
    const totalRevenue = statsAgg.length > 0 ? statsAgg[0].totalRevenue : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, sellerId: sellerId, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$totals.subtotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

    monthlyAgg.forEach(item => {
      const target = revenueByMonth.find(r => r.monthNum === item._id.month && r.year === item._id.year);
      if (target) {
        target.value = item.revenue;
      }
    });

    const recentOrdersRaw = await Order.find({ sellerId: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrders = recentOrdersRaw.map(order => {
      const amount = order.totals.finalTotal;
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: order._id,
        orderId: order.orderId,
        customer: order.shippingAddress?.fullName || 'Guest',
        items: itemsCount,
        amount,
        status: order.status,
        date: order.createdAt.toISOString().split('T')[0]
      };
    });

    const topProductsAgg = await Order.aggregate([
      { $match: { sellerId: sellerId, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
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
