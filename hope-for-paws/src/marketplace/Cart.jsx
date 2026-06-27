import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, Plus, Minus, ArrowRight, PawPrint,
  ShoppingBag, Truck, ShieldCheck, Tag, ChevronRight, Loader2
} from "lucide-react";
import { useCart } from "../context/CartContext";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// bg:      #fcfaf8   warm cream canvas
// surface: #ffffff   pure white cards
// brown-1: #3d2a24   darkest — headings, prices
// brown-2: #6b493d   primary — CTAs, accents, brand
// brown-3: #a07f77   muted text, labels
// brown-4: #d4c5c1   borders (default)
// brown-5: #ede6e1   borders (subtle), dividers
// brown-6: #f7f1ee   tinted backgrounds inside cards
// brown-7: #fdf9f7   hover tint on inputs

const fmt = (n) => `Rs ${n.toLocaleString("en-PK")}`;

// ─── QuantityControl ──────────────────────────────────────────────────────────
function QuantityControl({ qty, onInc, onDec }) {
  return (
    <div className="flex items-center rounded-xl border border-[#d4c5c1] bg-white overflow-hidden h-9">
      <button
        onClick={onDec}
        disabled={qty <= 1}
        aria-label="Decrease"
        className="w-9 h-9 flex items-center justify-center text-[#6b493d] hover:bg-[#f7f1ee] active:bg-[#ede6e1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>
      <span className="w-8 text-center text-[13px] font-bold text-[#3d2a24] tabular-nums select-none">
        {qty}
      </span>
      <button
        onClick={onInc}
        aria-label="Increase"
        className="w-9 h-9 flex items-center justify-center text-[#6b493d] hover:bg-[#f7f1ee] active:bg-[#ede6e1] transition-colors"
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── CartItem ────────────────────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove, removing }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group bg-white rounded-2xl border border-[#ede6e1] overflow-hidden transition-all duration-300 hover:border-[#d4c5c1] hover:shadow-[0_4px_24px_rgba(107,73,61,0.08)]"
      style={{
        opacity: removing ? 0 : 1,
        transform: removing ? "scale(0.97) translateY(-4px)" : "scale(1) translateY(0)",
      }}
    >
      <div className="flex gap-0">
        {/* Image block */}
        <div
          className="relative flex-shrink-0 w-[120px] sm:w-[140px] flex items-center justify-center"
          style={{ background: "#f7f1ee" }}
        >
          {!imgError && item.image ? (
            <img
              src={item.image}
              alt={item.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              style={{ minHeight: "120px", maxHeight: "140px" }}
            />
          ) : (
            <span className="text-5xl py-8">🛒</span>
          )}
          {item.category && (
            <span className="absolute top-2.5 left-2.5 bg-[#6b493d] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              {item.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#a07f77] uppercase tracking-[0.12em] mb-1">
                {item.seller}
              </p>
              <h3 className="text-[#3d2a24] font-semibold text-[14px] sm:text-[15px] leading-snug">
                {item.title}
              </h3>
              <p className="text-[11px] text-[#a07f77] mt-0.5">
                {item.brand}{item.weight ? ` · ${item.weight}` : ""}
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={() => onRemove(item.productId)}
              aria-label={`Remove ${item.title}`}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#d4c5c1] hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 mt-0.5"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <QuantityControl
              qty={item.quantity}
              onInc={() => onQtyChange(item.productId, item.quantity + 1)}
              onDec={() => onQtyChange(item.productId, item.quantity - 1)}
            />

            <div className="text-right">
              <p className="text-[18px] sm:text-[20px] font-extrabold text-[#3d2a24] tracking-tight leading-none">
                {fmt(item.price * item.quantity)}
              </p>
              {item.quantity > 1 && (
                <p className="text-[10px] text-[#a07f77] mt-1">
                  {fmt(item.price)} each
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PromoCode ───────────────────────────────────────────────────────────────
function PromoCode() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  const apply = () => {
    if (code.trim()) setApplied(true);
  };

  return (
    <div className="border border-dashed border-[#d4c5c1] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#fdf9f7] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Tag size={14} className="text-[#6b493d]" />
          <span className="text-[13px] font-semibold text-[#6b493d]">
            {applied ? "Promo code applied ✓" : "Have a promo code?"}
          </span>
        </div>
        <ChevronRight
          size={14}
          className={`text-[#a07f77] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && !applied && (
        <div className="px-4 pb-4 pt-1 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 px-3 py-2 text-[13px] rounded-xl border border-[#d4c5c1] bg-white text-[#3d2a24] placeholder:text-[#d4c5c1] focus:outline-none focus:border-[#6b493d] transition-colors"
          />
          <button
            onClick={apply}
            className="px-4 py-2 rounded-xl bg-[#6b493d] text-white text-[12px] font-bold hover:bg-[#5a3c31] transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ─── OrderSummary ────────────────────────────────────────────────────────────
function OrderSummary({ subtotal, itemCount, onCheckout }) {
  const freeThreshold = 5000;
  const shipping = subtotal >= freeThreshold ? 0 : 350;
  const total = subtotal + shipping;
  const progress = Math.min((subtotal / freeThreshold) * 100, 100);

  return (
    <div className="bg-white rounded-2xl border border-[#ede6e1] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[#ede6e1]">
        <h2 className="text-[#3d2a24] font-bold text-[17px] tracking-tight">
          Order Summary
        </h2>
        <p className="text-[12px] text-[#a07f77] mt-0.5">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Free shipping progress */}
        {shipping > 0 && (
          <div className="bg-[#f7f1ee] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[#6b493d]">
                Add {fmt(freeThreshold - subtotal)} for free delivery
              </p>
              <Truck size={13} className="text-[#6b493d]" />
            </div>
            <div className="h-1.5 bg-[#d4c5c1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6b493d] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {shipping === 0 && (
          <div className="flex items-center gap-2.5 bg-[#f0faf6] border border-[#a7e8c8] rounded-xl px-3.5 py-2.5">
            <Truck size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-700">
              You qualify for free delivery!
            </p>
          </div>
        )}

        {/* Line items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#a07f77]">Subtotal</span>
            <span className="text-[13px] font-semibold text-[#3d2a24]">
              {fmt(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#a07f77]">Shipping</span>
            {shipping === 0 ? (
              <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wide">
                Free
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-[#3d2a24]">
                {fmt(shipping)}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#ede6e1]" />

        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-bold text-[#3d2a24]">Total</span>
          <span className="text-[26px] font-extrabold text-[#3d2a24] tracking-tight leading-none">
            {fmt(total)}
          </span>
        </div>

        {/* Promo */}
        <PromoCode />

        {/* CTA */}
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-center gap-2.5 bg-[#6b493d] hover:bg-[#5a3c31] active:scale-[0.98] text-white font-bold text-[14px] py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_16px_rgba(107,73,61,0.3)] hover:shadow-[0_6px_20px_rgba(107,73,61,0.4)] tracking-wide"
        >
          Proceed to Checkout
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>

        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { icon: Truck, text: "Free over Rs 5K" },
            { icon: ShieldCheck, text: "Secure pay" },
            { icon: Tag, text: "Best price" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl bg-[#fdf9f7]"
            >
              <Icon size={14} className="text-[#a07f77]" />
              <span className="text-[9px] font-medium text-[#a07f77] text-center leading-tight">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ onContinue }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-6 text-center">
      <div className="relative mb-8 select-none">
        <PawPrint size={120} className="text-[#ede6e1]" strokeWidth={0.8} />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag size={44} className="text-[#d4c5c1]" strokeWidth={1.2} />
        </div>
      </div>
      <h2 className="text-[#3d2a24] font-extrabold text-[26px] tracking-tight mb-2">
        Your cart is empty
      </h2>
      <p className="text-[#a07f77] text-[14px] max-w-[260px] leading-relaxed mb-8">
        Looks like you haven't added anything yet. Your furry friend is waiting.
      </p>
      <button
        onClick={onContinue}
        className="inline-flex items-center gap-2.5 bg-[#6b493d] hover:bg-[#5a3c31] text-white font-bold text-[14px] px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-[0_4px_16px_rgba(107,73,61,0.3)] hover:shadow-[0_6px_20px_rgba(107,73,61,0.4)] active:scale-[0.98] tracking-wide"
      >
        Continue Shopping
        <ArrowRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}



// ─── Loading State ────────────────────────────────────────────────────────────
function CartLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-6 text-center">
      <Loader2 size={40} className="text-[#6b493d] animate-spin mb-4" />
      <p className="text-[#a07f77] text-[14px] font-medium">Loading your cart…</p>
    </div>
  );
}

// ─── Main Cart Component ──────────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    cartTotal,
    cartQuantity,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [removingId, setRemovingId] = useState(null);

  const handleQtyChange = (productId, newQty) => {
    if (newQty < 1) return;
    updateQuantity(productId, newQty);
  };

  const handleRemove = (productId) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeFromCart(productId);
      setRemovingId(null);
    }, 300);
  };

  return (
    <div
      className="min-h-screen bg-[#fcfaf8]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {isLoading ? (
          <CartLoading />
        ) : items.length === 0 ? (
          <EmptyState onContinue={() => navigate("/marketplace")} />
        ) : (
          <>
            {/* Page heading */}
            <div className="mb-7">
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#3d2a24] tracking-tight leading-none">
                My Cart
              </h1>
              <p className="text-[#a07f77] text-[13px] mt-1.5">
                Review your items before checkout
              </p>
            </div>

            {/* Split layout */}
            <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">

              {/* ── Left: Items ── */}
              <div className="flex-1 min-w-0 space-y-3">
                {items.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onQtyChange={handleQtyChange}
                    onRemove={handleRemove}
                    removing={removingId === item.productId}
                  />
                ))}

                {/* Footer row */}
                <div className="flex items-center justify-between pt-6 mt-2 border-t border-[#ede6e1]">
                  <button
                    onClick={() => navigate("/marketplace")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#ede6e1] text-[13px] font-bold text-[#6b493d] hover:bg-[#f7f1ee] hover:border-[#d4c5c1] active:scale-[0.98] transition-all duration-200"
                  >
                    <ArrowRight size={14} strokeWidth={2.5} className="rotate-180" />
                    Continue Shopping
                  </button>
                  <button
                    onClick={clearCart}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#a07f77] hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                  >
                    <Trash2 size={14} />
                    Clear Cart
                  </button>
                </div>


              </div>

              {/* ── Right: Summary ── */}
              <div className="w-full lg:w-[340px] xl:w-[360px] flex-shrink-0 lg:sticky lg:top-[72px]">
                <OrderSummary
                  subtotal={cartTotal}
                  itemCount={cartQuantity}
                  onCheckout={() => navigate("/checkout")}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
