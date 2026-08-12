import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  Store,
  Shield,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Share2,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Package,
  Clock,
  BadgeCheck,
} from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import StarDisplay from "../components/StarDisplay";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useRequireAuth } from "../Components/AuthGuard";
import ReportModal from "./ReportModal";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const BRAND = {
  dark: "#8B5A2B",
  mid: "#6F4C3E",
  light: "#f5f0e1",
  muted: "#b8905a",
  softBorder: "#e8ddd0",
};

/* ─────────────────────────── HELPERS ─────────────────────────── */
const fmt = (n) => `Rs. ${n.toLocaleString("en-PK")}`;

function StarRow({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        return (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            className={filled ? "text-amber-400" : "text-stone-300"}
            fill={filled ? "#FBBF24" : "none"}
          />
        );
      })}
    </span>
  );
}

function StockBadge({ stock }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Out of Stock
      </span>
    );
  if (stock <= 10)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle size={11} />
        Only {stock} left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} />
      In Stock
    </span>
  );
}

function QuantitySelector({ qty, onChange, max }) {
  return (
    <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: BRAND.softBorder }}>
      <button
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
        className="w-10 h-10 flex items-center justify-center transition-colors duration-150 hover:bg-stone-100 text-stone-600 disabled:opacity-40"
      >
        <Minus size={15} />
      </button>
      <span className="w-10 text-center text-sm font-semibold text-stone-800">{qty}</span>
      <button
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        aria-label="Increase quantity"
        className="w-10 h-10 flex items-center justify-center transition-colors duration-150 hover:bg-stone-100 text-stone-600 disabled:opacity-40"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

function SellerCard({ seller, navigate }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 border" style={{ backgroundColor: BRAND.light, borderColor: BRAND.softBorder }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ backgroundColor: BRAND.mid }}
          >
            {seller.name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-stone-900 truncate">{seller.name}</p>
              <VerifiedBadge isVerified={seller.verified} size="md"/>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <StarRow rating={seller.rating} size={12} />
              <span className="text-xs text-stone-500">{seller.rating} · {seller.totalSales} sales</span>
            </div>
          </div>
        </div>
        <button
  onClick={() => {
    if (seller.userId) {
      navigate(`/profile/public/${seller.userId}`);
    }
  }}
  disabled={!seller.userId}
  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors duration-150 hover:bg-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
  style={{ borderColor: BRAND.softBorder, color: BRAND.dark }}
>
  <Store size={13} />
  View Store
</button>
      </div>

      <div
        className="mt-4 pt-4 border-t grid grid-cols-3 divide-x text-center"
        style={{ borderColor: BRAND.softBorder }}
      >
        {[
          { label: "Rating", value: `${seller.rating}/5` },
          { label: "Sales",  value: seller.totalSales },
          { label: "Dispatch", value: "Same Day" },
        ].map(({ label, value }) => (
          <div key={label} className="px-1 sm:px-2">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="text-xs sm:text-sm font-semibold text-stone-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Shield,       text: "Secure payments" },
    { icon: CheckCircle2, text: "Quality guaranteed" },
    { icon: Truck,        text: "Nationwide shipping" },
  ];
  return (
    <div className="flex items-center justify-between gap-1 py-4 border-y" style={{ borderColor: BRAND.softBorder }}>
      {items.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1 sm:gap-1.5 text-xs text-stone-500 min-w-0">
          <Icon size={13} className="flex-shrink-0" style={{ color: BRAND.muted }} />
          <span className="truncate">{text}</span>
        </div>
      ))}
    </div>
  );
}

function CustomerReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/reviews/product/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  if (loading) return <div className="py-10 text-center text-stone-400">Loading reviews...</div>;

  return (
    <div className="mt-12 sm:mt-16 pt-10 border-t" style={{ borderColor: BRAND.softBorder }}>
      <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Customer Reviews</h2>
      
      {reviews.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-8 text-center border border-stone-100 transition-all hover:shadow-sm">
          <Star size={32} className="mx-auto mb-3 text-stone-300" />
          <p className="text-stone-800 font-semibold text-lg">No reviews yet</p>
          <p className="text-stone-500 text-sm mt-1">Buy this product to be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: BRAND.softBorder }}>
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 bg-stone-100 flex items-center justify-center text-stone-500 font-bold shadow-inner">
                    {r.user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-stone-900 truncate max-w-[120px] sm:max-w-[200px]">{r.user?.username || "Unknown User"}</p>
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        <BadgeCheck size={11} className="text-emerald-500" /> Verified Buyer
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StarDisplay rating={r.rating} showText={false} size={12} />
                </div>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed mt-1 whitespace-pre-wrap">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const requireAuth = useRequireAuth();
  const [PRODUCT, setPRODUCT] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [qty, setQty]           = useState(1);
  const [cartAdded, setCartAdded]   = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isWishlisted = PRODUCT ? isInWishlist(PRODUCT._id) : false;

  useEffect(() => {
    const controller = new AbortController();
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:3000/api/products/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        
        setPRODUCT({
          _id: data._id,
          title: data.title,
          brand: data.brand || "Hope For Paws",
          sku: data.sku || "N/A",
          price:
            data.price - (data.price * (data.discountPercentage || 0)) / 100,

          originalPrice:
            (data.discountPercentage || 0) > 0 ? data.price : null,

          discount:
            data.discountPercentage || 0,
          stock: data.countInStock || 0,
          rating: data.averageRating || 0,
          reviewCount: data.numReviews || 0,
          weight: data.weight || "N/A",
          images: data.images?.length > 0 ? data.images.map(img => img.startsWith('http') ? img : `http://localhost:3000${img}`) : [
            "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80"
          ],
          seller: {
  name: data.sellerId?.storeName || data.sellerId?.name || "Hope For Paws Seller",
  rating: 4.9,
  totalSales: "1.2k",
  verified: data.sellerId?.isVerified || false,
  userId: data.sellerId?.userId || data.sellerId?._id || null,
},
          tags: [data.category, "Premium"],
          description: data.description || "No description provided.",
          ingredients: data.ingredients || "Not specified.",
          usage: data.usageInstructions || "Not specified.",
          delivery: [
            { icon: Truck,    label: "Free delivery",     detail: "On orders over Rs. 2,000 — arrives in 2–4 business days." },
            { icon: Package,  label: "Secure packaging",  detail: "Tamper-proof, moisture-sealed bag inside a branded outer box." },
            { icon: RotateCcw,label: "Easy returns",      detail: "7-day return window on unopened items in original condition." },
            { icon: Clock,    label: "Same-day dispatch", detail: "Order before 2 PM (Mon–Sat) for same-day processing." },
          ],
        });
        setIsLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setIsLoading(false);
      }
    };
    fetchProduct();
    return () => controller.abort();
  }, [id]);

  const handleAddToCart = async () => {
    if (addingToCart || PRODUCT.stock <= 0) return;
    if (!requireAuth('add items to your cart')) return;
    setAddingToCart(true);
    const result = await addToCart(PRODUCT._id, qty);
    setAddingToCart(false);
    if (result.success) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2200);
    } else if (!result.message?.includes('sign in')) {
      alert(result.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (addingToCart || PRODUCT.stock <= 0) return;
    if (!requireAuth('purchase products')) return;
    setAddingToCart(true);
    const result = await addToCart(PRODUCT._id, qty);
    setAddingToCart(false);
    if (result.success) {
      navigate('/checkout');
    } else if (!result.message?.includes('sign in')) {
      alert(result.message || 'Failed to add to cart');
    }
  };

  function ImageGallery({ images }) {
    const [active, setActive] = useState(0);
    const [imgErrors, setImgErrors] = useState({});
    const fallbackSrc = "https://placehold.co/400x400/EDE8DF/9B6B45?text=🐾";

    const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
    const next = () => setActive((a) => (a + 1) % images.length);

    const handleImgError = (idx) => setImgErrors((prev) => ({ ...prev, [idx]: true }));

    return (
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">

        {/* Thumbnail strip — horizontal on mobile, vertical on sm+ */}
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 sm:w-[68px] overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className="rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0"
              style={{
                width: 60,
                height: 60,
                minWidth: 60,
                borderColor: i === active ? BRAND.dark : BRAND.softBorder,
                boxShadow: i === active ? `0 0 0 2px ${BRAND.dark}22` : "none",
              }}
            >
              <img 
                src={imgErrors[i] ? fallbackSrc : src} 
                alt="" 
                onError={() => handleImgError(i)}
                className="w-full h-full object-cover" 
              />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="relative flex-1 rounded-2xl overflow-hidden bg-stone-100"
          style={{ aspectRatio: "1 / 1", minHeight: 280 }}>
          <img
            key={active}
            src={imgErrors[active] ? fallbackSrc : images[active]}
            alt={PRODUCT.title}
            onError={() => handleImgError(active)}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Arrows */}
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors duration-150"
          >
            <ChevronLeft size={16} className="text-stone-700" />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors duration-150"
          >
            <ChevronRight size={16} className="text-stone-700" />
          </button>

          {/* Discount badge */}
          {PRODUCT.discount > 0 && (
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white tracking-wide"
              style={{ backgroundColor: BRAND.dark }}
            >
              {PRODUCT.discount}% OFF
            </div>
          )}

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to image ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === active ? 18 : 7,
                  height: 7,
                  backgroundColor: i === active ? BRAND.dark : "#d6c9b8",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function DetailTabs() {
    const [active, setActive] = useState(0);
    const TABS = ["Description", "Specifications", "Delivery"];

    const panels = [
      /* Description */
      <div key="desc">
        {PRODUCT?.description?.split("\n\n").map((p, i) => (
          <p key={i} className="text-sm sm:text-base text-stone-600 leading-relaxed mb-4 last:mb-0">{p}</p>
        ))}
        {PRODUCT?.tags && PRODUCT.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {PRODUCT.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{ borderColor: BRAND.softBorder, color: BRAND.mid, backgroundColor: BRAND.light }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>,

      /* Specifications */
      <div key="specs">
        {PRODUCT?.additionalInfo && PRODUCT.additionalInfo.length > 0 ? (
          <dl className="space-y-0">
            {PRODUCT.additionalInfo.map((item, index) => (
              <div 
                key={index} 
                className={`py-3 flex flex-col sm:flex-row gap-1 sm:gap-4 ${index !== PRODUCT.additionalInfo.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <dt className="text-sm font-medium text-gray-700 w-full sm:w-1/3 flex-shrink-0">{item.heading}</dt>
                <dd className="text-sm text-gray-600 w-full sm:w-2/3">{item.description}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="py-6 text-center text-sm text-gray-500 italic">
            No additional specifications provided.
          </div>
        )}
      </div>,

      /* Delivery */
      <div key="delivery" className="space-y-4">
        {PRODUCT.delivery.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-3 sm:gap-4">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: BRAND.light }}
            >
              <Icon size={17} style={{ color: BRAND.dark }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">{label}</p>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>,
    ];

    return (
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: BRAND.softBorder }}>
        {/* Tab bar — scrollable on very small screens */}
        <div
          className="relative flex border-b overflow-x-auto"
          style={{ borderColor: BRAND.softBorder }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              className="flex-1 min-w-[80px] py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors duration-150 focus:outline-none relative whitespace-nowrap px-2"
              style={{ color: active === i ? BRAND.dark : "#9c8474" }}
            >
              {tab}
              {active === i && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: BRAND.dark }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="p-5 sm:p-6 lg:p-8">{panels[active]}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#e8ddd0] opacity-30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#8B5A2B] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[#8B5A2B] font-semibold text-sm tracking-widest uppercase animate-pulse">
          Loading Details...
        </p>
      </div>
    );
  }

  if (!PRODUCT) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-stone-800">Product Not Found</h2>
        <p className="text-stone-500 max-w-sm">The product you are looking for might have been removed or is temporarily unavailable.</p>
        <Link to="/marketplace" className="mt-4 px-6 py-2.5 bg-[#8B5A2B] text-white font-semibold rounded-xl hover:bg-[#6F4C3E] transition-colors shadow-sm">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">

      {/* Warm gradient wash — only behind the hero section */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 480,
          background: `linear-gradient(180deg, ${BRAND.light} 0%, #ffffff 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        
        {/* ── BACK BUTTON ── */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors duration-200"
          >
            <ChevronLeft size={16} />
            Back to Marketplace
          </Link>
        </div>

        {/* ── TOP GRID: gallery left, info right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* LEFT — Gallery (sticky on desktop) */}
          <div className="lg:sticky lg:top-8">
            <ImageGallery images={PRODUCT.images} />
          </div>

          {/* RIGHT — Product Info + Buy Box */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Brand + Share */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>
                {PRODUCT.brand}
              </span>
              <button
                aria-label="Share product"
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors duration-150"
              >
                <Share2 size={14} />
                Share
              </button>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 leading-snug tracking-tight">
              {PRODUCT.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 mb-2">
              <StarDisplay rating={PRODUCT.rating} numReviews={PRODUCT.reviewCount} size={15} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: BRAND.dark }}>
                {fmt(PRODUCT.price)}
              </span>
              {PRODUCT.originalPrice && (
                <span className="text-base sm:text-lg text-stone-400 line-through font-medium">
                  {fmt(PRODUCT.originalPrice)}
                </span>
              )}
              {PRODUCT.discount > 0 && (
                <span
                  className="text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${BRAND.dark}18`, color: BRAND.dark }}
                >
                  Save {fmt(PRODUCT.originalPrice - PRODUCT.price)}
                </span>
              )}
            </div>

            {/* Stock + SKU */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <StockBadge stock={PRODUCT.stock} />
              <span className="text-xs text-stone-400">SKU: {PRODUCT.sku} · {PRODUCT.weight}</span>
            </div>

            {/* ── BUY BOX ── */}
            <div
              className="rounded-2xl p-4 sm:p-5 border space-y-4"
              style={{ backgroundColor: "#fdfaf6", borderColor: BRAND.softBorder }}
            >
              {/* Qty row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-600">Quantity</span>
                <QuantitySelector qty={qty} onChange={setQty} max={PRODUCT.stock} />
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm border-t pt-3" style={{ borderColor: BRAND.softBorder }}>
                <span className="text-stone-500">Subtotal</span>
                <span className="font-bold text-stone-900">{fmt(PRODUCT.price * qty)}</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={PRODUCT.stock <= 0}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: PRODUCT.stock <= 0 ? "#a8a29e" : (cartAdded ? "#4e8a5a" : BRAND.dark),
                    boxShadow: PRODUCT.stock <= 0 ? "none" : `0 4px 18px ${cartAdded ? "#4e8a5a" : BRAND.dark}40`,
                  }}
                >
                  {PRODUCT.stock <= 0 ? (
                    "Out of Stock"
                  ) : cartAdded ? (
                    <><CheckCircle2 size={17} />Added to Cart</>
                  ) : (
                    <><ShoppingCart size={17} />Add to Cart</>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={PRODUCT.stock <= 0}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: PRODUCT.stock <= 0 ? "#d6d3d1" : BRAND.dark, color: PRODUCT.stock <= 0 ? "#78716c" : BRAND.dark, backgroundColor: "transparent" }}
                  onMouseEnter={(e) => { if (PRODUCT.stock > 0) e.currentTarget.style.backgroundColor = BRAND.light; }}
                  onMouseLeave={(e) => { if (PRODUCT.stock > 0) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Zap size={17} />
                  Buy Now
                </button>
              </div>

              {/* Wishlist */}
              <button
                onClick={() => { if (requireAuth('use the wishlist')) toggleWishlist(PRODUCT._id); }}
                aria-pressed={isWishlisted}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ color: isWishlisted ? "#e24c4c" : "#9c8474" }}
              >
                <Heart size={16} fill={isWishlisted ? "#e24c4c" : "none"} className="transition-all duration-200" />
                {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Trust strip */}
            <TrustStrip />

           {/* Seller card */}
<SellerCard seller={PRODUCT.seller} navigate={navigate} />

          </div>
        </div>

        {/* ── DETAIL TABS ── */}
        <div className="mt-10 sm:mt-14">
          <DetailTabs />
        </div>

        {/* ── CUSTOMER REVIEWS ── */}
        <CustomerReviews productId={PRODUCT._id} />

        {/* Report listing */}
        {user && (
          <div className="mt-8 flex justify-center pb-4">
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors duration-150 group"
            >
              <Flag size={12} className="group-hover:text-red-400 transition-colors duration-150" />
              Report this listing
            </button>
          </div>
        )}

      </div>

      {/* Report Modal */}
      {PRODUCT && (
        <ReportModal 
          productId={PRODUCT._id} 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
        />
      )}
    </div>
  );
}
