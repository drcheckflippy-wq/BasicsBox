/**
@license
SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  BarChart3,
  Zap,
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  UserPlus,        // ← new
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';

// ← 'register' added to the union
type View = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function Admin() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    new_password: '',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && window.location.pathname.includes('reset-password')) {
      setView('reset-password');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ← clear message + password visibility when switching views
  const switchView = (next: View) => {
    setView(next);
    setMessage(null);
    setShowPassword(false);
    setFormData({ email: '', password: '', new_password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let endpoint = '';
      let data: any = {};

      if (view === 'login') {
        endpoint = '/admin/login/';
        data = { email: formData.email, password: formData.password };
      } else if (view === 'register') {                          // ← new branch
        endpoint = '/admin/register/';
        data = { email: formData.email, password: formData.password };
      } else if (view === 'forgot-password') {
        endpoint = '/forgot-password/';
        data = { email: formData.email, role: 'admin' };
      } else if (view === 'reset-password') {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        endpoint = '/reset-password/';
        data = { token, new_password: formData.new_password };
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

      setMessage({
        type: 'success',
        text:
          response.data.message ||
          (view === 'login'
            ? 'Login Successful!'
            : view === 'register'
            ? 'Admin registered successfully!'
            : 'Request Processed Successfully'),
      });

      if (view === 'login') {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('email', response.data.email);
        localStorage.setItem('role', response.data.role);
        navigate('/');
      }

      // ← after successful register, redirect to login after a short delay
      if (view === 'register') {
        setTimeout(() => switchView('login'), 1500);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Real-time Analytics', desc: 'Monitor your performance instantly.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Fast Operations', desc: 'Optimized workflows for every role.' },
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Platform', desc: 'Enterprise-grade security for your data.' },
  ];

  const adminColor = 'from-purple-500 to-indigo-500';

  // ← helper to get heading/subtext per view
  const viewMeta = {
    login:           { heading: 'Admin Login',     sub: 'Access the admin dashboard.' },
    register:        { heading: 'Admin Register',  sub: 'Create a new admin account.' },
    'forgot-password': { heading: 'Forgot Password', sub: 'Follow the instructions to proceed.' },
    'reset-password':  { heading: 'Reset Password',  sub: 'Follow the instructions to proceed.' },
  };

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans text-text-primary overflow-hidden">
      {/* Left Side: Branding (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop")',
            filter: 'blur(2px)',
          }}
        />
        <div className="absolute inset-0 bg-linear-to-br from-brand-bg/95 via-brand-bg/85 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-linear-to-br ${adminColor} rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20`}>
              <UtensilsCrossed className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MerchantHub</span>
          </motion.div>

          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6">
                {view === 'login' ? 'Admin Portal' : view === 'register' ? 'Join as Admin' : 'Admin Access'}
              </h1>
              <p className="text-xl text-text-secondary max-w-md leading-relaxed">
                Secure administration panel for managing the entire MerchantHub ecosystem.
              </p>
            </motion.div>

            <div className="space-y-8">
              {features.map((feature, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.1 }} className="flex items-start gap-4 group">
                  <div className="mt-1 p-2 rounded-lg border border-white/10 bg-white/5 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-text-secondary text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-sm text-text-secondary opacity-50">© 2026 MerchantHub Ecosystem</div>
        </div>
      </div>

      {/* Right Side: Auth Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial from-purple-500/10 to-transparent pointer-events-none" />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10 py-10">
          <div className="bg-card-bg rounded-[20px] p-8 sm:p-10 shadow-2xl shadow-black/40 border border-white/5">

            {/* Admin Badge */}
            <div className="flex justify-center mb-8">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r ${adminColor} text-white text-sm font-semibold shadow-lg`}>
                <ShieldCheck size={16} />
                Administrator
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">{viewMeta[view].heading}</h2>
              <p className="text-text-secondary">{viewMeta[view].sub}</p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Email — shown on all views except reset-password */}
              {view !== 'reset-password' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Email Address</label>
                  <input name="email" type="email" required placeholder="admin@example.com" className="auth-input" value={formData.email} onChange={handleInputChange} />
                </div>
              )}

              {/* Password — shown on login AND register */}
              {(view === 'login' || view === 'register') && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
                    {view === 'login' && (
                      <button type="button" onClick={() => switchView('forgot-password')} className="text-[10px] text-purple-400 hover:underline font-bold uppercase tracking-tighter">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="auth-input pr-12"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password — reset-password only */}
              {view === 'reset-password' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">New Password</label>
                  <input name="new_password" type="password" required placeholder="••••••••" className="auth-input" value={formData.new_password} onChange={handleInputChange} />
                </div>
              )}

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full h-13 bg-linear-to-r ${adminColor} rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {view === 'login'
                      ? 'Login to Dashboard'
                      : view === 'register'
                      ? 'Create Admin Account'
                      : view === 'forgot-password'
                      ? 'Send Reset Link'
                      : 'Update Password'}
                    {view === 'register' ? <UserPlus size={18} /> : <ArrowRight size={18} />}
                  </>
                )}
              </motion.button>

              {/* ← Register toggle: shown only on login */}
              {view === 'login' && (
                <p className="text-center text-sm text-text-secondary pt-1">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchView('register')} className="text-purple-400 font-semibold hover:underline">
                    Register as Admin
                  </button>
                </p>
              )}

              {/* ← Sign in link: shown only on register */}
              {view === 'register' && (
                <p className="text-center text-sm text-text-secondary pt-1">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView('login')} className="text-purple-400 font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              )}

              {/* Back to login — forgot-password & reset-password */}
              {(view === 'forgot-password' || view === 'reset-password') && (
                <button type="button" onClick={() => switchView('login')} className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-white transition-colors py-2">
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              )}
            </form>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background-color: #0F172A;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: white;
          transition: all 0.2s;
        }
        .auth-input:focus {
          outline: none;
          border-color: #A855F7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }
        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}