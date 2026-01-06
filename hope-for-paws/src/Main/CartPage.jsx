import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartItemCount } = useCart();
  const navigate = useNavigate();
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  const handleQuantityChange = (productId, change) => {
    const item = cartItems.find((item) => item.productId === productId || item._id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F4ED] to-[#e2d6cb]/30 pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E] text-white py-12 mb-8 shadow-md">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-4 text-center">Your Shopping Cart</h1>
              <p className="text-lg text-center text-[#e2d6cb]">Items you've added to your cart</p>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaShoppingCart className="text-8xl text-[#a07855] mx-auto mb-6 opacity-50" />
            <h2 className="text-3xl font-bold text-[#4E3B31] mb-4">Your cart is empty</h2>
            <p className="text-lg text-[#6b493d] mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-[#8B5A2B] text-white font-semibold rounded-lg hover:bg-[#6F4C3E] transition-colors duration-300 shadow-md"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F4ED] to-[#e2d6cb]/30 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E] text-white py-12 mb-8 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4">Your Shopping Cart</h1>
                <p className="text-lg text-[#e2d6cb]">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#e2d6cb]">
                  <h2 className="text-2xl font-bold text-[#4E3B31]">Product List</h2>
                </div>
                <div className="divide-y divide-[#e2d6cb]">
                  {cartItems.map((item) => {
                    const itemTotal = (parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2);
                    return (
                      <div key={item.productId || item._id} className="p-6 hover:bg-[#F8F4ED]/50 transition-colors">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full md:w-32 h-32 bg-[#e2d6cb] rounded-lg overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name || item.title || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#a07855]">
                                <FaShoppingCart className="text-4xl opacity-30" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-[#4E3B31] mb-2">
                                  {item.name || item.title || 'Product'}
                                </h3>
                                {item.description && (
                                  <p className="text-sm text-[#6b493d] mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                {/* Seller Name */}
                                {item.sellerName && (
                                  <p className="text-sm text-[#a07855] font-medium mb-3">
                                    Sold by: <span className="font-semibold">{item.sellerName}</span>
                                  </p>
                                )}
                                <p className="text-lg font-bold text-[#8B5A2B]">
                                  ${parseFloat(item.price || 0).toFixed(2)}
                                </p>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleQuantityChange(item.productId || item._id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-[#e2d6cb] hover:bg-[#c9a280] text-[#4E3B31] rounded-lg transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <FaMinus className="text-xs" />
                                  </button>
                                  <span className="w-12 text-center font-semibold text-[#4E3B31]">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(item.productId || item._id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-[#e2d6cb] hover:bg-[#c9a280] text-[#4E3B31] rounded-lg transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <FaPlus className="text-xs" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-[#6b493d]">Item Total:</p>
                                  <p className="text-lg font-bold text-[#8B5A2B]">${itemTotal}</p>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.productId || item._id)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  aria-label="Remove item"
                                >
                                  <FaTrash className="text-xs" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-[#4E3B31] mb-6">Price Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-[#6b493d]">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#6b493d]">
                    <span>Shipping</span>
                    <span className="font-semibold">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-[#e2d6cb] pt-4">
                    <div className="flex justify-between text-xl font-bold text-[#4E3B31]">
                      <span>Total</span>
                      <span className="text-[#8B5A2B]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-[#8B5A2B] text-white font-semibold rounded-lg hover:bg-[#6F4C3E] transition-colors duration-300 shadow-md mb-4"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-[#e2d6cb] text-[#4E3B31] font-semibold rounded-lg hover:bg-[#c9a280] transition-colors duration-300"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
