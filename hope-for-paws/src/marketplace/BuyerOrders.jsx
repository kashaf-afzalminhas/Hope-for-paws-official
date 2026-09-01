import { useState, useCallback, useEffect, useRef } from "react";
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  X,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Star,
  AlertTriangle,
  RotateCcw,
  MessageCircle,
  Filter,
  ArrowUpRight,
  Sparkles,
  Copy,
  Check,
  BadgeCheck,
  CreditCard,
  Receipt,
  Info,
  Calendar,
  Hash,
  ArrowLeft,
} from "lucide-react";
import ReviewModal from "./ReviewModal";
import { API_BASE_URL } from "../config";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// CONSTANTS

const STEPS = [
  { label: "Pending", shortLabel: "Placed", icon: Clock },
  { label: "Confirmed", shortLabel: "Confirmed", icon: CheckCircle2 },
  { label: "Processing", shortLabel: "Packed", icon: Package },
  { label: "Shipped", shortLabel: "Shipped", icon: Truck },
  { label: "Delivered", shortLabel: "Delivered", icon: MapPin },
];

const DB_STATUSES = STEPS.map(s => s.label.toLowerCase());

/** All colour tokens per status. */
const STATUS_CONFIG = {
  Pending: {
    accent: "#f59e0b",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-1 ring-amber-200",
    dot: "bg-amber-500",
    stepDone: "bg-amber-500 border-amber-500",
    stepActive: "bg-amber-500 border-amber-500 ring-4 ring-amber-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-amber-500",
    lightBg: "bg-amber-50",
    cancelLabel: "bg-amber-50 text-amber-700",
  },
  Confirmed: {
    accent: "#8b5cf6",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    badgeRing: "ring-1 ring-violet-200",
    dot: "bg-violet-500",
    stepDone: "bg-violet-500 border-violet-500",
    stepActive: "bg-violet-500 border-violet-500 ring-4 ring-violet-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-violet-500",
    lightBg: "bg-violet-50",
    cancelLabel: "bg-violet-50 text-violet-700",
  },
  Processing: {
    accent: "#0ea5e9",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeRing: "ring-1 ring-sky-200",
    dot: "bg-sky-500",
    stepDone: "bg-sky-500 border-sky-500",
    stepActive: "bg-sky-500 border-sky-500 ring-4 ring-sky-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-sky-500",
    lightBg: "bg-sky-50",
    cancelLabel: "bg-sky-50 text-sky-700",
  },
  Shipped: {
    accent: "#3b82f6",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeRing: "ring-1 ring-blue-200",
    dot: "bg-blue-500",
    stepDone: "bg-blue-500 border-blue-500",
    stepActive: "bg-blue-500 border-blue-500 ring-4 ring-blue-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-blue-500",
    lightBg: "bg-blue-50",
    cancelLabel: "bg-blue-50 text-blue-700",
  },
  Delivered: {
    accent: "#10b981",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeRing: "ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    stepDone: "bg-emerald-500 border-emerald-500",
    stepActive: "bg-emerald-500 border-emerald-500 ring-4 ring-emerald-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    cancelLabel: "bg-emerald-50 text-emerald-700",
  },
  Cancelled: {
    accent: "#ef4444",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    badgeRing: "ring-1 ring-red-200",
    dot: "bg-red-400",
    stepDone: "bg-red-400 border-red-400",
    stepActive: "bg-red-400 border-red-400 ring-4 ring-red-100",
    stepFuture: "bg-white border-stone-200",
    bar: "bg-red-400",
    lightBg: "bg-red-50",
    cancelLabel: "bg-red-50 text-red-600",
  },
};

const FILTER_TABS = [
  { key: "all", label: "All Orders" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

// UTILITY HOOKS

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(timerRef.current);
    setToast({ message, type, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}

// SMALL PRESENTATIONAL COMPONENTS

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        text-[11px] font-semibold tracking-wide
        ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeRing}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
}

function SellerStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={10} className="text-amber-400 fill-amber-400" />
      <span className="text-[10px] text-stone-400 font-medium">{rating}</span>
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy tracking ID"
      className="ml-1 p-0.5 rounded hover:bg-stone-200 transition-colors"
    >
      {copied
        ? <Check size={11} className="text-emerald-500" />
        : <Copy size={11} className="text-stone-400" />
      }
    </button>
  );
}

// TOAST

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
        text-sm font-medium text-white
        transition-all duration-300 animate-in
        ${isSuccess ? "bg-stone-800" : "bg-red-600"}
      `}
      style={{ animation: "slideUp 0.25s ease-out" }}
    >
      {isSuccess
        ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
        : <AlertTriangle size={15} className="text-amber-300 flex-shrink-0" />
      }
      {toast.message}
      <button onClick={onDismiss} aria-label="Dismiss" className="ml-1 opacity-60 hover:opacity-100">
        <X size={13} />
      </button>
    </div>
  );
}

// CANCEL CONFIRMATION (inline)

function CancelConfirm({ onConfirm, onDismiss, isCOD }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-heading"
      className="mx-6 mb-5 rounded-2xl border border-red-100 bg-red-50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p id="cancel-heading" className="text-sm font-semibold text-stone-800">
            Cancel this order?
          </p>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            Your payment will be refunded within 3–5 business days. This cannot be undone.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all"
            >
              Yes, cancel it
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 text-xs font-semibold hover:bg-stone-50 active:scale-95 transition-all"
            >
              Keep order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// TRACKING TIMELINE

function TrackingTimeline({ currentStep, status, timestamps = {} }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  const totalSegments = STEPS.length - 1;

  return (
    <div className="mt-2">
      {/* Step row */}
      <div className="relative flex items-start">
        {/* Connecting rail sits behind circles. */}
        <div
          className="absolute bg-stone-200"
          style={{ top: 14, left: "calc(10% + 14px)", right: "calc(10% + 14px)", height: 2 }}
          aria-hidden="true"
        />
        {/* Progress fill */}
        <div
          className={`absolute transition-all duration-700 ease-out ${cfg.bar}`}
          style={{
            top: 14,
            left: "calc(10% + 14px)",
            height: 2,
            // Precise: span from first circle center to current circle center
            width: currentStep === 0
              ? 0
              : `calc(${currentStep / totalSegments} * (80% - 28px))`,
          }}
          aria-hidden="true"
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const isFuture = i > currentStep;
          const ts = timestamps[i];

          return (
            <div
              key={step.label}
              className="relative z-10 flex flex-col items-center"
              style={{ flex: 1 }}
            >
              {/* Circle */}
              <div
                className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${isDone ? `${cfg.stepDone} text-white` : ""}
                  ${isActive ? `${cfg.stepActive} text-white` : ""}
                  ${isFuture ? `${cfg.stepFuture} text-stone-300` : ""}
                `}
                aria-label={`${step.label}${isDone ? " (complete)" : isActive ? " (current)" : " (upcoming)"}`}
              >
                {isActive
                  ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  : <Icon size={12} strokeWidth={isDone ? 2.5 : 1.5} />
                }
              </div>

              {/* Label */}
              <span className={`
                mt-2 text-[9px] font-semibold uppercase tracking-wide text-center leading-tight px-0.5
                ${isDone || isActive ? "text-stone-700" : "text-stone-400"}
              `}>
                {step.shortLabel}
              </span>

              {/* Timestamp (only for completed) */}
              {ts && (isDone || isActive) && (
                <span className="mt-0.5 text-[8px] text-stone-400 text-center leading-tight hidden sm:block">
                  {ts}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ORDER ITEM ROW

function OrderItem({ item }) {
  const [imgError, setImgError] = useState(false);
  const qty = item.quantity || item.qty || 1;

  return (
    <div className="flex gap-3 items-start py-3 first:pt-0 last:pb-0 border-b border-stone-50 last:border-0">
      {/* Thumbnail */}
      <div className="w-[60px] h-[60px] rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 ring-1 ring-black/5">
        {!imgError && item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <Package size={20} className="text-stone-300" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-stone-400 font-medium mb-0.5">{item.category || "Product"}</p>
        <p className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-stone-500">
            by <span className="text-[#6b493d] font-semibold">{item.seller || "Marketplace Seller"}</span>
          </span>
          {item.sellerRating && <SellerStars rating={item.sellerRating} />}
        </div>
      </div>

      {/* Price + qty */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-stone-800">Rs. {(item.price * qty).toFixed(2)}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {qty > 1 ? `${qty} × Rs. ${item.price.toFixed(2)}` : `1 item`}
        </p>
      </div>
    </div>
  );
}

// ORDER CARD

function OrderCard({ order, onCancel, showToast, reviewedOrders, onOpenReview }) {
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTracking, setShowTracking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const orderId = order._id || order.id;
  const isReviewed = reviewedOrders?.has(orderId);

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Pending;
  const isPending = order.status === "Pending";
  const isCancelled = order.status === "Cancelled";

  const currentStepIndex = STEPS.findIndex(s => s.label === order.status);
  const currentStep = currentStepIndex !== -1 ? currentStepIndex : 0;
  const isDelivered = currentStep === 4;

  const timestamps = {};
  if (order.statusHistory) {
    order.statusHistory.forEach(h => {
      const hStatus = (h.status || '').toLowerCase();
      const idx = DB_STATUSES.indexOf(hStatus);
      if (idx !== -1) timestamps[idx] = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    });
  }

  const totalPrice = order.totals?.finalTotal || order.items.reduce((sum, item) => sum + item.price * (item.quantity || item.qty || 1), 0);
  const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);

  const displayId = order.orderId || order._id || order.id;
  const displayDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date;

  const handleCancelConfirm = useCallback(async () => {
    setShowCancelConfirm(false);
    await onCancel(order._id || order.id);
  }, [order._id, order.id, onCancel]);

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100/80 transition-all duration-300 hover:shadow-md hover:border-[#c9a280]/40"
      aria-label={`Order ${displayId}`}
    >
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Status accent bar (the signature element) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: cfg.accent }}
        aria-hidden="true"
      />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Card header Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-stone-50">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cfg.accent + "18" }}
          >
            <ShoppingBag size={15} style={{ color: cfg.accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#6b493d] tracking-tight">
                #{displayId}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {displayDate} · {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-stone-800">Rs. {totalPrice.toFixed(2)}</p>
            <p className="text-[10px] text-stone-400">{order.paymentMethod || 'card'}</p>
          </div>
          <button
            onClick={() => setIsExpanded(v => !v)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse order" : "Expand order"}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors text-stone-400"
          >
            <ChevronRight
              size={15}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Expandable body Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {isExpanded && (
        <>
          {/* Items */}
          <div className="px-5 pt-3 pb-1">
            {order.items.map((item, idx) => (
              <OrderItem key={item.productId || item.id || idx} item={item} />
            ))}
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tracking section Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {showTracking && !isCancelled && (
            <div className="mx-5 mb-4 mt-3 rounded-2xl border border-stone-100 bg-stone-50/60 px-4 pt-4 pb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Order Journey
                </p>
                {order.trackingId && (
                  <div className="flex items-center text-[10px] text-stone-500">
                    <span className="font-mono">{order.trackingId.slice(-8)}</span>
                    <CopyButton text={order.trackingId} />
                    <button className="ml-1.5 flex items-center gap-0.5 text-[#6b493d] font-semibold hover:underline">
                      Track <ArrowUpRight size={9} />
                    </button>
                  </div>
                )}
              </div>

              <TrackingTimeline
                currentStep={currentStep}
                status={order.status}
                timestamps={timestamps}
              />

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[11px] text-stone-400">
                  {isCancelled ? "Cancelled" : isDelivered ? "Delivered" : "Est. delivery"}
                </p>
                <p className="text-[11px] font-semibold text-stone-600">
                  {order.estimatedDelivery || 'To be determined'}
                </p>
              </div>
            </div>
          )}

          {/* ── Order Details Panel ── */}
          {showDetails && !isCancelled && (
            <div className="mx-5 mb-4 mt-3 rounded-2xl border border-stone-100 bg-stone-50/60 overflow-hidden"
              style={{ animation: "slideUp 0.2s ease-out" }}>
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cfg.accent + '18' }}>
                      <Receipt size={13} style={{ color: cfg.accent }} />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Order Summary
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-stone-200 transition-colors text-stone-400"
                    aria-label="Close details"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span className="text-xs font-semibold text-stone-700">
                    Rs. {(order.totals?.subtotal || totalPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Shipping fee</span>
                  <span className="text-xs font-semibold text-stone-700">
                    {order.totals?.shippingFee
                      ? `Rs. ${order.totals.shippingFee.toFixed(2)}`
                      : <span className="text-emerald-600 font-semibold">Free</span>
                    }
                  </span>
                </div>
                <div className="h-px bg-stone-200 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-800">Total</span>
                  <span className="text-sm font-bold" style={{ color: cfg.accent }}>
                    Rs. {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Meta info grid */}
              <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2.5">
                {/* Payment method */}
                <div className="rounded-xl bg-white border border-stone-100 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard size={10} className="text-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Payment</span>
                  </div>
                  <p className="text-xs font-semibold text-stone-700 capitalize">
                    {order.paymentMethod || 'Card'}
                  </p>
                </div>

                {/* Order date */}
                <div className="rounded-xl bg-white border border-stone-100 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={10} className="text-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Ordered</span>
                  </div>
                  <p className="text-xs font-semibold text-stone-700">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : order.date || '\u2014'
                    }
                  </p>
                </div>

                {/* Order ID */}
                <div className="rounded-xl bg-white border border-stone-100 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash size={10} className="text-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Order ID</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-mono font-semibold text-stone-700 truncate">
                      {displayId}
                    </p>
                    <CopyButton text={displayId} />
                  </div>
                </div>

                {/* Estimated delivery */}
                <div className="rounded-xl bg-white border border-stone-100 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck size={10} className="text-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">
                      {isDelivered ? 'Delivered' : 'Est. Delivery'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-700">
                    {order.estimatedDelivery || 'TBD'}
                  </p>
                </div>
              </div>

              {/* Shipping address */}
              {order.shippingAddress && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl bg-white border border-stone-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin size={10} className="text-stone-400" />
                      <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Shipping Address</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Status history timeline */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info size={10} className="text-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Status History</span>
                  </div>
                  <div className="space-y-0">
                    {[...order.statusHistory].reverse().map((entry, i) => {
                      const entryCfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.Pending;
                      const isLast = i === order.statusHistory.length - 1;
                      return (
                        <div key={i} className="flex items-start gap-2.5 relative">
                          {/* Vertical connector line */}
                          {!isLast && (
                            <div
                              className="absolute left-[7px] top-[18px] w-px h-[calc(100%-4px)] bg-stone-200"
                              aria-hidden="true"
                            />
                          )}
                          {/* Dot */}
                          <div
                            className="w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              borderColor: entryCfg.accent,
                              backgroundColor: i === 0 ? entryCfg.accent : 'white',
                            }}
                          >
                            {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          {/* Content */}
                          <div className="pb-3 min-w-0">
                            <p className="text-xs font-semibold text-stone-700">{entry.status}</p>
                            <p className="text-[10px] text-stone-400">
                              {new Date(entry.date).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                            {entry.note && (
                              <p className="text-[10px] text-stone-500 mt-0.5 italic">{entry.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cancelled banner ── */}
          {isCancelled && (
            <div className="mx-5 mb-4 mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3">
              <X size={15} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Order cancelled</p>
                <p className="text-xs text-red-400 mt-0.5">Refund will appear in 3–5 business days.</p>
              </div>
            </div>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Cancel confirm (inline) Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {showCancelConfirm && (
            <CancelConfirm
              onConfirm={handleCancelConfirm}
              onDismiss={() => setShowCancelConfirm(false)}
              isCOD={order.paymentMethod?.toLowerCase() === 'cod'}
            />
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Order meta (shipping, payment) Ã¢â‚¬â€ subtle row Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div className="px-5 pb-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
              <MapPin size={10} />
              <span>
                {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 sm:hidden">
              <span className="font-semibold text-stone-700">Rs. {totalPrice.toFixed(2)}</span>
              <span>· {order.paymentMethod || 'card'}</span>
            </div>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Action footer Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div className="px-5 py-3 border-t border-stone-50 bg-stone-50/40 flex items-center justify-between gap-3 flex-wrap">
            {/* Left: support link */}
            <button
              onClick={() => {
                const sellerUserId = order.sellerId?.userId;
                if (sellerUserId) {
                  navigate(`/chat/${sellerUserId}`, {
                    state: {
                      fromOrder: true,
                      orderId: order.orderId || order._id,
                      sellerStoreName: order.sellerId?.storeName,
                    }
                  });
                }
              }}
              className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-[#6b493d] transition-colors group"
            >
              <MessageCircle size={12} className="group-hover:text-[#6b493d]" />
              Get help with this order
            </button>

            {/* Right: primary CTAs */}
            <div className="flex items-center gap-2">
              {!isCancelled && (
                <button
                  onClick={() => setShowTracking(v => !v)}
                  className="
                    inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    bg-white border border-stone-200 text-stone-600 text-xs font-semibold
                    hover:bg-stone-50 active:scale-95 transition-all duration-150
                  "
                >
                  <Truck size={12} className={showTracking ? "text-[#6b493d]" : "text-stone-400"} />
                  {showTracking ? "Hide tracking" : "Track package"}
                </button>
              )}
              {isPending && !showCancelConfirm && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="
                    inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    border border-red-200 text-red-500 text-xs font-semibold bg-white
                    hover:bg-red-50 hover:border-red-300
                    active:scale-95 transition-all duration-150
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400
                  "
                >
                  <X size={12} />
                  Cancel order
                </button>
              )}

              {isDelivered && !isCancelled && (
                isReviewed ? (
                  <span className="
                    inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200
                    cursor-default select-none
                  ">
                    <BadgeCheck size={12} className="text-emerald-500" />
                    Reviewed
                  </span>
                ) : (
                  <button
                    onClick={() => onOpenReview(order)}
                    className="
                      inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                      bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200
                      hover:bg-amber-100 active:scale-95 transition-all duration-150
                    "
                  >
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    Rate & Review
                  </button>
                )
              )}

              {!isCancelled && (
                <button
                  onClick={() => {
                    if (isDelivered) {
                      navigate('/checkout', {
                        state: {
                          reorder: true,
                          previousOrder: {
                            orderId: order.orderId || order._id || order.id,
                            items: order.items,
                            shippingAddress: order.shippingAddress,
                            paymentMethod: order.paymentMethod,
                            totals: order.totals,
                            contact: order.contact || {
                              email: order.shippingAddress?.email || '',
                              phone: order.shippingAddress?.phone || '',
                            },
                          },
                        },
                      });
                    } else {
                      setShowDetails(v => !v);
                    }
                  }}
                  className={`
                    inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    text-xs font-semibold
                    active:scale-95 transition-all duration-150
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6b493d]
                    ${showDetails && !isDelivered
                      ? 'bg-[#5a3c32] text-white ring-2 ring-[#6b493d]/30'
                      : 'bg-[#6b493d] text-white hover:bg-[#5a3c32]'
                    }
                  `}
                >
                  {isDelivered ? "Reorder" : showDetails ? "Hide details" : "View details"}
                  {isDelivered
                    ? <RotateCcw size={11} />
                    : <ChevronDown size={11} className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                  }
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

// PAGE HEADER STATS

function PageStats({ orders }) {
  const totalSpent = orders.reduce(
    (sum, o) => sum + (o.totals?.finalTotal || o.items.reduce((s, i) => s + i.price * (i.quantity || i.qty || 1), 0)),
    0
  );
  const activeCount = orders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === "Delivered").length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {[
        { label: "Total spent", value: `Rs. ${totalSpent.toFixed(0)}`, sub: "all time", cardColor: "bg-violet-50 border-violet-100", textColor: "text-violet-950", labelColor: "text-violet-800" },
        { label: "Active orders", value: activeCount, sub: "in progress", cardColor: "bg-blue-50 border-blue-100", textColor: "text-blue-950", labelColor: "text-blue-800" },
        { label: "Delivered", value: deliveredCount, sub: "completed", cardColor: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-950", labelColor: "text-emerald-800" },
      ].map(stat => (
        <div
          key={stat.label}
          className={`${stat.cardColor} rounded-2xl border-2 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
        >
          <p className={`text-[10px] uppercase tracking-widest font-semibold ${stat.labelColor}`}>{stat.label}</p>
          <p className={`mt-0.5 text-xl font-bold tracking-tight ${stat.textColor}`}>{stat.value}</p>
          <p className={`text-[10px] ${stat.labelColor} opacity-75`}>{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

// FILTER TABS
const ALL_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

function StatusFilterDropdown({ selectedStatus, onSelect, orders }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const counts = {};
  ALL_STATUSES.forEach(s => {
    counts[s] = orders.filter(o => o.status === s).length;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Filter by exact status"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(v => !v)}
        className={`
          w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-sm
          ${selectedStatus
            ? "bg-[#6b493d] border-[#6b493d] text-white"
            : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }
        `}
      >
        <Filter size={15} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Filter by status
          </p>

          <button
            role="menuitem"
            onClick={() => { onSelect(null); setIsOpen(false); }}
            className={`
              w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors
              ${!selectedStatus ? "text-[#6b493d] bg-[#6b493d]/5" : "text-stone-600 hover:bg-stone-50"}
            `}
          >
            All statuses
            {!selectedStatus && <Check size={13} />}
          </button>

          {ALL_STATUSES.map(status => {
            const cfg = STATUS_CONFIG[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                role="menuitem"
                onClick={() => { onSelect(status); setIsOpen(false); }}
                className={`
                  w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors
                  ${isActive ? "bg-[#6b493d]/5" : "hover:bg-stone-50"}
                `}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={isActive ? "text-[#6b493d]" : "text-stone-600"}>{status}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400">{counts[status]}</span>
                  {isActive && <Check size={13} className="text-[#6b493d]" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
const isRecentlyCancelled = (order) => {
  if (order.status !== 'Cancelled') return false;
  const cancelledEntry = order.statusHistory?.find(h => h.status === 'Cancelled');
  const cancelDate = cancelledEntry ? new Date(cancelledEntry.date) : new Date(order.updatedAt || order.createdAt || new Date());
  const hoursSince = (new Date() - cancelDate) / (1000 * 60 * 60);
  return hoursSince <= 12;
};

function FilterTabs({ activeFilter, onFilter, orders }) {
  const counts = {
    all: orders.length,
    active: orders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
  };

  return (
    <div
      role="tablist"
      aria-label="Filter orders"
      className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 mb-5"
    >
      {FILTER_TABS.map(tab => {
        const isActive = activeFilter === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilter(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-1.5
              px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-all duration-150
              ${isActive
                ? "bg-white text-[#6b493d] shadow-sm"
                : "text-stone-500 hover:text-[#a07855]"
              }
            `}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`
                text-[9px] font-bold px-1.5 py-0.5 rounded-full
                ${isActive ? "bg-[#f8f6f4] text-[#a07855]" : "bg-stone-200 text-stone-400"}
              `}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// EMPTY STATE

function EmptyState({ filter }) {
  const navigate = useNavigate();
  const messages = {
    all: { title: "No orders yet", sub: "Your next furry friend's supplies are waiting." },
    active: { title: "No active orders", sub: "Everything you've ordered has been delivered." },
    delivered: { title: "No delivered orders", sub: "Delivered orders will appear here." },
    cancelled: { title: "No cancelled orders", sub: "Great - nothing's been cancelled!" },
  };
  const { title, sub } = messages[filter] ?? messages.all;

  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#f8f6f4] border border-[#d4c5c1] mx-auto flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
        <ShoppingBag size={26} className="text-[#c9a280]" />
      </div>
      <p className="text-[#6b493d] font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</p>
      <p className="text-[#a07855] text-xs mt-1 max-w-xs mx-auto leading-relaxed">{sub}</p>
      {filter === "all" && (
        <button
          onClick={() => navigate('/marketplace')}
          className="mt-5 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#6b493d] text-white text-sm font-semibold hover:bg-[#573b31] transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Browse the marketplace
        </button>
      )}
    </div>
  );
}

// PAGE ROOT

export default function MyOrdersPage({ embedded = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeFilter, setFilter] = useState(() => searchParams.get('status') || "all");
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, dismissToast } = useToast();

  // Review state
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [reviewModal, setReviewModal] = useState({ open: false, orderId: null, product: null });

  const handleOpenReview = useCallback((order) => {
    const firstItem = order.items?.[0];
    setReviewModal({
      open: true,
      orderId: order._id || order.id,
      product: firstItem ? {
        productId: firstItem.productId,
        title: firstItem.title,
        image: firstItem.image,
      } : null,
    });
  }, []);

  const handleReviewSuccess = useCallback((orderId) => {
    setReviewedOrders(prev => new Set(prev).add(orderId));
    showToast("Review submitted! Thanks for your feedback.", "success");
  }, [showToast]);

  // Inject global keyframe for toast
  useEffect(() => {
    if (document.getElementById("mo-styles")) return;
    const style = document.createElement("style");
    style.id = "mo-styles";
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/orders/buyer`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(data);

          // Check which delivered orders have already been reviewed
          const deliveredIds = data
            .filter(o => o.status === "Delivered")
            .map(o => o._id || o.id);

          const reviewChecks = await Promise.allSettled(
            deliveredIds.map(async (id) => {
              const r = await fetch(`http://localhost:3000/api/reviews/check/${id}`);
              const d = await r.json();
              return d.reviewed ? id : null;
            })
          );
          const already = new Set(
            reviewChecks
              .filter(r => r.status === "fulfilled" && r.value)
              .map(r => r.value)
          );
          setReviewedOrders(already);
        } else {
          showToast(data.message || "Failed to load orders", "error");
        }
      } catch (err) {
        showToast("Network error while loading orders", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [showToast]);

  const handleCancel = useCallback(async (orderId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setOrders(prev =>
          prev.map(o =>
            (o._id === orderId || o.id === orderId) ? { ...o, status: "Cancelled", statusHistory: data.order.statusHistory } : o
          )
        );
        showToast("Order cancelled. Refund initiated.", "success");
      } else {
        showToast(data.message || "Failed to cancel order", "error");
      }
    } catch (err) {
      showToast("Network error while cancelling order", "error");
    }
  }, [showToast]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter) return o.status === statusFilter;

    if (activeFilter === "all") return true;
    if (activeFilter === "active") return !["Delivered", "Cancelled"].includes(o.status);
    if (activeFilter === "delivered") return o.status === "Delivered";
    if (activeFilter === "cancelled") return o.status === "Cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f6f4]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {!embedded && (
          <button type="button" onClick={() => navigate('/profile')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6b493d] transition hover:text-[#4E3B31]">
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Page header Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <header className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#6b493d] tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Orders
              </h1>
              <p className="text-xs text-[#a07855] mt-1.5 font-medium">
                {orders.length} order{orders.length !== 1 ? "s" : ""} across all time
              </p>
            </div>
            <StatusFilterDropdown
              selectedStatus={statusFilter}
              onSelect={setStatusFilter}
              orders={orders}
            />
          </div>
        </header>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Stats strip Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <PageStats orders={orders} />

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Filter tabs Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilter={(tab) => { setStatusFilter(null); setFilter(tab); }}
          orders={orders}
        />

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Order list Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <main>
          {loading ? (
            <div className="flex justify-center py-20 text-[#c9a280]">
              <Package className="animate-bounce" size={32} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState filter={activeFilter} />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <OrderCard
                  key={order._id || order.id}
                  order={order}
                  onCancel={handleCancel}
                  showToast={showToast}
                  reviewedOrders={reviewedOrders}
                  onOpenReview={handleOpenReview}
                />
              ))}
            </div>
          )}
        </main>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Footer note Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <footer className="mt-12 text-center pb-8">
          <span className="text-sm text-stone-400">
            Questions about your order?{" "}
            <span
              onClick={() => navigate('/contactus', { state: { name: user?.username, email: user?.email } })}
              className="font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
            >
              Reach out to us
            </span>
          </span>
        </footer>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Review modal Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, orderId: null, product: null })}
        orderId={reviewModal.orderId}
        product={reviewModal.product}
        onSuccess={handleReviewSuccess}
      />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Global toast Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
