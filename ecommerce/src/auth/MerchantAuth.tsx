/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Eye, EyeOff, BarChart3, Zap,
  ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Store, Upload,  MapPin
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';

type View = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function MerchantAuth() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
const [confirmPassword, setConfirmPassword] = useState('');
const [passwordStrength, setPasswordStrength] = useState<'weak' | 'neutral' | 'strong' | ''>('');
const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [formData, setFormData] = useState({
  name: '', restaurant_name: '', email: '', business_number: '',
  password: '', new_password: '', document: null as File | null,
  cover_image: null as File | null, latitude: '', longitude: '',
});

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('token') && window.location.pathname.includes('reset-password')) {
    setView('reset-password');
  }

  // Auto-fetch location on load
  if (navigator.geolocation) {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  }
}, []);
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  if (name === 'password') checkPasswordStrength(value);
};
const handleConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setConfirmPassword(val);
  setPasswordMatch(val === formData.password);
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData((prev) => ({ ...prev, document: e.target.files![0] }));
  };
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) setFormData((prev) => ({ ...prev, cover_image: e.target.files![0] }));
};
const fetchLocation = () => {
  if (!navigator.geolocation) return;
  setLocationLoading(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setFormData((prev) => ({
        ...prev,
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
      }));
      setLocationLoading(false);
    },
    () => setLocationLoading(false)
  );
};
const checkPasswordStrength = (pwd: string) => {
  if (!pwd) return setPasswordStrength('');
  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const neutral = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
  if (strong.test(pwd)) setPasswordStrength('strong');
  else if (neutral.test(pwd)) setPasswordStrength('neutral');
  else setPasswordStrength('weak');
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (view === 'register' && formData.password !== confirmPassword) {
  setMessage({ type: 'error', text: 'Passwords do not match.' });
  setLoading(false);
  return;
}

    try {
      let endpoint = '';
      let data: any = {};
      let headers: any = {};

      if (view === 'login') {
        endpoint = '/merchant/login/';
        data = { email: formData.email, password: formData.password };
      } else if (view === 'register') {
        endpoint = '/merchant/register/';
        const form = new FormData();
        form.append('name', formData.name);
        form.append('restaurant_name', formData.restaurant_name);
        form.append('email', formData.email);
        form.append('business_number', formData.business_number);
        form.append('password', formData.password);
        if (formData.document) form.append('document', formData.document);
        if (formData.cover_image) form.append('cover_image', formData.cover_image);
if (formData.latitude) form.append('latitude', formData.latitude);
if (formData.longitude) form.append('longitude', formData.longitude);
        data = form;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else if (view === 'forgot-password') {
        endpoint = '/forgot-password/';
        data = { email: formData.email, role: 'merchant' };
      } else if (view === 'reset-password') {
        const token = new URLSearchParams(window.location.search).get('token');
        endpoint = '/reset-password/';
        data = { token, new_password: formData.new_password };
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, { headers });

      setMessage({
        type: 'success',
        text: response.data.message || (view === 'login' ? 'Login Successful!' : 'Request Processed Successfully'),
      });

    if (view === 'login') {
  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);
  localStorage.setItem('email', response.data.email);
  localStorage.setItem('role', 'merchant'); // force merchant

  setTimeout(() => {
    navigate('/merchant/dashboard', { replace: true });
  }, 800);
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

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Real-time Analytics', desc: 'Monitor your restaurant performance.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Fast Operations', desc: 'Optimized workflows for merchants.' },
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Platform', desc: 'Enterprise-grade security for your data.' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans text-text-primary overflow-hidden">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center hover:scale-110 transition-transform duration-[10000ms]"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop")', filter: 'blur(2px)' }}
        />
        <div className="absolute inset-0 bg-linear-to-br from-brand-bg/95 via-brand-bg/85 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full max-w-2xl">
          <div />
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6 capitalize">
                {view === 'login' ? 'Welcome Back, Merchant' : 'Join as a Merchant'}
              </h1>
              <p className="text-xl text-text-secondary max-w-md leading-relaxed">
                The unified portal for merchants to manage their restaurants and the food ecosystem.
              </p>
            </motion.div>
            <div className="space-y-8">
              {features.map((f, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.1 }} className="flex items-start gap-4 group">
                  <div className="mt-1 p-2 rounded-lg border border-white/10 bg-white/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">{f.icon}</div>
                  <div><h3 className="font-semibold text-lg">{f.title}</h3><p className="text-text-secondary text-sm">{f.desc}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-sm text-text-secondary opacity-50">© 2026 MerchantHub Ecosystem</div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial from-brand-primary/10 to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10 py-10">
          <div className="bg-card-bg rounded-[20px] p-8 sm:p-10 shadow-2xl shadow-black/40 border border-white/5">

            {/* Role Badge */}
            <div className="flex mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 text-white text-sm font-medium shadow-lg">
                <Store size={16} />
                <span>Merchant Portal</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 capitalize">
                {view === 'login' ? 'Login' : view === 'register' ? 'Register' : view === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
              </h2>
              <p className="text-text-secondary">
                {view === 'login' ? 'Access your merchant dashboard.' : view === 'register' ? 'Create your merchant account.' : 'Follow the instructions to proceed.'}
              </p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>
             

              {/* Email — only for non-register, non-reset views */}
{view !== 'reset-password' && view !== 'register' && (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Email Address</label>
    <input name="email" type="email" required placeholder="name@example.com" className="auth-input" value={formData.email} onChange={handleInputChange} />
  </div>
)}

{/* Login password */}
{view === 'login' && (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center ml-1">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
      <button type="button" onClick={() => setView('forgot-password')} className="text-[10px] text-brand-primary hover:underline font-bold uppercase tracking-tighter">Forgot Password?</button>
    </div>
    <div className="relative">
      <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="auth-input pr-12" value={formData.password} onChange={handleInputChange} />
      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors">
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
)}

{/* Register — 2 steps */}
{view === 'register' && (
  <AnimatePresence mode="wait">
    {registerStep === 1 && (
      <motion.div key="step1"
        initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Full Name</label>
          <input name="name" type="text" required placeholder="John Doe" className="auth-input" value={formData.name} onChange={handleInputChange} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Restaurant Name</label>
          <input name="restaurant_name" type="text" required placeholder="The Gourmet Kitchen" className="auth-input" value={formData.restaurant_name} onChange={handleInputChange} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Business Number</label>
          <input name="business_number" type="text" required placeholder="BN-12345678" className="auth-input" value={formData.business_number} onChange={handleInputChange} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Email Address</label>
          <input name="email" type="email" required placeholder="name@example.com" className="auth-input" value={formData.email} onChange={handleInputChange} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="auth-input pr-12" value={formData.password} onChange={handleInputChange} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordStrength && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1 flex-1">
                {['weak', 'neutral', 'strong'].map((level) => (
                  <div key={level} className={`h-1 flex-1 rounded-full transition-all ${
                    passwordStrength === 'weak' && level === 'weak' ? 'bg-red-500' :
                    passwordStrength === 'neutral' && (level === 'weak' || level === 'neutral') ? 'bg-yellow-500' :
                    passwordStrength === 'strong' ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <span className={`text-xs font-medium capitalize ${
                passwordStrength === 'weak' ? 'text-red-400' :
                passwordStrength === 'neutral' ? 'text-yellow-400' : 'text-emerald-400'
              }`}>{passwordStrength}</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Confirm Password</label>
          <input type="password" placeholder="••••••••" className={`auth-input border ${
            passwordMatch === null ? 'border-input-border' :
            passwordMatch ? 'border-emerald-500/50' : 'border-red-500/50'
          }`} value={confirmPassword} onChange={handleConfirmPassword} />
          {passwordMatch === false && <p className="text-xs text-red-400 ml-1 mt-1">Passwords do not match</p>}
          {passwordMatch === true && <p className="text-xs text-emerald-400 ml-1 mt-1">Passwords match ✓</p>}
        </div>
        <button type="button"
          onClick={() => {
            if (!formData.name || !formData.restaurant_name || !formData.business_number || !formData.email || !formData.password) {
              setMessage({ type: 'error', text: 'Please fill all fields before proceeding.' });
              return;
            }
            if (!passwordMatch) {
              setMessage({ type: 'error', text: 'Passwords do not match.' });
              return;
            }
            setMessage(null);
            setRegisterStep(2);
          }}
          className="w-full h-13 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all"
        >
          Next <ArrowRight size={18} />
        </button>
      </motion.div>
    )}

    {registerStep === 2 && (
      <motion.div key="step2"
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Business Document</label>
          <div className="relative">
            <input type="file" required onChange={handleFileChange} className="hidden" id="doc-upload" accept=".pdf,.jpg,.png" />
            <label htmlFor="doc-upload" className="auth-input flex items-center justify-between cursor-pointer hover:border-brand-primary/50 transition-colors">
              <span className="text-text-secondary truncate max-w-50">{formData.document ? formData.document.name : 'Upload PDF/Image'}</span>
              <Upload size={18} className="text-brand-primary" />
            </label>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Cover Image</label>
          <div className="relative">
            <input type="file" onChange={handleCoverImageChange} className="hidden" id="cover-upload" accept=".jpg,.jpeg,.png,.webp" />
            <label htmlFor="cover-upload" className="auth-input flex items-center justify-between cursor-pointer hover:border-brand-primary/50 transition-colors">
              <span className="text-text-secondary truncate max-w-50">{formData.cover_image ? formData.cover_image.name : 'Upload Cover Image'}</span>
              <Upload size={18} className="text-brand-primary" />
            </label>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">
            Location {locationLoading && <span className="text-brand-primary normal-case">(detecting...)</span>}
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input name="latitude" type="text" placeholder="Latitude" className="auth-input" value={formData.latitude} onChange={handleInputChange} />
            </div>
            <div className="relative flex-1">
              <input name="longitude" type="text" placeholder="Longitude" className="auth-input" value={formData.longitude} onChange={handleInputChange} />
            </div>
            <button type="button" onClick={fetchLocation} title="Get my current location"
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-input-border bg-[#0F172A] text-brand-primary hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
              {locationLoading
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <MapPin size={18} />}
            </button>
          </div>
          {formData.latitude && formData.longitude && (
            <a href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-primary hover:underline mt-1 inline-block">
              Preview on Google Maps
            </a>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setRegisterStep(1)}
            className="flex-1 h-13 rounded-xl font-semibold border border-white/10 text-slate-300 hover:bg-white/8 transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Back
          </button>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={loading}
            className="flex-1 h-13 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all disabled:opacity-50">
            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit <ArrowRight size={18} /></>}
          </motion.button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)}

{/* Reset password field */}
{view === 'reset-password' && (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">New Password</label>
    <input name="new_password" type="password" required placeholder="••••••••" className="auth-input" value={formData.new_password} onChange={handleInputChange} />
  </div>
)}

{/* Submit button — only for login, forgot-password, reset-password */}
{view !== 'register' && (
  <motion.button
    whileHover={{ scale: 1.01, translateY: -2 }} whileTap={{ scale: 0.98 }}
    disabled={loading}
    className="w-full h-13 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? (
      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      <>{view === 'login' ? 'Login to Dashboard' : view === 'forgot-password' ? 'Send Reset Link' : 'Update Password'}<ArrowRight size={18} /></>
    )}
  </motion.button>
)}

              

            

              {view !== 'login' && (
                <button type="button" onClick={() => { setView('login'); setRegisterStep(1); }} className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-white transition-colors py-2">
                  <ArrowLeft size={16} /> Back to Login
                </button>
              )}
            </form>

            {view === 'login' && (
              <p className="mt-8 text-center text-sm text-text-secondary">
                Don't have an account?{' '}
                <button onClick={() => { setView('register'); setRegisterStep(1); }} className="text-brand-primary font-semibold hover:underline">Register as Merchant</button>
              </p>
            )}

          
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-input { width: 100%; background-color: #0F172A; border: 1px solid #334155; border-radius: 0.75rem; padding: 0.875rem 1rem; color: white; transition: all 0.2s; }
        .auth-input:focus { outline: none; border-color: #F97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2); }
        .auth-input::placeholder { color: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}