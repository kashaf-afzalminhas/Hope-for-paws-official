const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ─── Populate options for cart items ─────────────────────────────────────────
const POPULATE_OPTS = {
  path: 'items.productId',
  select: 'title price discountPrice images sellerId category brand weight countInStock',
  populate: {
    path: 'sellerId',
    select: 'name',
  },
};

// ─── GET /api/cart — Fetch the authenticated user's cart ─────────────────────
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId }).populate(POPULATE_OPTS);

    if (!cart) {
      // Return an empty cart structure if none exists yet
      return res.json({ items: [], totalPrice: 0, totalQuantity: 0 });
    }

    // Filter out items whose products have been deleted or hidden
    const validItems = cart.items.filter(
      (item) => item.productId && item.productId.isVisible !== false
    );

    // If any items were pruned, persist the cleanup
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
      // Re-populate after save
      cart = await Cart.findById(cart._id).populate(POPULATE_OPTS);
    }

    res.json(cart);
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
};

// ─── POST /api/cart/add — Add item (or increment qty if exists) ─────────────
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    // Verify the product exists and is purchasable
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.isVisible || product.status !== 'active') {
      return res.status(400).json({ message: 'Product is currently unavailable' });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    // Check if item is already in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingIndex > -1) {
      // Increment quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.countInStock) {
        return res.status(400).json({
          message: `Only ${product.countInStock} units available`,
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // Add new item
      if (quantity > product.countInStock) {
        return res.status(400).json({
          message: `Only ${product.countInStock} units available`,
        });
      }
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    // Return populated cart
    cart = await Cart.findById(cart._id).populate(POPULATE_OPTS);
    res.status(200).json(cart);
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
};

// ─── PUT /api/cart/update — Update quantity of a specific item ───────────────
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity == null) {
      return res.status(400).json({ message: 'productId and quantity are required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Verify stock availability
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (quantity > product.countInStock) {
      return res.status(400).json({
        message: `Only ${product.countInStock} units available`,
      });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.userId, 'items.productId': productId },
      { $set: { 'items.$.quantity': quantity } },
      { new: true } // Return updated document without populating
    );

    if (!cart) {
      return res.status(404).json({ message: 'Cart or Item not found' });
    }

    // Do NOT run .populate() here, frontend already has the data
    res.json({ success: true, message: 'Quantity updated', cart });
  } catch (error) {
    console.error('updateQuantity error:', error);
    res.status(500).json({ message: 'Failed to update quantity', error: error.message });
  }
};

// ─── DELETE /api/cart/remove/:productId — Remove a specific item ────────────
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();

    cart = await Cart.findById(cart._id).populate(POPULATE_OPTS);
    res.json(cart);
  } catch (error) {
    console.error('removeFromCart error:', error);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
};

// ─── DELETE /api/cart/clear — Clear entire cart ──────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.json({ items: [], totalPrice: 0, totalQuantity: 0 });
    }

    cart.items = [];
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('clearCart error:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
};
