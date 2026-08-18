import { useNavigate } from "react-router-dom";
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
  AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────

// Dummy data removed. Real data fetched via API.

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    accent: "#f59e0b",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-amber-200",
    icon: Clock,
    pulse: true,
    optionBg: "hover:bg-amber-50",
    optionText: "text-amber-700",
  },
  Confirmed: {
    label: "Confirmed",
    accent: "#8b5cf6",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    badgeRing: "ring-violet-200",
    icon: CheckCircle2,
    pulse: false,
    optionBg: "hover:bg-violet-50",
    optionText: "text-violet-700",
  },
  Processing: {
    label: "Processing",
    accent: "#0ea5e9",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeRing: "ring-sky-200",
    icon: Package,
    pulse: false,
    optionBg: "hover:bg-sky-50",
    optionText: "text-sky-700",
  },
  Shipped: {
    label: "Shipped",
    accent: "#3b82f6",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeRing: "ring-blue-200",
    icon: Truck,
    pulse: false,
    optionBg: "hover:bg-blue-50",
    optionText: "text-blue-700",
  },
  Delivered: {
    label: "Delivered",
    accent: "#10b981",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeRing: "ring-emerald-200",
    icon: CheckCircle2,
    pulse: false,
    optionBg: "hover:bg-emerald-50",
    optionText: "text-emerald-700",
  },
  Cancelled: {
    label: "Cancelled",
    accent: "#ef4444",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    badgeRing: "ring-red-200",
    icon: XCircle,
    pulse: false,
    optionBg: "hover:bg-red-50",
    optionText: "text-red-600",
  },
};

const STATUS_ORDER = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
const FILTER_TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];


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

// ─────────────────────────────────────────────────────────────────────────
// INJECT GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// CUSTOMER AVATAR
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// CUSTOM STATUS DROPDOWN
// ─────────────────────────────────────────────────────────────────────────

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
        <span>{saving ? "Saving…" : "Update status"}</span>
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

// ─────────────────────────────────────────────────────────────────────────
// EXPANDED ORDER DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────

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
                      <img
                        src={item.image.startsWith('http') ? item.image : `http://localhost:3000${item.image}`}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package size={14} className="text-[#6b493d]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{item.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">SKU: {item.productId?.toString().substring(0, 8) || "N/A"} · Qty: {item.quantity}</p>
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

// ─────────────────────────────────────────────────────────────────────────
// ORDER ROW (TABLE VERSION)
// ─────────────────────────────────────────────────────────────────────────

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
    const subtotal = order.totals?.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = order.totals?.shippingFee ?? 0;
    const finalTotal = order.totals?.finalTotal ?? (subtotal + shippingFee);

    const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #eee;">
        <div style="font-weight:600; color:#292524;">${item.title}</div>
        <div style="font-size:12px; color:#78716c; margin-top:2px;">
          SKU: ${item.productId?.toString().substring(0, 8) || "N/A"} · Qty: ${item.quantity}
        </div>
      </td>
      <td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right; font-weight:600; color:#292524;">
        Rs ${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${order.orderId || order._id}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 40px;
          background: #f8f6f4;
          color: #292524;
        }
        .receipt {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
          background: #6b493d;
          color: #fff;
          padding: 28px 32px;
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
        .body { padding: 28px 32px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #a8a29e; margin-bottom: 6px; }
        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #e7e5e4; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .totals-row.final { font-weight: 700; font-size: 16px; border-top: 1px solid #e7e5e4; margin-top: 8px; padding-top: 10px; }
        .ship-box { background: #f8f6f4; border-radius: 10px; padding: 14px 16px; margin-top: 10px; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #a8a29e; border-top: 1px solid #f0ede9; }
        .print-btn {
          display: block; margin: 20px auto; padding: 12px 28px;
          background: #6b493d; color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
        @media print {
          body { background: #fff; padding: 0; }
          .receipt { box-shadow: none; border-radius: 0; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">🖨 Print Receipt</button>
      <div class="receipt">
        <div class="header">
          <h1>HopeForPaws</h1>
          <p>Order Receipt</p>
        </div>
        <div class="body">
          <div class="meta-grid">
            <div>
              <div class="label">Order ID</div>
              <div style="font-weight:700;">${order.orderId || order._id}</div>
            </div>
            <div style="text-align:right;">
              <div class="label">Date</div>
              <div>${new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          <div class="label">Items</div>
          <table>${itemsHtml}</table>

          <div class="totals-row"><span>Subtotal</span><span>Rs ${subtotal.toLocaleString()}</span></div>
          <div class="totals-row"><span>Shipping</span><span>Rs ${shippingFee.toLocaleString()}</span></div>
          <div class="totals-row final"><span>ORDER TOTAL</span><span>Rs ${finalTotal.toLocaleString()}</span></div>

          <div class="label" style="margin-top:24px;">Ship To</div>
          <div class="ship-box">
            <div style="font-weight:600;">${order.shippingAddress?.fullName || 'Guest'}</div>
            <div style="font-size:13px; color:#78716c; margin-top:4px;">
              ${order.shippingAddress?.street || ''}<br/>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''} ${order.shippingAddress?.postalCode || ''}
            </div>
          </div>
        </div>
        <div class="footer">Thank you for shopping with HopeForPaws 🐾</div>
      </div>
    </body>
    </html>
  `;

    const printWindow = window.open('', '_blank', 'width=700,height=900');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    } else {
      addToast("Please allow pop-ups to print receipts.", "error");
    }
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
            {order.orderId || order._id.toString().substring(0, 8)}
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
            {itemCount} item{itemCount !== 1 ? "s" : ""} · <span className="font-bold text-stone-700">Rs {total.toLocaleString()}</span>
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
                  onClick={() => onStatusChange(order._id, "Processing")}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#6b493d] text-white text-xs font-semibold hover:bg-[#5a3c32] transition-colors shadow-sm active:scale-95"
                >
                  Mark as Processing
                </button>
                <button
                  onClick={() => onStatusChange(order._id, "Cancelled")}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-500 text-xs font-semibold hover:bg-stone-50 hover:text-red-600 transition-colors shadow-sm active:scale-95"
                >
                  Reject
                </button>
              </>
            ) : order.status === "Confirmed" || order.status === "Processing" ? (
              <button
                onClick={() => onStatusChange(order._id, "Shipped")}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#0ea5e9] text-white text-xs font-semibold hover:bg-[#0284c7] transition-colors shadow-sm active:scale-95"
              >
                Mark as Shipped
              </button>
            ) : order.status === "Shipped" ? (
              <button
                onClick={() => onStatusChange(order._id, "Delivered")}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#10b981] text-white text-xs font-semibold hover:bg-[#059669] transition-colors shadow-sm active:scale-95"
              >
                Mark as Delivered
              </button>
            ) : null}

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

// ─────────────────────────────────────────────────────────────────────────
// STAT CARD
// Enhancement: each card now carries a soft tint of its own accent color
// (instead of plain white), so the stat row reads as its own distinct band
// instead of blending into the cream header above and the white table below.
// ─────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent, pulse }) {
  return (
    <div
      className="flex items-start gap-4 rounded-[24px] border px-5 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: accent + "0F",
        borderColor: accent + "35",
      }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: accent + "26" }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">{label}</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-bold leading-none tracking-tight text-stone-900">{value}</span>
          {pulse && (
            <span className="mb-1 h-2 w-2 rounded-full sd-pulse-bar" style={{ backgroundColor: accent }} aria-hidden="true" />
          )}
        </div>
        {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TOAST STACK
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// FILTER TABS
// Enhancement: inactive tabs now carry a soft tint of their own status color
// (Pending amber, Processing sky, Shipped blue, Delivered emerald, Cancelled
// red) instead of uniform white, so they read as distinct at a glance instead
// of looking like the same washed-out state.
// ─────────────────────────────────────────────────────────────────────────

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
      className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 max-w-full"
    >
      {FILTER_TABS.map(tab => {
        const isActive = active === tab;
        const count = counts[tab] || 0;
        const cfg = tab !== "All" ? STATUS_CONFIG[tab] : null;

        const inactiveStyle = cfg
          ? { backgroundColor: cfg.accent + "12", borderColor: cfg.accent + "35" }
          : { backgroundColor: "#ffffff", borderColor: "#e7e2dd" };

        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab)}
            style={isActive ? undefined : inactiveStyle}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold
              transition-all duration-150
              ${isActive
                ? "bg-[#6b493d] border-[#6b493d] text-white shadow-sm"
                : "text-stone-600 hover:shadow-sm"
              }
            `}
          >
            {cfg && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.accent }} />
            )}
            {tab}
            {count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : ""}`}
                style={!isActive ? { backgroundColor: (cfg ? cfg.accent : "#78716c") + "22", color: cfg ? cfg.accent : "#57534e" } : undefined}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ filter, query }) {
  const isSearch = Boolean(query);
  return (
    <tr>
      <td colSpan={5} className="py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[24px] border border-dashed border-stone-200 bg-stone-50/70 px-6 py-12 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            {isSearch ? <Search size={24} className="text-stone-400" /> : <Inbox size={24} className="text-stone-400" />}
          </div>
          <p className="text-base font-semibold text-stone-800">
            {isSearch ? `No results for "${query}"` : `No ${filter !== "All" ? filter.toLowerCase() : ""} orders`}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            {isSearch
              ? "Try a different order ID or customer name to widen the search."
              : filter === "All"
                ? "New orders from buyers will appear here as soon as they arrive."
                : `You have no orders currently marked as "${filter}".`}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────

export default function SellerOrderDashboard({ embedded = false }) {
  useGlobalStyles();

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setFilter] = useState("All");
  const [searchQuery, setSearch] = useState("");
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

        // Backward-compatible: API may return an array (old) or an object { orders, counts } (new)
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
          // If counts provided, you could use them for badges in future
        } else {
          setOrders([]);
        }
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update status');
      }
      addToast(`Order updated to ${newStatus}`, "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to update status. Reverting.", "error");
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
  const newCount = orders.filter(o => o.status === "Pending").length;
  const toShipCount = orders.filter(o => ["Confirmed", "Processing"].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === "Delivered").length;
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((s, o) => s + (o.totals?.finalTotal || 0), 0);

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-[#f8f6f4]"}>
      <div className={embedded ? "w-full" : "max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6"}>

        {/* ── Page header ── */}
        <header className={`rounded-[28px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fcf8f3] to-[#efe4d8] p-6 shadow-sm ${embedded ? "mb-6" : "mb-8"}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#6b493d] shadow-sm">
                  <ShoppingBag size={14} className="text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#6b493d]">
                  HopeForPaws Seller Hub
                </span>
              </div>
              <h1 className={`font-bold tracking-tight text-stone-900 ${embedded ? "text-2xl" : "text-3xl"}`}>
                Order Management
              </h1>
              <p className="mt-1.5 text-sm font-medium text-stone-500">
                {orders.length} total orders • <span className="font-bold text-emerald-600">Rs {totalRevenue.toLocaleString()}</span> revenue
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/seller/analytics')}
              aria-label="View revenue analytics"
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b493d] text-white text-sm font-semibold hover:bg-[#5a3c32] active:scale-95 transition-all shadow-md hover:shadow-lg"
            >
              <TrendingUp size={16} />
              Analytics
              <ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        {/*  Stat cards */}
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${embedded ? "mb-6" : "mb-8"}`}>
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

        {/* UNIFIED DATA TABLE CONTAINER */}
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(107,73,61,0.04),0_12px_32px_-16px_rgba(107,73,61,0.18)] border border-[#e7dfd6] overflow-hidden">

          {/* Top Toolbar */}
          <div className="p-6 border-b border-[#ece4da] flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white">
            <SearchBar value={searchQuery} onChange={setSearch} />
            <FilterTabs active={activeFilter} onSelect={setFilter} orders={orders} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#f6f1ea]">
                  {["Order", "Customer", "Items", "Status", "Actions"].map((h, i) => (
                    <th key={i} className="px-6 py-3.5 text-[11px] font-bold text-[#6b493d] uppercase tracking-widest border-b-2 border-[#6b493d]/15">
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

          {/* Bottom strip — closes the card on content instead of empty space */}
          {!loading && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-[#ece4da] bg-[#faf7f3]">
              <p className="text-xs font-medium text-stone-500">
                Showing <span className="font-bold text-stone-700">{filteredOrders.length}</span> of{" "}
                <span className="font-bold text-stone-700">{orders.length}</span> orders
              </p>
              {(activeFilter !== "All" || searchQuery) && (
                <button
                  onClick={() => { setFilter("All"); setSearch(""); }}
                  className="text-xs font-semibold text-[#6b493d] hover:text-[#5a3c32] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/*  Toast notifications */}
      <ToastStack toasts={toasts} removeToast={removeToast} />
    </div>
  );
}