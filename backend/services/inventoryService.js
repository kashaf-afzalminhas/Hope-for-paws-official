const Product = require('../models/Product');
const EventEmitter = require('events');
const Notification = require('../models/Notification');
const Seller = require('../models/Seller');
const User = require('../models/User');
const { sendEmail } = require('../routes/mailer');
const emailTemplates = require('../utils/emailTemplates');

// Create a dedicated event emitter for inventory operations
class InventoryEventEmitter extends EventEmitter {}
const inventoryEvents = new InventoryEventEmitter();

function getNotificationService() {
  return global.notificationService;
}

/**
 * NON-BLOCKING EVENT LISTENER
 * Decoupled from the checkout thread to ensure instantaneous API responses.
 * Evaluates low stock thresholds and triggers system notifications/status updates.
 */
inventoryEvents.on('checkLowStock', async (productsToCheck) => {
  try {
    for (const item of productsToCheck) {
      const product = await Product.findById(item.productId).populate('sellerId');
      if (!product) continue;

      const threshold = product.lowStockThreshold ?? 5;

      // 1. Trigger Notification if stock dropped below the product's custom threshold
      if (item.newStock > 0 && item.newStock <= threshold) {
        console.log(`[Inventory Alert] Product ${item.productId} is running low (Stock: ${item.newStock}, Threshold: ${threshold})`);
        try {
          if (product.sellerId) {
            const sellerProfile = product.sellerId;
            const sellerUser = sellerProfile.userId ? await User.findById(sellerProfile.userId).select('email username') : null;
            if (sellerUser && sellerUser.email) {
              const { subject, html } = emailTemplates.buildNotificationEmail({
                title: `Low Stock Alert: ${product.title}`,
                message: `Your product "${product.title}" is low on stock (remaining: ${item.newStock}). Please restock to avoid missed sales.`
              });
              await sendEmail(sellerUser.email, subject, `Low stock for ${product.title}`, html);
            }
          }
        } catch (emailErr) {
          console.error('[Inventory Alert] Failed to send low-stock email:', emailErr);
        }
      }

      // 2. Out of Stock Event
      if (item.newStock === 0) {
        console.log(`[Inventory Alert] Product ${item.productId} is OUT OF STOCK.`);
        try {
          // Deep-populate sellerId and the associated User
          const productWithSeller = await Product.findById(item.productId)
            .populate({
              path: 'sellerId',
              populate: { path: 'userId', select: '_id email username notificationPreferences' }
            });

          if (!productWithSeller || !productWithSeller.sellerId) {
            console.warn(`[Inventory Alert] Product ${item.productId} has no valid seller profile.`);
            continue;
          }

          // Resolve the User document
          let sellerUser = productWithSeller.sellerId.userId;

          // Fallback if nested population did not return the document
          if (!sellerUser || !sellerUser._id) {
            const rawUserId = productWithSeller.sellerId.userId || productWithSeller.sellerId;
            sellerUser = await User.findById(rawUserId).select('_id email username notificationPreferences');
          }

          if (!sellerUser) {
            console.warn(`[Inventory Alert] Could not resolve User for seller profile:`, productWithSeller.sellerId);
            continue;
          }

          console.log(`[Inventory Alert] Found seller user: ${sellerUser.email} (ID: ${sellerUser._id})`);

          const notificationService = getNotificationService();

          if (notificationService) {
            // Central service: saves DB doc, emits live Socket.io event, and dispatches email
            await notificationService.createNotification(
              {
                recipient: sellerUser._id,
                sender: sellerUser._id,
                type: 'out_of_stock',
                title: `Out of Stock: ${productWithSeller.title}`,
                message: `Your product "${productWithSeller.title}" has run out of stock. Restock soon to avoid lost sales.`,
                data: { productId: productWithSeller._id },
                priority: 'high',
                channels: { email: true, inApp: true, push: false }
              },
              { sendEmail: true }
            );
            console.log(`[Inventory Alert] Notification & email dispatched via NotificationService to seller ${sellerUser._id}`);
          } else {
            console.warn('[Inventory Alert] NotificationService not available on global, falling back to direct DB write & sendEmail');
            await Notification.create({
              recipient: sellerUser._id,
              sender: sellerUser._id,
              type: 'out_of_stock',
              title: `Out of Stock: ${productWithSeller.title}`,
              message: `Your product "${productWithSeller.title}" has run out of stock. Restock soon to avoid lost sales.`,
              data: { productId: productWithSeller._id },
              priority: 'high',
              channels: { email: true, inApp: true, push: false }
            });

            if (sellerUser.email && sellerUser.notificationPreferences?.email !== 'disabled') {
              const { subject, html } = emailTemplates.buildNotificationEmail({
                title: `Out of Stock Alert: ${productWithSeller.title}`,
                message: `Your product "${productWithSeller.title}" has reached 0 stock and is now marked as Out of Stock. Please restock to resume sales.`
              });
              await sendEmail(sellerUser.email, subject, `Out of stock: ${productWithSeller.title}`, html);
              console.log(`[Inventory Alert] Direct email dispatched to ${sellerUser.email}`);
            }
          }
        } catch (alertErr) {
          console.error('[Inventory Alert] Failed to send out-of-stock notification/email:', alertErr);
        }
      }
    }
  } catch (error) {
    console.error('[Inventory Event Error] Failed to process low stock notifications:', error);
  }
});

/**
 * ATOMIC INVENTORY DECREMENT
 * Use this service during order creation/checkout.
 * 
 * @param {Array} orderItems - Array of objects containing { productId, quantity }
 * @returns {Boolean} true if successful, throws Error if stock is insufficient
 */
exports.processCheckoutInventory = async (orderItems) => {
  if (!orderItems || orderItems.length === 0) return true;

  // Merge repeated products so one product is never decremented twice in separate operations
  const merged = new Map();
  for (const item of orderItems) {
    const key = item.productId.toString();
    merged.set(key, (merged.get(key) || 0) + Number(item.quantity));
  }

  // Decrement one product at a time; each update only succeeds if enough stock is left.
  // If any product is short, every decrement already made is put back, so a failed checkout never loses stock.
  const done = [];
  for (const [productId, quantity] of merged) {
    const result = await Product.updateOne(
      { _id: productId, countInStock: { $gte: quantity } },
      { $inc: { countInStock: -quantity } }
    );
    if (result.modifiedCount !== 1) {
      await exports.restoreInventory(done);
      throw new Error('Insufficient stock for one or more items in your cart. Checkout aborted.');
    }
    done.push({ productId, quantity });
  }

  const updatedProducts = await Product.find({ _id: { $in: [...merged.keys()] } })
    .select('_id countInStock')
    .lean();

  const stockCheckPayload = updatedProducts.map(p => ({
    productId: p._id,
    newStock: p.countInStock
  }));

  // Non-blocking low-stock alerts
  inventoryEvents.emit('checkLowStock', stockCheckPayload);

  return true;
};

/**
 * Puts stock back, e.g. when a checkout fails after reserving stock or an order is cancelled.
 * @param {Array} items - [{ productId, quantity }]
 */
exports.restoreInventory = async (items) => {
  if (!items || items.length === 0) return;
  const ops = items
    .filter(i => i && i.productId && Number(i.quantity) > 0)
    .map(i => ({
      updateOne: {
        filter: { _id: i.productId },
        update: { $inc: { countInStock: Number(i.quantity) } }
      }
    }));
  if (ops.length > 0) {
    await Product.bulkWrite(ops);
  }
};
