// ─── Home.tsx ─────────────────────────────────────────────────────────────────
// Main page — layout, hero, food categories, restaurant grid, footer.
// Cart, checkout, modals live in their own files.
import { motion } from 'framer-motion';
import {
  Search, MapPin,Star, Clock3,
  ChevronRight, ChevronLeft, Leaf, UtensilsCrossed, Heart,
  Bike, Truck,  Smartphone, Flame, Zap, Tag,
  ArrowRight, BadgePercent, ShoppingCart, User,
  Box, Fish, Pizza, Salad, Sandwich, Soup,
  Beef,
  Apple,
  Banana,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  Drumstick,
  Egg,
  IceCream,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

// Split components
import { CartProvider, useCart, type RestaurantData, type Review } from '../context/CartContext';
import CartSidebar from '../components/cart/CartSidebar';
import CheckoutModal from '../components/modals/Checkoutmodal';
import RestaurantModal from '../components/modals/Restaurantmodal';
import ReviewsModal from '../components/modals/Reviewsmodal';


// ─── Inner page (needs CartProvider above) ────────────────────────────────────
function HomeContent() {
  const { theme } = useTheme();
  const { cartCount, cartTotal } = useCart();

  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [foodItems, setFoodItems] = useState<{ id: number; name: string; image: string }[]>([]);
  const [loadingFoodItems, setLoadingFoodItems] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [filterVeg, setFilterVeg] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [reviews, setReviews] = useState<{ [key: number]: Review[] }>({});
  const [loadingReviews, setLoadingReviews] = useState<{ [key: number]: boolean }>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRestaurantForReview, setSelectedRestaurantForReview] = useState<number | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState<{ [key: number]: boolean }>({});
  const [viewMode, setViewMode] = useState<'all' | 'nearby'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [] = useState<{ [key: number]: boolean }>({});



  useEffect(() => {
    fetchFoodItems();
    const t = setTimeout(() => fetchAllRestaurants(), 300);
    return () => clearTimeout(t);
  }, []);
// Update the REAL-TIME STATUS POLLING - Check every 5 seconds for BOTH is_open AND is_manually_overridden
useEffect(() => {
  if (restaurants.length === 0) return;
  
  let isMounted = true;
  
  const fetchRealStatus = async () => {
    try {
      // Determine which endpoint to use based on view mode
      let url = 'https://basicsbox.pythonanywhere.com/api/get-all-restaurants-full/';
      if (viewMode === 'nearby' && address && address.includes(',')) {
        const [lat, lng] = address.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          url = `https://basicsbox.pythonanywhere.com/api/restaurants/?lat=${lat}&lng=${lng}`;
        }
      }
      
      const response = await fetch(url);
      const freshData = await response.json();
      
      if (isMounted && Array.isArray(freshData)) {
        setRestaurants(prevRestaurants => {
          let hasChanges = false;
          
          // Create a map for quick lookup
          const freshMap = new Map();
          freshData.forEach((item: any) => {
            if (item.restaurant?.id) {
              freshMap.set(item.restaurant.id, item);
            }
          });
          
          // Update restaurants with fresh data - check BOTH is_open AND is_manually_overridden
          const updatedRestaurants = prevRestaurants.map(prev => {
            const fresh = freshMap.get(prev.restaurant.id);
            if (fresh) {
              const oldIsOpen = prev.restaurant.is_open;
              const newIsOpen = fresh.restaurant.is_open;
              const oldOverride = prev.restaurant.is_manually_overridden;
              const newOverride = fresh.restaurant.is_manually_overridden;
              
              // Check if either is_open or override status changed
              if (oldIsOpen !== newIsOpen || oldOverride !== newOverride) {
                hasChanges = true;
                console.log(`🔄 POLLING UPDATE: ${prev.restaurant.name}`, {
                  is_open: `${oldIsOpen} → ${newIsOpen}`,
                  is_manually_overridden: `${oldOverride} → ${newOverride}`
                });
                return fresh;
              }
            }
            return prev;
          });
          
          return hasChanges ? updatedRestaurants : prevRestaurants;
        });
      }
    } catch (error) {
      console.error('Failed to fetch real restaurant status:', error);
    }
  };
  
  // Poll every 5 seconds for real database status
  const interval = setInterval(fetchRealStatus, 5000);
  
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [restaurants.length, viewMode, address]);

// Add a second useEffect to force re-render when restaurants change (just to be safe)
useEffect(() => {
  // This will run every time restaurants state updates
  console.log(`📊 Restaurant count: ${restaurants.length}, Open: ${restaurants.filter(r => r.restaurant.is_open).length}, Closed: ${restaurants.filter(r => !r.restaurant.is_open).length}`);
}, [restaurants]);
 
  // ─── Data Fetching ───────────────────────────────────────────────────────
  const fetchFoodItems = async () => {
    setLoadingFoodItems(true);
    try {
      const res = await fetch('https://basicsbox.pythonanywhere.com/api/get-food-item-names/');
      const data = await res.json();
      if (Array.isArray(data)) setFoodItems(data);
    } catch (e) { console.error(e); }
    finally { setLoadingFoodItems(false); }
  };

const fetchAllRestaurants = async () => {
  setLoadingRestaurants(true); 
  setViewMode('all');
  try {
    const res = await fetch('https://basicsbox.pythonanywhere.com/api/get-all-restaurants-full/');
    const data = await res.json();
    if (Array.isArray(data)) {
      // ✅ JUST USE THE DATA FROM API - DON'T RECALCULATE
      setRestaurants(data);
    }
  } catch (e) { 
    console.error(e); 
  } finally { 
    setLoadingRestaurants(false); 
  }
};
  const fetchNearbyRestaurants = async (lat: number, lng: number) => {
  setLoadingRestaurants(true); 
  setViewMode('nearby');
  try {
    const res = await fetch(`https://basicsbox.pythonanywhere.com/api/restaurants/?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      // ✅ JUST USE THE DATA FROM API - DON'T RECALCULATE
      setRestaurants(data);
    }
  } catch (e) { 
    console.error(e); 
  } finally { 
    setLoadingRestaurants(false); 
  }
};
const handleManualRefresh = async () => {
  console.log('🔄 Manual refresh triggered');
  if (viewMode === 'nearby' && address && address.includes(',')) {
    const [lat, lng] = address.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      await fetchNearbyRestaurants(lat, lng);
    }
  } else {
    await fetchAllRestaurants();
  }
};

  const fetchReviews = async (restaurantId: number) => {
    setLoadingReviews(prev => ({ ...prev, [restaurantId]: true }));
    try {
      const res = await fetch(`https://basicsbox.pythonanywhere.com/api/reviews/${restaurantId}/`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(prev => ({ ...prev, [restaurantId]: data }));
        const userEmail = localStorage.getItem('email');
        setUserHasReviewed(prev => ({ ...prev, [restaurantId]: !!data.find((r: Review) => r.user_email === userEmail) }));
      }
    } catch (e) { console.error(e); }
    finally { setLoadingReviews(prev => ({ ...prev, [restaurantId]: false })); }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) fetchAllRestaurants();
  };

  const handleLocate = () => {
  setLocating(true);
  navigator.geolocation.getCurrentPosition(
    ({ coords: { latitude, longitude } }) => {
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setLocating(false);
      setViewMode('nearby');
      fetchNearbyRestaurants(latitude, longitude);
      
      // Wait for restaurants to load then smooth scroll
      setTimeout(() => {
        const restaurantsSection = document.getElementById('restaurants-section');
        if (restaurantsSection) {
          restaurantsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 300); // Slightly faster delay for better UX
    },
    (error) => { 
      console.error('Location error:', error);
      setAddress('Location access denied'); 
      setLocating(false); 
    }
  );
};
  const getGoogleMapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

  const formatDays = (daysString: string | null): string => {
    if (!daysString) return 'Not specified';
    const days = daysString.split(',').map(d => d.trim());
    if (days.length === 7) return 'Daily';
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (days.length === 5 && days.every(d => weekdays.includes(d))) return 'Weekdays';
    const weekends = ['Saturday', 'Sunday'];
    if (days.length === 2 && days.every(d => weekends.includes(d))) return 'Weekends';
    const dayMap: { [k: string]: string } = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)).map(d => dayMap[d] || d).join(', ');
  };

  const openReviewModal = (rid: number) => {
    setSelectedRestaurantForReview(rid);
    setShowReviewModal(true);
    fetchReviews(rid);
  };

 const toggleFavorite = (id: number) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
const restaurantGrid = useMemo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {restaurants.map((rdata, i) => {
      const { restaurant, menu } = rdata;
      // Restaurant is closed if either:
      // 1. Business hours say closed (is_open = false) OR
      // 2. Force close override is active (is_manually_overridden = true AND is_open = false)
      const isClosed = !restaurant.is_open;
      
      return (
        <motion.div 
          key={`${restaurant.id}-${restaurant.is_open}-${restaurant.is_manually_overridden}`}
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: '-50px' }} 
          transition={{ delay: Math.min(i * 0.07, 0.35) }}
          onClick={() => !isClosed && setSelectedRestaurant(rdata)}
          className={`group rounded-2xl overflow-hidden transition-all duration-300 ${!isClosed ? 'cursor-pointer hover:-translate-y-1.5' : 'cursor-not-allowed'}`}
          style={{
            background: 'var(--bg-card, var(--input-bg))',
            border: '1px solid var(--border-color)',
            boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
            opacity: isClosed ? 0.55 : 1,
            filter: isClosed ? 'blur(1px)' : 'none',
          }}
          whileHover={!isClosed ? { boxShadow: theme === 'dark' ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(251,146,60,0.2)' : '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(251,146,60,0.25)' } as any : {}}
        >
    <div className="relative h-44 overflow-hidden">
  <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'} alt={restaurant.name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'; }}
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
  
  {/* Status Badges */}
  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
    {isClosed && (
      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase"
        style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
        Closed
      </span>
    )}
    {menu?.some(m => m.has_offer) && (
      <span className="px-2 py-0.5 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
        style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>
        <BadgePercent className="w-2.5 h-2.5" /> Offers
      </span>
    )}
  </div>
  
  {/* Show overlay message ONLY when force closed override is active */}
  {isClosed && restaurant.is_manually_overridden && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center px-4">
        <Clock3 className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-white font-bold text-sm">Sorry, we cannot take your orders at the moment</p>
        <p className="text-red-400 text-xs mt-1">Restaurant is temporarily closed</p>
      </div>
    </div>
  )}
  
  <button onClick={e => { e.stopPropagation(); toggleFavorite(restaurant.id); }}
    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
    <Heart className={`w-4 h-4 transition-colors ${favorites.includes(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
  </button>
  
  {!isClosed && (
    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      <span className="text-green-400 text-[10px] font-black">Open Now</span>
    </div>
  )}
</div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="font-black text-[var(--text-primary)] text-base leading-tight group-hover:text-orange-500 transition-colors">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                <Star className="w-2.5 h-2.5 fill-white text-white" />
                <span className="text-white text-xs font-black">{restaurant.rating}</span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-xs mb-3 font-medium">{restaurant.cuisine}</p>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] pb-3 mb-3"
              style={{ borderBottom: '1px solid var(--border-color)' }}>
              {restaurant.opening_time && restaurant.closing_time && (
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />{restaurant.opening_time.slice(0, 5)}–{restaurant.closing_time.slice(0, 5)}
                </span>
              )}
              {restaurant.days_open && (
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <span>·</span><span className="text-[10px]">{formatDays(restaurant.days_open)}</span>
                </span>
              )}
              {viewMode === 'nearby' && (rdata as any).distance && (
                <span className="flex items-center gap-1"><Bike className="w-3 h-3" />{(rdata as any).distance}</span>
              )}
              <span className="flex items-center gap-1 text-green-500 font-semibold">
                <Truck className="w-3 h-3" />Free Delivery
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {restaurant.tags?.slice(0, 3).map((tag, j) => (
                <span key={j} className="px-2 py-0.5 rounded-full text-[10px] text-[var(--text-secondary)] font-medium"
                  style={{ background: 'var(--input-bg)' }}>{tag}</span>
              ))}
              {menu?.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] text-orange-500 font-bold"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  {menu.length} items
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={e => { e.stopPropagation(); openReviewModal(restaurant.id); }}
                className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-orange-500 transition-colors font-medium">
                <Star className="w-3 h-3" /> {restaurant.reviews_count} reviews
              </button>
              <div className="flex items-center gap-3">
                <a href={getGoogleMapsUrl(restaurant.latitude, restaurant.longitude)} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-[10px] text-blue-500 hover:text-blue-400 flex items-center gap-0.5 transition-colors">
                  <MapPin className="w-2.5 h-2.5" /> Maps
                </a>
                {!isClosed && (
                  <span className="text-orange-500 text-xs font-black flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Menu <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
), [restaurants, favorites, viewMode, theme]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
  @keyframes floatIcon {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`}</style>

      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

        <Header 
        address={address}
        setAddress={setAddress}
        handleLocate={handleLocate}
        handleSearch={handleSearch}
        locating={locating}
      />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
    <section className="relative pt-16 overflow-hidden min-h-[70vh] flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1800&q=85"
            alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500"
            style={{
              filter: theme === 'dark'
                ? 'brightness(0.28) saturate(1.4)'
                : 'brightness(1.05) saturate(0.4) opacity(0.07)',
            }}
          />
          {theme === 'dark' && <div className="absolute inset-0 bg-black/60" />}
          {theme === 'light' && (
            <>
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 40%, #FFF1E6 70%, #FEF3C7 100%)' }} />
              <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
              <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
              <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
              <div className="absolute inset-0 opacity-[0.025]"
                style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </>
          )}
          {theme === 'dark' && (
            <>
              <div className="absolute -bottom-20 -left-32 w-[700px] h-[700px] rounded-full"
                style={{ background: 'rgba(251,146,60,0.08)', filter: 'blur(80px)' }} />
              <div className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full"
                style={{ background: 'rgba(59,130,246,0.05)', filter: 'blur(80px)' }} />
            </>
          )}
          <div className="absolute -right-48 top-0 w-[520px] h-full"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(to right, rgba(249,115,22,0.08), transparent)'
                : 'linear-gradient(to right, rgba(249,115,22,0.05), transparent)',
              transform: 'skewX(-8deg)',
            }}
          />
        </div>

 {/* Floating icons */}
<div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
  {[
    { Icon: Pizza },
    { Icon: Soup },
    { Icon: Fish },
    { Icon: Salad },
    { Icon: Sandwich },
    { Icon: Box },
    { Icon: UtensilsCrossed },
    { Icon: Beef },
    { Icon: IceCream },
    { Icon: Coffee },
    { Icon: Cookie },
    { Icon: Croissant },
    { Icon: Egg },
    { Icon: Drumstick },
    { Icon: Banana },
    { Icon: Apple },
    { Icon: Cherry },
  ].map(({ Icon }, i) => (
    <div
      key={i}
      className="absolute"
      style={{
        left:  ['6%','17%','28%','39%','50%','61%','72%','83%','11%','33%','55%','77%','4%','22%','44%','66%','88%'][i],
        top:   ['8%','30%','14%','55%','20%','65%','10%','40%','72%','82%','78%','68%','45%','92%','88%','95%','58%'][i],
        opacity: theme === 'light' ? 0.18 + (i % 3) * 0.06 : 0.2 + (i % 4) * 0.08,
        color: theme === 'dark'
          ? ['#fb923c','#fbbf24','#f97316','#fdba74'][i % 4]
          : '#f97316',
      filter: theme === 'dark'
  ? 'drop-shadow(0 0 6px rgba(251,146,60,0.75)) drop-shadow(0 0 18px rgba(251,146,60,0.35))'
  : 'none',
        willChange: 'transform',
transform: 'translateZ(0)',
animation: `floatIcon ${3.5 + i * 0.55}s ease-in-out ${i * 0.3}s infinite`,
      }}
    >
      <Icon size={theme === 'light' ? 52 : 60} strokeWidth={1.2} />
    </div>
  ))}
</div>

       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex-1 flex flex-col">
           <div className="grid lg:grid-cols-2 gap-1 items-center flex-1">

            {/* Left: Copy + Search */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
                style={{
                  background: theme === 'dark' ? 'rgba(251,146,60,0.15)' : 'rgba(249,115,22,0.1)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(251,146,60,0.3)' : 'rgba(249,115,22,0.25)'}`,
                  color: theme === 'dark' ? '#fb923c' : '#ea580c',
                }}
              >
                <Flame className="w-3 h-3" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                Fastest delivery in town
              </motion.div>
  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] mb-4 tracking-tight">
                <span className="block transition-colors duration-300" style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                  Order food &amp;
                </span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="block"
                  style={theme === 'dark' ? {
                    background: 'linear-gradient(135deg, #fb923c 0%, #fbbf24 45%, #f97316 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : {
                    color: '#c2410c', WebkitTextFillColor: '#c2410c',
                    textShadow: '0 2px 12px rgba(194,65,12,0.15)',
                  }}>
                  groceries
                </motion.span>
                <span className="block text-3xl lg:text-4xl font-bold mt-1 transition-colors duration-300"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
                  delivered to you
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="text-base mb-6 max-w-md leading-relaxed transition-colors duration-300"
                style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#64748b' }}>
                From your favourite restaurants to fresh groceries — get everything delivered fast.
              </motion.p>

          
              {/* Quick stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="flex items-center gap-5 text-sm flex-wrap mb-6">
                {[
                  { icon: Zap, val: '25 min', label: 'Avg delivery' },
                  { icon: Truck, val: 'Free', label: 'Delivery' },
                  { icon: Tag, val: '500+', label: 'Restaurants' },
                ].map(({ icon: Icon, val, label }, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: theme === 'dark' ? 'rgba(251,146,60,0.12)' : 'rgba(249,115,22,0.1)',
                        border: theme === 'dark' ? '1px solid rgba(251,146,60,0.25)' : '1px solid rgba(249,115,22,0.2)',
                      }}>
                      <Icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-black text-xs transition-colors duration-300"
                        style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>{val}</p>
                      <p className="text-[10px] transition-colors duration-300"
                        style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Lottie */}
           {/* Right: Lottie */}
<motion.div
  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
  className="relative w-full max-w-[300px] mx-auto lg:max-w-none lg:aspect-auto lg:h-[510px]"
>
  {theme === 'light' && (
    <div className="absolute inset-4 rounded-3xl"
      style={{ background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />
  )}
  <DotLottieReact
    src="https://lottie.host/c0ac28fe-e3df-48e4-b3ad-480fd0daac0c/0Ywoi3BsRm.lottie"
    loop autoplay className="w-full h-full relative z-10"
    style={theme === 'light' ? { filter: 'drop-shadow(0 8px 32px rgba(249,115,22,0.15))' } : {}}
  />
</motion.div>
          </div>

          {/* Promo Banners */}
          <div className="mt-1 pb-1">
          <div className="flex flex-col sm:flex-row gap-3">
              {[
                { title: 'FOOD DELIVERY', sub: 'FROM RESTAURANTS', badge: 'UPTO 60% OFF', bgColor: '#FF5A1F', badgeBg: 'rgba(255,90,31,0.12)', badgeColor: '#FF5A1F', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=85' },
                { title: 'FREE DELIVERY', sub: 'ON ORDERS ABOVE ₹299', badge: 'LIMITED TIME', bgColor: '#0EA5E9', badgeBg: 'rgba(14,165,233,0.12)', badgeColor: '#0EA5E9', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=85' },
                { title: 'NEW ARRIVALS', sub: 'FRESH RESTAURANTS', badge: 'EXPLORE NOW', bgColor: '#A855F7', badgeBg: 'rgba(168,85,247,0.12)', badgeColor: '#A855F7', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=85' },
              ].map((b, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="relative w-full sm:flex-1 cursor-pointer group flex-shrink-0" style={{ height: '120px' }}>
                  <div className="absolute inset-0 rounded-2xl group-hover:scale-[1.01] transition-transform duration-300" style={{ background: b.bgColor }} />
                  <div className="absolute rounded-xl overflow-hidden" style={{ inset: '5px', background: theme === 'dark' ? '#1a1f2e' : '#ffffff' }}>
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center z-10" style={{ left: '12px', right: '44%' }}>
                      <p className="font-black leading-tight mb-0.5 tracking-tight"
                        style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>{b.title}</p>
                      <p className="font-semibold mb-2 tracking-wide"
                        style={{ fontSize: 'clamp(9px, 1.8vw, 11px)', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>{b.sub}</p>
                      <div className="inline-flex items-center self-start rounded-full font-black tracking-wide border"
                        style={{ padding: '3px 8px', fontSize: 'clamp(8px, 1.6vw, 10px)', background: b.badgeBg, color: b.badgeColor, borderColor: b.badgeColor + '40', whiteSpace: 'nowrap' }}>
                        {b.badge}
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0" style={{ width: '48%' }}>
                      <img src={b.img} alt={b.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        style={{ maskImage: 'linear-gradient(to left, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)' }}
                        onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=70'; }}
                      />
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-20 group-hover:scale-110 transition-transform"
                      style={{ background: b.bgColor, boxShadow: `0 2px 8px ${b.bgColor}66` }}>
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative z-10 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48L60 41.3C120 34.7 240 21.3 360 18.7C480 16 600 24 720 26.7C840 29.3 960 26.7 1080 22.7C1200 18.7 1320 13.3 1380 10.7L1440 8V48H0Z" fill="var(--bg-secondary)" />
          </svg>
        </div>
      </section>

      {/* ═══ FOOD CATEGORIES ═══════════════════════════════════════════════ */}
      <section className="py-14 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">What's on your mind?</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => document.getElementById('food-scroll')?.scrollBy({ left: -280, behavior: 'smooth' })}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--input-bg)', border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => document.getElementById('food-scroll')?.scrollBy({ left: 280, behavior: 'smooth' })}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full mb-8" style={{ borderTop: '1px solid var(--border-color)' }} />

          {loadingFoodItems ? (
            <div className="flex justify-center gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-[var(--input-bg)] animate-pulse" />
                  <div className="w-14 h-3 rounded bg-[var(--input-bg)] animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div id="food-scroll" className="flex gap-2 overflow-x-auto justify-start" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {foodItems.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="flex-shrink-0 flex flex-col items-center gap-2.5 cursor-pointer group" style={{ width: '110px' }}>
                  <div className="w-24 h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:ring-2 group-hover:ring-orange-400 group-hover:ring-offset-2"
                    style={{
                      background: theme === 'dark' ? 'linear-gradient(145deg, #1e2433, #252d3d)' : 'linear-gradient(145deg, #fff7ed, #fef3c7)',
                      boxShadow: theme === 'dark' ? '0 6px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(249,115,22,0.12)' : '0 6px 20px rgba(0,0,0,0.10), 0 2px 6px rgba(249,115,22,0.10)',
                      '--tw-ring-offset-color': theme === 'dark' ? '#0f1117' : '#fff',
                    } as React.CSSProperties}>
                    <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'} alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'; }}
                    />
                  </div>
                  <span className="text-xs font-bold text-center leading-tight px-1 transition-colors duration-200 group-hover:text-orange-500"
                    style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                </motion.div>
              ))}
            </div>
          )}
          <div className="w-full mt-8" style={{ borderTop: '1px solid var(--border-color)' }} />
        </div>
      </section>

      {/* ═══ RESTAURANTS ════════════════════════════════════════════════════ */}
      {/* ═══ RESTAURANTS ════════════════════════════════════════════════════ */}
<section id="restaurants-section" className="pb-20 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                  {viewMode === 'nearby' ? 'Restaurants near you' : 'All Restaurants'}
                </h2>
                <div className="flex p-1 gap-1 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                  <button onClick={() => viewMode !== 'all' && fetchAllRestaurants()}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${viewMode === 'all' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={viewMode === 'all' ? { background: 'linear-gradient(135deg,#f97316,#fbbf24)', boxShadow: '0 2px 12px rgba(251,146,60,0.35)' } : {}}>All</button>
                  <button onClick={() => {
                    if (viewMode !== 'nearby') {
                      if (!address) { alert('Click the location pin first'); return; }
                      const parts = address.split(',');
                      if (parts.length === 2) {
                        const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
                        if (!isNaN(lat) && !isNaN(lng)) fetchNearbyRestaurants(lat, lng);
                        else alert('Click the location pin first');
                      }
                    }
                  }}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${viewMode === 'nearby' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={viewMode === 'nearby' ? { background: 'linear-gradient(135deg,#f97316,#fbbf24)', boxShadow: '0 2px 12px rgba(251,146,60,0.35)' } : {}}>Nearby</button>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-xs mt-1">
                {loadingRestaurants ? 'Loading...' : `${restaurants.length} restaurants available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterVeg(!filterVeg)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${filterVeg ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                style={!filterVeg ? { background: 'var(--input-bg)', border: '1px solid var(--border-color)' } : {}}>
                <Leaf className="w-3.5 h-3.5" /> Pure Veg
              </button>
              <button 
  onClick={handleManualRefresh}
  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all"
  style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
>
  <RefreshCw className="w-3.5 h-3.5" /> Refresh
</button>
              <select className="px-3 py-2 rounded-xl text-xs focus:outline-none font-bold cursor-pointer"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <option>Relevance</option><option>Rating ↓</option><option>Name A–Z</option>
              </select>
            </div>
          </div>

          <div className="w-full border-t mb-7" style={{ borderColor: 'var(--border-color)' }} />

          {loadingRestaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="h-44 bg-[var(--input-bg)]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[var(--input-bg)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--input-bg)] rounded w-1/2" />
                    <div className="h-3 bg-[var(--input-bg)] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
           restaurantGrid
          )}

          {!loadingRestaurants && restaurants.length === 0 && (
            <div className="text-center py-20">
              <UtensilsCrossed className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-bold">No restaurants found</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">Try enabling location or searching nearby</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ DOWNLOAD APP ═══════════════════════════════════════════════════ */}
      <section className="py-14" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden"
            style={{
              background: theme === 'dark' ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a5f 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%)',
              border: theme === 'dark' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(249,115,22,0.2)',
              boxShadow: theme === 'dark' ? '0 24px 80px rgba(99,102,241,0.2)' : '0 24px 80px rgba(249,115,22,0.12)',
            }}>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: theme === 'dark' ? 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: theme === 'dark' ? 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="relative z-10 p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black mb-4"
                  style={{ background: theme === 'dark' ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.12)', border: `1px solid ${theme === 'dark' ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.25)'}`, color: '#f97316' }}>
                  <Smartphone className="w-3 h-3" /> Download the App
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                  Get exclusive deals<br />
                  <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>on the go</span>
                </h3>
                <p className="text-sm mb-7 max-w-sm leading-relaxed" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                  Track orders live, get personalized recommendations, and unlock member-only discounts.
                </p>
         <div className="flex flex-wrap gap-3">
  {[
    { label: 'App Store',    sub: 'Download on the', Icon: Smartphone },
    { label: 'Google Play',  sub: 'Get it on',        Icon: PlayCircle  },
  ].map(({ label, sub, Icon }, i) => (
    <button
      key={i}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
      style={{
        background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#0f172a',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : 'none',
        boxShadow: theme === 'dark' ? 'none' : '0 4px 14px rgba(0,0,0,0.2)',
      }}
    >
      <Icon className="w-6 h-6 text-white" />
      <div className="text-left">
        <p className="text-[10px] font-medium" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)' }}>{sub}</p>
        <p className="text-sm font-black text-white">{label}</p>
      </div>
    </button>
  ))}
</div>
              
              </div>
        {/* Phone mockup */}
<div className="flex justify-center items-center">
  <div className="relative w-44 h-80 rounded-[2.5rem] flex items-center justify-center overflow-hidden"
    style={{
      background: 'linear-gradient(145deg, #1e293b, #0f172a)',
      border: theme === 'dark' ? '3px solid rgba(255,255,255,0.12)' : '3px solid rgba(15,23,42,0.15)',
      boxShadow: theme === 'dark'
        ? '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
        : '0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}>
    <div className="w-full h-full flex flex-col p-4 gap-2">
      <div className="w-16 h-2 bg-orange-400/60 rounded-full mx-auto mt-1" />
      <div className="flex-1 flex flex-col gap-2 mt-2">
        <div className="w-full h-20 rounded-xl" style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', opacity: 0.9 }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `rgba(249,115,22,${0.2 + i * 0.1})` }} />
            <div className="flex-1 space-y-1">
              <div className="h-2 rounded-full bg-white/20" />
              <div className="h-1.5 rounded-full bg-white/10 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-around pb-1">
        {[UtensilsCrossed, Search, ShoppingCart, User].map((Icon, i) => (
          <Icon key={i} className="w-4 h-4 opacity-50 text-white" />
        ))}
      </div>
    </div>
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-black" />
  </div>
</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
     <footer style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
      <div className="col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg" style={{ boxShadow: '0 4px 12px var(--brand-glow)' }}>
            <img 
              src={logo} 
              alt="BasicsBox Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.style.background = 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))';
                  container.classList.add('flex', 'items-center', 'justify-center');
                  const fallback = document.createElement('span');
                  fallback.className = 'text-white text-sm font-bold';
                  fallback.textContent = 'BB';
                  container.appendChild(fallback);
                }
              }}
            />
          </div>
          <span className="text-base font-black text-[var(--text-primary)] tracking-tight">
            Basics<span style={{ color: 'var(--brand-primary)' }}>Box</span>
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          India's fastest food delivery platform. Fresh food, delivered with love since 2024.
        </p>
      </div>
      {[
        { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
        { title: 'Support', links: ['Help Center', 'Safety', 'Terms', 'Privacy'] },
        { title: 'Contact', links: ['hello@basicsbox.com', '+91 12345 67890', 'Chennai, Tamil Nadu'] },
      ].map(({ title, links }) => (
        <div key={title}>
          <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">{title}</h4>
          <ul className="space-y-2">
            {links.map(l => (
              <li key={l}>
                <a 
                  href="#" 
                  className="text-xs text-[var(--text-muted)] hover-link"
                  style={{ 
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
      <p className="text-[11px] text-[var(--text-muted)]">© 2026 BasicsBox. All rights reserved.</p>
      <div className="flex gap-5">
        {['Privacy', 'Terms', 'Sitemap'].map(l => (
          <a 
            key={l} 
            href="#" 
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {l}
          </a>
        ))}
      </div>
    </div>
  </div>

  <style>{`
    .hover-link:hover {
      color: var(--brand-primary) !important;
    }
  `}</style>
</footer>

      {/* ═══ MODALS & OVERLAYS ═══════════════════════════════════════════════ */}
      <RestaurantModal
        selectedRestaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        onOpenCart={() => setCartOpen(true)}
        filterVeg={filterVeg}
      />

      <CartSidebar
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        onCheckout={() => setShowOrderModal(true)}
      />

      <CheckoutModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        address={address}
        onLocate={handleLocate}
        locating={locating}
      />

      <ReviewsModal
        show={showReviewModal}
        restaurantId={selectedRestaurantForReview}
        reviews={reviews}
        loadingReviews={loadingReviews}
        userHasReviewed={userHasReviewed}
        onClose={() => { setShowReviewModal(false); setSelectedRestaurantForReview(null); }}
        onReviewAdded={(rid) => { fetchReviews(rid); fetchAllRestaurants(); }}
      />

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && !selectedRestaurant && (
        <motion.button
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3.5 rounded-2xl text-white font-black text-sm"
          style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', boxShadow: '0 8px 40px rgba(249,115,22,0.55)' }}>
          <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" />{cartCount} item{cartCount > 1 ? 's' : ''}</span>
          <span className="w-px h-5 bg-white/30" />
          <span>₹{cartTotal}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

// ─── Default export wraps everything in CartProvider ──────────────────────────
export default function Home() {
  return (
    <CartProvider>
      <HomeContent />
    </CartProvider>
  );
}