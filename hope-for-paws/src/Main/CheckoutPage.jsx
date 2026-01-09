
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: '',
    contact: '',
    address: ''
  });

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 8;
  const taxes = 22;
  const discount = 12;
  const total = subtotal + shipping + taxes - discount;

  const handleChange = e => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const placeOrder = () => {
    if (!customer.name || !customer.contact || !customer.address) {
      alert("Please fill all customer details");
      return;
    }

    clearCart();
    alert("Order placed successfully!");
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-10">

     {/*LEFT: Customer Details */}
      <div className="lg:col-span-2 space-y-8">

        <h1 className="text-3xl font-semibold text-[#6b493d]">Checkout</h1>

        <div className="space-y-4">
          <h2 className="font-semibold">Customer Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full Name" value={customer.name} onChange={handleChange} className="input" />
            <input name="contact" placeholder="Contact Number" value={customer.contact} onChange={handleChange} className="input" />
          </div>

          <textarea name="address" placeholder="Delivery Address" value={customer.address} onChange={handleChange} rows="3" className="input" />
        </div>

      </div>

       {/* RIGHT: Order Summary */}
      <div className="border p-6 rounded-lg space-y-4">

        <h2 className="text-xl font-semibold text-[#6b493d]">Order Summary</h2>

        {cartItems.map(item => (
          <div key={item.id} className="flex justify-between items-center gap-4 border-b pb-3">

            <div className="flex items-center gap-3">
              <img src={item.image} className="w-16 h-16 object-cover rounded" />
              <div>
                <p className="font-medium">{item.name}</p>
                <p>${item.price}</p>

                <div className="flex gap-2 mt-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-2 border rounded">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 border rounded">+</button>
                </div>
              </div>
            </div>

            <button onClick={() => removeItem(item.id)} className="text-red-500">×</button>
          </div>
        ))}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>${shipping}</span></div>
          <div className="flex justify-between"><span>Taxes</span><span>${taxes}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-${discount}</span></div>
        </div>

        <hr />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          onClick={placeOrder}
          className="w-full py-3 mt-4 rounded bg-[#6b493d] text-white hover:bg-[#a07855]"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
