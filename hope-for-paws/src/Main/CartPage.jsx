 import React from 'react';
import { useCart } from '../context/CartContext';
import { NavLink } from 'react-router-dom';

const CartPage = () => {
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0;
  const taxes = 0;
  const discount = 100;
  const total = Math.max(subtotal + shipping + taxes - discount, 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center mb-10 text-[#6b493d]">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT: Cart Items  */} 
        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-4 font-semibold text-[#6b493d] border-b pb-3">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
          </div>

          {cartItems.map(item => (
            <div key={item.id} className="grid grid-cols-4 items-center gap-4 py-4 border-b">

              <div className="flex items-center gap-4">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xl text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
                <img src={item.image} className="w-20 h-20 object-cover rounded" />
                <div>
                  <h2 className="font-semibold text-[#6b493d]">{item.name}</h2>
                  <p className="text-sm text-gray-500">Seller: {item.seller}</p>
                </div>
              </div>

              <p>${item.price}</p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="px-3 py-1 border rounded"
                >−</button>

                <span>{item.quantity}</span>

                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1 border rounded"
                >+</button>
              </div>

              <p>${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}

          <div className="flex justify-between items-center pt-6">
            <div className="flex gap-3">
              <input
                placeholder="Coupon Code"
                className="border px-4 py-2 rounded w-48"
              />
              <button className="bg-[#a07855] text-white px-6 py-2 rounded hover:bg-[#6b493d]">
                Apply Coupon
              </button>
            </div>

            <button
              onClick={clearCart}
              className="text-[#6b493d] underline"
            >
              Clear Shopping Cart
            </button>
          </div>

        </div>

        {/* RIGHT: Order Summary*/} 
        <div className="border p-6 rounded-lg space-y-4 h-fit">

          <h2 className="text-xl font-semibold text-[#6b493d]">
            Order Summary
          </h2>

          <div className="flex justify-between">
            <span>Items</span>
            <span>{cartItems.length}</span>
          </div>

          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$0.00</span>
          </div>

          <div className="flex justify-between">
            <span>Taxes</span>
            <span>$0.00</span>
          </div>

          <div className="flex justify-between">
            <span>Coupon Discount</span>
            <span>-$100.00</span>
          </div>

          <hr />

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <NavLink
            to="/checkout"
            className="block text-center bg-[#6b493d] text-white py-3 rounded mt-4 hover:bg-[#a07855]"
          >
            Proceed to Checkout
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default CartPage;