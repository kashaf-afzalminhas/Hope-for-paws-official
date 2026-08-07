import { SHIPPING_FEE } from '../utils/constants';
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Lock,
  ShieldCheck,
  PawPrint,
  ShoppingCart,
  XCircle,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';

function ToastStack({ toasts, dismissToast }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          backgroundColor: t.type === "success" ? "#6b493d" : "#dc2626",
          color: "#fff", borderRadius: 16, padding: "13px 18px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
          animation: "slideUp 0.38s cubic-bezier(0.22,1,0.36,1) both",
          pointerEvents: "auto", minWidth: 240, maxWidth: 360,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {t.type === "success" ? <ShoppingCart size={14} /> : <XCircle size={14} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{t.message}</p>
          </div>
          <button onClick={() => dismissToast(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [errors, setErrors] = useState({});

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);
  
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    province: '',
    postalCode: ''
  });

  const shippingFee = SHIPPING_FEE;
  const finalTotal = items.length > 0 ? cartTotal + shippingFee : 0;

  const handlePlaceOrder = async () => {
    setErrors({});
    const newErrors = {};

    if (items.length === 0) {
      addToast('error', 'Your cart is empty');
      return;
    }
    
    // Contact Validation
    if (!contact.email.trim()) {
      newErrors.email = 'Email address is required.';
    }

    const phoneRegex = /^(0[0-9]{10}|\+92[0-9]{10})$/;
    if (!contact.phone || !phoneRegex.test(contact.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (e.g., 03001234567 or +923001234567).';
    }

    // Shipping Validation
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = 'Street address is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const payload = {
        items: items.map(it => ({
          productId: it.productId,
          title: it.title || 'Unknown Product',
          image: it.image,
          quantity: it.quantity,
          price: it.price
        })),
        shippingAddress: { ...contact, ...shippingAddress },
        paymentMethod,
        totals: {
          subtotal: cartTotal,
          shippingFee,
          finalTotal
        }
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');

      await clearCart();
      addToast('success', 'Order placed successfully!');
      setTimeout(() => navigate('/my-orders'), 800);
      
    } catch (err) {
      console.error(err);
      addToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] font-sans text-[#3d2a24] pb-12">
      {/* Stepper */ }
      <div className="bg-white border-b border-[#ede6e1] py-4 px-6 shadow-[0_2px_10px_rgba(107,73,61,0.04)]">
      <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-4 text-[13px] font-bold">
        <div 
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-[#3d2a24] cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-full bg-[#3d2a24] text-white flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span>Cart</span>
        </div>
        <div className="w-8 sm:w-12 h-[2px] bg-[#ede6e1]"></div>
        <div className="flex items-center gap-2 text-[#6b493d]">
          <div className="w-6 h-6 rounded-full bg-[#6b493d] text-white flex items-center justify-center shadow-sm">
            2
          </div>
          <span>Checkout</span>
        </div>
        <div className="w-8 sm:w-12 h-[2px] bg-[#ede6e1]"></div>
        <div className="flex items-center gap-2 text-[#a07f77]">
          <div className="w-6 h-6 rounded-full bg-[#f7f1ee] text-[#a07f77] flex items-center justify-center">
            3
          </div>
          <span>Confirmation</span>
        </div>
      </div>
      </div >

    {/* Main Layout */ }
    < main className = "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 py-8 px-4 sm:px-6 lg:px-8" >

      {/* Left Column: Forms */ }
      < div className = "space-y-6" >

          {/* Contact Section */}
  <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(107,73,61,0.06)] border border-[#ede6e1]">
    <h2 className="text-xl font-extrabold mb-5 text-[#3d2a24] tracking-tight">Contact</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Email Address</label>
        <input 
          type="email" 
          value={contact.email}
          onChange={(e) => {
            setContact({...contact, email: e.target.value});
            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
          }}
          placeholder="you@example.com"
          className={`w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
            errors.email ? 'border-red-500 focus:border-red-600' : 'border-[#d4c5c1] focus:border-[#6b493d]'
          }`}
        />
        {errors.email && <p className="mt-1.5 text-[12px] font-semibold text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Phone Number</label>
        <input 
          type="tel" 
          value={contact.phone}
          maxLength={13}
          onChange={(e) => {
            setContact({ ...contact, phone: e.target.value });
            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
          }}
          placeholder="03001234567 or +923001234567"
          className={`w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
            errors.phone ? 'border-red-500 focus:border-red-600' : 'border-[#d4c5c1] focus:border-[#6b493d]'
          }`}
        />
        {errors.phone && <p className="mt-1.5 text-[12px] font-semibold text-red-600">{errors.phone}</p>}
      </div>
    </div>
  </section>

    {/* Delivery Address Section */ }
    < section className = "bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(107,73,61,0.06)] border border-[#ede6e1]" >
            <h2 className="text-xl font-extrabold mb-5 text-[#3d2a24] tracking-tight">Delivery Address</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  value={shippingAddress.fullName}
                  onChange={(e) => {
                    setShippingAddress({...shippingAddress, fullName: e.target.value});
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="John Doe"
                  className={`w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                    errors.fullName ? 'border-red-500 focus:border-red-600' : 'border-[#d4c5c1] focus:border-[#6b493d]'
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-[12px] font-semibold text-red-600">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Street Address</label>
                <input 
                  type="text" 
                  value={shippingAddress.street}
                  onChange={(e) => {
                    setShippingAddress({...shippingAddress, street: e.target.value});
                    if (errors.street) setErrors(prev => ({ ...prev, street: '' }));
                  }}
                  placeholder="123 Main St, Apt 4B"
                  className={`w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border rounded-xl px-4 py-3 focus:outline-none transition-colors ${
                    errors.street ? 'border-red-500 focus:border-red-600' : 'border-[#d4c5c1] focus:border-[#6b493d]'
                  }`}
                />
                {errors.street && <p className="mt-1.5 text-[12px] font-semibold text-red-600">{errors.street}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">City</label>
                  <input 
                    type="text" 
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    placeholder="New York"
                    className="w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border border-[#d4c5c1] rounded-xl px-4 py-3 focus:outline-none focus:border-[#6b493d] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Province/State</label>
                  <input 
                    type="text" 
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                    placeholder="NY"
                    className="w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border border-[#d4c5c1] rounded-xl px-4 py-3 focus:outline-none focus:border-[#6b493d] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#a07f77] mb-2 uppercase tracking-wide">Postal Code</label>
                  <input 
                    type="text" 
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                    placeholder="10001"
                    className="w-full bg-white text-[#3d2a24] placeholder-[#d4c5c1] border border-[#d4c5c1] rounded-xl px-4 py-3 focus:outline-none focus:border-[#6b493d] transition-colors"
                  />
                </div>
              </div>
            </div>
          </section >

    {/* Payment Section */ }
    < section className = "bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(107,73,61,0.06)] border border-[#ede6e1]" >
            <h2 className="text-xl font-extrabold mb-5 text-[#3d2a24] tracking-tight">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash on delivery */}
              <div 
                onClick={() => setPaymentMethod('cod')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod' 
                    ? 'border-[#6b493d] bg-[#f7f1ee]' 
                    : 'border-[#ede6e1] hover:border-[#d4c5c1] bg-white'
                }`}
              >
                {paymentMethod === 'cod' && (
                  <span className="absolute top-0 right-4 -translate-y-1/2 bg-[#6b493d] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    Default
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'cod' ? 'border-[#6b493d]' : 'border-[#d4c5c1]'
                  }`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-[#6b493d] rounded-full" />}
                  </div>
                  <span className="font-bold text-[#3d2a24]">Cash on delivery</span>
                </div>
              </div>

              {/* Card payment */}
              <div 
                onClick={() => setPaymentMethod('card')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-[#6b493d] bg-[#f7f1ee]' 
                    : 'border-[#ede6e1] hover:border-[#d4c5c1] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === 'card' ? 'border-[#6b493d]' : 'border-[#d4c5c1]'
                  }`}>
                    {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-[#6b493d] rounded-full" />}
                  </div>
                  <span className="font-bold text-[#3d2a24]">Card payment</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting || items.length === 0}
              className="w-full mt-8 bg-[#6b493d] hover:bg-[#5a3c31] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_16px_rgba(107,73,61,0.3)] hover:shadow-[0_6px_20px_rgba(107,73,61,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide text-[14px]"
            >
              <Lock size={15} />
              {isSubmitting ? 'Processing...' : 'Complete Order'}
            </button>
          </section >

        </div >

    {/* Right Column: Order Summary */ }
    < div className = "lg:sticky lg:top-8 h-fit space-y-4" >
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(107,73,61,0.06)] border border-[#ede6e1]">
        <h2 className="text-[13px] font-extrabold text-[#3d2a24] tracking-widest mb-6 uppercase">YOUR ORDER</h2>

        <div className="space-y-5 mb-6">
          {items.length === 0 ? (
            <p className="text-sm text-[#a07f77]">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4 items-center">
                <div className="relative w-16 h-16 rounded-xl border border-[#ede6e1] bg-[#f7f1ee] flex-shrink-0">
                  <img src={item.image} alt={item.title || 'Product'} className="w-full h-full object-cover rounded-xl" />
                  <span className="absolute -top-2 -right-2 bg-[#6b493d] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#3d2a24] truncate text-[14px] leading-tight">{item.title}</h3>
                  <p className="text-[12px] text-[#a07f77] truncate mt-1">
                    {item.brand || 'Premium'} Ã¢â‚¬Â¢ {item.weight || 'Standard'}
                  </p>
                </div>
                <div className="font-bold text-[#3d2a24] text-[14px]">
                  Rs {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#ede6e1] pt-5 space-y-3 mb-5">
          <div className="flex justify-between text-[14px] text-[#a07f77] font-medium">
            <span>Subtotal</span>
            <span className="text-[#3d2a24] font-bold">Rs {cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[14px] text-[#a07f77] font-medium">
            <span>Shipping</span>
            <span className="text-[#3d2a24] font-bold">Rs {items.length > 0 ? shippingFee : 0}</span>
          </div>
        </div>

        <div className="border-t border-[#ede6e1] pt-5 mb-6">
          <div className="flex justify-between items-baseline">
            <span className="font-extrabold text-[#3d2a24] text-[15px]">Total</span>
            <span className="font-extrabold text-[24px] text-[#3d2a24] tracking-tight">Rs {finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Promo Code */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Promo code"
            className="flex-1 bg-white text-[#3d2a24] placeholder-[#d4c5c1] border border-[#d4c5c1] rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-[#6b493d] transition-colors"
          />
          <button className="bg-[#6b493d] hover:bg-[#5a3c31] text-white font-bold px-5 py-3 rounded-xl text-[13px] transition-colors">
            Apply
          </button>
        </div>
      </div>

  {/* Trust Badges */ }
  <div className="grid grid-cols-2 gap-3">
    <div className="flex items-center justify-center gap-2 border border-[#ede6e1] rounded-xl py-3.5 px-2 bg-white shadow-sm">
      <Lock size={15} className="text-[#a07f77]" />
      <span className="text-[10px] font-bold text-[#a07f77] uppercase tracking-widest">SSL Secure</span>
    </div>
    <div className="flex items-center justify-center gap-2 border border-[#ede6e1] rounded-xl py-3.5 px-2 bg-white shadow-sm">
      <ShieldCheck size={15} className="text-[#a07f77]" />
      <span className="text-[10px] font-bold text-[#a07f77] uppercase tracking-widest">Verified Check</span>
    </div>
  </div>
        </div >

      </main >
      <ToastStack toasts={toasts} dismissToast={dismissToast} />
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div >
  );
}
