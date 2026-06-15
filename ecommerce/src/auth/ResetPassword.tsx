/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, 
  Lock, ShieldCheck, KeyRound
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setMessage({
        type: 'error',
        text: 'No reset token found. Please request a new password reset link.'
      });
    }
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePasswords = () => {
    if (formData.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
      });
      return false;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Invalid or missing reset token'
      });
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password/`, {
        token: token,
        new_password: formData.new_password
      });

      setMessage({
        type: 'success',
        text: response.data.message || 'Password has been reset successfully!'
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/customer');
      }, 2000);

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.response?.data?.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.new_password;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength === 0) return 'bg-gray-600';
    if (strength <= 2) return 'bg-red-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength === 0) return 'Enter password';
    if (strength <= 2) return 'Weak';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const features = [
    { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Reset', desc: 'Enterprise-grade security for your password reset.' },
    { icon: <KeyRound className="w-5 h-5" />, title: 'Strong Password', desc: 'Create a strong password to protect your account.' },
    { icon: <Lock className="w-5 h-5" />, title: 'Encrypted', desc: 'All data is encrypted during transmission.' },
  ];

  return (
    <div className="flex h-screen font-sans overflow-hidden">
      {/* Full screen background image */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop")',
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Left: Branding - Desktop only */}
      <div className="hidden lg:flex lg:w-[60%] relative z-10 overflow-y-auto min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full max-w-2xl min-h-screen">
          <div />
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6 capitalize text-white">
                Reset Your Password
              </h1>
              <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                Create a new strong password to secure your account and continue enjoying our services.
              </p>
            </motion.div>
            <div className="space-y-8">
              {features.map((f, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.4 + idx * 0.1 }} 
                  className="flex items-start gap-4 group"
                >
                  <div className="mt-1 p-2 rounded-lg border border-white/30 bg-white/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{f.title}</h3>
                    <p className="text-gray-300 text-sm">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Right: Reset Password Card */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 h-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-md"
        >
          {/* Glass Card */}
          <div className="rounded-[20px] p-5 sm:p-6 shadow-2xl border border-white/30 bg-white/10 dark:bg-black/30 backdrop-blur-[2px]">
            
            {/* Role Badge */}
            <div className="flex mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg">
                <KeyRound size={16} />
                <span>Password Reset</span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-1 capitalize text-white">
                Reset Password
              </h2>
              <p className="text-white/80 text-sm">
                Enter your new password below to reset your account password
              </p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40' 
                      : 'bg-red-500/30 text-red-200 border border-red-500/40'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="flex-1">{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    name="new_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    className="w-full bg-white/20 border border-white/30 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    value={formData.new_password}
                    onChange={handleInputChange}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="space-y-1 px-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 h-full rounded-full transition-colors ${
                          level <= passwordStrength() ? getStrengthColor() : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] ${passwordStrength() <= 2 ? 'text-red-400' : passwordStrength() === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                    Password strength: {getStrengthText()}
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 ml-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    className="w-full bg-white/20 border border-white/30 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements - Simplified */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/20">
                <p className="text-[10px] font-medium text-white/60 mb-1.5">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${formData.new_password.length >= 8 ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`text-[9px] ${formData.new_password.length >= 8 ? 'text-green-400' : 'text-white/50'}`}>
                      8+ chars
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(formData.new_password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`text-[9px] ${/[A-Z]/.test(formData.new_password) ? 'text-green-400' : 'text-white/50'}`}>
                      Uppercase
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(formData.new_password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`text-[9px] ${/[0-9]/.test(formData.new_password) ? 'text-green-400' : 'text-white/50'}`}>
                      Number
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(formData.new_password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`text-[9px] ${/[^A-Za-z0-9]/.test(formData.new_password) ? 'text-green-400' : 'text-white/50'}`}>
                      Special
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01, translateY: -2 }} 
                whileTap={{ scale: 0.98 }}
                disabled={loading || !formData.new_password || !formData.confirm_password}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Reset Password
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={() => navigate('/customer')}
                className="w-full flex items-center justify-center gap-2 text-xs text-white/70 hover:text-white transition-colors py-2"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[10px] text-white/40 mt-4">
            This link will expire in 24 hours for security purposes
          </p>
        </motion.div>
      </div>
    </div>
  );
}