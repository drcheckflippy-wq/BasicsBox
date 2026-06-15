/**
@license
SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Menu, X, LayoutDashboard, ChevronDown, Bell, Smartphone, ShoppingBag, CreditCard, Sun, Moon, Phone, Home, Search, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

interface HeaderProps {
  address: string;
  setAddress: (value: string) => void;
  handleLocate: () => void;
  handleSearch: (e: React.FormEvent) => void;
  locating: boolean;
}

type TxNotification = {
  id: string;
  message: string;
  time: string;
  read: boolean;
  amount?: number;
};

export default function Header({
  address = '',
  setAddress = () => {},
  handleLocate = () => {},
  handleSearch = () => {},
  locating = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Add refs to store channels
const merchantChannelRef = useRef<any>(null);
const customerChannelRef = useRef<any>(null);
const txChannelRef = useRef<any>(null);

  // ── Approval notifications (existing) ──────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; time: string; read: boolean }[]
  >([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const realtimeSubscribed = useRef(false);

  // ── Transaction notifications (NEW) ────────────────────────────────────
  const [txNotifications, setTxNotifications] = useState<TxNotification[]>([]);
  const [txNotifOpen, setTxNotifOpen] = useState(false);
  const [txUnreadCount, setTxUnreadCount] = useState(0);
  const txNotifRef = useRef<HTMLDivElement>(null);
  const txRealtimeSubscribed = useRef(false);
  // Add this force update function
const [, forceUpdate] = useState(0);
const forceReRender = () => forceUpdate(prev => prev + 1);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('email') || '';
    const role = localStorage.getItem('role') || '';
    setIsLoggedIn(!!token);
    setUserEmail(email);
    setUserRole(role);
  }, [location]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') return;
    if (location.pathname === '/admin/dashboard') {
      setNotifications([]);
      setPendingCount(0);
    }
    // Clear tx badge when on transactions page
    if (location.pathname === '/admin/transactions') {
      setTxNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setTxUnreadCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (txNotifRef.current && !txNotifRef.current.contains(e.target as Node)) {
        setTxNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return;
  
  // Cleanup previous subscriptions
  if (merchantChannelRef.current) {
    supabase.removeChannel(merchantChannelRef.current);
  }
  if (customerChannelRef.current) {
    supabase.removeChannel(customerChannelRef.current);
  }

  // Fetch initial count
  const fetchInitialCount = async () => {
    const [merchantRes, customerRes] = await Promise.all([
      supabase.from('pending_merchants').select('*', { count: 'exact', head: true }),
      supabase.from('pending_customers').select('*', { count: 'exact', head: true }),
    ]);
    const total = (merchantRes.count ?? 0) + (customerRes.count ?? 0);
    setPendingCount(total);
  };
  fetchInitialCount();

  // Merchant subscription - NOTIFICATIONS COMMENTED OUT
  const merchantChannel = supabase
    .channel('merchant-approvals')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'pending_merchants' }, 
      (payload) => {
        console.log('🆕 New merchant registration detected!', payload);
        
        // COMMENTED OUT - No dropdown message
        /*
        setNotifications(prev => [
          { 
            id: crypto.randomUUID(), 
            message: `New merchant "${name}" awaiting approval`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            read: false 
          }, 
          ...prev
        ].slice(0, 10));
        */
        
        // Only update the count
        setPendingCount(prev => prev + 1);
        forceReRender();
      }
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: 'pending_merchants' }, 
      () => {
        console.log('Merchant approved/deleted');
        setPendingCount(prev => Math.max(0, prev - 1));
        forceReRender();
      }
    )
    .subscribe((status) => {
      console.log('Merchant subscription status:', status);
    });

  // Customer subscription - NOTIFICATIONS COMMENTED OUT
  const customerChannel = supabase
    .channel('customer-approvals')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'pending_customers' }, 
      () => {
        
        // COMMENTED OUT - No dropdown message
        /*
        setNotifications(prev => [
          { 
            id: crypto.randomUUID(), 
            message: `👤 New customer "${name}" awaiting approval`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            read: false 
          }, 
          ...prev
        ].slice(0, 10));
        */
        
        // Only update the count
        setPendingCount(prev => prev + 1);
      }
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: 'pending_customers' }, 
      () => {
        setPendingCount(prev => Math.max(0, prev - 1));
      }
    )
    .subscribe();

  merchantChannelRef.current = merchantChannel;
  customerChannelRef.current = customerChannel;

  return () => {
    if (merchantChannelRef.current) {
      supabase.removeChannel(merchantChannelRef.current);
    }
    if (customerChannelRef.current) {
      supabase.removeChannel(customerChannelRef.current);
    }
  };
}, []); // Empty dependency array - only run once on mount

// Add this useEffect in your Header component temporarily
useEffect(() => {
  // Expose supabase to window for debugging
  (window as any).supabase = supabase;
  console.log('🔧 Supabase exposed to window for debugging');
}, []);

useEffect(() => {
  const role = localStorage.getItem('role');
  console.log('🔍 Transaction useEffect - Role:', role);
  
  if (role !== 'admin') {
    console.log('Not admin, skipping transaction notifications');
    return;
  }

  // Cleanup previous subscription
  if (txChannelRef.current) {
    console.log('Cleaning up previous transaction channel');
    supabase.removeChannel(txChannelRef.current);
  }

  // Request notification permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // IMPORTANT: First test if we can read the table
  const testConnection = async () => {
    const { error } = await supabase
      .from('cashfree_transactions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot access cashfree_transactions:', error);
    } else {
      console.log('✅ Successfully connected to cashfree_transactions');
    }
  };
  testConnection();

  const txChannel = supabase
    .channel('transactions-realtime', {
      config: {
        broadcast: { ack: true },
        presence: { key: 'tx-status' },
      },
    })
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'cashfree_transactions' 
      },
      (payload) => {
        console.log('💰💰💰 NEW TRANSACTION DETECTED!', payload);
        console.log('Payload details:', JSON.stringify(payload, null, 2));
        
        const row = payload.new as {
          id: string;
          order_amount?: number;
          customer_details?: string | Record<string, string>;
          cf_order_id?: string;
          payment_status?: string;
        };
        
        // Parse customer details
        let customerInfo = 'Customer';
        try {
          if (row.customer_details) {
            const cd = typeof row.customer_details === 'string'
              ? JSON.parse(row.customer_details)
              : row.customer_details;
            customerInfo = cd?.customer_phone || cd?.customer_name || cd?.customer_id || 'Customer';
          }
        } catch (e) {
          console.error('Error parsing customer details:', e);
        }
        
        const amount = row.order_amount ?? 0;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newNotification = {
          id: crypto.randomUUID(),
          message: `💰 Payment: ₹${amount.toLocaleString('en-IN')} from ${customerInfo}`,
          time,
          read: false,
          amount,
        };
        
        console.log('Creating notification:', newNotification);
        
        // IMPORTANT: Update states sequentially
        setTxNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 20);
          console.log('Updated txNotifications count:', updated.length);
          console.log('Current txNotifications:', updated);
          return updated;
        });
        
        setTxUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('New unread count:', newCount);
          return newCount;
        });
        
        // Force re-render
        setTimeout(() => {
          forceReRender();
          console.log('Force re-render triggered');
        }, 0);
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Transaction!', {
            body: `₹${amount.toLocaleString('en-IN')} from ${customerInfo}`,
            icon: '/logo192.png'
          });
        }
      }
    )
    .subscribe((status, err) => {
      console.log('Transaction subscription status:', status);
      if (err) {
        console.error('Transaction subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to transaction realtime!');
        // Test by sending a ping
        txChannel.send({
          type: 'broadcast',
          event: 'test',
          payload: { message: 'Connected!' }
        });
      }
    });

  txChannelRef.current = txChannel;
  console.log('Transaction channel created:', txChannelRef.current);

  return () => {
    console.log('Cleaning up transaction subscription');
    if (txChannelRef.current) {
      supabase.removeChannel(txChannelRef.current);
    }
  };
}, []);
// Add this polling solution for merchant notifications (GUARANTEED TO WORK)
useEffect(() => {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return;
  
  console.log('🔄 Merchant polling started (checks every 3 seconds)');
  
  let lastIds = new Set<string>();
  let isFirstRun = true;
  
  const checkForNewMerchants = async () => {
    try {
      // Fetch latest merchants with their IDs
      const { data: merchants, error } = await supabase
        .from('pending_merchants')
        .select('id, name, restaurant_name, email, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Polling error:', error);
        return;
      }
      
      if (!merchants) return;
      
      const currentIds = new Set(merchants.map(m => m.id));
      
      // On first run, just set baseline
      if (isFirstRun) {
        lastIds = currentIds;
        setPendingCount(merchants.length);
        console.log(`Initial merchant count: ${merchants.length}`);
        isFirstRun = false;
        return;
      }
      
      // Find new merchants (by ID)
      const newMerchants = merchants.filter(m => !lastIds.has(m.id));
      
      if (newMerchants.length > 0) {
        console.log(`🎉 POLLING: Found ${newMerchants.length} new merchant(s)!`);
        
        // Update count only - NO dropdown messages
        setPendingCount(merchants.length);
        forceReRender();
        
        // Browser notification (optional - remove if you don't want)
        if (Notification.permission === 'granted') {
          new Notification(`${newMerchants.length} New Merchant Registration${newMerchants.length > 1 ? 's' : ''}!`, {
            body: newMerchants.map(m => m.restaurant_name || m.name).join(', '),
            icon: '/logo192.png'
          });
        }
      }
      
      lastIds = currentIds;
      
    } catch (error) {
      console.error('Polling error:', error);
    }
  };
  
  // Run immediately and then every 3 seconds
  checkForNewMerchants();
  const interval = setInterval(checkForNewMerchants, 3000);
  
  return () => {
    console.log('Stopping merchant polling');
    clearInterval(interval);
  };
}, []); // Empty dependency array - only run once
// Add this polling solution for transaction notifications
useEffect(() => {
  const role = localStorage.getItem('role');
  if (role !== 'admin') return;
  
  console.log('🔄 Transaction polling started (checks every 5 seconds)');
  
  let lastTxIds = new Set<string>();
  let isFirstRun = true;
  
  const checkForNewTransactions = async () => {
    try {
      // Fetch latest transactions
      const { data: transactions, error } = await supabase
        .from('cashfree_transactions')
        .select('id, order_amount, customer_details, payment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Transaction polling error:', error);
        return;
      }
      
      if (!transactions) return;
      
      const currentIds = new Set(transactions.map(t => t.id));
      
      // On first run, just set baseline
      if (isFirstRun) {
        lastTxIds = currentIds;
        console.log(`Initial transaction count: ${transactions.length}`);
        isFirstRun = false;
        return;
      }
      
      // Find new transactions (by ID)
      const newTransactions = transactions.filter(t => !lastTxIds.has(t.id));
      
      if (newTransactions.length > 0) {
        console.log(`💰 POLLING: Found ${newTransactions.length} new transaction(s)!`, newTransactions);
        
        // Add notifications for each new transaction
        newTransactions.forEach(transaction => {
          // Parse customer details
          let customerInfo = 'Customer';
          try {
            if (transaction.customer_details) {
              const cd = typeof transaction.customer_details === 'string'
                ? JSON.parse(transaction.customer_details)
                : transaction.customer_details;
              customerInfo = cd?.customer_phone || cd?.customer_name || cd?.customer_id || 'Customer';
            }
          } catch (e) {
            console.error('Error parsing customer details:', e);
          }
          
          const amount = transaction.order_amount ?? 0;
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const newNotification = {
            id: crypto.randomUUID(),
            message: `Payment: ₹${amount.toLocaleString('en-IN')} from ${customerInfo}`,
            time,
            read: false,
            amount,
          };
          
          console.log('Adding transaction notification:', newNotification);
          
          setTxNotifications(prev => {
            const updated = [newNotification, ...prev].slice(0, 20);
            console.log('Updated txNotifications:', updated.length);
            return updated;
          });
        });
        
        setTxUnreadCount(prev => {
          const newCount = prev + newTransactions.length;
          console.log('New unread count:', newCount);
          return newCount;
        });
        
        forceReRender();
        
        // Browser notification
        if (Notification.permission === 'granted') {
          const totalAmount = newTransactions.reduce((sum, t) => sum + (t.order_amount || 0), 0);
          new Notification(`${newTransactions.length} New Transaction${newTransactions.length > 1 ? 's' : ''}!`, {
            body: `Total: ₹${totalAmount.toLocaleString('en-IN')}`,
            icon: '/logo192.png'
          });
        }
      }
      
      lastTxIds = currentIds;
      
    } catch (error) {
      console.error('Transaction polling error:', error);
    }
  };
  
  // Run immediately and then every 5 seconds
  checkForNewTransactions();
  const interval = setInterval(checkForNewTransactions, 5000);
  
  return () => {
    console.log('Stopping transaction polling');
    clearInterval(interval);
  };
}, []); // Empty dependency array - only run once

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearNotifications = () => { setNotifications([]); setPendingCount(0); };

 const markTxAllRead = () => {
  console.log('Marking all transactions as read');
  setTxNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  setTxUnreadCount(0);
};

const clearTxNotifications = () => { 
  setTxNotifications([]); 
  setTxUnreadCount(0); 
};

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
    setProfileOpen(false);
    setPendingCount(0);
    setNotifications([]);
    setTxNotifications([]);
    setTxUnreadCount(0);
    realtimeSubscribed.current = false;
    txRealtimeSubscribed.current = false;
    navigate('/customer');
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Contact Us', href: '#contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.hash === href || location.pathname === href;
  };

  const textPrimary    = theme === 'dark' ? 'text-white'       : 'text-gray-900';
  const textSecondary  = theme === 'dark' ? 'text-slate-400'   : 'text-gray-600';
  const textMuted      = theme === 'dark' ? 'text-slate-500'   : 'text-gray-500';
  const bgHover        = theme === 'dark' ? 'hover:bg-white/8' : 'hover:bg-black/5';
  const borderColor    = theme === 'dark' ? 'border-white/5'   : 'border-gray-200';
  const borderColorLight = theme === 'dark' ? 'border-white/8' : 'border-gray-100';
  const dropdownBg     = theme === 'dark' ? 'bg-[#1E293B]'     : 'bg-white';
  const dropdownBorder = theme === 'dark' ? 'border-white/10'  : 'border-gray-200';
  const dropdownShadow = theme === 'dark' ? 'shadow-black/40'  : 'shadow-gray-200/40';

  return (
    <>
      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? theme === 'dark'
              ? 'bg-black/95 backdrop-blur-xl shadow-xl shadow-black/30 border-b border-white/5'
              : 'bg-[var(--bg-primary)]/95 backdrop-blur-xl shadow-xl shadow-gray-200/50 border-b border-gray-200'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const role = localStorage.getItem('role');
                if (role === 'admin') navigate('/admin/dashboard');
                else if (role === 'merchant') navigate('/merchant/dashboard');
                else navigate('/');
              }}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                <img
                  src={logo}
                  alt="BasicsBox Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const container = e.currentTarget.parentElement;
                    if (container && !container.querySelector('.fallback-icon')) {
                      const fallbackIcon = document.createElement('div');
                      fallbackIcon.className = 'fallback-icon';
                      fallbackIcon.innerHTML =
                        '<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2M3 2h18"/></svg>';
                      container.appendChild(fallbackIcon);
                    }
                  }}
                />
              </div>
              <span className={`text-xl font-bold tracking-tight hidden sm:inline ${textPrimary}`}>
                Basics<span className="text-orange-400">Box</span>
              </span>
            </motion.button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    isActive(link.href) ? textPrimary : `${textSecondary} hover:${textPrimary}`
                  }`}
                >
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-active"
                      className={`absolute inset-0 ${theme === 'dark' ? 'bg-white/8' : 'bg-black/5'} rounded-lg`}
                    />
                  )}
                  {link.label === 'Get the App' && (
                    <Smartphone size={13} className="relative z-10 text-orange-400" />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              ))}
            </nav>

            {/* Location Search */}
            <div className="hidden md:flex items-center gap-2 mx-2">
              <div
                className="flex items-center rounded-xl overflow-hidden min-w-[240px]"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <button onClick={handleLocate} className="flex items-center gap-1 pl-3 pr-2 py-1.5 text-orange-500">
                  {locating ? (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1 py-1.5 bg-transparent text-xs focus:outline-none"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                className="px-4 py-1.5 rounded-xl font-semibold text-white text-xs flex items-center gap-1"
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
              >
                <Search className="w-3 h-3" />
                <span>Find</span>
              </motion.button>
            </div>

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-3">
              <AnimatePresence mode="wait">
                {isLoggedIn ? (
                  <motion.div
                    key="logged-in"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2"
                  >
                    {/* Approval Bell — admin only */}
                    {userRole === 'admin' && (
                      <div className="relative" ref={notifRef}>
                        <button
                          onClick={() => { setNotifOpen((prev) => !prev); if (!notifOpen) markAllRead(); }}
                          className={`relative p-2 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all`}
                          title="Approval Notifications"
                        >
                          <Bell size={18} />
                          <AnimatePresence>
                            {pendingCount > 0 && (
                              <motion.span
                                key="badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40"
                              >
                                {pendingCount > 99 ? '99+' : pendingCount}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {unreadCount > 0 && (
                            <motion.span
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.4 }}
                              className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-400 rounded-full"
                            />
                          )}
                        </button>
                        <AnimatePresence>
                          {notifOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className={`absolute right-0 mt-2 w-80 rounded-2xl ${dropdownBg} border ${dropdownBorder} shadow-2xl ${dropdownShadow} overflow-hidden`}
                            >
                              <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColorLight}`}>
                                <p className={`text-sm font-semibold ${textPrimary}`}>Notifications</p>
                                {pendingCount > 0 && (
                                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/20">
                                    {pendingCount} pending
                                  </span>
                                )}
                              </div>
                              <div className="max-h-72 overflow-y-auto">
                                {pendingCount > 0 && (
                                  <button
                                    onClick={() => { clearNotifications(); setNotifOpen(false); navigate('/admin/dashboard'); }}
                                    className={`w-full flex items-start gap-3 px-4 py-3 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors text-left border-b ${borderColorLight}`}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                      <LayoutDashboard size={14} className="text-orange-400" />
                                    </div>
                                    <div>
                                      <p className={`text-xs font-semibold ${textPrimary}`}>
                                        {pendingCount} registration{pendingCount !== 1 ? 's' : ''} awaiting review
                                      </p>
                                      <p className={`text-xs ${textMuted} mt-0.5`}>Click to open dashboard →</p>
                                    </div>
                                  </button>
                                )}
                                {notifications.length > 0 ? (
                                  notifications.map((n) => (
                                    <button
                                      key={n.id}
                                      onClick={() => { clearNotifications(); setNotifOpen(false); navigate('/admin/dashboard'); }}
                                      className={`w-full flex items-start gap-3 px-4 py-3 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors text-left`}
                                    >
                                      <div className="relative shrink-0 mt-0.5">
                                        <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-white/8 border-white/10' : 'bg-gray-100 border-gray-200'} border flex items-center justify-center`}>
                                          <User size={13} className={textSecondary} />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} leading-relaxed`}>{n.message}</p>
                                        <p className={`text-[10px] ${textMuted} mt-0.5`}>{n.time}</p>
                                      </div>
                                    </button>
                                  ))
                                ) : pendingCount === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Bell size={24} className={`${textMuted} mb-2`} />
                                    <p className={`text-xs ${textMuted}`}>No notifications yet</p>
                                  </div>
                                ) : null}
                              </div>
                              <div className={`px-4 py-3 border-t ${borderColorLight}`}>
                                <button
                                  onClick={() => { clearNotifications(); setNotifOpen(false); navigate('/admin/dashboard'); }}
                                  className="w-full text-center text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                                >
                                  View all in Dashboard →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}


                    {/* ── Transaction Notification Bell (NEW) ── */}
                    {userRole === 'admin' && (
                      <div className="relative" ref={txNotifRef}>
                        <button
                          onClick={() => {
                            setTxNotifOpen((prev) => !prev);
                            if (!txNotifOpen) markTxAllRead();
                          }}
                          className={`relative p-2 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all`}
                          title="Transaction Notifications"
                        >
                          <CreditCard size={18} />
                          <AnimatePresence>
                            {txUnreadCount > 0 && (
                              <motion.span
                                key="tx-badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-green-500/40"
                              >
                                {txUnreadCount > 99 ? '99+' : txUnreadCount}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {txUnreadCount > 0 && (
                            <motion.span
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.4 }}
                              className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full"
                            />
                          )}
                        </button>

                        <AnimatePresence>
                          {txNotifOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className={`absolute right-0 mt-2 w-80 rounded-2xl ${dropdownBg} border ${dropdownBorder} shadow-2xl ${dropdownShadow} overflow-hidden`}
                            >
                              <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColorLight}`}>
                                <p className={`text-sm font-semibold ${textPrimary}`}>Transactions</p>
                                {txUnreadCount > 0 && (
                                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                                    {txUnreadCount} new
                                  </span>
                                )}
                              </div>
                              <div className="max-h-72 overflow-y-auto">
                                {txNotifications.length > 0 ? (
                                  txNotifications.map((n) => (
                                    <button
                                      key={n.id}
                                      onClick={() => {
                                        clearTxNotifications();
                                        setTxNotifOpen(false);
                                        navigate('/admin/transactions');
                                      }}
                                      className={`w-full flex items-start gap-3 px-4 py-3 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors text-left ${!n.read ? (theme === 'dark' ? 'bg-green-500/5' : 'bg-green-50/60') : ''}`}
                                    >
                                      <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <CreditCard size={14} className="text-green-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} leading-relaxed`}>
                                          {n.message}
                                        </p>
                                        <p className={`text-[10px] ${textMuted} mt-0.5`}>{n.time}</p>
                                      </div>
                                      {!n.read && (
                                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-2" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <CreditCard size={24} className={`${textMuted} mb-2`} />
                                    <p className={`text-xs ${textMuted}`}>No new transactions</p>
                                  </div>
                                )}
                              </div>
                              <div className={`px-4 py-3 border-t ${borderColorLight}`}>
                                <button
                                  onClick={() => {
                                    clearTxNotifications();
                                    setTxNotifOpen(false);
                                    navigate('/admin/transactions');
                                  }}
                                  className="w-full text-center text-xs text-green-400 hover:text-green-300 font-semibold transition-colors"
                                >
                                  View all Transactions →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
 
                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setProfileOpen((prev) => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all text-sm font-medium`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {profileOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute right-0 mt-2 w-56 rounded-2xl ${dropdownBg} border ${dropdownBorder} shadow-2xl ${dropdownShadow} overflow-hidden`}
                          >
                            <div className={`px-4 py-3 border-b ${borderColorLight}`}>
                              <p className={`text-xs ${textMuted} font-medium uppercase tracking-wider mb-1`}>Signed in as</p>
                              <p className={`text-sm ${textPrimary} font-medium truncate`}>{userEmail || 'user@example.com'}</p>
                            </div>
                            <div className="p-2 space-y-1">
                              {userRole === 'customer' && (
                                <button
                                  onClick={() => { navigate('/your-orders'); setProfileOpen(false); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all text-sm font-medium text-left`}
                                >
                                  <ShoppingBag size={15} className="text-orange-400" />
                                  Your Orders
                                </button>
                              )}
                              {userRole === 'admin' && (
                                <>
                                  <button
                                    onClick={() => { navigate('/admin/dashboard'); setProfileOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all text-sm font-medium text-left`}
                                  >
                                    <LayoutDashboard size={15} className="text-orange-400" />
                                    Dashboard
                                    {pendingCount > 0 && (
                                      <span className="ml-auto px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                                        {pendingCount}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => { navigate('/admin/transactions'); setProfileOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all text-sm font-medium text-left`}
                                  >
                                    <CreditCard size={15} className="text-orange-400" />
                                    Transactions
                                    {txUnreadCount > 0 && (
                                      <span className="ml-auto px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                                        {txUnreadCount}
                                      </span>
                                    )}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={toggleTheme}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${textSecondary} hover:${textPrimary} ${bgHover} transition-all text-sm font-medium text-left`}
                              >
                                {theme === 'dark' ? (
                                  <><Sun size={15} className="text-orange-400" /><span>Light Mode</span></>
                                ) : (
                                  <><Moon size={15} className="text-orange-400" /><span>Dark Mode</span></>
                                )}
                              </button>
                              <div className={`border-t ${borderColorLight} pt-1 mt-1`}>
                                <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium text-left"
                                >
                                  <LogOut size={15} />
                                  Logout
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="logged-out"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <button
                      onClick={() => navigate('/customer')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-110 transition-all"
                    >
                      Get Started
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Location Search */}
            <div className="flex md:hidden items-center flex-1 justify-end ml-auto max-w-[200px]">
              <div
                className="flex items-center rounded-lg overflow-hidden w-full"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <button onClick={handleLocate} className="flex items-center pl-2 pr-1 py-1.5 text-orange-500">
                  {locating ? (
                    <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="text"
                  placeholder="Location..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1 py-1.5 bg-transparent text-xs focus:outline-none w-full min-w-0"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                className="ml-1 p-1.5 rounded-lg font-semibold text-white text-xs flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
              >
                <Search className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg ${textSecondary} hover:${textPrimary} ${bgHover} transition-all`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>
      {/* ═══ END HEADER ═══════════════════════════════════════════════════ */}

      {/* ═══ MOBILE MENU ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`fixed top-0 right-0 h-full w-[82vw] max-w-xs z-50 flex flex-col border-l md:hidden ${borderColor}`}
              style={{ background: 'var(--bg-primary)' }}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${borderColor}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                    <img src={logo} alt="logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <span className={`font-black text-sm ${textPrimary}`}>
                    Basics<span className="text-orange-400">Box</span>
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgHover} transition-all`}>
                  <X size={18} className={textSecondary} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      isActive(link.href)
                        ? `${textPrimary} ${theme === 'dark' ? 'bg-white/8' : 'bg-black/5'}`
                        : `${textSecondary} ${bgHover}`
                    }`}
                  >
                    {link.label === 'Home' && <Home size={15} className="text-orange-400 flex-shrink-0" />}
                    {link.label === 'Contact Us' && <Phone size={15} className="text-orange-400 flex-shrink-0" />}
                    {link.label === 'Get the App' && <Smartphone size={15} className="text-orange-400 flex-shrink-0" />}
                    {link.label}
                  </a>
                ))}

                <div className={`border-t my-3 ${borderColor}`} />

                {isLoggedIn ? (
                  <div className="space-y-1">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 border ${borderColor} ${theme === 'dark' ? 'bg-white/5' : 'bg-black/[0.03]'}`}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Signed in as</p>
                        <p className={`text-sm font-black truncate ${textPrimary}`}>{userEmail}</p>
                      </div>
                    </div>

                    {userRole === 'customer' && (
                      <button
                        onClick={() => { navigate('/your-orders'); setMobileOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} ${bgHover} transition-all text-sm font-medium text-left`}
                      >
                        <ShoppingBag size={15} className="text-orange-400 flex-shrink-0" />
                        Your Orders
                      </button>
                    )}

                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => { navigate('/admin/dashboard'); setMobileOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} ${bgHover} transition-all text-sm font-medium text-left`}
                        >
                          <LayoutDashboard size={15} className="text-orange-400 flex-shrink-0" />
                          Dashboard
                          {pendingCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                              {pendingCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { navigate('/admin/transactions'); setMobileOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} ${bgHover} transition-all text-sm font-medium text-left`}
                        >
                          <CreditCard size={15} className="text-orange-400 flex-shrink-0" />
                          Transactions
                          {txUnreadCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                              {txUnreadCount}
                            </span>
                          )}
                        </button>
                      </>
                    )}

                    <button
                      onClick={toggleTheme}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} ${bgHover} transition-all text-sm font-medium text-left`}
                    >
                      {theme === 'dark' ? (
                        <><Sun size={15} className="text-orange-400 flex-shrink-0" /><span>Light Mode</span></>
                      ) : (
                        <><Moon size={15} className="text-orange-400 flex-shrink-0" /><span>Dark Mode</span></>
                      )}
                    </button>

                    <div className={`pt-2 mt-1 border-t ${borderColor}`}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold text-left"
                      >
                        <LogOut size={15} className="flex-shrink-0" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={toggleTheme}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${textSecondary} ${bgHover} transition-all text-sm font-medium text-left`}
                    >
                      {theme === 'dark' ? (
                        <><Sun size={15} className="text-orange-400 flex-shrink-0" /><span>Light Mode</span></>
                      ) : (
                        <><Moon size={15} className="text-orange-400 flex-shrink-0" /><span>Dark Mode</span></>
                      )}
                    </button>
                    <button
                      onClick={() => { navigate('/customer'); setMobileOpen(false); }}
                      className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-black shadow-lg shadow-orange-500/25 hover:brightness-110 transition-all"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ═══ END MOBILE MENU ══════════════════════════════════════════════ */}
    </>
  );
}