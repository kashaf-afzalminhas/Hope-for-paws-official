import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { Store, Star, ShoppingCart, Heart as HeartIcon, Package, Plus, Check, Loader2 } from 'lucide-react';
import VerifiedBadge from '../Components/VerifiedBadge';
import StarDisplay from '../Components/StarDisplay';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { FaSearch, FaFilter } from 'react-icons/fa';
// import { FaUserCircle, FaChevronLeft, FaMapMarkerAlt, FaHeart, FaComment } from 'react-icons/fa';
import { FaChevronLeft, FaMapMarkerAlt, FaHeart, FaComment, FaUser, FaCalendarAlt, FaPaw, FaNewspaper } from 'react-icons/fa';
import { getUserPublicProfile, getUserAdoptionAds, getUserPosts, getConversationBetweenUsers } from './api';
import { AUTH_BASE_URL } from '../config';
import { MessageSquare, User } from 'lucide-react';
import { useRequireAuth } from '../Components/AuthGuard.jsx';
import AdoptionCard from '../Components/adoption/AdoptionCard.jsx';
import { adoptionGridClass } from '../Components/adoption/adoptionTheme.js';


const C = {
  tan: "#C8965A", tanDeep: "#A97540", tanLight: "#DDB07A", tanPale: "#F5E8D5",
  cream: "#F5F0E8", creamDark: "#EDE8DF", creamMid: "#E5DDD3",
  brown: "#7B4F2E", brownMid: "#9B6B45", brownSoft: "#B8845A", brownGhost: "rgba(123,79,46,0.06)",
  white: "#FFFFFF", border: "#DDD0C0", borderSoft: "#EAE2D8",
  shadow: "rgba(123,79,46,0.10)", shadowMd: "rgba(123,79,46,0.16)",
};

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://api.hopeforpaws.club";

function Shimmer({ h = 16, r = 8, w = "100%" }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg, ${C.creamDark} 0%, ${C.creamMid} 50%, ${C.creamDark} 100%)`,
      backgroundSize: "600px 100%",
      animation: "shimmer 1.6s infinite linear",
    }} />
  );
}

function ProductCard({ p, isFav, onFav, inCart, onCart }) {
  const [imgOk, setImgOk] = React.useState(false);
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;

  return (
    <Link to={`/product/${p.id}`} className="card"
      style={{
        backgroundColor: C.white, borderRadius: 18, overflow: "hidden",
        border: `1px solid ${C.borderSoft}`, display: "flex", flexDirection: "column",
        cursor: "pointer", position: "relative", textDecoration: "none",
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.2s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px) scale(1.015)"; e.currentTarget.style.boxShadow = `0 24px 56px ${C.shadowMd}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ position: "relative", height: 210, backgroundColor: C.creamDark, overflow: "hidden", flexShrink: 0 }}>
        {!imgOk && <div style={{ position: "absolute", inset: 0 }}><Shimmer h="100%" r={0} /></div>}
        <img src={p.image} alt={p.name} onLoad={() => setImgOk(true)}
          onError={e => { setImgOk(true); e.target.src = `https://placehold.co/400x210/EDE8DF/9B6B45?text=🐾`; }}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: imgOk ? "block" : "none",
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)"
          }}
        />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 5, pointerEvents: "none" }}>
          {discount && <span style={{ padding: "2px 8px", borderRadius: 999, backgroundColor: C.tanPale, color: C.tanDeep, fontSize: 9, fontWeight: 800, border: `1px solid ${C.tan}40` }}>-{discount}%</span>}
        </div>
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(p.id); }}
          style={{
            position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%",
            backgroundColor: isFav ? C.brown : "rgba(255,255,255,0.93)", border: `1.5px solid ${isFav ? C.brown : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.22s",
            boxShadow: `0 2px 8px ${C.shadow}`
          }}>
          <HeartIcon size={13} style={{ color: isFav ? C.white : C.brownSoft, fill: isFav ? C.white : "none" }} />
        </button>
      </div>

      <div style={{ padding: "13px 14px 15px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <p style={{ fontSize: 9, color: C.brownSoft, margin: 0, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
          {p.brand}
        </p>
        <p style={{ fontSize: 13, color: C.brown, margin: 0, fontWeight: 600, lineHeight: 1.35 }}>{p.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <StarDisplay rating={p.rating} numReviews={p.reviews} size={10} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 }}>
          <div>
            <p style={{ fontSize: 19, fontWeight: 800, color: C.brown, margin: 0, lineHeight: 1 }}>Rs {p.price}</p>
            {p.originalPrice && <p style={{ fontSize: 10, color: C.brownSoft, textDecoration: "line-through", margin: 0 }}>Rs {p.originalPrice}</p>}
          </div>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); onCart(p.id); }}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 999,
              backgroundColor: inCart ? C.creamDark : C.brown, color: inCart ? C.brownMid : C.white,
              border: `1.5px solid ${inCart ? C.border : C.brown}`, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.22s"
            }}>
            {inCart ? <><Check size={11} /> Added</> : <><Plus size={11} /> Cart</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requireAuth = useRequireAuth();

  const location = useLocation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'ads');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const [adoptionAds, setAdoptionAds] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [imageFailed, setImageFailed] = useState(false);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (userId) {
      fetchPublicProfile(userId);
      fetchUserAdoptionAds(userId);
      fetchUserPosts(userId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      try {
        const response = await getConversationBetweenUsers(currentUserId, currentUserId);
        if (Array.isArray(response?.data?.data)) {
          setConversations(response.data.data);
        }
      } catch (error) {
        // Ignore for now
      }
    };
    fetchConversations();
  }, [currentUserId]);

  // Reset image error when user/profile image changes
  useEffect(() => {
    setImageFailed(false);
  }, [userId, profile?.profileImage]);

  const fetchPublicProfile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserPublicProfile(id);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load profile');
      }

      const profileData = {
        ...response.data.data,
        username: response.data.data.username || 'Unknown User',
        about: response.data.data.about || '',
        city: response.data.data.city || '',
        profileImage: response.data.data.profileImage || '',
        lastActive: response.data.data.lastActive || null
      };


      setProfile(profileData);

      if (profileData.sellerId) {
        fetchUserProducts(profileData.sellerId);
      }

    } catch (err) {
      console.error('Failed to fetch public profile:', err);
      setError('Failed to load profile. This user may not exist or the profile is private.');
    } finally {
      setLoading(false);
    }
  };


  const fetchUserProducts = async (sellerId) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE}/api/products?sellerId=${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const mapped = data.map(p => {
        let imageUrl = "https://placehold.co/400x210/EDE8DF/9B6B45?text=🐾";
        if (p.images && p.images.length > 0) {
          imageUrl = p.images[0].startsWith("http") ? p.images[0] : `${API_BASE}${p.images[0]}`;
        }
        return {
          ...p,
          id: p._id,
          name: p.title,
          image: imageUrl,
          seller: p.sellerId?.storeName || "Store",
          sellerVerified: p.sellerId?.isVerified || false,
          price: p.price - (p.price * (p.discountPercentage || 0)) / 100,
          originalPrice: (p.discountPercentage || 0) > 0 ? p.price : null,
          rating: p.averageRating || 0,
          reviews: p.numReviews || 0,
          category: p.category || 'Other'
        };
      });
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchUserAdoptionAds = async (id) => {
    setLoadingAds(true);
    try {
      const response = await getUserAdoptionAds(id);
      setAdoptionAds(response.data || []);
    } catch (err) {
      setAdoptionAds([]);
    } finally {
      setLoadingAds(false);
    }
  };

  const fetchUserPosts = async (id) => {
    setLoadingPosts(true);
    try {
      const response = await getUserPosts(id);
      setUserPosts(response.data || []);
    } catch (err) {
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleStartConversation = async (profileUserId, profileUserUsername) => {
    if (!requireAuth('start a conversation')) return;

    try {
      const existingConv = conversations.find(conv =>
        conv.participants.includes(currentUserId) &&
        conv.participants.includes(profileUserId)
      );

      if (existingConv) {
        navigate(`/chat/${profileUserId}`);
        return;
      }

      const response = await getConversationBetweenUsers(currentUserId, profileUserId);
      if (response.data) {
        navigate(`/chat/${profileUserId}`);
      } else {
        navigate(`/chat/${profileUserId}`);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
      navigate(`/chat/${profileUserId}`);
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F4ED]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#6b493d]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#6b493d]/20">
            <User className="h-12 w-12 text-[#6b493d]" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-[#6b493d]">Profile Not Found</h2>
          <p className="text-gray-600">{error || 'Could not load profile data'}</p>
          <NavLink
            to="/"
            className="mt-4 inline-block bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Go Home
          </NavLink>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f8f4ea] pb-6">
      {/* Sticky Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-[#e5d9c8]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center p-2 rounded-xl hover:bg-[#f0e6d8] transition-colors"
          >
            <FaChevronLeft className="text-[#6b493d]" />
          </button>
          <h1 className="text-xl font-heading font-semibold text-[#2c1810] ml-2">Profile</h1>
          <div className="flex-1"></div>
          {currentUser && profile._id !== currentUserId && (
            <button
              onClick={() => handleStartConversation(profile._id, profile.username)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#a07855] text-[#ffd8b8] rounded-xl hover:bg-[#8a6a4d] transition-all shadow-md hover:shadow-lg"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Message</span>
            </button>
          )}
        </div>
      </header>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col items-center text-center mb-6 bg-white rounded-2xl p-6 shadow-sm border border-[#e5d9c8]">
          <div className="relative mb-5">
            {profile.profileImage && !imageFailed ? (
              <img
                src={
                  profile.profileImage.startsWith('http')
                    ? profile.profileImage
                    : `${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage.startsWith('/') ? '' : '/'}${profile.profileImage}`
                }
                alt={profile.username}
                className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="w-28 h-28 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#a07855] to-[#6b493d] shadow-lg">
                <span className="text-4xl font-bold text-[#ffd8b8]">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md">
          <div className="bg-green-500 rounded-full w-3.5 h-3.5"></div>
        </div> */}
          </div>

          <div className="mb-4">
            <div className="flex flex-row items-center justify-center">
              <h1 className="text-2xl font-heading font-bold text-[#2c1810]">
                {profile.username}
              </h1>
              {profile.sellerId && (
                profile.sellerVerified ? (
                  <VerifiedBadge isVerified={true} size="lg" className="ml-2" />
                ) : (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 text-gray-500 bg-gray-50 flex items-center">
                    Unverified
                  </span>
                )
              )}
            </div>
            {profile.city && (
              <div className="flex items-center justify-center text-[#2c1810]/80 mt-2">
                <FaMapMarkerAlt className="mr-1.5 text-[#a07855]" />
                <span>{profile.city}</span>
              </div>
            )}
          </div>

          <div className="text-lg font-bold text-[#a07855] mb-3">{adoptionAds.length} Adoption Ads</div>

          <div className="text-[#2c1810]/80 bg-[#f8f4ea] rounded-xl py-3 px-5 max-w-md text-center font-body">
            {profile.about || "This user hasn't written a bio yet."}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm text-[#2c1810]/70">
            {profile.joinedDate && (
              <div className="flex items-center bg-[#f5efe6] py-1.5 px-3 rounded-lg">
                <FaCalendarAlt className="mr-1.5 text-[#a07855]" />
                <span>Joined {formatJoinedDate(profile.joinedDate)}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-14 z-10 bg-white pt-3 pb-2 border-b border-[#e5d9c8] shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around">
            {profile?.sellerId && (
              <button
                className={`px-4 py-3 font-medium relative transition-colors ${activeTab === 'products' ? 'text-[#a07855] font-semibold' : 'text-[#2c1810]/60 hover:text-[#2c1810]'}`}
                onClick={() => setActiveTab('products')}
              >
                Products
                {activeTab === 'products' && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#a07855] rounded-full"></span>
                )}
              </button>
            )}
            <button
              className={`px-4 py-3 font-medium relative transition-colors ${activeTab === 'ads' ? 'text-[#a07855] font-semibold' : 'text-[#2c1810]/60 hover:text-[#2c1810]'}`}
              onClick={() => setActiveTab('ads')}
            >
              Adoption Ads
              {activeTab === 'ads' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#a07855] rounded-full"></span>
              )}
            </button>
            <button
              className={`px-4 py-3 font-medium relative transition-colors ${activeTab === 'posts' ? 'text-[#a07855] font-semibold' : 'text-[#2c1810]/60 hover:text-[#2c1810]'}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts
              {activeTab === 'posts' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#a07855] rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 pt-5">

        {/* Products */}
        {activeTab === 'products' && (
          loadingProducts ? (
            <div className="flex flex-col items-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
              </div>
              <p className="text-[#2c1810]/80">Loading products...</p>
            </div>
          ) : (
            <div className="pb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a07855]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#e5d9c8] rounded-xl focus:outline-none focus:border-[#a07855] focus:ring-1 focus:ring-[#a07855] transition-all"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a07855]" />
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#e5d9c8] rounded-xl focus:outline-none focus:border-[#a07855] appearance-none"
                  >
                    <option value="All">All Categories</option>
                    {Array.from(new Set(products.map(p => p.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="relative w-full sm:w-48">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#e5d9c8] rounded-xl focus:outline-none focus:border-[#a07855] appearance-none text-[#2c1810]"
                  >
                    <option value="popular">Sort: Popular</option>
                    <option value="new">New Arrivals</option>
                    <option value="rating">Highest Rated</option>
                    <option value="priceAsc">Price: Low → High</option>
                    <option value="priceDesc">Price: High → Low</option>
                  </select>
                </div>
              </div>

              {products.filter(p =>
                (categoryFilter === 'All' || p.category === categoryFilter) &&
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#e5d9c8]">
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-[#f5efe6] mb-5">
                    <Package className="h-10 w-10 text-[#a07855]" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-[#2c1810] mb-2">No Products Found</h3>
                  <p className="text-[#2c1810]/80">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                  {products
                    .filter(p =>
                      (categoryFilter === 'All' || p.category === categoryFilter) &&
                      p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (sortBy === 'priceAsc') return a.price - b.price;
                      if (sortBy === 'priceDesc') return b.price - a.price;
                      if (sortBy === 'rating') return b.rating - a.rating;
                      if (sortBy === 'new') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                      return (b.reviews || 0) - (a.reviews || 0);
                    })
                    .map(p => (
                      <ProductCard
                        key={p.id}
                        p={p}
                        isFav={isInWishlist(p.id)}
                        onFav={async () => {
                          if (requireAuth('use wishlist')) {
                            await toggleWishlist(p.id);
                          }
                        }}
                        inCart={isInCart(p.id)}
                        onCart={async () => {
                          if (requireAuth('add to cart')) {
                            await addToCart(p.id, 1);
                          }
                        }}
                      />
                    ))
                  }
                </div>
              )}
            </div>
          )
        )}

        {/* Adoption Ads */}

        {activeTab === 'ads' && (
          loadingAds ? (
            <div className="flex flex-col items-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
                </div>
              </div>
              <p className="text-[#2c1810]/80">Loading adoption ads...</p>
            </div>
          ) : adoptionAds.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center shadow-inner mb-5">
                <FaPaw className="h-12 w-12 text-[#a07855]" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-[#2c1810] mb-2">No Adoption Ads</h3>
              <p className="text-[#2c1810]/80 max-w-md mx-auto">
                {profile.username} hasn't posted any pets for adoption yet
              </p>
            </div>
          ) : (
            <div className={`${adoptionGridClass} pb-8`}>
              {adoptionAds.map((ad) => (
                <AdoptionCard key={ad._id} post={ad} descriptionLines={2} poster={{ show: false }} />
              ))}
            </div>
          )
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          loadingPosts ? (
            <div className="flex flex-col items-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
                </div>
              </div>
              <p className="text-[#2c1810]/80">Loading posts...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center shadow-inner mb-5">
                <FaNewspaper className="h-12 w-12 text-[#a07855]" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-[#2c1810] mb-2">No Posts Yet</h3>
              <p className="text-[#2c1810]/80 max-w-md mx-auto">
                {profile.username} hasn't shared any posts yet
              </p>
            </div>
          ) : (
            <div className="space-y-5 pb-8">
              {userPosts.map(post => (
                <div
                  key={post._id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-[#e5d9c8]"
                >
                  {post.imageUrl && (
                    <div className="w-full h-64 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-heading font-bold text-[#2c1810]">
                        {post.caption || 'Pet Story'}
                      </h3>
                      <span className="text-sm text-[#2c1810]/70">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <p className="text-[#2c1810]/80 mb-5 font-body">{post.text}</p>

                    <div className="flex items-center justify-between border-t border-[#e5d9c8] pt-4">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center text-sm text-[#2c1810]/80 hover:text-[#a07855]">
                          <FaHeart className="mr-1.5" />
                          {post.likes?.length || 0}
                        </button>
                        <button className="flex items-center text-sm text-[#2c1810]/80 hover:text-[#a07855]">
                          <FaComment className="mr-1.5" />
                          {post.comments?.length || 0}
                        </button>
                      </div>
                      {/* <button className="text-sm text-[#a07855] font-medium hover:text-[#8a6a4d]">
                    Read more
                  </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
export default PublicProfilePage;
