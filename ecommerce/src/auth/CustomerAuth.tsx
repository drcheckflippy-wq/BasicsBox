/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Eye, EyeOff, BarChart3, Zap,
  ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, User
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../components/GoogleAuthButton';
import logo from '../assets/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';

type View = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', new_password: '',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token') && window.location.pathname.includes('reset-password')) {
      setView('reset-password');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let endpoint = '';
      let data: any = {};

      if (view === 'login') {
        endpoint = '/customer/login/';
        data = { email: formData.email, password: formData.password };
      } else if (view === 'register') {
        endpoint = '/customer/register/';
        data = { name: formData.name, email: formData.email, phone: formData.phone, password: formData.password };
      } else if (view === 'forgot-password') {
        endpoint = '/forgot-password/';
        data = { email: formData.email, role: 'customer' };
      } else if (view === 'reset-password') {
        const token = new URLSearchParams(window.location.search).get('token');
        endpoint = '/reset-password/';
        data = { token, new_password: formData.new_password };
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

      setMessage({
        type: 'success',
        text: response.data.message || (view === 'login' ? 'Login Successful!' : 'Request Processed Successfully'),
      });

      if (view === 'login') {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('email', response.data.email);
        localStorage.setItem('role', response.data.role || 'customer');
        setTimeout(() => navigate('/', { replace: true }), 800);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.response?.data?.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    setTimeout(() => navigate('/', { replace: true }), 500);
  };

  const handleGoogleError = (error: { type: 'error' | 'pending'; message: string }) => {
    if (error.type === 'error') {
      setMessage({
        type: 'error',
        text: error.message
      });
    }
  };

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Order Tracking', desc: 'Track your orders in real-time.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Fast Checkout', desc: 'Seamless, one-tap ordering experience.' },
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Payments', desc: 'Enterprise-grade security for your data.' },
  ];

  return (
    <div className="flex h-screen font-sans overflow-hidden">
      {/* Full screen background image for all devices */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop")',
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Left: Branding with Image - Desktop only */}
      <div className="hidden lg:flex lg:w-[60%] relative z-10 overflow-y-auto min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full max-w-2xl min-h-screen">
          <div />
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6 capitalize text-white">
                {view === 'login' ? 'Welcome Back, Customer' : 'Join as a Customer'}
              </h1>
              <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                The unified portal for customers to manage orders and the food ecosystem.
              </p>
            </motion.div>
            <div className="space-y-8">
              {features.map((f, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.1 }} className="flex items-start gap-4 group">
                  <div className="mt-1 p-2 rounded-lg border border-white/30 bg-white/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">{f.icon}</div>
                  <div><h3 className="font-semibold text-lg text-white">{f.title}</h3><p className="text-gray-300 text-sm">{f.desc}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Card */}
     <div className="w-full lg:w-[40%] flex items-start justify-center p-4 sm:p-6 lg:p-8 relative z-10 min-h-screen overflow-y-auto">
      <motion.div 
  initial={{ opacity: 0, scale: 0.95 }} 
  animate={{ opacity: 1, scale: 1 }} 
  className="w-full max-w-md py-8"
>
          {/* Mobile Header - Only visible on mobile */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/30 mb-3">
              <img 
                src={logo} 
                alt="BasicsBox Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome to <span className="text-orange-400">BasicsBox</span>
            </h1>
            <p className="text-sm text-white/60">Your food delivery partner</p>
          </div>

          {/* Glass Card */}
          <div className="rounded-[20px] p-5 sm:p-6 shadow-2xl border border-white/30 bg-white/10 dark:bg-black/30 backdrop-blur-[2px]">
            
            {/* Role Badge - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg">
                <User size={16} />
                <span>Customer Portal</span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-1 capitalize text-white">
                {view === 'login' ? 'Login' : view === 'register' ? 'Register' : view === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
              </h2>
              <p className="text-white/80 text-sm"> 
                {view === 'login' ? 'Access your customer dashboard.' : view === 'register' ? 'Create your customer account.' : 'Follow the instructions to proceed.'}
              </p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div 
                  key="message"
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40' 
                      : message.type === 'info'
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40'
                      : 'bg-red-500/30 text-red-200 border border-red-500/40'
                  }`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {view === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">Full Name</label>
                    <input 
                      name="name" 
                      type="text" 
                      required 
                      placeholder="John Doe" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">Phone Number</label>
                    <input 
                      name="phone" 
                      type="tel" 
                      required 
                      placeholder="+1 234 567 890" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </>
              )}

              {view !== 'reset-password' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">Email Address</label>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="name@example.com" 
                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                  />
                </div>
              )}

              {(view === 'login' || view === 'register') && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Password</label>
                    {view === 'login' && (
                      <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-blue-300 hover:text-blue-200 hover:underline font-medium">
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
                      className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {view === 'reset-password' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">New Password</label>
                  <input 
                    name="new_password" 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    value={formData.new_password} 
                    onChange={handleInputChange} 
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01, translateY: -2 }} 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {view === 'login' ? 'Login to Dashboard' : view === 'register' ? 'Create Account' : view === 'forgot-password' ? 'Send Reset Link' : 'Update Password'}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>

              {view !== 'login' && (
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  className="w-full flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white transition-colors py-2"
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
              )}
            </form>

            {view === 'login' && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-transparent text-white/70">Or</span>
                  </div>
                </div>

                <GoogleAuthButton 
                  role="customer"
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />

                <p className="mt-4 text-center text-sm text-white/70">
                  Don't have an account?{' '}
                  <button onClick={() => setView('register')} className="text-blue-300 hover:text-blue-200 font-semibold hover:underline">Register as Customer</button>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}