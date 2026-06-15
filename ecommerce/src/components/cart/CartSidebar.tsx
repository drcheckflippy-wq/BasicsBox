// ─── CartSidebar.tsx ──────────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  onCheckout: () => void;
};

export default function CartSidebar({ cartOpen, setCartOpen, onCheckout }: Props) {
  const { theme } = useTheme();
  const { cart, cartCount, cartTotal, currentRestaurant, addToCart, removeFromCart } = useCart();

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const bg          = theme === 'dark' ? '#111827'                : '#ffffff';
  const bgCard      = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const bgRestaurant= theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const bgQty       = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const bgCloseBtn  = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const border      = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const borderCard  = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const borderQty   = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const borderLeft  = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const textPri     = theme === 'dark' ? '#ffffff'                : '#0f172a';
  const textSec     = theme === 'dark' ? '#94a3b8'                : '#475569';
  const textMuted   = theme === 'dark' ? '#475569'                : '#94a3b8';
  const textVal     = theme === 'dark' ? '#cbd5e1'                : '#334155';
  const closeIcon   = theme === 'dark' ? '#94a3b8'                : '#475569';
  const emptyIcon   = theme === 'dark' ? '#1e293b'                : '#cbd5e1';

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm flex flex-col"
            style={{ background: bg, borderLeft: `1px solid ${borderLeft}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5"
              style={{ borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <span className="font-black text-lg" style={{ color: textPri }}>Your Cart</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-black text-orange-500"
                  style={{ background: 'rgba(249,115,22,0.12)' }}>
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: bgCloseBtn }}>
                <X className="w-4 h-4" style={{ color: closeIcon }} />
              </button>
            </div>

            {/* Restaurant info */}
            {currentRestaurant && (
              <div className="px-5 py-3"
                style={{ borderBottom: `1px solid ${border}`, background: bgRestaurant }}>
                <p className="text-xs font-black" style={{ color: textPri }}>
                  {currentRestaurant.restaurant.name}
                </p>
                <p className="text-[10px]" style={{ color: textMuted }}>
                  {currentRestaurant.restaurant.cuisine}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {cart.map(item => (
                <div key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: bgCard, border: `1px solid ${borderCard}` }}>
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=70'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=70'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate" style={{ color: textPri }}>{item.name}</p>
                    <p className="text-orange-500 font-black text-sm">
                      ₹{(item.has_offer && item.offer_price ? item.offer_price : item.price) * item.qty}
                    </p>
                  </div>
                  {/* Qty stepper */}
                  <div className="flex items-center rounded-xl"
                    style={{ background: bgQty, border: `1px solid ${borderQty}` }}>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-orange-500 hover:opacity-70 transition-opacity">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-black" style={{ color: textPri }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => { if (currentRestaurant) addToCart(item, currentRestaurant.restaurant.id, currentRestaurant); }}
                      className="w-7 h-7 flex items-center justify-center text-orange-500 hover:opacity-70 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {cart.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: emptyIcon }} />
                  <p className="font-bold text-sm" style={{ color: textSec }}>Your cart is empty</p>
                  <p className="text-xs mt-1" style={{ color: textMuted }}>
                    Add items from a restaurant to get started
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
                <div className="space-y-2">
                  {[['Item total', `₹${cartTotal}`], ['Delivery fee', 'FREE'], ['Platform fee', '₹0']].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: textMuted }}>{k}</span>
                      <span className="font-bold"
                        style={{ color: v === 'FREE' ? '#22c55e' : textVal }}>
                        {v}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black pt-2"
                    style={{ borderTop: `1px solid ${border}` }}>
                    <span className="text-sm" style={{ color: textPri }}>To Pay</span>
                    <span className="text-sm text-orange-500">₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!currentRestaurant) { alert('Restaurant info missing'); return; }
                    setCartOpen(false);
                    onCheckout();
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg,#f97316,#fbbf24)',
                    boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
                  }}
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-[10px]" style={{ color: textMuted }}>
                  By ordering, you agree to our Terms
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}