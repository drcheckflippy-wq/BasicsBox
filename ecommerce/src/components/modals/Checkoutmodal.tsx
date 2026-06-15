// ─── CheckoutModal.tsx ────────────────────────────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Wallet, Smartphone, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  show: boolean;
  onClose: () => void;
  address: string;
  onLocate: () => void;
  locating: boolean;
};

export default function CheckoutModal({ show, onClose, address, onLocate, locating }: Props) {
  const { theme } = useTheme();
  const { cart, cartTotal, currentRestaurant, addToCart, removeFromCart, clearCart } = useCart();
  const { authenticatedFetch } = useAuth();

  const [customerPhone, setCustomerPhone]           = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placingOrder, setPlacingOrder]             = useState(false);
  const [paymentMethod, setPaymentMethod]           = useState('cash');

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const bg          = theme === 'dark' ? '#111827'                : '#ffffff';
  const bgCard      = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const bgCardAlt   = theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
  const bgInput     = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const bgStepBtn   = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bgCloseBtn  = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bgCancelBtn = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bgDisabled  = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const border      = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const borderCard  = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const borderSub   = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderInput = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const borderPmInactive = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const bgPmInactive     = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const textPri     = theme === 'dark' ? '#ffffff'                : '#0f172a';
  const textMuted   = theme === 'dark' ? '#475569'                : '#94a3b8';
  const closeIcon   = theme === 'dark' ? '#94a3b8'                : '#475569';
  const cancelTxt   = theme === 'dark' ? '#94a3b8'                : '#475569';
  const iconMuted   = theme === 'dark' ? '#475569'                : '#94a3b8';

  const clearAndClose = () => {
    clearCart();
    setCustomerPhone('');
    setSpecialInstructions('');
    setPaymentMethod('cash');
    onClose();
  };

const initiateCashfreePayment = async (orderId: string, _amount: number) => {
  try {
    const customerName = prompt('Enter your name for payment:', 'Customer') || 'Customer';
    if (!customerName) return;
    
    const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/payment/cashfree/create/', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        customer_phone: customerPhone,
        customer_email: localStorage.getItem('email') || 'customer@example.com',
        customer_name: customerName,
        return_url: window.location.origin + '/payment-callback'
      }),
    });
    
    const data = await res.json();
    console.log('Payment creation response:', data);
    
    if (res.ok && data.success) {
      await loadCashfreeCheckout(data.payment_session_id, orderId, data.cf_order_id);
    } else {
      alert('Failed to initiate payment: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    alert('Error initiating payment. Please try again.');
  }
};


const loadCashfreeCheckout = (sid: string, oid: string, cfoid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Remove existing Cashfree script if any
    const existingScript = document.querySelector('script[src*="cashfree"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Cashfree script loaded, opening checkout...');
      openCashfreeCheckout(sid, oid, cfoid);
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Cashfree script');
      alert('Failed to load payment gateway. Please try again.');
      reject();
    };
    
    document.body.appendChild(script);
  });
};

const openCashfreeCheckout = (sid: string, oid: string, cfoid: string) => {
  // Wait for Cashfree to be available
  const checkCashfree = setInterval(() => {
    // @ts-ignore
    if (typeof Cashfree !== 'undefined') {
      clearInterval(checkCashfree);
      
      try {
        // @ts-ignore
        const cashfree = new Cashfree({
          mode: 'production' // Change to 'production' when live
        });
        
        console.log('Opening Cashfree checkout with session:', sid);
        
        cashfree.checkout({
          paymentSessionId: sid,
          redirectTarget: '_self',
        });
        
        // Poll for payment status
        let attempts = 0;
        const maxAttempts = 30; // 90 seconds max
        
        const paymentTimer = setInterval(async () => {
          attempts++;
          try {
            const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/payment/cashfree/verify/', {
              method: 'POST',
              body: JSON.stringify({ 
                order_id: oid, 
                cf_order_id: cfoid 
              }),
            });
            const data = await res.json();
            
            if (data.success) {
              clearInterval(paymentTimer);
              alert('✅ Payment successful! Your order has been placed.');
              clearAndClose();
            } else if (attempts >= maxAttempts) {
              clearInterval(paymentTimer);
              alert('⚠️ Payment status unknown. Please check your orders page.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            if (attempts >= maxAttempts) {
              clearInterval(paymentTimer);
            }
          }
        }, 3000);
        
      } catch (error) {
        console.error('Cashfree checkout error:', error);
        alert('Failed to open payment window. Please try again.');
      }
    }
  }, 100);
  
  // Timeout after 5 seconds if Cashfree doesn't load
  setTimeout(() => {
    clearInterval(checkCashfree);
  }, 5000);
};

  const handlePlaceOrder = async () => {
    if (!currentRestaurant) { alert('No restaurant selected'); return; }
    if (cart.length === 0) { alert('Cart is empty'); return; }
    if (!customerPhone.trim()) { alert('Please enter phone number'); return; }

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (address?.includes(',')) {
      const [a, b] = address.split(',');
      latitude = parseFloat(a.trim());
      longitude = parseFloat(b.trim());
    }

    if (!latitude || !longitude) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej));
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch { alert('Location required for delivery'); return; }
    }

    if (!localStorage.getItem('access_token')) { alert('Please login to place an order'); return; }

    setPlacingOrder(true);
    try {
      const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/orders/create/', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: currentRestaurant.restaurant.id,
          items: cart.map(i => ({ menu_item_id: i.id, quantity: i.qty })),
          latitude, longitude,
          customer_phone: customerPhone,
          special_instructions: specialInstructions || '',
          payment_method: paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (paymentMethod === 'cash') { alert(`✅ Order placed! Order #${data.order_number}`); clearAndClose(); }
        else if (paymentMethod === 'upi') { onClose(); initiateCashfreePayment(data.order_id, data.total_amount); }
      } else alert(`❌ ${data.error || 'Failed to place order'}`);
    } catch { alert('❌ Error placing order'); }
    finally { setPlacingOrder(false); }
  };

  const isDisabled = placingOrder || !customerPhone || !address;

  return (
    <AnimatePresence>
      {show && currentRestaurant && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: bg, border: `1px solid ${border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black" style={{ color: textPri }}>Confirm Order</h3>
                <p className="text-xs" style={{ color: textMuted }}>{currentRestaurant.restaurant.name}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: bgCloseBtn }}>
                <X className="w-4 h-4" style={{ color: closeIcon }} />
              </button>
            </div>

            {/* Order Summary */}
            <div className="mb-5 rounded-2xl overflow-hidden"
              style={{ background: bgCard, border: `1px solid ${borderCard}` }}>
              <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${borderSub}` }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: textMuted }}>
                  Order Summary
                </p>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y" style={{ borderColor: borderSub }}>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <img src={item.image} alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: textPri }}>{item.name}</p>
                      <p className="text-[10px]" style={{ color: textMuted }}>Qty: {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-orange-500"
                        style={{ background: bgStepBtn }}>
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-black w-5 text-center" style={{ color: textPri }}>
                        {item.qty}
                      </span>
                      <button onClick={() => addToCart(item, currentRestaurant.restaurant.id, currentRestaurant)}
                        className="w-5 h-5 rounded flex items-center justify-center text-orange-500"
                        style={{ background: bgStepBtn }}>
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="text-orange-500 font-black text-xs flex-shrink-0">
                      ₹{(item.has_offer && item.offer_price ? item.offer_price : item.price) * item.qty}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-4 py-2.5"
                style={{ borderTop: `1px solid ${borderSub}`, background: bgCardAlt }}>
                <span className="text-xs font-black" style={{ color: textPri }}>Total</span>
                <span className="text-orange-500 font-black text-sm">₹{cartTotal}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: textMuted }}>
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'cash', label: 'Cash on Delivery', sub: 'Pay at door', icon: Wallet },
                  { val: 'upi',  label: 'UPI',              sub: 'Via Cashfree', icon: Smartphone },
                ].map(({ val, label, sub, icon: Icon }) => (
                  <label key={val}
                    className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                    style={paymentMethod === val
                      ? { border: '1px solid rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.08)' }
                      : { border: `1px solid ${borderPmInactive}`, background: bgPmInactive }}>
                    <input type="radio" name="pm" value={val} checked={paymentMethod === val}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-3.5 h-3.5 accent-orange-500" />
                    <div className="flex-1">
                      <p className="text-xs font-black" style={{ color: textPri }}>{label}</p>
                      <p className="text-[10px]" style={{ color: textMuted }}>{sub}</p>
                    </div>
                    <Icon className="w-4 h-4" style={{ color: iconMuted }} />
                  </label>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>
                Phone Number{' '}
                <span className="text-red-500 normal-case text-[10px] font-black">*required</span>
              </p>
              <input
                type="tel"
                placeholder="+91 00000 00000"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm font-medium focus:outline-none transition-all rounded-xl"
                style={{
                  background: bgInput,
                  border: `1px solid ${borderInput}`,
                  color: textPri,
                }}
              />
            </div>

            {/* Special Instructions */}
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>
                Instructions{' '}
                <span className="normal-case font-normal text-[10px]" style={{ color: textMuted }}>(optional)</span>
              </p>
              <textarea
                placeholder="e.g. extra chilli, no onions..."
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 text-sm focus:outline-none transition-all resize-none rounded-xl"
                style={{
                  background: bgInput,
                  border: `1px solid ${borderInput}`,
                  color: textPri,
                }}
              />
            </div>

            {/* Delivery Location */}
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>
                Delivery Location{' '}
                <span className="text-red-500 normal-case text-[10px] font-black">*required</span>
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  <input
                    type="text"
                    placeholder="Click pin to get location"
                    value={address}
                    readOnly
                    className="w-full pl-10 pr-3 py-3 text-sm focus:outline-none cursor-default rounded-xl"
                    style={{
                      background: bgInput,
                      border: `1px solid ${borderInput}`,
                      color: textPri,
                    }}
                  />
                </div>
                <button
                  onClick={onLocate}
                  disabled={locating}
                  className="px-4 py-3 rounded-xl text-orange-500 transition-all flex items-center hover:opacity-80"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  {locating
                    ? <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    : <Navigation className="w-4 h-4" />}
                </button>
              </div>
              {!address && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> Location required
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-5 py-3.5 rounded-2xl font-black text-sm transition-all hover:opacity-80"
                style={{ background: bgCancelBtn, color: cancelTxt }}>
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isDisabled}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                style={isDisabled
                  ? { background: bgDisabled, color: textMuted, cursor: 'not-allowed' }
                  : { background: 'linear-gradient(135deg,#f97316,#fbbf24)', color: '#ffffff', boxShadow: '0 8px 32px rgba(249,115,22,0.4)' }}
              >
                {placingOrder
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing...</>
                  : <>Place Order · ₹{cartTotal} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}