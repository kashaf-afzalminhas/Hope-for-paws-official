import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const total = getCartTotal();

  const [formData, setFormData] = useState({
    customerName: user?.username || user?.name || '',
    customerContact: user?.phone || user?.contact || '',
    deliveryAddress: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.customerContact.trim()) {
      newErrors.customerContact = 'Contact number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.customerContact)) {
      newErrors.customerContact = 'Please enter a valid contact number';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    } else if (formData.deliveryAddress.trim().length < 10) {
      newErrors.deliveryAddress = 'Please provide a complete address (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        customerName: formData.customerName,
        customerContact: formData.customerContact,
        deliveryAddress: formData.deliveryAddress,
        items: cartItems.map((item) => ({
          productId: item.productId || item._id,
          name: item.name || item.title,
          price: item.price,
          quantity: item.quantity,
          sellerName: item.sellerName,
          imageUrl: item.imageUrl,
        })),
        total: total,
        orderDate: new Date().toISOString(),
        userId: user?._id || user?.id,
      };

      // TODO: Replace with your actual API endpoint
      // Example: await fetch(`${API_BASE_URL}/orders`, { method: 'POST', ... })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Order placed:', orderData);

      // Clear cart after successful order
      clearCart();

      // Show success message and redirect
      alert('Order placed successfully! Thank you for your purchase.');
      navigate('/');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F4ED] to-[#e2d6cb]/30 pb-12">
        <div className="bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E] text-white py-12 mb-8 shadow-md">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Checkout</h1>
          </div>
        </div>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaShoppingCart className="text-8xl text-[#a07855] mx-auto mb-6 opacity-50" />
            <h2 className="text-3xl font-bold text-[#4E3B31] mb-4">Your cart is empty</h2>
            <p className="text-lg text-[#6b493d] mb-8">Please add items to your cart before checkout.</p>
            <button
              onClick={() => navigate('/cart')}
              className="px-8 py-3 bg-[#8B5A2B] text-white font-semibold rounded-lg hover:bg-[#6F4C3E] transition-colors duration-300 shadow-md"
            >
              View Cart
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
                <h1 className="text-4xl font-bold mb-4">Checkout</h1>
                <p className="text-lg text-[#e2d6cb]">Complete your order</p>
              </div>
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>Back to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#e2d6cb] bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E]">
                  <h2 className="text-2xl font-bold text-white">Customer Information</h2>
                </div>
                <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
                  {/* Customer Name */}
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-semibold text-[#4E3B31] mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.customerName
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-[#e2d6cb] focus:ring-[#8B5A2B]'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                    )}
                  </div>

                  {/* Customer Contact */}
                  <div>
                    <label htmlFor="customerContact" className="block text-sm font-semibold text-[#4E3B31] mb-2">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="customerContact"
                      name="customerContact"
                      value={formData.customerContact}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.customerContact
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-[#e2d6cb] focus:ring-[#8B5A2B]'
                      }`}
                      placeholder="e.g., +1234567890"
                    />
                    {errors.customerContact && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerContact}</p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-[#4E3B31] mb-2">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                        errors.deliveryAddress
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-[#e2d6cb] focus:ring-[#8B5A2B]'
                      }`}
                      placeholder="Enter complete delivery address including street, city, state, and zip code"
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>
                    )}
                  </div>

                  {/* Security Note */}
                  <div className="bg-[#F8F4ED] border border-[#e2d6cb] rounded-lg p-4 flex items-start gap-3">
                    <FaLock className="text-[#8B5A2B] mt-1 flex-shrink-0" />
                    <p className="text-sm text-[#6b493d]">
                      Your information is secure and will only be used for order processing and delivery purposes.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-[#4E3B31] mb-6">Order Summary</h2>

                {/* Items List */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cartItems.map((item) => {
                    const itemTotal = (parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2);
                    return (
                      <div key={item.productId || item._id} className="flex gap-3 pb-4 border-b border-[#e2d6cb] last:border-0">
                        <div className="w-16 h-16 bg-[#e2d6cb] rounded-lg overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name || item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#a07855]">
                              <FaShoppingCart className="text-xl opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#4E3B31] truncate text-sm">
                            {item.name || item.title}
                          </h4>
                          {item.sellerName && (
                            <p className="text-xs text-[#a07855] mt-1">by {item.sellerName}</p>
                          )}
                          <p className="text-sm text-[#6b493d] mt-1">
                            Qty: {item.quantity} × ${parseFloat(item.price || 0).toFixed(2)}
                          </p>
                          <p className="text-sm font-bold text-[#8B5A2B] mt-1">${itemTotal}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Summary */}
                <div className="space-y-3 mb-6 pt-4 border-t-2 border-[#e2d6cb]">
                  <div className="flex justify-between text-[#6b493d]">
                    <span>Subtotal</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#6b493d]">
                    <span>Shipping</span>
                    <span className="font-semibold">TBD</span>
                  </div>
                  <div className="pt-3 border-t border-[#e2d6cb]">
                    <div className="flex justify-between text-xl font-bold text-[#4E3B31]">
                      <span>Total</span>
                      <span className="text-[#8B5A2B]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={`w-full py-3 bg-[#8B5A2B] text-white font-semibold rounded-lg transition-colors duration-300 shadow-md flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#6F4C3E]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <FaLock />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
