import React, { useState, useCallback, useEffect, useRef, useMemo, Fragment } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Printer,
  Eye,
  Search,
  TrendingUp,
  ShoppingBag,
  Inbox,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  Hash,
  X,
  Check,
  Bell,
  RefreshCw,
} from "lucide-react";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DATA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Dummy data removed. Real data fetched via API.

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONSTANTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_CONFIG = {
  Pending: {
    label:     "Pending",
    accent:    "#f59e0b",
    badgeBg:   "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-amber-200",
    icon:      Clock,
    pulse:     true,
    optionBg:  "hover:bg-amber-50",
    optionText:"text-amber-700",
  },
  Confirmed: {
    label:     "Confirmed",
    accent:    "#8b5cf6",
    badgeBg:   "bg-violet-50",
    badgeText: "text-violet-700",
    badgeRing: "ring-violet-200",
    icon:      CheckCircle2,
    pulse:     false,
    optionBg:  "hover:bg-violet-50",
    optionText:"text-violet-700",
  },
  Processing: {
    label:     "Processing",
    accent:    "#0ea5e9",
    badgeBg:   "bg-sky-50",
    badgeText: "text-sky-700",
    badgeRing: "ring-sky-200",
    icon:      Package,
    pulse:     false,
    optionBg:  "hover:bg-sky-50",
    optionText:"text-sky-700",
  },
  Shipped: {
    label:     "Shipped",
    accent:    "#3b82f6",
    badgeBg:   "bg-blue-50",
    badgeText: "text-blue-700",
    badgeRing: "ring-blue-200",
    icon:      Truck,
    pulse:     false,
    optionBg:  "hover:bg-blue-50",
    optionText:"text-blue-700",
  },
  Delivered: {
    label:     "Delivered",
    accent:    "#10b981",
    badgeBg:   "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeRing: "ring-emerald-200",
    icon:      CheckCircle2,
    pulse:     false,
    optionBg:  "hover:bg-emerald-50",
    optionText:"text-emerald-700",
  },
  Cancelled: {
    label:     "Cancelled",
    accent:    "#ef4444",
    badgeBg:   "bg-red-50",
    badgeText: "text-red-600",
    badgeRing: "ring-red-200",
    icon:      XCircle,
    pulse:     false,
    optionBg:  "hover:bg-red-50",
    optionText:"text-red-600",
  },
};

const STATUS_ORDER = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
const FILTER_TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HOOKS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    timerRefs.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INJECT GLOBAL STYLES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("seller-dash-styles")) return;
    const el = document.createElement("style");
    el.id = "seller-dash-styles";
    el.textContent = `
      @keyframes sdSlideUp   { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
      @keyframes sdSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes sdPulseBar  { 0%,100% { opacity:1; } 50% { opacity:.45; } }
      .sd-slide-up   { animation: sdSlideUp   .2s ease-out both; }
      .sd-slide-down { animation: sdSlideDown .18s ease-out both; }
      .sd-pulse-bar  { animation: sdPulseBar  1.8s ease-in-out infinite; }
      .sd-row-expand { animation: sdSlideDown .2s ease-out both; }
    `;
    document.head.appendChild(el);
  }, []);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// STATUS BADGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status, size = "md" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  const sz = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-[11px] px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${sz} ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeRing}`}>
      <Icon size={size === "sm" ? 9 : 11} strokeWidth={2.5} />
      {status}
    </span>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CUSTOMER AVATAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Avatar({ initials, color }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 select-none"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CUSTOM STATUS DROPDOWN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusDropdown({ orderId, currentStatus, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (newStatus) => {
    setIsOpen(false);
    if (!newStatus || newStatus === currentStatus) return;
    
    setSaving(true);
    await new Promise(r => setTimeout(r, 420));
    setSaving(false);
    onStatusChange(orderId, newStatus);
  };

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const availableOptions = STATUS_ORDER.filter((s, i) => i > currentIndex);

  if (availableOptions.length === 0) {
    return (
      <div className="inline-flex items-center justify-center w-[135px] px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold cursor-not-allowed">
        Update status
      </div>
    );
  }

  return (
    <div className="relative inline-block w-[135px]" ref={dropdownRef}>
      <button
        disabled={saving}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-3 py-2 rounded-xl border text-xs font-semibold
          transition-all duration-200 outline-none shadow-sm
          ${saving
            ? "bg-stone-50 text-stone-400 border-stone-200 cursor-wait"
            : isOpen 
              ? "bg-[#6b493d] border-[#6b493d] text-white ring-2 ring-[#6b493d]/20" 
              : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
          }
        `}
      >
        <span>{saving ? "Savingâ€¦" : "Update status"}</span>
        {saving 
          ? <RefreshCw size={12} className="animate-spin text-stone-400 flex-shrink-0" />
          : <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : "text-stone-400"}`} />
        }
      </button>

      {isOpen && !saving && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[150px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-stone-100 py-1.5 z-[9999] overflow-hidden transform origin-top right-0 animate-in fade-in slide-in-from-top-2 duration-200">
          {availableOptions.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-600 hover:bg-[#6b493d]/5 hover:text-[#6b493d] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EXPANDED ORDER DETAIL PANEL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OrderDetailPanel({ order }) {
  const subtotal =
    order.totals?.subtotal ??
    order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const shippingFee = order.totals?.shippingFee ?? 0;

  const finalTotal =
    order.totals?.finalTotal ??
    (subtotal + shippingFee);

  return (
    <div className="sd-row-expand px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Items breakdown */}
        <div className="md:col-span-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Items ordered</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-stone-100 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#6b493d]/10 flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                       <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                       <Package size={14} className="text-[#6b493d]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{item.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">SKU: {item.productId?.toString().substring(0,8) || "N/A"} Â· Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-stone-700 flex-shrink-0">
                  Rs {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex items-center justify-between mt-6 px-2 border-t border-stone-100 pt-4">
            <span className="text-xs font-semibold text-stone-500">Subtotal</span>
            <span className="text-sm font-semibold text-stone-700">Rs {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-2 px-2">
            <span className="text-xs font-semibold text-stone-500">Shipping</span>
            <span className="text-sm font-semibold text-stone-700">Rs {shippingFee.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Order total</span>
            <span className="text-base font-bold text-stone-900">Rs {finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Ship to</p>
            <div className="bg-white rounded-xl border border-stone-100 px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-stone-800">{order.shippingAddress?.fullName || 'Guest'}</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {order.shippingAddress?.street || ''}<br />
                {order.shippingAddress?.city || ''}, {order.shippingAddress?.province || ''} {order.shippingAddress?.postalCode || ''}
              </p>
            </div>
          </div>

          {order.trackingId && (
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Tracking</p>
              <div className="bg-white rounded-xl border border-stone-100 px-4 py-3 shadow-sm">
                <p className="text-xs font-mono text-stone-600 break-all">{order.trackingId}</p>
              </div>
            </div>
          )}

          {order.note && (
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Customer note</p>
              <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 shadow-sm">
                <p className="text-xs text-amber-700 italic leading-relaxed">"{order.note}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ORDER ROW (TABLE VERSION)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AVATAR_COLORS = ["#6b493d", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function OrderRow({ order, onStatusChange, addToast }) {
  const [expanded, setExpanded] = useState(false);
  const total = order.totals?.finalTotal || 0;
  const itemCount = order.items.reduce((s, i) => s + (i.quantity || 1), 0);
  
  const customerName = order.shippingAddress?.fullName || 'Guest';
  const color = avatarColor(customerName);
  const initials = customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handlePrint = useCallback(() => {
    addToast(`Printing label for ${order.orderId || order._id}â€¦`, "info");
  }, [order, addToast]);

  const d = new Date(order.createdAt || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <Fragment>
      <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors group">
        
        {/* ORDER */}
        <td className="px-6 py-4 align-top">
          <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
            <Hash size={13} className="text-stone-400" />
            {order.orderId || order._id.toString().substring(0,8)}
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
            <CalendarDays size={11} />
            {dateStr}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 pl-4">{timeStr}</div>
        </td>

        {/* CUSTOMER */}
        <td className="px-6 py-4 align-top">
          <div className="flex items-start gap-3">
            <Avatar initials={initials} color={color} />
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-stone-800 truncate">{customerName}</p>
              <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                <MapPin size={11} className="text-stone-400" />
                <span className="truncate">{order.shippingAddress?.city || 'Unknown'}</span>
              </div>
              {order.note && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 ring-1 ring-amber-200">
                    <Bell size={9} /> Note
                  </span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* ITEMS */}
        <td className="px-6 py-4 align-top">
          <p className="text-sm font-semibold text-stone-800 truncate max-w-[200px]">
            {order.items[0]?.title || 'Unknown Item'}
            {order.items.length > 1 && (
              <span className="ml-1 text-[11px] font-medium text-stone-400">
                +{order.items.length - 1} more
              </span>
            )}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {itemCount} item{itemCount !== 1 ? "s" : ""} Â· <span className="font-bold text-stone-700">Rs {total.toLocaleString()}</span>
          </p>
        </td>

        {/* STATUS */}
        <td className="px-6 py-4 align-top">
          <StatusBadge status={order.status} />
        </td>

        {/* ACTIONS */}
        <td className="px-6 py-4 align-top">
          <div className="flex items-center gap-2 relative">
            {order.status === "Delivered" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <CheckCircle2 size={13} /> Order Complete
              </span>
            ) : order.status === "Cancelled" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
                <XCircle size={13} /> Cancelled
              </span>
            ) : order.status === "Pending" ? (
              <>
                <button
                  onClick={() => onStatusChange(order._id, "Confirmed")}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#6b493d] text-white text-xs font-semibold hover:bg-[#5a3c32] transition-colors shadow-sm active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => onStatusChange(order._id, "Cancelled")}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-500 text-xs font-semibold hover:bg-stone-50 hover:text-red-600 transition-colors shadow-sm active:scale-95"
                >
                  Reject
                </button>
              </>
            ) : (
              <StatusDropdown
                orderId={order._id}
                currentStatus={order.status}
                onStatusChange={onStatusChange}
              />
            )}

            <button
              onClick={handlePrint}
              aria-label="Print shipping label"
              title="Print shipping label"
              className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-[#6b493d] hover:border-[#6b493d]/30 transition-all duration-150 active:scale-95 shadow-sm"
            >
              <Printer size={13} />
            </button>

            <button
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse order details" : "Expand order details"}
              className={`
                w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm
                ${expanded
                  ? "bg-[#6b493d] border-[#6b493d] text-white"
                  : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50 group-hover:border-stone-300"
                }
              `}
            >
              <Eye size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded panel */}
      {expanded && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-stone-100 bg-stone-50/40">
            <OrderDetailPanel order={order} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// STAT CARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ icon: Icon, label, value, sub, accent, pulse }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + "18" }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-3xl font-bold text-stone-900 tracking-tight leading-none">{value}</span>
          {pulse && (
            <span className="mb-1 w-2 h-2 rounded-full sd-pulse-bar" style={{ backgroundColor: accent }} aria-hidden="true" />
          )}
        </div>
        {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TOAST STACK
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ToastStack({ toasts, removeToast }) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={`
            sd-slide-up flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white
            ${t.type === "success" ? "bg-stone-800" : t.type === "info" ? "bg-[#6b493d]" : "bg-red-600"}
          `}
        >
          <Check size={13} className="text-emerald-400 flex-shrink-0" />
          {t.message}
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss"
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SEARCH BAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full md:w-72">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search orders..."
        aria-label="Search orders"
        className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#6b493d]/20 focus:border-[#6b493d]/40 transition-all"
      />
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FILTER TABS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FilterTabs({ active, onSelect, orders }) {
  const counts = useMemo(() => {
    const c = { All: orders.length };
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  return (
    <div
      role="tablist"
      aria-label="Filter orders by status"
      className="flex flex-wrap items-center gap-2"
    >
      {FILTER_TABS.map(tab => {
        const isActive = active === tab;
        const count    = counts[tab] || 0;
        const cfg      = tab !== "All" ? STATUS_CONFIG[tab] : null;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
              transition-all duration-150
              ${isActive
                ? "bg-[#6b493d] text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300"
              }
            `}
          >
            {cfg && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.accent }} />
            )}
            {tab}
            {count > 0 && (
              <span className={`
                text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EMPTY STATE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EmptyState({ filter, query }) {
  const isSearch = Boolean(query);
  return (
    <tr>
      <td colSpan={5} className="py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-50 mx-auto flex items-center justify-center mb-4 border border-stone-100 shadow-sm">
          {isSearch
            ? <Search size={24} className="text-stone-400" />
            : <Inbox size={24} className="text-stone-400" />
          }
        </div>
        <p className="text-base font-semibold text-stone-800">
          {isSearch ? `No results for "${query}"` : `No ${filter !== "All" ? filter.toLowerCase() : ""} orders`}
        </p>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {isSearch
            ? "Try a different order ID or customer name."
            : filter === "All"
              ? "New orders from buyers will appear here."
              : `You have no orders with status "${filter}".`
          }
        </p>
      </td>
    </tr>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAGE ROOT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SellerOrderDashboard() {
  useGlobalStyles();

  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeFilter, setFilter] = useState("All");
  const [searchQuery, setSearch]  = useState("");
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('hope_for_paws_token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiBase}/api/orders/seller`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle 404 cleanly by setting an empty state, not throwing an error
        if (res.status === 404) {
          setOrders([]);
          return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          setOrders([]);
          return;
        }
        
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        addToast("Failed to load orders.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [addToast]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    const originalOrders = [...orders];
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('hope_for_paws_token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      addToast(`Order updated to ${newStatus}`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to update status. Reverting.", "error");
      setOrders(originalOrders);
    }
  }, [orders, addToast]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchFilter = activeFilter === "All" || o.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || (o.orderId || o._id).toLowerCase().includes(q)
        || (o.shippingAddress?.fullName || "").toLowerCase().includes(q)
        || (o.shippingAddress?.email || "").toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  // Quick stats
  const newCount       = orders.filter(o => o.status === "Pending").length;
  const toShipCount    = orders.filter(o => ["Confirmed", "Processing"].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === "Delivered").length;
  const totalRevenue   = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((s, o) => s + (o.totals?.finalTotal || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f6f4]">
      <div className="max-w-[1200px] mx-auto px-4 py-8">

        {/* â”€â”€ Page header â”€â”€ */}
        <header className="flex items-start justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#6b493d] flex items-center justify-center shadow-sm">
                <ShoppingBag size={14} className="text-white" />
              </div>
              <span className="text-xs font-bold text-[#6b493d] uppercase tracking-widest">
                HopeForPaws Seller Hub
              </span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Order Management
            </h1>
            <p className="text-sm text-stone-500 mt-1.5 font-medium">
              {orders.length} total orders Â· <span className="text-emerald-600 font-bold">Rs {totalRevenue.toLocaleString()}</span> revenue
            </p>
          </div>

          <button
            aria-label="View revenue analytics"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b493d] text-white text-sm font-semibold hover:bg-[#5a3c32] active:scale-95 transition-all shadow-md hover:shadow-lg"
          >
            <TrendingUp size={16} />
            Analytics
            <ArrowUpRight size={14} />
          </button>
        </header>

        {/* â”€â”€ Stat cards â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={Bell}
            label="New orders"
            value={newCount}
            sub="Need your attention"
            accent="#f59e0b"
            pulse={newCount > 0}
          />
          <StatCard
            icon={Package}
            label="To ship"
            value={toShipCount}
            sub="Confirmed or processing"
            accent="#3b82f6"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedCount}
            sub="Successfully delivered"
            accent="#10b981"
          />
        </div>

        {/* â”€â”€ UNIFIED DATA TABLE CONTAINER â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          
          {/* Top Toolbar */}
          <div className="p-6 border-b border-stone-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white">
            <SearchBar value={searchQuery} onChange={setSearch} />
            <FilterTabs active={activeFilter} onSelect={setFilter} orders={orders} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px] pb-32">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-stone-50/50">
                  {["Order", "Customer", "Items", "Status", "Actions"].map((h, i) => (
                    <th key={i} className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-b border-stone-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                     <tr key={i} className="border-b border-stone-100 animate-pulse bg-white">
                       <td className="px-6 py-6"><div className="h-4 bg-stone-200 rounded w-16 mb-2"></div><div className="h-3 bg-stone-100 rounded w-24"></div></td>
                       <td className="px-6 py-6"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-stone-200"></div><div><div className="h-4 bg-stone-200 rounded w-24 mb-2"></div><div className="h-3 bg-stone-100 rounded w-16"></div></div></div></td>
                       <td className="px-6 py-6"><div className="h-4 bg-stone-200 rounded w-32 mb-2"></div><div className="h-3 bg-stone-100 rounded w-20"></div></td>
                       <td className="px-6 py-6"><div className="h-6 bg-stone-200 rounded-full w-20"></div></td>
                       <td className="px-6 py-6"><div className="h-8 bg-stone-200 rounded-xl w-24"></div></td>
                     </tr>
                  ))
                ) : filteredOrders.length === 0
                  ? <EmptyState filter={activeFilter} query={searchQuery} />
                  : filteredOrders.map(order => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        addToast={addToast}
                      />
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* â”€â”€ Footer â”€â”€ */}
        <div className="pb-8"></div>
      </div>

      {/* â”€â”€ Toast notifications â”€â”€ */}
      <ToastStack toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
