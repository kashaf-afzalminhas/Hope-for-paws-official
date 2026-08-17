const { SHIPPING_FEE } = require('../utils/constants');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendEmail } = require('../routes/mailer');
const emailTemplates = require('../utils/emailTemplates');


function getNotificationService() {
  return global.notificationService;
}

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

    // ── Phone, City & Address Validation ─────────────────────────────
    if (!shippingAddress || !shippingAddress.email || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Please fill in all required contact and shipping fields.' });
    }

    // Validates international phone numbers (+ followed by 7 to 15 digits) or local 10-digit format
    const phoneRegex = /^(\+[1-9]\d{6,14}|0?\d{10})$/;
    const phone = shippingAddress.phone ? String(shippingAddress.phone).trim() : '';

    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Please enter a valid phone number.'
      });
    }
    // ──────────────────────────────────────────────────────────────────

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

      const discountedPrice =
        product.discountPercentage > 0
          ? product.price * (1 - product.discountPercentage / 100)
          : product.price;

      itemsBySeller[sellerId].push({
        productId: product._id,
        title: product.title,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : item.image,
        quantity: item.quantity,
        price: discountedPrice
      });
    }

    const ordersToCreate = [];

    // Reserved for future seller shipping fee logic.
    // Do not include in finalTotal calculation.
    const sellerShippingFee = 15;

    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      const subtotal = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      const FREE_SHIPPING_THRESHOLD = 5000;
      const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const finalTotal = subtotal + shippingFee;
      ordersToCreate.push({
        buyerId,
        sellerId,
        items: sellerItems,
        shippingAddress,
        paymentMethod,
        totals: {
          subtotal,
          shippingFee,
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

    // === Inventory Synchronization Start ===
    try {
      for (const order of createdOrders) {
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            // 1. Deduct Stock Quantity
            product.countInStock = Math.max(0, product.countInStock - Number(item.quantity));

            // 2. Handle Out of Stock Status
            if (product.countInStock < 1) {
              // The frontend derives "Out of Stock" from countInStock <= 0
              // Notify seller about the out of stock event
              try {
                const notificationService = getNotificationService();
                if (notificationService) {
                  const sellerProfile = await Seller.findById(product.sellerId);
                  const sellerUserId = sellerProfile && sellerProfile.userId ? sellerProfile.userId : product.sellerId;
                  
                  await notificationService.createNotification({
                    recipient: sellerUserId,
                    sender: buyerId,
                    type: 'system',
                    title: 'Product Out of Stock',
                    message: `Your product "${product.title}" is out of stock.`,
                    data: { productId: product._id },
                    priority: 'routine',
                    channels: { email: true, inApp: true, push: false }
                  });
                }
              } catch (notifyErr) {
                console.error('Failed to notify seller about out of stock:', notifyErr);
              }
            }

            // 3. Database Save
            await product.save();
          }
        }
      }
    } catch (inventoryError) {
      console.error('Inventory synchronization failed:', inventoryError);
    }
    // === Inventory Synchronization End ===

    // Empty the user's cart
    await Cart.findOneAndUpdate(
      { userId: buyerId },
      { $set: { items: [] } }
    );

    // Send order confirmation email (HTML styled, matching Hope for Paws branding)
    // Respects the buyer's notificationPreferences.email setting — a buyer who
    // has disabled email must not receive this regardless of any other logic.
    try {
      const buyer = await User.findById(buyerId).select('email username notificationPreferences');
      const buyerEmailPref = buyer?.notificationPreferences?.email || 'instant';
      if (buyer?.email && buyerEmailPref !== 'disabled') {
        const orderItemsHtml = createdOrders.map(o => `
      <div style="text-align: center; border: 2px dashed #6b493d; border-radius: 8px; padding: 15px 20px; margin-bottom: 14px; background-color: #fff;">
        <p style="margin: 0 0 6px 0; color: #6b493d; font-weight: bold; font-size: 15px;">Order ID: ${o.orderId}</p>
        <p style="margin: 0 0 4px 0; color: #333;">Total: Rs. ${o.totals.finalTotal}</p>
        <p style="margin: 0; color: #333;">Status: ${o.status}</p>
      </div>
    `).join('');

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d8cc;">
        <div style="background-color: #6b493d; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 22px;">Hope for Paws</h1>
        </div>
        <div style="padding: 30px 25px; background-color: #f5f0e8; text-align: center;">
          <h2 style="color: #6b493d; margin: 0 0 10px 0;">Order Confirmation</h2>
          <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${buyer.username || 'there'}, thank you for your order! Here are your order details.
          </p>

          ${orderItemsHtml}

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            We'll notify you when your order status updates.
          </p>
        </div>
        <div style="background-color: #f5f3ed; padding: 15px; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;">© 2024 Hope for Paws. All rights reserved.</p>
        </div>
      </div>
    `;

        await sendEmail(
          buyer.email,
          'Order Confirmation - Hope For Paws',
          `Hi ${buyer.username || 'there'}, thank you for your order! We'll notify you when your order status updates.`,
          html
        );
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    // Notify each seller about their respective new order(s)
    try {
      const notificationService = getNotificationService();
      const ordersBySeller = createdOrders.reduce((acc, o) => {
        const sid = o.sellerId.toString();
        acc[sid] = acc[sid] || [];
        acc[sid].push(o);
        return acc;
      }, {});

      for (const [sellerId, orders] of Object.entries(ordersBySeller)) {
        try {
          const seller = await Seller.findById(sellerId).populate('userId', 'email username storeName notificationPreferences');
          const sellerUser = seller && seller.userId ? seller.userId : null;
          if (!sellerUser || !sellerUser.email) continue;

          const orderHtmlBlocks = orders.map(o => `
        <div style="text-align: center; border: 2px dashed #6b493d; border-radius: 8px; padding: 12px; margin-bottom: 12px; background-color: #fff;">
          <p style="margin:0 0 6px 0; color:#6b493d; font-weight:700;">Order ID: ${o.orderId}</p>
          <p style="margin:0; color:#333;">Items: ${o.items.length} — Total: Rs. ${o.totals.finalTotal}</p>
        </div>
      `).join('');

          const sellerHtml = `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #e0d8cc;">
          <div style="background-color:#6b493d; padding:16px; text-align:center;"><h2 style="margin:0;color:#fff">New Order Received</h2></div>
          <div style="padding:20px; background:#f5f0e8; text-align:left;">
            <p style="margin:0 0 12px 0;">Hi ${sellerUser.username || seller.storeName || 'Seller'},</p>
            <p style="margin:0 0 12px 0;">You have received ${orders.length} new order(s). Details below:</p>
            ${orderHtmlBlocks}
            <p style="color:#666; font-size:13px;">Buyer: ${createdOrders[0].shippingAddress?.fullName || 'Guest'}</p>
          </div>
          <div style="background:#f5f3ed; padding:10px; text-align:center; color:#888; font-size:12px;">© 2024 Hope for Paws</div>
        </div>
      `;

          if (notificationService) {
            await notificationService.createNotification({
              recipient: sellerUser._id,
              sender: buyerId,
              type: 'new_order',
              title: 'New Order Received',
              message: `You have ${orders.length} new order(s).`,
              data: {
                orderIds: orders.map(o => o._id),
                orderCount: orders.length,
                buyerName: createdOrders[0].shippingAddress?.fullName || 'Guest'
              },
              priority: 'high',
              channels: { email: true, inApp: true, push: false }
            });
          } else if (sellerUser.notificationPreferences?.email !== 'disabled') {
            // Last-resort fallback if the notification service genuinely isn't
            // available. Still respects the seller's email preference.
            await sendEmail(
              sellerUser.email,
              'New Order Received - Hope For Paws',
              `You have ${orders.length} new order(s) on Hope for Paws.`,
              sellerHtml
            );
          }
        } catch (sErr) {
          console.error('Failed to send new order email to seller:', sErr);
        }
      }
    } catch (notifyErr) {
      console.error('Error while notifying sellers about new orders:', notifyErr);
    }

    // Notify buyer in-app that their order was placed
    // NOTE: notificationPreferences on this schema only exposes an `email`
    // setting (instant/disabled) — there's no separate inApp toggle to check,
    // so this always fires when the notification service is available,
    // mirroring how seller in-app notifications already work above.
    try {
      const notificationService = getNotificationService();
      if (notificationService) {
        await notificationService.createNotification({
          recipient: buyerId,
          sender: buyerId,
          type: 'order_placed',
          title: 'Order Placed',
          message: `Your order${createdOrders.length > 1 ? 's have' : ' has'} been placed successfully.`,
          data: {
            orderIds: createdOrders.map(o => o._id),
            orderCount: createdOrders.length
          },
          priority: 'routine',
          channels: { email: false, inApp: true, push: false }
        });
      }
    } catch (buyerNotifyErr) {
      console.error('Failed to send in-app notification to buyer:', buyerNotifyErr);
    }

    res.status(201).json({ success: true, orders: createdOrders, message: 'Orders placed successfully' });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user?.id || req.user?.userId;
    const orders = await Order.find({ buyerId })
      .populate('sellerId', 'userId storeName')
      .sort({ createdAt: -1 });
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

    // Send order cancellation email (HTML styled)
    // Respects the buyer's notificationPreferences.email setting.
    try {
      const buyer = await User.findById(buyerId).select('email username notificationPreferences');
      const buyerEmailPref = buyer?.notificationPreferences?.email || 'instant';
      if (buyer?.email && buyerEmailPref !== 'disabled') {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d8cc;">
        <div style="background-color: #6b493d; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 22px;">Hope for Paws</h1>
        </div>
        <div style="padding: 30px 25px; background-color: #f5f0e8; text-align: center;">
          <h2 style="color: #6b493d; margin: 0 0 10px 0;">Order Cancelled</h2>
          <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${buyer.username || 'there'}, your order has been cancelled successfully.
          </p>

          <div style="text-align: center; border: 2px dashed #6b493d; border-radius: 8px; padding: 15px 20px; margin-bottom: 14px; background-color: #fff;">
            <p style="margin: 0 0 6px 0; color: #6b493d; font-weight: bold; font-size: 15px;">Order ID: ${order.orderId}</p>
            <p style="margin: 0; color: #333;">Total: Rs. ${order.totals.finalTotal}</p>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            If you didn't request this cancellation, please contact support.
          </p>
        </div>
        <div style="background-color: #f5f3ed; padding: 15px; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;">© 2024 Hope for Paws. All rights reserved.</p>
        </div>
      </div>
    `;

        await sendEmail(
          buyer.email,
          'Order Cancelled - Hope For Paws',
          `Hi ${buyer.username || 'there'}, your order (${order.orderId}) has been cancelled successfully.`,
          html
        );
      }
    } catch (emailError) {
      console.error('Failed to send order cancellation email:', emailError);
    }

    // Notify seller about cancellation
    try {
      const notificationService = getNotificationService();
      const sellerProfile = await Seller.findById(order.sellerId).populate('userId', 'email username storeName notificationPreferences');
      const sellerUser = sellerProfile && sellerProfile.userId ? sellerProfile.userId : null;
      if (sellerUser) {
        if (notificationService) {
          await notificationService.createNotification({
            recipient: sellerUser._id,
            sender: buyerId,
            type: 'order_status_update',
            title: 'Order Cancelled',
            message: `Order ${order.orderId} has been cancelled by the buyer.`,
            data: {
              orderId: order._id,
              orderStatus: 'Cancelled'
            },
            priority: 'routine',
            channels: { email: true, inApp: true, push: false }
          });
        } else if (sellerUser.email && sellerUser.notificationPreferences?.email !== 'disabled') {
          const sellerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d8cc;">
          <div style="background-color: #6b493d; padding: 16px; text-align: center; color: #fff;"><h2 style="margin:0">Order Cancelled</h2></div>
          <div style="padding:20px; background:#f5f0e8;">
            <p>Hi ${sellerUser.username || sellerProfile.storeName || 'Seller'},</p>
            <p>The order <strong>${order.orderId}</strong> has been cancelled by the buyer.</p>
            <p>Total: Rs. ${order.totals.finalTotal}</p>
          </div>
        </div>
      `;

          await sendEmail(
            sellerUser.email,
            'Order Cancelled - Hope For Paws',
            `Order ${order.orderId} has been cancelled by the buyer.`,
            sellerHtml
          );
        }
      }
    } catch (sellerEmailErr) {
      console.error('Failed to send cancellation email to seller:', sellerEmailErr);
    }

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
    // Build seller match: prefer Seller._id, but keep backward-compatibility with older orders that used userId
    const sellerObjectId = seller ? seller._id : null;
    const sellerMatch = sellerObjectId
      ? { $or: [{ sellerId: sellerObjectId }, { sellerId: userId }] }
      : { sellerId: userId };

    // Support optional status filter via query param. If status is 'All' or omitted, return all statuses.
    const requestedStatus = (req.query.status || '').trim();

    const findFilter = { ...sellerMatch };
    if (requestedStatus && requestedStatus.toLowerCase() !== 'all') {
      // Validate against allowed statuses to avoid injection
      const allowed = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      const normalized = requestedStatus.charAt(0).toUpperCase() + requestedStatus.slice(1).toLowerCase();
      if (allowed.includes(normalized)) {
        findFilter.status = normalized;
      } else {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
    }

    const orders = await Order.find(findFilter).sort({ createdAt: -1 }).lean();

    // Return empty array if none
    if (!orders || orders.length === 0) {
      // Still return counts (all zero) to help the UI show badges
      const zeroCounts = {
        All: 0,
        Pending: 0,
        Confirmed: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0
      };
      return res.status(200).json({ orders: [], counts: zeroCounts });
    }

    // Compute counts per status for the dashboard/tabs
    const aggMatch = sellerObjectId
      ? { $or: [{ sellerId: sellerObjectId }, { sellerId: userId }] }
      : { sellerId: userId };

    const countsAgg = await Order.aggregate([
      { $match: aggMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = countsAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const responseCounts = {
      All: orders.length,
      Pending: counts['Pending'] || 0,
      Confirmed: counts['Confirmed'] || 0,
      Processing: counts['Processing'] || 0,
      Shipped: counts['Shipped'] || 0,
      Delivered: counts['Delivered'] || 0,
      Cancelled: counts['Cancelled'] || 0
    };

    res.status(200).json({ orders, counts: responseCounts });
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

    // Send status update email to buyer
    // Respects the buyer's notificationPreferences.email setting.
    try {
      const buyer = await User.findById(order.buyerId).select('email username notificationPreferences');
      const buyerEmailPref = buyer?.notificationPreferences?.email || 'instant';
      if (buyer?.email && buyerEmailPref !== 'disabled') {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d8cc;">
            <div style="background-color: #6b493d; padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 22px;">Hope for Paws</h1>
            </div>
            <div style="padding: 30px 25px; background-color: #f5f0e8; text-align: center;">
              <h2 style="color: #6b493d; margin: 0 0 10px 0;">Order Status Updated</h2>
              <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${buyer.username || 'there'}, your order status has been updated.
              </p>
              <div style="text-align: center; border: 2px dashed #6b493d; border-radius: 8px; padding: 15px 20px; margin-bottom: 14px; background-color: #fff;">
                <p style="margin: 0 0 6px 0; color: #6b493d; font-weight: bold; font-size: 15px;">Order ID: ${order.orderId}</p>
                <p style="margin: 0 0 4px 0; color: #333;">Total: Rs. ${order.totals.finalTotal}</p>
                <p style="margin: 0; color: #6b493d; font-weight: bold;">Status: ${newStatus}</p>
              </div>
            </div>
            <div style="background-color: #f5f3ed; padding: 15px; text-align: center; color: #888; font-size: 12px;">
              <p style="margin: 0;">&copy; 2024 Hope for Paws. All rights reserved.</p>
            </div>
          </div>
        `;

        await sendEmail(
          buyer.email,
          `Order ${newStatus} - Hope For Paws`,
          `Hi ${buyer.username || 'there'}, your order (${order.orderId}) status has been updated to ${newStatus}.`,
          html
        );
      }
    } catch (emailError) {
      console.error('Failed to send order status update email:', emailError);
    }

    // Notify buyer in-app about the status change
    // Same note as in createOrder: no separate inApp preference field exists
    // on this schema, so this fires independently of the email preference.
    try {
      const notificationService = getNotificationService();
      if (notificationService) {
        await notificationService.createNotification({
          recipient: order.buyerId,
          sender: userId,
          type: 'order_status_update',
          title: `Order ${newStatus}`,
          message: `Your order ${order.orderId} status has been updated to ${newStatus}.`,
          data: {
            orderId: order._id,
            orderStatus: newStatus
          },
          priority: 'routine',
          channels: { email: false, inApp: true, push: false }
        });
      }
    } catch (buyerNotifyErr) {
      console.error('Failed to send in-app notification to buyer:', buyerNotifyErr);
    }

    // Also notify seller for status changes
    try {
      const notificationService = getNotificationService();
      const sellerProfile = await Seller.findById(order.sellerId).populate('userId', 'email username storeName notificationPreferences');
      const sellerUser = sellerProfile && sellerProfile.userId ? sellerProfile.userId : null;
      if (sellerUser) {
        if (notificationService) {
          await notificationService.createNotification({
            recipient: sellerUser._id,
            sender: userId,
            type: 'order_status_update',
            title: `Order ${newStatus}`,
            message: `Order ${order.orderId} status updated to ${newStatus}.`,
            data: {
              orderId: order._id,
              orderStatus: newStatus
            },
            priority: ['Confirmed', 'Delivered', 'Cancelled'].includes(newStatus) ? 'routine' : 'routine',
            channels: { email: true, inApp: true, push: false }
          });
        } else if (sellerUser.email && sellerUser.notificationPreferences?.email !== 'disabled') {
          const sellerHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d8cc;">
              <div style="background-color: #6b493d; padding: 16px; text-align: center; color: #fff;"><h2 style="margin:0">Order ${newStatus}</h2></div>
              <div style="padding:20px; background:#f5f0e8;">
                <p>Hi ${sellerUser.username || sellerProfile.storeName || 'Seller'},</p>
                <p>The order <strong>${order.orderId}</strong> status has been updated to <strong>${newStatus}</strong>.</p>
                <p>Total: Rs. ${order.totals.finalTotal}</p>
              </div>
            </div>
          `;

          await sendEmail(
            sellerUser.email,
            `Order ${newStatus} - Hope For Paws`,
            `Order ${order.orderId} status updated to ${newStatus}.`,
            sellerHtml
          );
        }
      }
    } catch (sellerStatusErr) {
      console.error('Failed to send order status notification to seller:', sellerStatusErr);
    }

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