import React, { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { HeartCrack, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StarDisplay from '../components/StarDisplay';
import VerifiedBadge from '../components/VerifiedBadge';
import { API_BASE_URL } from '../config';

const C = {
  brown: "#6b493d",
  brownSoft: "#a07855",
  brownMid: "#856046",
  tan: "#c9a280",
  tanPale: "#e8d5c0",
  cream: "#F8F4ED",
  creamDark: "#F0EAE1",
  white: "#FFFFFF",
  border: "#E2D8CC",
  borderSoft: "#EAE2D8",
  red: "#e24c4c",
  text: "#332218",
  shadow: "rgba(107, 73, 61, 0.08)",
};

const WishlistItemCard = ({ p, onRemove, onCart, inCart }) => {
  const [imgOk, setImgOk] = useState(false);
  const discount = p.discountPercentage || null;

  const currentPrice =
    p.price - (p.price * (p.discountPercentage || 0)) / 100;

  const originalPrice =
    (p.discountPercentage || 0) > 0 ? p.price : null;

  // Normalizing image path — strip "/api" from API_BASE_URL for static file serving
  const STATIC_BASE = API_BASE_URL.replace(/\/api\/?$/, '');
  const FALLBACK_IMG = "https://placehold.co/400x400/EDE8DF/9B6B45?text=🐾";
  let imageUrl = FALLBACK_IMG;
  if (p.images && p.images.length > 0 && p.images[0]) {
    imageUrl = p.images[0].startsWith("http") ? p.images[0] : `${STATIC_BASE}${p.images[0]}`;
  }

  const sellerName = p.sellerId?.storeName || p.sellerId?.name || "Hope For Paws Seller";
  const isVerified = p.sellerId?.isVerified || false;

  return (
    <Link to={`/product/${p._id}`} className="group relative bg-white rounded-2xl overflow-hidden border border-[#EAE2D8] flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ textDecoration: 'none' }}>

      <div className="relative h-48 bg-[#F0EAE1] overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={p.title}
          onLoad={() => setImgOk(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgOk ? 'block' : 'hidden'}`}
          onError={e => { setImgOk(true); e.target.src = `https://placehold.co/400x400/EDE8DF/9B6B45?text=🐾`; }}
        />
        {!imgOk && <div className="absolute inset-0 animate-pulse bg-[#E2D8CC]"></div>}

        {discount && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[#B03A2E] text-white text-[10px] font-bold z-10 shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Remove Button Overlay */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(p._id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#e24c4c] shadow-md transition-transform hover:scale-110 border border-[#E2D8CC] z-10"
          title="Remove from Wishlist"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-[#a07855] mb-1 font-bold tracking-wider uppercase flex items-center gap-1">
          {p.category || "General"}
          {isVerified && <VerifiedBadge isVerified={true} size="sm" />}
        </p>

        <h3 className="text-[15px] text-[#6b493d] mb-1.5 font-semibold leading-tight line-clamp-2 min-h-[40px]">
          {p.title}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <StarDisplay rating={p.averageRating || 0} numReviews={p.numReviews || 0} size={12} />
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-lg font-extrabold text-[#6b493d] leading-none mb-1">
              Rs {currentPrice}
            </p>
            {originalPrice && (
              <p className="text-[11px] text-[#a07855] line-through m-0">
                Rs {originalPrice}
              </p>
            )}
          </div>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCart(p._id); }}
            disabled={inCart || p.countInStock === 0}
            className={`h-9 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 border-1.5 ${inCart
                ? 'bg-[#F0EAE1] text-[#856046] border-[#E2D8CC]'
                : p.countInStock === 0
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-[#6b493d] text-white border-[#6b493d] hover:bg-[#856046]'
              }`}
          >
            {inCart ? (
              <>Added</>
            ) : p.countInStock === 0 ? (
              <>Out of Stock</>
            ) : (
              <><ShoppingCart size={14} /> Add</>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function Wishlist() {
  const { wishlist, isLoading, toggleWishlist, markAsViewed } = useWishlist();

  useEffect(() => {
    markAsViewed();
  }, [markAsViewed]);
  
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();

  // Filter out any IDs that haven't been hydrated into objects yet
  const populatedWishlist = wishlist.filter(item => typeof item === 'object' && item !== null);

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (!result.success && result.message?.includes('sign in')) {
      navigate('/signin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#F8F4ED] flex flex-col items-center justify-center p-6">
        <HeartCrack size={40} className="text-[#c9a280] animate-pulse mb-4" />
        <h2 className="text-2xl font-bold text-[#6b493d]">Loading your wishlist...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] pb-24">
      {/* Header Banner */}
      <div className="bg-[#6b493d] text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 150%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% -50%, #c9a280 0%, transparent 50%)` }}></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Wishlist
            </h1>
            <p className="text-[#e8d5c0] text-sm md:text-base font-medium">
              Curated items you love. {populatedWishlist.length > 0 ? `You have ${populatedWishlist.length} saved product${populatedWishlist.length === 1 ? '' : 's'}.` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {populatedWishlist.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-[#EAE2D8] shadow-sm">
            <div className="w-24 h-24 bg-[#F8F4ED] rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md">
              <HeartCrack size={40} className="text-[#a07855]" />
            </div>
            <h2 className="text-2xl font-bold text-[#6b493d] mb-3">Your wishlist is empty</h2>
            <p className="text-[#a07855] max-w-md mb-8">
              Looks like you haven't saved any items yet. Explore our marketplace to find perfect products for your furry friends.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6b493d] text-white font-bold rounded-xl hover:bg-[#856046] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Explore Marketplace <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* WISHLIST GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {populatedWishlist.map((product) => (
              <WishlistItemCard
                key={product._id}
                p={product}
                onRemove={toggleWishlist}
                onCart={handleAddToCart}
                inCart={isInCart(product._id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
