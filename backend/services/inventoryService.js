const Product = require('../models/Product');
const EventEmitter = require('events');

// Create a dedicated event emitter for inventory operations
class InventoryEventEmitter extends EventEmitter {}
const inventoryEvents = new InventoryEventEmitter();

/**
 * NON-BLOCKING EVENT LISTENER
 * Decoupled from the checkout thread to ensure instantaneous API responses.
 * Evaluates low stock thresholds and triggers system notifications/status updates.
 */
inventoryEvents.on('checkLowStock', async (productsToCheck) => {
  try {
    for (const item of productsToCheck) {
      if (item.newStock <= 5) {
        
        // 1. Trigger Notification System (e.g., to Seller)
        console.log(`[Inventory Alert] Product ${item.productId} is running low (Stock: ${item.newStock})`);
        // e.g. global.notificationService.createSystemNotification(sellerId, 'Low Stock Alert');

        // 2. Check if completely Out of Stock
        if (item.newStock === 0) {
          console.log(`[Inventory Alert] Product ${item.productId} is OUT OF STOCK. Hiding product from storefront.`);
          
          // Use atomic findByIdAndUpdate to safely hide the product without triggering Mongoose pre-save hooks
          await Product.findByIdAndUpdate(item.productId, { 
            status: 'hidden', 
            isVisible: false 
          });
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

  // 1. Build the bulkWrite operations with strict race-condition guards
  const bulkOps = orderItems.map(item => ({
    updateOne: {
      filter: { 
        _id: item.productId, 
        // GUARANTEE: The current stock MUST be >= the requested quantity. 
        // This mathematically prevents stock from ever dropping below zero during concurrent checkouts.
        countInStock: { $gte: item.quantity } 
      },
      update: { 
        $inc: { countInStock: -item.quantity } 
      }
    }
  }));

  // 2. Execute atomic bulk write in a single DB trip
  const result = await Product.bulkWrite(bulkOps);

  // 3. Verify exactly all items were successfully updated.
  // If matchedCount/modifiedCount is less than orderItems.length, 
  // it means the query constraint ($gte) failed for at least one item due to insufficient stock.
  if (result.modifiedCount !== orderItems.length) {
    throw new Error('Insufficient stock for one or more items in your cart. Checkout aborted.');
  }

  // 4. Fetch the newly updated stock levels for evaluation
  const productIds = orderItems.map(item => item.productId);
  const updatedProducts = await Product.find({ _id: { $in: productIds } })
    .select('_id countInStock')
    .lean();

  const stockCheckPayload = updatedProducts.map(p => ({
    productId: p._id,
    newStock: p.countInStock
  }));

  // 5. Fire off the non-blocking event so the main checkout thread can respond instantly to the buyer
  inventoryEvents.emit('checkLowStock', stockCheckPayload);

  return true;
};
