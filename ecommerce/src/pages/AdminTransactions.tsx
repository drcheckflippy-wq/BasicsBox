import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Search, Download, CheckCircle, XCircle, Clock,
  Calendar, Phone, Store, Wifi, WifiOff, RefreshCw, Filter, Archive, Calendar as CalendarIcon
} from 'lucide-react';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';

type Transaction = {
  id: string;
  date_time: string;
  transaction_id: string;
  transaction_amount: number;
  payment_method: string;
  status: string;
  customer_phone: string;
  order_id: string;
  order_amount: number;
  customer_ref_id: string;
  restaurant_name: string;
  _isNew?: boolean;
};


type WeeklyData = {
  week_number: number;
  week_start: string;
  week_end: string;
  is_current_week: boolean;
  transactions: Transaction[];
  is_archived?: boolean;
};

type ArchivedWeek = {
  week_number: number;
  week_start: string;
  week_end: string;
  transaction_count: number;
  total_amount: number;
  upi_total: number;
  archived_at: string;
};


export default function AdminTransactions() {
  const [loading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [newTxCount, setNewTxCount] = useState(0);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const realtimeSubscribed = useRef(false);
  const tableTopRef = useRef<HTMLDivElement>(null);
  
  // Weekly view states
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [filterUPIOnly, setFilterUPIOnly] = useState(false);
  const [currentWeekInfo, setCurrentWeekInfo] = useState<{start: string, end: string, number: number} | null>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // Theme helpers
  const isDark = theme === 'dark';
  const bgPage = isDark ? 'bg-[#0A0F1E]' : 'bg-[#F8FAFC]';
  const bgCard = isDark ? 'bg-[#1A1F2E]' : 'bg-white';
  const bgInput = isDark ? 'bg-[#0A0F1E]' : 'bg-gray-50';
  const bgTableHead = isDark ? 'bg-[#0A0F1E]' : 'bg-gray-50';
  const bgEmptyIcon = isDark ? 'bg-white/5' : 'bg-gray-100';
  const bgHoverRow = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textTh = isDark ? 'text-slate-400' : 'text-gray-500';
  const textIcon = isDark ? 'text-slate-500' : 'text-gray-400';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const divideColor = isDark ? 'divide-slate-700' : 'divide-gray-200';
  const exportText = isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900';
  const emptyIconCl = isDark ? 'text-slate-600' : 'text-gray-300';

  let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';
  const axiosInstance = axios.create({ baseURL: API_BASE_URL });

// Request interceptor - add token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // ✅ CRITICAL FIX: Don't retry the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh/')) {
      console.log('Refresh endpoint failed - redirecting to login');
      localStorage.clear();
      window.location.href = '/admin';
      return Promise.reject(error);
    }
    
    // Only handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, _reject) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken
        });
        
        const newAccessToken = response.data.access_token;
        localStorage.setItem('access_token', newAccessToken);
        
        // Update all queued requests
        onTokenRefreshed(newAccessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect
        console.error('Token refresh failed:', refreshError);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/admin';
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

  // Replace your existing refreshAccessToken with this
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
      refresh_token: refreshToken
    });
    const newAccessToken = response.data.access_token;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.clear();
    window.location.href = '/admin';
    return null;
  }
};


 useEffect(() => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!token || !refreshToken) { 
    navigate('/admin', { replace: true }); 
    return; 
  }
  
  // Initial load
  fetchWeeklyTransactions();
  
  // Set up refresh interval
  const refreshInterval = setInterval(() => { 
    refreshAccessToken(); 
  }, 5 * 60 * 1000); // Refresh every 5 minutes
  
  return () => clearInterval(refreshInterval);
}, [navigate, filterUPIOnly]); // Add filterUPIOnly dependency

  const fetchWeeklyTransactions = async (weekNum?: number) => {
    setLoadingWeekly(true);
    try {
      let url = '/admin/weekly-transactions/';
      if (filterUPIOnly) url += '?filter_upi=true';
      if (weekNum) url += `${filterUPIOnly ? '&' : '?'}week=${weekNum}`;
      
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        if (weekNum && response.data.week) {
          setWeeklyData([response.data.week]);
        } else {
          setWeeklyData(response.data.weeks || []);
        }
        setCurrentWeekInfo(response.data.current_week);
        if (response.data.archived_weeks) {
          fetchArchivedWeeks();
        }
      }
    } catch (error) {
      console.error('Error fetching weekly transactions:', error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const fetchArchivedWeeks = async () => {
    try {
      const response = await axiosInstance.get('/admin/archived-weeks/');
      if (response.data.success) {
        setArchivedWeeks(response.data.archived_weeks);
      }
    } catch (error) {
      console.error('Error fetching archived weeks:', error);
    }
  };

  const exportWeekCSV = (week: WeeklyData) => {
  if (week.transactions.length === 0) {
    alert('No transactions to export for this week.');
    return;
  }

  // Apply UPI filter if enabled
  let transactionsToExport = week.transactions;
  if (filterUPIOnly) {
    transactionsToExport = week.transactions.filter(
      t => t.payment_method.toUpperCase() === 'UPI'
    );
    
    if (transactionsToExport.length === 0) {
      alert('No UPI transactions found for this week.');
      return;
    }
  }

  const headers = [
    'Date & Time (IST)', 'Transaction ID', 'Order ID', 'Amount (₹)',
    'Order Amount (₹)', 'Payment Method', 'Status',
    'Customer Phone', 'Customer Ref ID', 'Restaurant'
  ];

  const rows = transactionsToExport.map((tx) => [
    formatDate(tx.date_time),
    tx.transaction_id || '',
    tx.order_id || '',
    tx.transaction_amount,
    tx.order_amount,
    tx.payment_method,
    tx.status,
    tx.customer_phone || 'N/A',
    tx.customer_ref_id || '',
    tx.restaurant_name || ''
  ]);

  const escapeCell = (val: unknown) => {
    const str = String(val ?? '');
    // Escape quotes and handle commas/newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(','))
  ].join('\n');

  // Add BOM for UTF-8 to handle special characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with week number and date
  const date = new Date().toISOString().slice(0, 10);
  const filterSuffix = filterUPIOnly ? '_upi_only' : '';
  link.download = `week_${week.week_number}_transactions${filterSuffix}_${date}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'SUCCESS':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Success</span>;
      case 'PENDING':
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'USER_DROPPED':
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium border border-orange-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> User Dropped</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'VOID':
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> Void</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium border border-slate-500/30">{status}</span>;
    }
  };

  // Supabase realtime subscription for new transactions
  useEffect(() => {
    if (realtimeSubscribed.current) return;
    realtimeSubscribed.current = true;

    const channel = supabase
      .channel('admin-transactions-rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cashfree_transactions' },
        async (_payload) => {


          setNewTxCount((prev) => prev + 1);
          
          // Refresh weekly view to include new transaction
          fetchWeeklyTransactions(selectedWeek || undefined);
          
          setTimeout(() => {
            tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      realtimeSubscribed.current = false;
      supabase.removeChannel(channel);
    };
  }, [filterUPIOnly, selectedWeek]);

  if (loading && loadingWeekly) {
    return (
      <div className={`min-h-screen ${bgPage} ${textPrimary}`}>
        <Header address="" setAddress={() => {}} handleLocate={() => {}} handleSearch={() => {}} locating={false} />
        <div className="pt-32 flex justify-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgPage} ${textPrimary}`}>
      <Header address="" setAddress={() => {}} handleLocate={() => {}} handleSearch={() => {}} locating={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">Weekly Payment Transactions</h1>
              <p className={textMuted}>View transactions grouped by week (Sunday to Saturday, IST)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                isLive
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isLive ? 'Live' : 'Offline'}
              </span>
              <button
                onClick={() => { setNewTxCount(0); fetchWeeklyTransactions(selectedWeek || undefined); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${isDark ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'} transition-colors`}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* New transaction toast banner */}
        <AnimatePresence>
          {newTxCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {newTxCount} new transaction{newTxCount > 1 ? 's' : ''} received
              </span>
              <button
                onClick={() => setNewTxCount(0)}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${bgCard} rounded-xl p-4 mb-6 border ${borderColor}`}
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setFilterUPIOnly(!filterUPIOnly);
                  fetchWeeklyTransactions(selectedWeek || undefined);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  filterUPIOnly
                    ? 'bg-orange-500 text-white'
                    : `${bgInput} ${textMuted} border ${borderColor}`
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {filterUPIOnly ? 'UPI Only' : 'All Methods'}
              </button>
              
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  showArchived
                    ? 'bg-purple-500 text-white'
                    : `${bgInput} ${textMuted} border ${borderColor}`
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archived Weeks
              </button>
            </div>
            
            {currentWeekInfo && (
              <div className={`text-sm ${textMuted} flex items-center gap-2`}>
                <CalendarIcon className="w-4 h-4" />
                Current Week: {formatDateRange(currentWeekInfo.start, currentWeekInfo.end)}
              </div>
            )}
          </div>
        </motion.div>

        {/* Archived Weeks Section */}
        {showArchived && archivedWeeks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h3 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Archived Weeks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {archivedWeeks.map((week) => (
                <button
                  key={week.week_number}
                  onClick={() => {
                    setSelectedWeek(week.week_number);
                    fetchWeeklyTransactions(week.week_number);
                    setShowArchived(false);
                  }}
                  className={`${bgCard} border ${borderColor} rounded-lg p-3 text-left hover:border-orange-500 transition-all`}
                >
                  <div className="text-sm font-semibold text-orange-500">Week {week.week_number}</div>
                  <div className={`text-xs ${textMuted} mt-1`}>
                    {formatDateRange(week.week_start, week.week_end)}
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className={textPrimary}>{week.transaction_count} txs</span>
                    <span className="text-orange-400">₹{week.upi_total.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weekly Tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          ref={tableTopRef}
        >
          {loadingWeekly ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {weeklyData.length === 0 ? (
                <div className={`${bgCard} rounded-xl border ${borderColor} text-center py-12`}>
                  <div className={`w-16 h-16 ${bgEmptyIcon} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <CalendarIcon className={`w-6 h-6 ${emptyIconCl}`} />
                  </div>
                  <p className={textMuted}>No weekly transactions found</p>
                </div>
              ) : (
                weeklyData.map((week) => (
                  <div key={week.week_number} className={`${bgCard} rounded-xl border ${borderColor} overflow-hidden`}>
                    {/* Week Header */}
                    <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center flex-wrap gap-3`}>
                      <div>
                        <h2 className={`text-xl font-bold ${textPrimary}`}>
                          Week {week.week_number}
                          {week.is_current_week && (
                            <span className="ml-3 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Current</span>
                          )}
                          {week.is_archived && (
                            <span className="ml-3 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">Archived</span>
                          )}
                        </h2>
                        <p className={`text-sm ${textMuted} mt-1`}>
                          {formatDateRange(week.week_start, week.week_end)}
                          {' • '}
                          UPI Total: <span className="text-orange-400 font-semibold">
                            ₹{week.transactions
                              .filter(t => t.payment_method.toUpperCase() === 'UPI')
                              .reduce((sum, t) => sum + t.transaction_amount, 0)
                              .toLocaleString('en-IN')}
                          </span>
                        </p>
                      </div>
                     <button
  onClick={() => exportWeekCSV(week)}
  className={`px-3 py-1.5 ${bgInput} border ${borderColor} rounded-lg text-sm ${exportText} transition-colors flex items-center gap-2`}
>
  <Download className="w-4 h-4" />
  Export Week
</button>
                    </div>

                    {/* Week Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`${bgTableHead} border-b ${borderColor}`}>
                          <tr>
                            {['Date & Time (IST)', 'Transaction ID', 'Amount', 'Method', 'Status', 'Customer Phone', 'Order ID', 'Restaurant'].map((h) => (
                              <th key={h} className={`px-4 py-3 text-left text-xs font-medium ${textTh} uppercase tracking-wider`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${divideColor}`}>
                          {week.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8">
                                <div className={`w-12 h-12 ${bgEmptyIcon} rounded-full flex items-center justify-center mx-auto mb-2`}>
                                  <Search className={`w-5 h-5 ${emptyIconCl}`} />
                                </div>
                                <p className={textMuted}>No transactions this week</p>
                              </td>
                            </tr>
                          ) : (
                            week.transactions.map((tx) => (
                              <tr key={tx.id} className={`${bgHoverRow} transition-colors`}>
                                <td className={`px-4 py-3 text-sm whitespace-nowrap ${textPrimary}`}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className={`w-3 h-3 ${textIcon}`} />
                                    {formatDate(tx.date_time)}
                                  </div>
                                </td>
                                <td className={`px-4 py-3 text-sm font-mono ${textPrimary}`}>{tx.transaction_id || '—'}</td>
                                <td className="px-4 py-3 text-sm font-medium text-orange-400">₹{tx.transaction_amount}</td>
                                <td className={`px-4 py-3 text-sm ${textPrimary}`}>{tx.payment_method}</td>
                                <td className="px-4 py-3 text-sm">{getStatusBadge(tx.status)}</td>
                                <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                                  <div className="flex items-center gap-2">
                                    <Phone className={`w-3 h-3 ${textIcon}`} />
                                    {tx.customer_phone || 'N/A'}
                                  </div>
                                </td>
                                <td className={`px-4 py-3 text-sm font-mono ${textPrimary}`}>{tx.order_id || '—'}</td>
                                <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                                  <div className="flex items-center gap-2">
                                    <Store className={`w-3 h-3 ${textIcon}`} />
                                    {tx.restaurant_name || '—'}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}