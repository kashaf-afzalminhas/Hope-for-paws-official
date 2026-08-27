import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  Search, Heart, ShoppingCart, Star, X, ChevronDown, Check, Plus,
  Flame, Sparkles, LayoutGrid, List, SlidersHorizontal,
  Eye, Minus, ChevronUp, Shield,
  Award,
} from "lucide-react";
import { PRODUCT_CATEGORIES } from "../utils/constants";
import VerifiedBadge from "../Components/VerifiedBadge";
import StarDisplay from "../Components/StarDisplay";
import { useWishlist } from "../context/WishlistContext";
import { useRequireAuth } from "../Components/AuthGuard";

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=Poppins:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #C8965A55; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #C8965A; }
  .hide-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .hide-scroll::-webkit-scrollbar { display:none; }

  button, input, select { font-family: inherit; }
  a { text-decoration: none; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes slideUp  { from { transform:translateY(110%); } to { transform:translateY(0); } }
  @keyframes slideRight { from { transform:translateX(-100%); } to { transform:translateX(0); } }
  @keyframes shimmer  { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
  @keyframes popIn    { 0% { transform:scale(0.4);opacity:0; } 65% { transform:scale(1.18); } 100% { transform:scale(1);opacity:1; } }
  @keyframes heartBeat { 0%,100% { transform:scale(1); } 25% { transform:scale(1.35); } 50% { transform:scale(0.92); } 75% { transform:scale(1.15); } }
  @keyframes spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes marquee  { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes gradientX { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes floatPaw { 0% { transform:translateY(0) rotate(var(--r,0deg)); opacity:0.07; } 100% { transform:translateY(-18px) rotate(calc(var(--r,0deg) + 15deg)); opacity:0.04; } }

  .card {
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.3s cubic-bezier(0.22,1,0.36,1),
                border-color 0.2s ease;
  }
  .card:hover {
    transform: translateY(-6px) scale(1.015);
    box-shadow: 0 24px 56px rgba(123,79,46,0.18);
    border-color: #C8965A66 !important;
  }
  .card:hover .card-img { transform: scale(1.08); }
  .card-img { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }

  .btn-press { transition: transform 0.14s ease, box-shadow 0.14s ease; }
  .btn-press:active { transform: scale(0.94) !important; }

  .heart-anim { animation: heartBeat 0.45s ease; }
  .pop-anim   { animation: popIn    0.35s cubic-bezier(0.22,1,0.36,1); }

  .smooth { transition: all 0.22s ease; }
  .smooth-slow { transition: all 0.38s cubic-bezier(0.22,1,0.36,1); }

  input[type=range] { -webkit-appearance:none; width:100%; height:4px; background:transparent; cursor:pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#7B4F2E; border:2.5px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.2); margin-top:-7px; }
  input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:99px; }
  input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:#7B4F2E; border:2.5px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.2); }

  .tag-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; }
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════════════════════ */
const C = {
  tan:"#C8965A", tanDeep:"#A97540", tanLight:"#DDB07A", tanPale:"#F5E8D5", tanGlow:"rgba(200,150,90,0.15)",
  cream:"#F5F0E8", creamDark:"#EDE8DF", creamMid:"#E5DDD3",
  brown:"#7B4F2E", brownMid:"#9B6B45", brownSoft:"#B8845A", brownGhost:"rgba(123,79,46,0.06)",
  white:"#FFFFFF", border:"#DDD0C0", borderSoft:"#EAE2D8",
  shadow:"rgba(123,79,46,0.10)", shadowMd:"rgba(123,79,46,0.16)", shadowLg:"rgba(123,79,46,0.24)",
  success:"#2E7B5A", successBg:"#E8F5EE",
};

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════════ */
// Data will be fetched dynamically

const SORTS = [
  { value:"popular",   label:"Most Popular" },
  { value:"new",       label:"New Arrivals" },
  { value:"rating",    label:"Highest Rated" },
  { value:"priceAsc",  label:"Price: Low → High" },
  { value:"priceDesc", label:"Price: High → Low" },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════════════════════ */
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════════════════════════ */
function PawSVG({ size = 20, color = C.brown }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill={color} style={{ flexShrink:0 }}>
      <ellipse cx="16" cy="14" rx="7" ry="9"/>
      <ellipse cx="32" cy="9"  rx="7" ry="9"/>
      <ellipse cx="48" cy="14" rx="7" ry="9"/>
      <ellipse cx="8"  cy="30" rx="6" ry="8"/>
      <path d="M32 22 C14 22 8 38 10 50 C12 60 22 62 32 62 C42 62 52 60 54 50 C56 38 50 22 32 22Z"/>
    </svg>
  );
}

function Stars({ rating, size = 11, showVal = false }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <div style={{ display:"flex", gap:1.5 }}>
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={size}
            style={{ color: s <= Math.round(rating) ? C.tan : C.creamDark,
                     fill:  s <= Math.round(rating) ? C.tan : C.creamDark }} />
        ))}
      </div>
      {showVal && <span style={{ fontSize:size, color:C.brownMid, fontWeight:600 }}>{rating.toFixed(1)}</span>}
    </div>
  );
}

function Shimmer({ h = 16, r = 8, w = "100%" }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:r,
      background:`linear-gradient(90deg, ${C.creamDark} 0%, ${C.creamMid} 50%, ${C.creamDark} 100%)`,
      backgroundSize:"600px 100%",
      animation:"shimmer 1.6s infinite linear",
    }}/>
  );
}

function Badge({ text, color = C.tan }) {
  const bg = color === C.tan ? C.tanPale : C.brownGhost;
  const tc = color === C.tan ? C.tanDeep : C.brown;
  return (
    <span className="tag-pill" style={{ backgroundColor:bg, color:tc, border:`1px solid ${color}40` }}>
      {text}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════════════ */
function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:10, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:"flex", alignItems:"center", gap:12,
          backgroundColor:t.type==="cart" ? C.brown : C.success,
          color:"#fff", borderRadius:16, padding:"13px 18px",
          boxShadow:"0 16px 40px rgba(0,0,0,0.18)",
          animation:"slideUp 0.38s cubic-bezier(0.22,1,0.36,1) both",
          pointerEvents:"auto", minWidth:240, maxWidth:300,
        }}>
          <div style={{ width:30, height:30, borderRadius:"50%", backgroundColor:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {t.type==="cart" ? <ShoppingCart size={14}/> : <Heart size={14} fill="#fff"/>}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, fontWeight:700, margin:0 }}>{t.type==="cart" ? "Added to cart!" : "Wishlisted!"}</p>
            <p style={{ fontSize:11, opacity:0.8, margin:0, marginTop:1, lineHeight:1.3 }}>{t.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   QUICK-VIEW MODAL
═══════════════════════════════════════════════════════════════════════════════ */
function QuickView({ product: p, isFav, onFav, inCart, onCart, onClose }) {
  const [qty, setQty] = useState(1);
  const [imgOk, setImgOk] = useState(false);
  const discount = p.originalPrice ? Math.round((1 - p.price/p.originalPrice)*100) : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, backgroundColor:"rgba(30,15,5,0.55)", zIndex:500, backdropFilter:"blur(6px)", animation:"fadeIn 0.25s ease" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:501, display:"flex", alignItems:"center", justifyContent:"center", padding:16, pointerEvents:"none" }}>
        <div style={{
          backgroundColor:C.white, borderRadius:24, width:"100%", maxWidth:740,
          maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column",
          boxShadow:"0 40px 80px rgba(0,0,0,0.22)",
          animation:"scaleIn 0.32s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents:"auto", position:"relative",
        }}>
          <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
            <div style={{ width:"45%", flexShrink:0, backgroundColor:C.creamDark, position:"relative", overflow:"hidden" }}>
              {!imgOk && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", gap:12, padding:16 }}>
                  <Shimmer h="60%" r={0}/><Shimmer h="30%" r={0}/>
                </div>
              )}
              <img src={p.image} alt={p.name} onLoad={() => setImgOk(true)}
                onError={e => { setImgOk(true); e.target.src=`https://placehold.co/400x460/EDE8DF/9B6B45?text=🐾`; }}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:imgOk?"block":"none", minHeight:380 }}
              />
              <div style={{ position:"absolute", top:14, left:14, display:"flex", flexDirection:"column", gap:6 }}>
                {p.isNew    && <Badge text="New"          color={C.brown}/>}
                {discount   && <Badge text={`-${discount}%`} color={C.tan}/>}
                {p.badge    && <Badge text={p.badge}/>}
              </div>
            </div>

            <div style={{ flex:1, padding:"28px 28px 0", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:10, color:C.brownSoft, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>{p.brand}</span>
                  <span style={{ width:3, height:3, borderRadius:"50%", backgroundColor:C.border }}/>
                  <span style={{ fontSize:10, color:C.brownSoft, display:"inline-flex", alignItems:"center", gap:4 }}>{p.seller}<VerifiedBadge isVerified={p.sellerVerified} size="sm"/></span>
                </div>
                <h2 style={{ fontSize:20, fontWeight:800, color:C.brown, lineHeight:1.25, marginBottom:10 }}>{p.name}</h2>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Stars rating={p.rating} size={13} showVal/>
                  <span style={{ fontSize:12, color:C.brownSoft }}>({p.reviews.toLocaleString()} reviews)</span>
                </div>
              </div>

              <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                <span style={{ fontSize:28, fontWeight:900, color:C.brown }}>Rs {p.price}</span>
                {p.originalPrice && <span style={{ fontSize:15, color:C.brownSoft, textDecoration:"line-through" }}>Rs {p.originalPrice}</span>}
                {discount && (
                  <span style={{ padding:"3px 10px", borderRadius:999, backgroundColor:C.tanPale, color:C.tanDeep, fontSize:11, fontWeight:700 }}>
                    Save Rs {p.originalPrice - p.price}
                  </span>
                )}
              </div>

              <p style={{ fontSize:13, color:C.brownMid, lineHeight:1.7 }}>
                A premium, vet-approved {p.category.toLowerCase()} product from {p.brand}. Loved by over {Math.floor(p.reviews/10)*10}+ pet owners for its quality and durability.
              </p>

              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", border:`1.5px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1,q-1))} className="btn-press"
                    style={{ width:38, height:38, background:"none", border:"none", cursor:"pointer", color:C.brownMid, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Minus size={13}/>
                  </button>
                  <span style={{ minWidth:32, textAlign:"center", fontSize:14, fontWeight:700, color:C.brown }}>{qty}</span>
                  <button onClick={() => setQty(q => q+1)} className="btn-press"
                    style={{ width:38, height:38, background:"none", border:"none", cursor:"pointer", color:C.brownMid, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Plus size={13}/>
                  </button>
                </div>
                <button onClick={() => { if (p.stock > 0) onCart(p.id); }} className="btn-press" disabled={p.stock <= 0}
                  style={{ flex:1, height:42, borderRadius:12, backgroundColor:p.stock <= 0 ? C.border : (inCart?C.creamDark:C.brown), color:p.stock <= 0 ? C.brownSoft : (inCart?C.brown:C.white), border:`1.5px solid ${p.stock <= 0 ? C.borderSoft : (inCart?C.border:C.brown)}`, fontWeight:700, fontSize:13, cursor:p.stock <= 0 ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all 0.22s" }}>
                  {p.stock <= 0 ? "Out of Stock" : inCart ? <><Check size={14}/> In Cart</> : <><ShoppingCart size={14}/> Add to Cart — Rs {p.price * qty}</>}
                </button>
                <button onClick={() => onFav(p.id)} className="btn-press"
                  style={{ width:42, height:42, borderRadius:12, backgroundColor:isFav?C.brown:C.white, border:`1.5px solid ${isFav?C.brown:C.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.22s", flexShrink:0 }}>
                  <Heart size={16} style={{ color:isFav?C.white:C.brownSoft, fill:isFav?C.white:"none" }}/>
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, paddingBottom:24 }}>
                {[
                  { Icon:Shield, text:"Vet-approved quality" },
                  { Icon:Award,  text:"Premium certified brand" },
                ].map(({ Icon, text }) => (
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", backgroundColor:C.cream, borderRadius:10 }}>
                    <Icon size={13} style={{ color:C.tan, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:C.brownMid, fontWeight:500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-press"
            style={{ position:"absolute", top:14, right:14, width:34, height:34, borderRadius:"50%", backgroundColor:C.white, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:`0 2px 8px ${C.shadow}`, zIndex:10 }}>
            <X size={15} style={{ color:C.brownMid }}/>
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HERO BANNER
═══════════════════════════════════════════════════════════════════════════════ */
function HeroBanner({ query, setQuery, isMobile }) {
  const PAWS = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 90}%`,
    left: `${Math.random() * 95}%`,
    size: 14 + Math.random() * 18,
    delay: i * 0.6,
    duration: 7 + Math.random() * 5,
    rotate: Math.random() * 360,
  })), []);

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(145deg, #c9a280 0%, #b8916d 35%, #a07855 70%, #8a6a4d 100%)",
      padding: isMobile ? "48px 16px 50px" : "56px 24px 52px",
    }}>
      {PAWS.map(p => (
        <div key={p.id} style={{
          position: "absolute", top: p.top, left: p.left,
          opacity: 0.07, transform: `rotate(${p.rotate}deg)`,
          animation: `floatPaw ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          pointerEvents: "none",
        }}>
          <PawSVG size={p.size} color="#fff" />
        </div>
      ))}

      <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,73,61,0.25), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,150,90,0.2), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: isMobile ? 0 : 40 }}>
        {/* Left — Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
            borderRadius: 999, padding: "6px 16px", marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.2)",
            animation: "fadeUp 0.5s ease both",
          }}>
            <Sparkles size={13} style={{ color: "#F5E8D5" }} />
            <span style={{ fontSize: 11, color: "#F5E8D5", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>HopeForPaws Marketplace</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 30 : 48,
            fontWeight: 800, color: "#fff",
            lineHeight: 1.15, margin: "0 0 14px",
            letterSpacing: "-0.02em",
            animation: "fadeUp 0.6s ease 0.1s both",
          }}>
            Everything Your Pet{" "}
            <span style={{ fontStyle: "italic", color: "#F5E8D5" }}>Deserves,</span>
            <br />
            All in One Place.
          </h1>

          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? 13 : 16, color: "rgba(255,255,255,0.82)",
            lineHeight: 1.6, margin: "0 0 26px", maxWidth: 480, fontWeight: 400,
            animation: "fadeUp 0.6s ease 0.2s both",
          }}>
            Vet-approved essentials from trusted brands — food, toys, grooming & more. Because they deserve the best.
          </p>

          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            maxWidth: isMobile ? "100%" : 460,
            background: "rgba(255,255,255,0.95)", borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            overflow: "hidden",
            animation: "fadeUp 0.6s ease 0.3s both",
          }}>
            <Search size={16} style={{ marginLeft: 16, color: "#a07855", flexShrink: 0 }} />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              style={{
                flex: 1, padding: "14px 14px", border: "none", outline: "none",
                fontSize: 14, color: "#6b493d", fontFamily: "'Inter', sans-serif",
                background: "transparent",
              }}
              className="focus:outline-none focus:ring-0"
            />
            <button className="btn-press" style={{
              padding: "12px 24px", margin: 4,
              background: "#6b493d", color: "#fff", border: "none",
              borderRadius: 11, fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: "'Poppins', sans-serif",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              transition: "background 0.2s",
            }}>
              <Search size={13} /> {!isMobile && "Search"}
            </button>
          </div>
        </div>

        {/* Right — Pet Image */}
        {!isMobile && (
          <div style={{
            flexShrink: 0, width: "44%", maxWidth: 480,
            animation: "fadeUp 0.7s ease 0.25s both",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <img
              src="/hero-pets.png"
              alt="Adorable puppy and kitten"
              style={{
                width: "115%", maxHeight: 420,
                objectFit: "contain",
                filter: "drop-shadow(0 16px 36px rgba(60,30,10,0.25))",
                maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)",
                position: "relative", zIndex: 1,
                marginBottom: -20,
              }}
            />
          </div>
        )}
      </div>

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 40, display: "block" }}>
        <path d="M0,60 L0,25 Q360,0 720,25 Q1080,50 1440,25 L1440,60 Z" fill="#F5F0E8" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TOP PICKS FOR YOU
═══════════════════════════════════════════════════════════════════════════════ */
function TopPicks({ onFav, favs, onCart, isInCart, onQuickView, products = [] }) {
  const scrollRef = useRef(null);
  const picks = useMemo(() =>
    [...products].sort((a, b) => (b.pop||0) - (a.pop||0)).slice(0, 8),
  [products]);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <div style={{
      background: "linear-gradient(180deg, #F5F0E8 0%, #FBF7F1 100%)",
      padding: "40px 0 44px",
      position: "relative",
    }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 16px" }}>
        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Flame size={16} style={{ color: C.tan }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.tan, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Curated for you
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26, fontWeight: 800, color: C.brown,
              margin: 0, lineHeight: 1.2,
            }}>
              Top Picks <span style={{ color: C.tan, fontStyle: "italic" }}>for You</span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => scroll(-1)} className="btn-press" style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.brownMid }}>
              <ChevronDown size={15} style={{ transform: "rotate(90deg)" }} />
            </button>
            <button onClick={() => scroll(1)} className="btn-press" style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.brownMid }}>
              <ChevronDown size={15} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </div>
        </div>

        {/* Scroll Container */}
        <div ref={scrollRef} className="hide-scroll" style={{
          display: "flex", gap: 16, overflowX: "auto",
          padding: "4px 2px 8px",
          scrollSnapType: "x mandatory",
        }}>
          {picks.map((p, i) => {
            const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;
            const isFav = favs.has(p.id);
            const inCart = isInCart(p.id);
            return (
              <Link key={p.id} to={`/product/${p.id}`} className="card" style={{
                minWidth: 230, maxWidth: 230, flexShrink: 0,
                backgroundColor: C.white, borderRadius: 18,
                border: `1px solid ${C.borderSoft}`,
                overflow: "hidden", scrollSnapAlign: "start",
                animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                display: "flex", flexDirection: "column", textDecoration: "none",
              }}>
                <div style={{ position: "relative", height: 170, backgroundColor: C.creamDark, overflow: "hidden" }}>
                  <img src={p.image} alt={p.name} className="card-img"
                    onError={e => { e.target.src = `https://placehold.co/230x170/EDE8DF/9B6B45?text=🐾`; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {p.badge && <Badge text={p.badge} />}
                    {discount && <span className="tag-pill" style={{ backgroundColor: C.tanPale, color: C.tanDeep, border: `1px solid ${C.tan}40` }}>-{discount}%</span>}
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(p.id); }} className="btn-press" style={{
                    position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%",
                    background: isFav ? C.brown : "rgba(255,255,255,0.9)", border: `1.5px solid ${isFav ? C.brown : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <Heart size={12} style={{ color: isFav ? C.white : C.brownSoft, fill: isFav ? C.white : "none" }} />
                  </button>
                </div>
                <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <p style={{ fontSize:9, color:C.brownSoft, margin:0, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:4 }}>{p.seller}<VerifiedBadge isVerified={p.sellerVerified} size="sm"/></p>
                  <p style={{ fontSize: 13, color: C.brown, margin: 0, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Stars rating={p.rating} size={10} />
                    <span style={{ fontSize: 10, color: C.brownSoft }}>{p.rating.toFixed(1)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: C.brown }}>Rs {p.price}</span>
                      {p.originalPrice && <span style={{ fontSize: 10, color: C.brownSoft, textDecoration: "line-through", marginLeft: 6 }}>Rs {p.originalPrice}</span>}
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCart(p.id); }} className="btn-press" style={{
                      padding: "6px 12px", borderRadius: 999,
                      backgroundColor: inCart ? C.creamDark : C.brown,
                      color: inCart ? C.brownMid : C.white,
                      border: `1.5px solid ${inCart ? C.border : C.brown}`,
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
                    }}>
                      {inCart ? <><Check size={10} /> Added</> : <><Plus size={10} /> Cart</>}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
   CATEGORY PILL BAR
═══════════════════════════════════════════════════════════════════════════════ */
function CategoryBar({ active, onChange, categories = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector("[data-active='true']")?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [active]);

  return (
    <div ref={ref} className="hide-scroll"
      style={{ display:"flex", gap:7, overflowX:"auto", padding:"2px 0 4px" }}>
      {categories.map(cat => {
        const on = active === cat;
        return (
          <button key={cat} data-active={on} onClick={() => onChange(cat)} className="btn-press smooth"
            style={{
              flexShrink:0, display:"flex", alignItems:"center", gap:6,
              padding:"8px 18px", borderRadius:999,
              border:`1.5px solid ${on ? C.brown : C.border}`,
              backgroundColor: on ? C.brown : C.white,
              color: on ? C.white : C.brownMid,
              fontSize:13, fontWeight: on ? 700 : 500, cursor:"pointer",
              letterSpacing: "0.01em",
              boxShadow: on ? `0 4px 16px ${C.shadowMd}` : "none",
            }}>
            {cat}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FILTER CONTENT
═══════════════════════════════════════════════════════════════════════════════ */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:`1px solid ${C.borderSoft}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:"13px 0", color:C.brown }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:C.brownMid }}>{title}</span>
        <ChevronDown size={13} style={{ color:C.brownSoft, transform:open?"rotate(180deg)":"none", transition:"0.22s" }}/>
      </button>
      {open && <div style={{ paddingBottom:14 }}>{children}</div>}
    </div>
  );
}

function CheckRow({ checked, label, onChange }) {
  return (
    <label onClick={onChange}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 2px", cursor:"pointer" }}>
      <div className="smooth"
        style={{ width:17, height:17, borderRadius:5, flexShrink:0, border:`2px solid ${checked?C.brown:C.border}`, backgroundColor:checked?C.brown:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <Check size={10} color="#fff" strokeWidth={3}/>}
      </div>
      <span className="smooth" style={{ fontSize:13, color:checked?C.brown:C.brownMid, fontWeight:checked?600:400 }}>{label}</span>
    </label>
  );
}

function PriceSlider({ priceMax, setPriceMax, maxPrice = 200 }) {
  return (
    <div style={{ paddingTop:4 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:12, color:C.brownSoft }}>Rs 0</span>
        <span style={{ fontSize:13, fontWeight:700, color:C.brown }}>Rs {priceMax ?? maxPrice}</span>
      </div>
      <div style={{ position:"relative" }}>
        <div style={{ height:4, borderRadius:99, backgroundColor:C.creamDark, position:"relative" }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:99, backgroundColor:C.tan, width:`${((priceMax??maxPrice)/maxPrice)*100}%`, transition:"width 0.1s" }}/>
        </div>
        <input type="range" min={0} max={maxPrice} step={1}
          value={priceMax ?? maxPrice}
          onChange={e => setPriceMax(Number(e.target.value) === maxPrice ? null : Number(e.target.value))}
          style={{ position:"absolute", top:-7, left:0, width:"100%", cursor:"pointer", height:18, background:"transparent" }}
        />
      </div>
    </div>
  );
}

function FilterContent({ filters, setFilters, onDone, brands = [], sellers = [], maxPrice = 200 }) {
  const toggle = (key, val) => setFilters(f => {
    const s = new Set(f[key]); s.has(val) ? s.delete(val) : s.add(val); return { ...f, [key]: s };
  });
  const clear = () => setFilters({ category:"All", brands:new Set(), sellers:new Set(), priceMax:null, minRating:0 });

  return (
    <div>
      <Section title="Price (max)" defaultOpen={true}>
        <PriceSlider priceMax={filters.priceMax} setPriceMax={v => setFilters(f => ({ ...f, priceMax:v }))} maxPrice={maxPrice}/>
      </Section>

      <Section title="Brand">
        {brands.map(b => <CheckRow key={b} checked={filters.brands.has(b)} label={b} onChange={() => toggle("brands", b)}/>)}
      </Section>

      <Section title="Seller" defaultOpen={false}>
        {sellers.map(s => <CheckRow key={s} checked={filters.sellers.has(s)} label={s} onChange={() => toggle("sellers", s)}/>)}
      </Section>

      <Section title="Rating">
        {[5,4,3].map(r => (
          <label key={r} onClick={() => setFilters(f => ({ ...f, minRating: f.minRating===r ? 0 : r }))}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 2px", cursor:"pointer" }}>
            <div className="smooth" style={{ width:17, height:17, borderRadius:5, flexShrink:0, border:`2px solid ${filters.minRating===r?C.brown:C.border}`, backgroundColor:filters.minRating===r?C.brown:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {filters.minRating===r && <Check size={10} color="#fff" strokeWidth={3}/>}
            </div>
            <Stars rating={r} size={11}/>
            <span style={{ fontSize:12, color:C.brownSoft }}>& up</span>
          </label>
        ))}
      </Section>

      <div style={{ display:"flex", gap:8, paddingTop:16 }}>
        <button onClick={clear} className="btn-press smooth"
          style={{ flex:1, padding:"10px", borderRadius:11, border:`1.5px solid ${C.border}`, backgroundColor:"transparent", color:C.brownMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>
          Clear
        </button>
        {onDone && (
          <button onClick={onDone} className="btn-press"
            style={{ flex:2, padding:"10px", borderRadius:11, border:"none", backgroundColor:C.brown, color:C.white, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 6px 18px ${C.shadowMd}` }}>
            Show Results
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DESKTOP SIDEBAR
═══════════════════════════════════════════════════════════════════════════════ */
function DesktopSidebar({ filters, setFilters, brands, sellers, maxPrice }) {
  const activeCount = filters.brands.size + filters.sellers.size + (filters.priceMax!=null?1:0) + (filters.minRating>0?1:0);
  return (
    <aside style={{ width:224, flexShrink:0, alignSelf:"flex-start", position:"sticky", top:128 }}>
      <div style={{ backgroundColor:C.white, borderRadius:20, border:`1px solid ${C.borderSoft}`, overflow:"hidden" }}>
        <div style={{ padding:"15px 18px", borderBottom:`1px solid ${C.borderSoft}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <SlidersHorizontal size={13} style={{ color:C.brown }}/>
            <span style={{ fontSize:11, fontWeight:700, color:C.brown, letterSpacing:"0.08em", textTransform:"uppercase" }}>Filters</span>
            {activeCount > 0 && (
              <span className="pop-anim" style={{ padding:"2px 7px", borderRadius:999, backgroundColor:C.brown, color:C.white, fontSize:10, fontWeight:700 }}>{activeCount}</span>
            )}
          </div>
        </div>
        <div style={{ padding:"0 18px 4px" }}>
          <FilterContent filters={filters} setFilters={setFilters} brands={brands} sellers={sellers} maxPrice={maxPrice}/>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE FILTER SHEET
═══════════════════════════════════════════════════════════════════════════════ */
function MobileSheet({ open, onClose, filters, setFilters, brands, sellers, maxPrice }) {
  const activeCount = filters.brands.size + filters.sellers.size + (filters.priceMax!=null?1:0) + (filters.minRating>0?1:0);
  return (
    <>
      {open && <div onClick={onClose} style={{ position:"fixed", inset:0, backgroundColor:"rgba(30,15,5,0.48)", zIndex:300, backdropFilter:"blur(4px)", animation:"fadeIn 0.2s ease" }}/>}
      <div className="smooth-slow" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:301,
        backgroundColor:C.white, borderRadius:"22px 22px 0 0",
        transform: open ? "translateY(0)" : "translateY(105%)",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
          <div style={{ width:38, height:4, borderRadius:999, backgroundColor:C.creamMid }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 20px 11px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:17, fontWeight:800, color:C.brown }}>Filters</span>
            {activeCount > 0 && (
              <span style={{ padding:"2px 8px", borderRadius:999, backgroundColor:C.brown, color:C.white, fontSize:11, fontWeight:700 }}>{activeCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.brownMid, display:"flex", padding:4 }}>
            <X size={18}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px" }}>
          <FilterContent filters={filters} setFilters={setFilters} onDone={onClose} brands={brands} sellers={sellers} maxPrice={maxPrice}/>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FILTER CHIP
═══════════════════════════════════════════════════════════════════════════════ */
function Chip({ label, onRemove }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px 5px 13px", borderRadius:999, backgroundColor:C.tanPale, border:`1.5px solid ${C.tan}55`, color:C.tanDeep, fontSize:11, fontWeight:600, animation:"scaleIn 0.2s ease", whiteSpace:"nowrap" }}>
      {label}
      <button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", color:C.brownMid, display:"flex", padding:0, lineHeight:1 }}>
        <X size={11}/>
      </button>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════════════════════ */
function ProductCard({ p, isFav, onFav, inCart, onCart, onQuickView, listView, animDelay = 0 }) {
  const [imgOk,    setImgOk]   = useState(false);
  const [hovering, setHovering]= useState(false);
  const discount = p.originalPrice ? Math.round((1 - p.price/p.originalPrice)*100) : null;

  if (listView) {
    return (
      <Link to={`/product/${p.id}`} className="card"
        style={{ backgroundColor:C.white, borderRadius:16, border:`1px solid ${C.borderSoft}`, display:"flex", overflow:"hidden", animation:`fadeUp 0.35s ease both`, animationDelay:`${animDelay}s`, textDecoration:"none" }}>
        <div style={{ width:110, minHeight:100, flexShrink:0, backgroundColor:C.creamDark, position:"relative", overflow:"hidden" }}>
          {!imgOk && <div style={{ position:"absolute", inset:0 }}><Shimmer h="100%" r={0}/></div>}
          <img src={p.image} alt={p.name} className="card-img" onLoad={() => setImgOk(true)}
            onError={e => { setImgOk(true); e.target.src=`https://placehold.co/110x100/EDE8DF/9B6B45?text=🐾`; }}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:imgOk?"block":"none" }}
          />
          {discount && <span style={{ position:"absolute", top:6, left:6, padding:"2px 6px", borderRadius:999, backgroundColor:"#B03A2E", color:C.white, fontSize:8.5, fontWeight:800 }}>-{discount}%</span>}
          {p.stock <= 0 && <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}><span style={{ padding:"4px 8px", backgroundColor:"#B03A2E", color:C.white, borderRadius:6, fontSize:10, fontWeight:800, textTransform:"uppercase" }}>Out of Stock</span></div>}
        </div>
        <div style={{ flex:1, padding:"12px 14px", display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:9, color:C.brownSoft, margin:"0 0 3px", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:4 }}>{p.brand}<VerifiedBadge isVerified={p.sellerVerified} size="sm"/></p>
            <p style={{ fontSize:13, color:C.brown, margin:"0 0 5px", fontWeight:600, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <StarDisplay rating={p.rating} numReviews={p.reviews} size={10} />
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:18, fontWeight:800, color:C.brown, margin:0, lineHeight:1 }}>Rs {p.price}</p>
              {p.originalPrice && <p style={{ fontSize:10, color:C.brownSoft, textDecoration:"line-through", margin:0 }}>Rs {p.originalPrice}</p>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(p); }} className="btn-press smooth"
                style={{ height:32, padding:"0 10px", borderRadius:10, border:`1.5px solid ${C.border}`, backgroundColor:C.white, color:C.brownMid, fontSize:10, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                <Eye size={11}/> View
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(p.id); }} className="btn-press"
                style={{ width:32, height:32, borderRadius:10, backgroundColor:isFav?C.brown:C.white, border:`1.5px solid ${isFav?C.brown:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.2s" }}>
                <Heart size={12} style={{ color:isFav?C.white:C.brownSoft, fill:isFav?C.white:"none" }}/>
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (p.stock > 0) onCart(p.id); }} className="btn-press" disabled={p.stock <= 0}
                style={{ height:32, padding:"0 13px", borderRadius:10, backgroundColor:p.stock <= 0 ? C.border : (inCart?C.creamDark:C.brown), color:p.stock <= 0 ? C.brownSoft : (inCart?C.brownMid:C.white), border:`1.5px solid ${p.stock <= 0 ? C.borderSoft : (inCart?C.border:C.brown)}`, fontSize:11, fontWeight:700, cursor:p.stock <= 0 ? "not-allowed" : "pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:5 }}>
                {p.stock <= 0 ? "Out of Stock" : inCart ? <><Check size={11}/> Added</> : <><ShoppingCart size={11}/> Add</>}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${p.id}`} className="card" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
      style={{ backgroundColor:C.white, borderRadius:18, overflow:"hidden", border:`1px solid ${C.borderSoft}`, display:"flex", flexDirection:"column", cursor:"pointer", position:"relative", animation:`fadeUp 0.4s ease both`, animationDelay:`${animDelay}s`, textDecoration:"none" }}>

      <div style={{ position:"relative", height:210, backgroundColor:C.creamDark, overflow:"hidden", flexShrink:0 }}>
        {!imgOk && <div style={{ position:"absolute", inset:0 }}><Shimmer h="100%" r={0}/></div>}
        <img src={p.image} alt={p.name} className="card-img" onLoad={() => setImgOk(true)}
          onError={e => { setImgOk(true); e.target.src=`https://placehold.co/400x210/EDE8DF/9B6B45?text=🐾`; }}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:imgOk?"block":"none" }}
        />

        <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(30,15,5,0.28)", display:"flex", alignItems:"center", justifyContent:"center", opacity:hovering?1:0, transition:"opacity 0.22s", zIndex:3 }}>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(p); }} className="btn-press"
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", backgroundColor:"rgba(255,255,255,0.95)", borderRadius:999, border:"none", color:C.brown, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            <Eye size={13}/> Quick View
          </button>
        </div>

        {p.stock <= 0 && (
          <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
            <span style={{ padding:"6px 12px", backgroundColor:"#B03A2E", color:C.white, borderRadius:8, fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", boxShadow:`0 4px 12px rgba(176,58,46,0.3)` }}>Out of Stock</span>
          </div>
        )}

        <div style={{ position:"absolute", top:10, left:10, display:"flex", flexDirection:"column", gap:5, pointerEvents:"none" }}>
          {p.isNew    && <span className="tag-pill" style={{ backgroundColor:C.brown,    color:C.white }}>New</span>}
          {p.pop>10000 && <span className="tag-pill" style={{ backgroundColor:C.tan,     color:C.white, display:"flex", alignItems:"center", gap:3 }}><Flame size={8}/>Hot</span>}
          {discount   && <span className="tag-pill" style={{ backgroundColor:C.tanPale,  color:C.tanDeep, border:`1px solid ${C.tan}40` }}>-{discount}%</span>}
        </div>

        <button onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(p.id); }} className="btn-press"
          style={{ position:"absolute", top:10, right:10, width:34, height:34, borderRadius:"50%", backgroundColor:isFav?C.brown:"rgba(255,255,255,0.93)", border:`1.5px solid ${isFav?C.brown:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.22s", boxShadow:`0 2px 8px ${C.shadow}` }}>
          <Heart size={13} style={{ color:isFav?C.white:C.brownSoft, fill:isFav?C.white:"none" }}/>
        </button>
      </div>

      <div style={{ padding:"13px 14px 15px", display:"flex", flexDirection:"column", gap:5, flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <p style={{ fontSize:9, color:C.brownSoft, margin:0, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:4 }}>{p.seller}<VerifiedBadge isVerified={p.sellerVerified} size="sm"/></p>
          {p.badge && <Badge text={p.badge}/>}
        </div>
        <p style={{ fontSize:13, color:C.brown, margin:0, fontWeight:600, lineHeight:1.35 }}>{p.name}</p>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <StarDisplay rating={p.rating} numReviews={p.reviews} size={10} />
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"auto", paddingTop:10 }}>
          <div>
            <p style={{ fontSize:19, fontWeight:800, color:C.brown, margin:0, lineHeight:1 }}>Rs {p.price}</p>
            {p.originalPrice && <p style={{ fontSize:10, color:C.brownSoft, textDecoration:"line-through", margin:0 }}>Rs {p.originalPrice}</p>}
          </div>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); if (p.stock > 0) onCart(p.id); }} className="btn-press" disabled={p.stock <= 0}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", borderRadius:999, backgroundColor:p.stock <= 0 ? C.border : (inCart?C.creamDark:C.brown), color:p.stock <= 0 ? C.brownSoft : (inCart?C.brownMid:C.white), border:`1.5px solid ${p.stock <= 0 ? C.borderSoft : (inCart?C.border:C.brown)}`, fontSize:11, fontWeight:700, cursor:p.stock <= 0 ? "not-allowed" : "pointer", transition:"all 0.22s" }}>
            {p.stock <= 0 ? "Out of Stock" : inCart ? <><Check size={11}/> Added</> : <><Plus size={11}/> Cart</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════════════ */
function EmptyState({ onClear }) {
  return (
    <div style={{ textAlign:"center", padding:"72px 24px", backgroundColor:C.white, borderRadius:22, border:`1px solid ${C.borderSoft}`, animation:"fadeUp 0.4s ease" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", backgroundColor:C.cream, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <PawSVG size={36} color={C.creamDark}/>
      </div>
      <p style={{ fontSize:18, color:C.brownMid, fontWeight:700, marginBottom:8 }}>No results found</p>
      <p style={{ fontSize:13, color:C.brownSoft, marginBottom:24, lineHeight:1.6 }}>
        Try adjusting your filters or<br/>searching for something else.
      </p>
      <button onClick={onClear} className="btn-press"
        style={{ padding:"11px 28px", backgroundColor:C.brown, color:C.white, border:"none", borderRadius:999, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 6px 20px ${C.shadowMd}` }}>
        Clear Everything
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCROLL TO TOP
═══════════════════════════════════════════════════════════════════════════════ */
function ScrollToTop({ visible }) {
  return (
    <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })} className="btn-press smooth"
      style={{ position:"fixed", bottom:28, right:20, zIndex:200, width:42, height:42, borderRadius:"50%", backgroundColor:C.brown, color:C.white, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${C.shadowMd}`, opacity:visible?1:0, transform:visible?"translateY(0) scale(1)":"translateY(12px) scale(0.85)", pointerEvents:visible?"auto":"none" }}>
      <ChevronUp size={18}/>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TOAST STACK
═══════════════════════════════════════════════════════════════════════════════ */
function ToastStack({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:10, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, backgroundColor:t.type==="cart"?C.brown:C.success, color:"#fff", borderRadius:16, padding:"13px 18px", boxShadow:"0 16px 40px rgba(0,0,0,0.18)", animation:"slideUp 0.38s cubic-bezier(0.22,1,0.36,1) both", minWidth:240, maxWidth:300, pointerEvents:"auto" }}>
          <div style={{ width:30, height:30, borderRadius:"50%", backgroundColor:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {t.type==="cart" ? <ShoppingCart size={14}/> : <Heart size={14} fill="#fff"/>}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, fontWeight:700, margin:0 }}>{t.type==="cart" ? "Added to cart!" : "Wishlisted!"}</p>
            <p style={{ fontSize:11, opacity:0.8, margin:0, marginTop:1, lineHeight:1.3 }}>{t.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════════ */
export default function Marketplace() {
  const width     = useWindowWidth();
  const scrollY   = useScrollY();
  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const [query,       setQuery]      = useState("");
  const [sortBy,      setSortBy]     = useState("popular");
  const [sortOpen,    setSortOpen]   = useState(false);
  const [filterOpen,  setFilterOpen] = useState(false);
  const [listView,    setListView]   = useState(false);
  const [toasts,      setToasts]     = useState([]);
  const { addToCart: ctxAddToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const cartNavigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [quickView,   setQuickView]  = useState(null);
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(10000);
  const [filters, setFilters] = useState({
    category:"All", brands:new Set(), sellers:new Set(), priceMax: 10000, minRating: 0,
  });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${API_BASE}/api/products`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        const mappedData = data.map(p => {
          let imageUrl = "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80";
          if (p.images && p.images.length > 0) {
            imageUrl = p.images[0].startsWith("http") ? p.images[0] : `${API_BASE}${p.images[0]}`;
          }

          return {
            ...p,
            id: p._id,
            name: p.title,
            image: imageUrl,
            seller: p.sellerId?.storeName || p.sellerId?.name || "Hope For Paws Seller",
            price:
              p.price - (p.price * (p.discountPercentage || 0)) / 100,

            originalPrice:
              (p.discountPercentage || 0) > 0 ? p.price : null,
            rating: p.averageRating || 0,
            reviews: p.numReviews || 0,
            pop: p.pop || Math.floor(Math.random() * 10000),
            isNew: p.isNew || Math.random() > 0.7,
            stock: p.countInStock || 0,
          };
        });
        
        const highestPrice = mappedData.length > 0 ? Math.max(...mappedData.map(p => p.price || 0)) : 10000;
        setAbsoluteMaxPrice(highestPrice);
        setFilters(f => ({ ...f, priceMax: highestPrice, minRating: 0 }));
        
        setProducts(mappedData);
        setError("");
        setIsLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, []);

  const CATEGORIES = useMemo(() => {
    return ["All", ...new Set([...PRODUCT_CATEGORIES, ...products.map(p => p.category)])];
  }, [products]);
  const BRANDS     = useMemo(() => [...new Set(products.map(p => p.brand))], [products]);
  const SELLERS    = useMemo(() => [...new Set(products.map(p => p.seller))], [products]);

  const addToast = useCallback((type, name) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, type, name }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const onFav = useCallback(async (id) => {
    if (!requireAuth('use the wishlist')) {
      localStorage.setItem('pendingAction', JSON.stringify({ action: 'wishlist', productId: id, redirectUrl: window.location.pathname }));
      return;
    }
    const result = await toggleWishlist(id);
    if (result.success && result.message.includes('added')) {
      addToast("fav", products.find(x => x.id === id)?.name);
    }
  }, [requireAuth, toggleWishlist, addToast, products]);

  const onCart = useCallback(async (id) => {
    if (!requireAuth('add items to your cart')) {
      localStorage.setItem('pendingAction', JSON.stringify({ action: 'cart', productId: id, redirectUrl: window.location.pathname }));
      return;
    }
    const result = await ctxAddToCart(id, 1);
    if (result.success) {
      addToast("cart", products.find(x => x.id === id)?.name);
    }
  }, [requireAuth, ctxAddToCart, addToast, products]);

  const clearAll = useCallback(() => {
    setQuery("");
    setFilters({ category:"All", brands:new Set(), sellers:new Set(), priceMax: absoluteMaxPrice, minRating: 0 });
  }, [absoluteMaxPrice]);

  const displayed = useMemo(() => {
    let list = products.filter(p => {
      if (filters.category !== "All" && p.category !== filters.category) return false;
      if (query && !`${p.name}${p.brand}${p.seller}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.brands.size && !filters.brands.has(p.brand)) return false;
      if (filters.sellers.size && !filters.sellers.has(p.seller)) return false;
      if (filters.priceMax != null && p.price > filters.priceMax) return false;
      if (p.rating < filters.minRating) return false;
      return true;
    });
    switch (sortBy) {
      case "priceAsc":  return [...list].sort((a,b) => a.price - b.price);
      case "priceDesc": return [...list].sort((a,b) => b.price - a.price);
      case "new":       return [...list].sort((a,b) => (b.isNew?1:0)-(a.isNew?1:0));
      case "rating":    return [...list].sort((a,b) => b.rating - a.rating);
      default:          return [...list].sort((a,b) => b.pop - a.pop);
    }
  }, [query, sortBy, filters, products]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.category!=="All") chips.push({ label:`${filters.category}`, remove:() => setFilters(f=>({...f,category:"All"})) });
    filters.brands.forEach(b  => chips.push({ label:b, remove:() => setFilters(f=>{const s=new Set(f.brands);s.delete(b);return{...f,brands:s};}) }));
    filters.sellers.forEach(s => chips.push({ label:s, remove:() => setFilters(f=>{const ss=new Set(f.sellers);ss.delete(s);return{...f,sellers:ss};}) }));
    if (filters.priceMax != null && filters.priceMax < absoluteMaxPrice) chips.push({ label:`Up to Rs ${filters.priceMax}`, remove:()=>setFilters(f=>({...f,priceMax:absoluteMaxPrice})) });
    if (filters.minRating>0) chips.push({ label:`${filters.minRating}+ stars`, remove:()=>setFilters(f=>({...f,minRating:0})) });
    return chips;
  }, [filters, absoluteMaxPrice]);

  const afc     = activeChips.length;
  const gridCols = isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(210px,1fr))";

  return (
    <div style={{ minHeight:"100vh", backgroundColor:C.cream, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── HERO BANNER ── */}
      <HeroBanner query={query} setQuery={setQuery} isMobile={isMobile} />

      {/* Top Picks Slider */}
      <TopPicks onFav={onFav} favs={{ has: isInWishlist }} onCart={onCart} isInCart={isInCart} onQuickView={setQuickView} products={products} />

      {/* ── STICKY CATEGORY + TOOLBAR ── */}
      <div style={{ position:"sticky", top:0, zIndex:150, backgroundColor:"rgba(245,240,232,0.96)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.borderSoft}` }}>
        <div style={{ maxWidth:1240, margin:"0 auto", padding:"11px 16px" }}>
          <CategoryBar active={filters.category} onChange={cat => setFilters(f => ({ ...f, category:cat }))} categories={CATEGORIES} />

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:10 }}>
            <span style={{ fontSize:12, color:C.brownSoft, whiteSpace:"nowrap" }}>
              <span style={{ color:C.brown, fontWeight:800, fontSize:14 }}>{displayed.length}</span> products
            </span>

            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              {!isDesktop && (
                <button onClick={() => setFilterOpen(true)} className="btn-press smooth"
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", backgroundColor:afc>0?C.brown:C.white, border:`1.5px solid ${afc>0?C.brown:C.border}`, borderRadius:10, color:afc>0?C.white:C.brownMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  <SlidersHorizontal size={12}/>
                  Filters
                  {afc > 0 && <span style={{ minWidth:17, height:17, borderRadius:999, backgroundColor:"rgba(255,255,255,0.25)", fontSize:10, fontWeight:800, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{afc}</span>}
                </button>
              )}

              <div style={{ display:"flex", border:`1.5px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
                {[{ I:LayoutGrid, v:false }, { I:List, v:true }].map(({ I, v }) => (
                  <button key={String(v)} onClick={() => setListView(v)} className="smooth"
                    style={{ padding:"7px 10px", background:listView===v?C.brown:C.white, border:"none", cursor:"pointer", display:"flex", alignItems:"center", color:listView===v?C.white:C.brownSoft }}>
                    <I size={13}/>
                  </button>
                ))}
              </div>

              <div style={{ position:"relative" }}>
                <button onClick={() => setSortOpen(o => !o)} className="smooth"
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", backgroundColor:C.white, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.brownMid, fontSize:12, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {SORTS.find(s=>s.value===sortBy)?.label}
                  <ChevronDown size={11} style={{ transform:sortOpen?"rotate(180deg)":"none", transition:"0.22s" }}/>
                </button>
                {sortOpen && (
                  <>
                    <div onClick={() => setSortOpen(false)} style={{ position:"fixed", inset:0, zIndex:99 }}/>
                    <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", backgroundColor:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:"hidden", zIndex:100, minWidth:196, boxShadow:`0 20px 48px ${C.shadowLg}`, animation:"scaleIn 0.18s ease" }}>
                      {SORTS.map(s => (
                        <button key={s.value} onClick={() => { setSortBy(s.value); setSortOpen(false); }}
                          style={{ width:"100%", textAlign:"left", padding:"11px 14px", background:sortBy===s.value?C.cream:"none", border:"none", color:sortBy===s.value?C.brown:C.brownMid, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"background 0.12s" }}>
                          <span style={{ flex:1 }}>{s.label}</span>
                          {sortBy===s.value && <Check size={11} style={{ color:C.tan }}/>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {afc > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:10 }}>
              {activeChips.map((c,i) => <Chip key={i} label={c.label} onRemove={c.remove}/>)}
              <button onClick={clearAll} style={{ fontSize:11, color:C.brownSoft, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit", padding:"5px 0" }}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth:1240, margin:"0 auto", padding:`24px 16px 100px` }}>
        <div style={{ display:"flex", gap:22, alignItems:"flex-start" }}>
          {isDesktop && <DesktopSidebar filters={filters} setFilters={setFilters} brands={BRANDS} sellers={SELLERS} maxPrice={absoluteMaxPrice}/>}

          <div style={{ flex:1, minWidth:0 }}>
            {displayed.length === 0 ? (
              <EmptyState onClear={clearAll}/>
            ) : listView ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {displayed.map((p, i) => (
                  <ProductCard key={p.id} p={p} isFav={isInWishlist(p.id)} onFav={onFav} inCart={isInCart(p.id)} onCart={onCart} onQuickView={setQuickView} listView animDelay={Math.min(i,8)*0.04}/>
                ))}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:isMobile?10:16 }}>
                {displayed.map((p, i) => (
                  <ProductCard key={p.id} p={p} isFav={isInWishlist(p.id)} onFav={onFav} inCart={isInCart(p.id)} onCart={onCart} onQuickView={setQuickView} animDelay={Math.min(i,12)*0.045}/>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileSheet open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} setFilters={setFilters} brands={BRANDS} sellers={SELLERS} maxPrice={absoluteMaxPrice}/>
      {quickView && <QuickView product={quickView} isFav={isInWishlist(quickView.id)} onFav={onFav} inCart={isInCart(quickView.id)} onCart={onCart} onClose={() => setQuickView(null)}/>}
      <ToastStack toasts={toasts}/>
      <ScrollToTop visible={scrollY > 400}/>
    </div>
  );
}
