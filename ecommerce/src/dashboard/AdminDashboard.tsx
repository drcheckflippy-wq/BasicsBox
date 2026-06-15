/**
@license
SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Store, CheckCircle, XCircle, Clock, ExternalLink, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // 👈 import shared client

const API_BASE = 'https://basicsbox.pythonanywhere.com/api';

interface PendingCustomer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  created_at?: string;
}

interface PendingMerchant {
  id?: string;
  name: string;
  restaurant_name: string;
  email: string;
  business_number: string;
  document_url?: string;
  cover_image_url?: string;
  latitude?: string;
  longitude?: string;
  google_maps_url?: string;
  created_at?: string;
}

type Tab = 'merchants' | 'customers';
type ActionState = { [email: string]: 'approving' | 'rejecting' | 'done' | null };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('merchants');
  const [merchants, setMerchants] = useState<PendingMerchant[]>([]);
  const [customers, setCustomers] = useState<PendingCustomer[]>([]);
  const [rejectTarget, setRejectTarget] = useState<{ email: string; type: 'merchant' | 'customer'; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionStates, setActionStates] = useState<ActionState>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();

    // ============================
    // 🔴 REALTIME: pending_merchants
    // ============================
    const merchantChannel = supabase
      .channel('realtime-pending-merchants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_merchants' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMerchants((prev) => {
              // avoid duplicates
              if (prev.find((m) => m.email === (payload.new as PendingMerchant).email)) return prev;
              return [payload.new as PendingMerchant, ...prev];
            });
            showToast('New merchant registration received!', 'success');
          } else if (payload.eventType === 'DELETE') {
            setMerchants((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // ============================
    // 🔴 REALTIME: pending_customers
    // ============================
    const customerChannel = supabase
      .channel('realtime-pending-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_customers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers((prev) => {
              if (prev.find((c) => c.email === (payload.new as PendingCustomer).email)) return prev;
              return [payload.new as PendingCustomer, ...prev];
            });
            showToast('New customer registration received!', 'success');
          } else if (payload.eventType === 'DELETE') {
            setCustomers((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(merchantChannel);
      supabase.removeChannel(customerChannel);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [merchantRes, customerRes] = await Promise.all([
        fetch(`${API_BASE}/pending/merchants/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/pending/customers/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (merchantRes.ok) {
        const data = await merchantRes.json();
        setMerchants(data);
      }
      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomers(data);
      }
    } catch (err) {
      showToast('Failed to fetch pending registrations', 'error');
    }
    setLoading(false);
  };

  const handleAction = async (
    email: string,
    type: 'merchant' | 'customer',
    action: 'approve' | 'reject'
  ) => {
    const key = `${email}-${type}`;
    setActionStates((prev) => ({ ...prev, [key]: action === 'approve' ? 'approving' : 'rejecting' }));

    const endpoint =
      action === 'approve'
        ? type === 'merchant'
          ? `${API_BASE}/merchant/approve/`
          : `${API_BASE}/customer/approve/`
        : type === 'merchant'
        ? `${API_BASE}/merchant/reject/`
        : `${API_BASE}/customer/reject/`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setActionStates((prev) => ({ ...prev, [key]: 'done' }));
        showToast(
          `${type === 'merchant' ? 'Merchant' : 'Customer'} ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
          'success'
        );
        setTimeout(() => {
          if (type === 'merchant') {
            setMerchants((prev) => prev.filter((m) => m.email !== email));
          } else {
            setCustomers((prev) => prev.filter((c) => c.email !== email));
          }
          setActionStates((prev) => ({ ...prev, [key]: null }));
        }, 800);
      } else {
        const err = await res.json();
        showToast(err.error || 'Action failed', 'error');
        setActionStates((prev) => ({ ...prev, [key]: null }));
      }
    } catch {
      showToast('Network error', 'error');
      setActionStates((prev) => ({ ...prev, [key]: null }));
    }
  };

  const openRejectModal = (email: string, type: 'merchant' | 'customer', name: string) => {
    setRejectTarget({ email, type, name });
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setRejectReason('');
    setRejectSubmitting(false);
  };

  const submitRejection = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    const { email, type } = rejectTarget;
    const key = `${email}-${type}`;
    setRejectSubmitting(true);
    setActionStates((prev) => ({ ...prev, [key]: 'rejecting' }));
    const endpoint = type === 'merchant' ? `${API_BASE}/merchant/reject/` : `${API_BASE}/customer/reject/`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, reason: rejectReason.trim() }),
      });
      if (res.ok) {
        setActionStates((prev) => ({ ...prev, [key]: 'done' }));
        showToast(`${type === 'merchant' ? 'Merchant' : 'Customer'} rejected successfully`, 'success');
        closeRejectModal();
        setTimeout(() => {
          if (type === 'merchant') setMerchants((prev) => prev.filter((m) => m.email !== email));
          else setCustomers((prev) => prev.filter((c) => c.email !== email));
          setActionStates((prev) => ({ ...prev, [key]: null }));
        }, 800);
      } else {
        const err = await res.json();
        showToast(err.error || 'Rejection failed', 'error');
        setActionStates((prev) => ({ ...prev, [key]: null }));
        setRejectSubmitting(false);
      }
    } catch {
      showToast('Network error', 'error');
      setActionStates((prev) => ({ ...prev, [key]: null }));
      setRejectSubmitting(false);
    }
  };

  const tabs = [
    { id: 'merchants' as Tab, label: 'Pending Merchants', icon: Store, count: merchants.length },
    { id: 'customers' as Tab, label: 'Pending Customers', icon: Users, count: customers.length },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeRejectModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', duration: 0.35 }}
              className="fixed inset-0 z-[95] flex items-center justify-center px-4">
              <div className="w-full max-w-md bg-[#1E293B] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Reject Registration</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{rejectTarget.type === 'merchant' ? 'Merchant' : 'Customer'}: {rejectTarget.name}</p>
                  </div>
                  <button onClick={closeRejectModal} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">✕</button>
                </div>
                <div className="px-6 py-5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Reason for Rejection <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Incomplete documentation, invalid business number..."
                    rows={4}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                  <p className="text-xs text-slate-600 mt-1.5">This reason will be emailed to the {rejectTarget.type}.</p>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
                  <button onClick={closeRejectModal} disabled={rejectSubmitting}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                    Cancel
                  </button>
                  <button onClick={submitRejection} disabled={!rejectReason.trim() || rejectSubmitting}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      !rejectReason.trim() || rejectSubmitting
                        ? 'bg-red-500/10 text-red-400/40 border-red-500/10 cursor-not-allowed'
                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/25'}`}>
                    <XCircle size={14} />
                    {rejectSubmitting ? 'Sending…' : 'Reject & Notify'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">Review and manage pending registrations</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-[#1E293B] p-1.5 rounded-2xl w-fit border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tab-active"
                  className="absolute inset-0 bg-orange-500/15 border border-orange-500/20 rounded-xl"
                />
              )}
              <tab.icon size={15} className={activeTab === tab.id ? 'text-orange-400' : ''} />
              <span className="relative z-10">{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`relative z-10 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center py-32">
              <div className="flex items-center gap-3 text-slate-400">
                <Clock size={20} className="animate-spin" />
                Loading pending registrations...
              </div>
            </motion.div>
          ) : activeTab === 'merchants' ? (
            <motion.div key="merchants" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <MerchantsTable merchants={merchants} actionStates={actionStates} onAction={handleAction} openRejectModal={openRejectModal} />
            </motion.div>
          ) : (
            <motion.div key="customers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <CustomersTable customers={customers} actionStates={actionStates} onAction={handleAction} openRejectModal={openRejectModal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MerchantsTable({ merchants, actionStates, onAction, openRejectModal }: {
  merchants: PendingMerchant[];
  actionStates: ActionState;
  onAction: (email: string, type: 'merchant' | 'customer', action: 'approve' | 'reject') => void;
  openRejectModal: (email: string, type: 'merchant' | 'customer', name: string) => void;
}) {
  if (merchants.length === 0) return <EmptyState label="merchants" />;
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#1E293B]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Business No.</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Document</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cover</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {merchants.map((m, i) => {
              const key = `${m.email}-merchant`;
              const state = actionStates[key];
              return (
                <motion.tr key={m.email} initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: state === 'done' ? 0 : 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500/30 to-amber-400/30 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-300">{m.restaurant_name}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-400">{m.email}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-400 font-mono">{m.business_number}</span></td>
                  <td className="px-6 py-4">
                    {m.document_url ? (
                      <a href={m.document_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium">
                        <ExternalLink size={12} /> View Doc
                      </a>
                    ) : <span className="text-xs text-slate-600">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    {m.cover_image_url ? (
                      <a href={m.cover_image_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium">
                        <ExternalLink size={12} /> View
                      </a>
                    ) : <span className="text-xs text-slate-600">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    {m.google_maps_url ? (
                      <a href={m.google_maps_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium">
                        <ExternalLink size={12} /> Maps
                      </a>
                    ) : <span className="text-xs text-slate-600">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons email={m.email} name={m.name} type="merchant" state={state} onAction={onAction} onReject={openRejectModal} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersTable({ customers, actionStates, onAction, openRejectModal }: {
  customers: PendingCustomer[];
  actionStates: ActionState;
  onAction: (email: string, type: 'merchant' | 'customer', action: 'approve' | 'reject') => void;
  openRejectModal: (email: string, type: 'merchant' | 'customer', name: string) => void;
}) {
  if (customers.length === 0) return <EmptyState label="customers" />;
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#1E293B]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((c, i) => {
              const key = `${c.email}-customer`;
              const state = actionStates[key];
              return (
                <motion.tr key={c.email} initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: state === 'done' ? 0 : 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500/30 to-indigo-400/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-400">{c.email}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-300 font-mono">{c.phone}</span></td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons email={c.email} name={c.name} type="customer" state={state} onAction={onAction} onReject={openRejectModal} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButtons({ email, name, type, state, onAction, onReject }: {
  email: string;
  name: string;
  type: 'merchant' | 'customer';
  state: 'approving' | 'rejecting' | 'done' | null | undefined;
  onAction: (email: string, type: 'merchant' | 'customer', action: 'approve' | 'reject') => void;
  onReject: (email: string, type: 'merchant' | 'customer', name: string) => void;
}) {
  const isLoading = state === 'approving' || state === 'rejecting';
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => onAction(email, type, 'approve')} disabled={isLoading}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          state === 'approving'
            ? 'bg-emerald-500/20 text-emerald-400 cursor-wait'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40'
        }`}>
        <CheckCircle size={13} />
        {state === 'approving' ? 'Approving…' : 'Approve'}
      </button>
      <button onClick={() => onReject(email, type, name)} disabled={isLoading}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          state === 'rejecting'
            ? 'bg-red-500/20 text-red-400 cursor-wait'
            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40'
        }`}>
        <XCircle size={13} />
        {state === 'rejecting' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/8 bg-[#1E293B]">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <CheckCircle size={28} className="text-emerald-500/50" />
      </div>
      <p className="text-white font-semibold mb-1">All clear!</p>
      <p className="text-slate-500 text-sm">No pending {label} at this time.</p>
    </div>
  );
}