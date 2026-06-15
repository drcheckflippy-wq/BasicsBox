import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Phone, CreditCard, AlertCircle,
  Package, Truck, CheckCircle, XCircle, UtensilsCrossed,
  ChevronDown, ChevronUp, ExternalLink, Hourglass, CheckSquare,
} from 'lucide-react';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

type OrderItem = {
  id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  item_name: string;
  category: string;
  is_veg: boolean;
  subtotal: number;
};

type Order = {
  id: string;
  order_number: string;
  restaurant_name: string;
  restaurant_image: string | null;
  restaurant_phone: string | null;
  total_amount: number;
  calculated_total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  delivery_address: string;
  customer_phone: string;
  created_at: string;
  items: OrderItem[];
  special_instructions: string | null;
};

export default function YourOrders() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const { authenticatedFetch, refreshToken, isTokenExpired } = useAuth();

  // ── Theme helpers ──────────────────────────────────────────────────────────
  const isDark = theme === 'dark';
  const bgPage      = isDark ? 'bg-[#0A0F1E]'        : 'bg-[#F8FAFC]';
  const bgCard      = isDark ? 'bg-[#1A1F2E]'        : 'bg-white';
  const bgInner     = isDark ? 'bg-white/5'           : 'bg-black/[0.03]';
  const bgEmpty     = isDark ? 'bg-[#1A1F2E]'        : 'bg-gray-100';
  const textPrimary = isDark ? 'text-white'           : 'text-gray-900';
  const textMuted   = isDark ? 'text-slate-400'       : 'text-gray-500';
  const textXs      = isDark ? 'text-slate-500'       : 'text-gray-400';
  const textItem    = isDark ? 'text-slate-300'       : 'text-gray-600';
  const borderCard  = isDark ? 'border-slate-700'     : 'border-gray-200';
  const borderInner = isDark ? 'border-slate-700'     : 'border-gray-200';
  const hoverRow    = isDark ? 'hover:bg-white/5'     : 'hover:bg-black/[0.03]';
  const tabBorder   = isDark ? 'border-slate-700'     : 'border-gray-200';
  const tabInactive = isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900';
  const chevronColor = isDark ? 'text-slate-400'      : 'text-gray-400';
  const emptyIcon   = isDark ? 'text-slate-600'       : 'text-gray-300';
  const browseBtn   = isDark
    ? 'bg-[#1A1F2E] border-slate-700 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30'
    : 'bg-white border-gray-200 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/30';
  // ──────────────────────────────────────────────────────────────────────────

  const statusConfig = {
    pending:   { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',   icon: Hourglass },
    confirmed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         icon: CheckSquare },
    preparing: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',   icon: Package },
    ready:     { color: 'bg-green-500/20 text-green-400 border-green-500/30',      icon: Truck },
    delivered: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',icon: CheckCircle },
    cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30',            icon: XCircle },
  };

  const paymentStatusConfig = {
    pending: 'text-yellow-400',
    paid:    'text-green-400',
    failed:  'text-red-400',
  };
 useEffect(() => {
  const checkToken = async () => {
    const token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    if (token && isTokenExpired(token)) {
      await refreshToken();
    }
    if (!token && refresh_token) await refreshToken();
  };
  checkToken();
}, [isTokenExpired, refreshToken]);

useEffect(() => { 
  fetchOrders(); 
}, []); // eslint-disable-line react-hooks/exhaustive-deps

const fetchOrders = async () => {
  setLoading(true);
  setError(null);
  
  // Check if token exists
  const token = localStorage.getItem('access_token');
  if (!token) { 
    setError('Please login to view your orders'); 
    setLoading(false); 
    return; 
  }
  
  try {
    const response = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/orders/customer/', { method: 'GET' });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    setOrders(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
};

  const pendingOrders   = orders.filter(o => o.status === 'pending'   && o.payment_status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' && o.payment_status === 'paid');

  const formatDate = (dateString: string) => {
    try {
      const date = dateString.includes('+') || dateString.includes('Z')
        ? new Date(dateString)
        : new Date(dateString + 'Z');
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return dateString; }
  };

  const toggleExpand = (orderId: string) =>
    setExpandedOrder(expandedOrder === orderId ? null : orderId);

  // ── Shared order card renderer ─────────────────────────────────────────────
  const renderOrderCard = (order: Order, index: number) => {
    const StatusIcon = statusConfig[order.status]?.icon || Clock;
    const isExpanded = expandedOrder === order.id;

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`${bgCard} rounded-2xl border ${borderCard} overflow-hidden hover:border-orange-500/30 transition-all`}
      >
        {/* ── Card Header ── */}
        <div className={`p-4 cursor-pointer ${hoverRow} transition-colors`} onClick={() => toggleExpand(order.id)}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-semibold ${textPrimary}`}>{order.order_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[order.status]?.color}`}>
                  <span className="flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </span>
              </div>
              <p className={`text-sm ${textMuted}`}>{order.restaurant_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold text-orange-400">₹{order.total_amount}</p>
                <p className={`text-xs ${textXs}`}>{formatDate(order.created_at)}</p>
              </div>
              {isExpanded
                ? <ChevronUp  className={`w-5 h-5 ${chevronColor}`} />
                : <ChevronDown className={`w-5 h-5 ${chevronColor}`} />}
            </div>
          </div>

          {/* Preview pills */}
          {!isExpanded && (
            <div className="flex flex-wrap gap-2">
              {order.items.slice(0, 3).map(item => (
                <span key={item.id} className={`px-2 py-1 ${bgInner} rounded-lg text-xs ${textItem}`}>
                  {item.quantity}x {item.item_name}
                </span>
              ))}
              {order.items.length > 3 && (
                <span className={`px-2 py-1 ${bgInner} rounded-lg text-xs ${textItem}`}>
                  +{order.items.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Expanded Details ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`border-t ${borderInner}`}
            >
              <div className="p-4 space-y-4">

                {/* Restaurant info */}
                <div className={`flex items-start gap-3 p-3 ${bgInner} rounded-xl`}>
                  {order.restaurant_image ? (
                    <img src={order.restaurant_image} alt={order.restaurant_name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6 text-orange-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${textPrimary}`}>{order.restaurant_name}</h4>
                    {order.restaurant_phone && (
                      <a href={`tel:${order.restaurant_phone}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Phone className="w-3 h-3" />{order.restaurant_phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Order items */}
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${textPrimary}`}>Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-2 ${bgInner} rounded-lg`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-orange-400 font-medium">{item.quantity}x</span>
                          <span className={`text-sm ${textPrimary}`}>{item.item_name}</span>
                          {item.is_veg
                            ? <span className="w-3 h-3 border border-green-500 rounded-sm bg-green-500/20" />
                            : <span className="w-3 h-3 border border-red-500 rounded-full bg-red-500/20" />}
                        </div>
                        <span className="text-sm text-orange-400">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 ${bgInner} rounded-xl`}>
                    <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1 ${textPrimary}`}>
                      <MapPin className="w-3 h-3 text-orange-400" />Delivery Address
                    </h4>
                    <a href={order.delivery_address} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 break-all">
                      {order.delivery_address}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className={`p-3 ${bgInner} rounded-xl`}>
                    <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1 ${textPrimary}`}>
                      <Phone className="w-3 h-3 text-orange-400" />Contact
                    </h4>
                    <a href={`tel:${order.customer_phone}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                      {order.customer_phone}<ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Payment info */}
                <div className="space-y-2">
                  <div className={`flex items-center justify-between text-sm p-2 ${bgInner} rounded-lg`}>
                    <span className={textMuted}>Payment Method</span>
                    <span className={`flex items-center gap-1 ${textPrimary}`}>
                      <CreditCard className="w-3 h-3 text-orange-400" />
                      {order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between text-sm p-2 ${bgInner} rounded-lg`}>
                    <span className={textMuted}>Payment Status</span>
                    <span className={`${paymentStatusConfig[order.payment_status]} font-medium`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                  {order.special_instructions && (
                    <div className={`p-2 ${bgInner} rounded-lg`}>
                      <span className={`text-xs ${textMuted} block mb-1`}>Special Instructions</span>
                      <p className={`text-sm ${textPrimary}`}>{order.special_instructions}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className={`p-3 ${bgInner} rounded-xl`}>
                  <h4 className={`text-xs font-semibold mb-3 flex items-center gap-1 ${textPrimary}`}>
                    <Clock className="w-3 h-3 text-orange-400" />Order Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-2 h-2 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${textPrimary}`}>Order Placed</p>
                        <p className={`text-[10px] ${textXs}`}>{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full ${statusConfig[order.status]?.color} bg-opacity-20 border flex items-center justify-center mt-0.5`}>
                        <StatusIcon className="w-2 h-2" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${textPrimary}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </p>
                        <p className={`text-[10px] ${textXs}`}>Current Status</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className={`flex justify-between items-center pt-3 border-t ${borderInner}`}>
                  <span className={`text-sm font-medium ${textPrimary}`}>Total Amount</span>
                  <span className="text-lg font-bold text-orange-400">₹{order.total_amount}</span>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`min-h-screen ${bgPage} ${textPrimary} font-sans antialiased`}>
        <Header address="" setAddress={() => {}} handleLocate={() => {}} handleSearch={() => {}} locating={false} />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={textMuted}>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgPage} ${textPrimary} font-sans antialiased`}>
      <Header address="" setAddress={() => {}} handleLocate={() => {}} handleSearch={() => {}} locating={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Orders</h1>
            <p className={textMuted}>Total {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
          </div>
          <button onClick={() => navigate('/')} className={`px-4 py-2 border rounded-xl transition-all text-sm font-medium ${browseBtn}`}>
            Browse Restaurants
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`flex gap-2 mb-6 border-b ${tabBorder} pb-4`}>
          <button onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === 'pending' ? 'text-orange-400' : tabInactive}`}>
            {activeTab === 'pending' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-orange-500/10 rounded-xl border border-orange-500/30" />
            )}
            <Hourglass className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Pending Orders</span>
            {pendingOrders.length > 0 && (
              <span className="relative z-10 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs border border-orange-500/30">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button onClick={() => setActiveTab('confirmed')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === 'confirmed' ? 'text-orange-400' : tabInactive}`}>
            {activeTab === 'confirmed' && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-orange-500/10 rounded-xl border border-orange-500/30" />
            )}
            <CheckSquare className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Confirmed Orders</span>
            {confirmedOrders.length > 0 && (
              <span className="relative z-10 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
                {confirmedOrders.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* ── Pending tab ── */}
        {activeTab === 'pending' && (
          <motion.div key="pending" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-24 h-24 ${bgEmpty} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Hourglass className={`w-12 h-12 ${emptyIcon}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${textPrimary}`}>No pending orders</h3>
                <p className={`${textMuted} mb-6`}>You don't have any orders waiting for confirmation</p>
                <button onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold hover:brightness-110 transition-all">
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <div className="space-y-4">{pendingOrders.map(renderOrderCard)}</div>
            )}
          </motion.div>
        )}

        {/* ── Confirmed tab ── */}
        {activeTab === 'confirmed' && (
          <motion.div key="confirmed" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {confirmedOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-24 h-24 ${bgEmpty} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <CheckSquare className={`w-12 h-12 ${emptyIcon}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${textPrimary}`}>No confirmed orders</h3>
                <p className={`${textMuted} mb-6`}>Your confirmed orders will appear here</p>
                <button onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold hover:brightness-110 transition-all">
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <div className="space-y-4">{confirmedOrders.map(renderOrderCard)}</div>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
}