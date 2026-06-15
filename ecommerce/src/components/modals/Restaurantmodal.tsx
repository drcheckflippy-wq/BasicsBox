// ─── RestaurantModal.tsx ──────────────────────────────────────────────────────
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, MapPin, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';
import type { RestaurantData } from '../../context/CartContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  selectedRestaurant: RestaurantData | null;
  onClose: () => void;
  onOpenCart: () => void;
  filterVeg: boolean;
};

export default function RestaurantModal({ selectedRestaurant, onClose, onOpenCart, filterVeg }: Props) {
  const { theme } = useTheme();
  const { addToCart, removeFromCart, cart, cartCount, cartTotal } = useCart();
  const [menuCategory, setMenuCategory] = useState('all');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const cartQty = (id: number) => cart.find(c => c.id === id)?.qty || 0;

  const menuCategories = useMemo(() => selectedRestaurant
    ? ['all', ...Array.from(new Set(selectedRestaurant.menu.map(i => i.category).filter(Boolean)))]
    : ['all'], [selectedRestaurant]);

  const filteredMenu = useMemo(() => selectedRestaurant?.menu
    .filter(i => !filterVeg || i.is_veg)
    .filter(i => menuCategory === 'all' || i.category === menuCategory) || [],
    [selectedRestaurant, filterVeg, menuCategory]);

  const scrollCategories = (dir: 'left' | 'right') => {
    categoryScrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  const getGoogleMapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const bg         = theme === 'dark' ? '#111827'               : '#ffffff';
  const bgCard     = theme === 'dark' ? 'rgba(255,255,255,0.03)': 'rgba(0,0,0,0.02)';
  const border     = theme === 'dark' ? 'rgba(255,255,255,0.06)': 'rgba(0,0,0,0.08)';
  const textPri    = theme === 'dark' ? '#ffffff'               : '#0f172a';
  const textSec    = theme === 'dark' ? '#94a3b8'               : '#475569';
  const textMuted  = theme === 'dark' ? '#475569'               : '#94a3b8';
  const catInactive= theme === 'dark' ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.05)';
  const catBorder  = theme === 'dark' ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.1)';
  const catText    = theme === 'dark' ? '#64748b'               : '#94a3b8';
  const chevron    = theme === 'dark' ? '#475569'               : '#94a3b8';

  return (
    <AnimatePresence>
      {selectedRestaurant && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-hidden sm:rounded-3xl rounded-t-3xl flex flex-col"
            style={{ background: bg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Hero image */}
            <div className="relative h-32 flex-shrink-0">
              <img
                src={selectedRestaurant.restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
                alt={selectedRestaurant.restaurant.name}
                className="w-full h-full object-cover"
                style={{ filter: theme === 'dark' ? 'brightness(0.5)' : 'brightness(0.75)' }}
                onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'; }}
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bg} 0%, ${bg}4d 40%, transparent 100%)` }} />
              <button onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="px-5 pb-3 -mt-6 relative z-10 flex-shrink-0">
              <h2 className="text-xl font-black" style={{ color: textPri }}>{selectedRestaurant.restaurant.name}</h2>
              <p className="text-xs mb-1" style={{ color: textSec }}>{selectedRestaurant.restaurant.cuisine}</p>

              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: textMuted }}>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10px] text-white"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  <Star className="w-2.5 h-2.5 fill-white" /> {selectedRestaurant.restaurant.rating}
                </span>
                <span>({selectedRestaurant.restaurant.reviews_count} reviews)</span>
                {selectedRestaurant.restaurant.opening_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedRestaurant.restaurant.opening_time.slice(0, 5)}–{selectedRestaurant.restaurant.closing_time?.slice(0, 5)}
                  </span>
                )}
                <a href={getGoogleMapsUrl(selectedRestaurant.restaurant.latitude, selectedRestaurant.restaurant.longitude)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-blue-400 hover:text-blue-500 transition-colors">
                  <MapPin className="w-2.5 h-2.5" /> View on Maps
                </a>
              </div>

              {/* Category tabs */}
              {menuCategories.length > 1 && (
                <div className="flex items-center gap-1.5 mt-3">
                  <button onClick={() => scrollCategories('left')} className="p-1 transition-colors flex-shrink-0"
                    style={{ color: chevron }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                    {menuCategories.map(cat => (
                      <button key={cat} onClick={() => setMenuCategory(cat)}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all"
                        style={menuCategory === cat
                          ? { background: 'linear-gradient(135deg,#f97316,#fbbf24)', color: '#ffffff' }
                          : { background: catInactive, border: `1px solid ${catBorder}`, color: catText }}
                      >{cat === 'all' ? 'All Items' : cat}</button>
                    ))}
                  </div>
                  <button onClick={() => scrollCategories('right')} className="p-1 transition-colors flex-shrink-0"
                    style={{ color: chevron }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-shrink-0" style={{ borderTop: `1px solid ${border}` }} />

            {/* Menu items */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: textMuted }}>
                {filteredMenu.length} items
              </p>

              {filteredMenu.map(item => (
                <div key={item.id}
                  className="flex gap-3 p-3 rounded-2xl group transition-all hover:-translate-y-0.5"
                  style={{ background: bgCard, border: `1px solid ${border}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.is_veg
                        ? <span className="w-3.5 h-3.5 border-2 border-green-500 rounded-sm flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-[1px]" />
                          </span>
                        : <span className="w-3.5 h-3.5 border-2 border-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          </span>
                      }
                      <h4 className="font-black text-sm truncate" style={{ color: textPri }}>{item.name}</h4>
                      {item.has_offer && (
                        <span className="px-1.5 py-0.5 text-white rounded text-[9px] font-black flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>
                          {item.offer_percentage}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] line-clamp-2 mb-2 leading-relaxed" style={{ color: textMuted }}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.has_offer && item.offer_price
                        ? <>
                            <span className="font-black text-orange-500 text-sm">₹{item.offer_price}</span>
                            <span className="text-[10px] line-through" style={{ color: textMuted }}>₹{item.price}</span>
                          </>
                        : <span className="font-black text-sm" style={{ color: textPri }}>₹{item.price}</span>
                      }
                    </div>
                  </div>

                  {/* Item image + add/remove */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'; }}
                    />
                    {cartQty(item.id) > 0
                      ? <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1 py-1"
                          style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)' }}>
                          <button onClick={() => removeFromCart(item.id)} className="w-5 h-5 flex items-center justify-center text-white">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white text-xs font-black">{cartQty(item.id)}</span>
                          <button onClick={() => addToCart(item, selectedRestaurant.restaurant.id, selectedRestaurant)} className="w-5 h-5 flex items-center justify-center text-white">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      : <button
                          onClick={() => addToCart(item, selectedRestaurant.restaurant.id, selectedRestaurant)}
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded text-white text-xs font-black transition-all whitespace-nowrap shadow-lg hover:brightness-110"
                          style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)' }}
                        >ADD</button>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* View cart bar */}
            {cartCount > 0 && (
              <div className="flex-shrink-0 p-4" style={{ background: bg, borderTop: `1px solid ${border}` }}>
                <button
                  onClick={() => { onOpenCart(); onClose(); }}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-between px-5 hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', boxShadow: '0 8px 32px rgba(249,115,22,0.4)' }}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />{cartCount} item{cartCount > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    View Cart · ₹{cartTotal} <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}