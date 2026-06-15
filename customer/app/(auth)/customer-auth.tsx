import React, { useState, useEffect } from 'react';
import {
  View as RNView,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const backgroundImage = { uri: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop' };
const logoImage = require('../../assets/images/icon.png');

type AuthView = 'login' | 'register' | 'forgot-password';

export default function CustomerAuth() {
  const router = useRouter();
  const { signIn } = useAuth(); // Use auth context
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    Haptics.notificationAsync(
      type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
    );
  };

  const handleSubmit = async () => {
    if (view === 'login' && (!formData.email || !formData.password)) {
      showMessage('error', 'Please fill in all fields');
      return;
    }
    
    if (view === 'register' && (!formData.name || !formData.email || !formData.phone || !formData.password)) {
      showMessage('error', 'Please fill in all fields');
      return;
    }

    if (view === 'forgot-password' && !formData.email) {
      showMessage('error', 'Please enter your email');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (view === 'login') {
        const response = await authService.login(formData.email, formData.password);
        await signIn({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          email: response.email,
          role: response.role || 'customer',
          name: response.name,
        });
        showMessage('success', 'Login Successful!');
        setTimeout(() => router.replace('/(tabs)'), 800);
      } 
      else if (view === 'register') {
        const response = await authService.register(formData.name, formData.email, formData.phone, formData.password);
        
        if (response.access_token) {
          await signIn({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            email: response.email,
            role: response.role || 'customer',
            name: response.name,
          });
          showMessage('success', 'Account created successfully!');
          setTimeout(() => router.replace('/(tabs)'), 800);
        } else {
          showMessage('success', 'Registration Successful! Please login.');
          setView('login');
          setFormData({ name: '', email: '', phone: '', password: '' });
        }
      } 
      else if (view === 'forgot-password') {
        await authService.forgotPassword(formData.email);
        showMessage('success', 'Reset link sent to your email!');
        setView('login');
      }
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (data: any) => {
    try {
      if (data.access_token) {
        await signIn({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          email: data.email,
          role: data.role || 'customer',
          name: data.name,
        });
        showMessage('success', 'Login Successful!');
        setTimeout(() => router.replace('/(tabs)'), 800);
      } else {
        showMessage('error', 'No token received from server');
      }
    } catch (e: any) {
      showMessage('error', 'Failed to save session');
    }
  };

  const handleGoogleError = (error: any) => {
    showMessage('error', error.message || 'Google login failed');
  };

  // Rest of your component remains the same (the JSX)
  return (
    <ImageBackground source={backgroundImage} style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(10,5,0,0.68)']}
        style={styles.overlay}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent' }}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.card}
          >
            <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
              <RNView style={styles.scrim}>
                <RNView style={styles.content}>
                  {/* Logo Section */}
                  <RNView style={styles.logoContainer}>
                    <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.brandName}>BasicsBox</Text>
                  </RNView>

                  {/* Role Badge */}
                  <RNView style={styles.badgeContainer}>
                    <LinearGradient
                      colors={['#3B82F6', '#06B6D4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.badge}
                    >
                      <Ionicons name="person" size={16} color="#fff" />
                      <Text style={styles.badgeText}>Customer Portal</Text>
                    </LinearGradient>
                  </RNView>

                  {/* Title Section */}
                  <RNView style={styles.titleContainer}>
                    <Text style={styles.title}>
                      {view === 'login' ? 'Login' : view === 'register' ? 'Register' : 'Forgot Password'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {view === 'login' ? 'Access your customer dashboard.' :
                       view === 'register' ? 'Create your customer account.' :
                       'Enter your email to reset password.'}
                    </Text>
                  </RNView>

                  {/* Message Alert */}
                  <AnimatePresence>
                    {message && (
                      <MotiView
                        from={{ opacity: 0, translateY: -10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: -10 }}
                        style={[
                          styles.messageContainer,
                          message.type === 'success' ? styles.successMessage : styles.errorMessage
                        ]}
                      >
                        <Ionicons
                          name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={message.type === 'success' ? '#34D399' : '#F87171'}
                        />
                        <Text style={[
                          styles.messageText,
                          message.type === 'success' ? styles.successText : styles.errorText
                        ]}>
                          {message.text}
                        </Text>
                      </MotiView>
                    )}
                  </AnimatePresence>

                  {/* Form Fields */}
                  <RNView style={styles.form}>
                    {/* Register Fields */}
                    {view === 'register' && (
                      <>
                        <RNView style={styles.inputGroup}>
                          <Text style={styles.label}>FULL NAME</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={formData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                          />
                        </RNView>

                        <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                          <Text style={styles.label}>PHONE NUMBER</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="+1 234 567 890"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(text) => handleInputChange('phone', text)}
                          />
                        </RNView>
                      </>
                    )}

                    {/* Email Field */}
                    {view !== 'forgot-password' && (
                      <RNView style={[styles.inputGroup, { marginTop: view === 'register' ? 16 : 0 }]}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="name@example.com"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          value={formData.email}
                          onChangeText={(text) => handleInputChange('email', text)}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </RNView>
                    )}

                    {/* Forgot Password Email */}
                    {view === 'forgot-password' && (
                      <RNView style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="name@example.com"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          value={formData.email}
                          onChangeText={(text) => handleInputChange('email', text)}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </RNView>
                    )}

                    {/* Password Field */}
                    {(view === 'login' || view === 'register') && (
                      <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                        <RNView style={styles.passwordHeader}>
                          <Text style={styles.label}>PASSWORD</Text>
                          {view === 'login' && (
                            <TouchableOpacity onPress={() => setView('forgot-password')}>
                              <Text style={styles.forgotPassword}>Forgot Password?</Text>
                            </TouchableOpacity>
                          )}
                        </RNView>
                        <RNView style={styles.passwordContainer}>
                          <TextInput
                            style={styles.passwordInput}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={formData.password}
                            onChangeText={(text) => handleInputChange('password', text)}
                            secureTextEntry={!showPassword}
                          />
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.7)" />
                          </TouchableOpacity>
                        </RNView>
                      </RNView>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={loading}
                      style={[styles.submitMainButton, loading && styles.disabledButton]}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gradientButton, loading && styles.disabledGradient]}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.buttonText}>
                              {view === 'login' ? 'Login to Dashboard' :
                               view === 'register' ? 'Create Account' :
                               'Send Reset Link'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Back to Login */}
                    {view !== 'login' && (
                      <TouchableOpacity
                        onPress={() => { setView('login'); }}
                        style={styles.backToLogin}
                      >
                        <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
                      </TouchableOpacity>
                    )}
                  </RNView>

                  {/* Divider and Google Sign-In */}
                  {view === 'login' && (
                    <>
                      <RNView style={styles.dividerContainer}>
                        <RNView style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Or</Text>
                        <RNView style={styles.dividerLine} />
                      </RNView>

                      <RNView style={{ marginTop: 8 }}>
                        <GoogleAuthButton
                          role="customer"
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                        />
                      </RNView>

                      <RNView style={styles.registerContainer}>
                        <Text style={styles.registerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => setView('register')}>
                          <Text style={styles.registerLink}>Register as Customer</Text>
                        </TouchableOpacity>
                      </RNView>
                    </>
                  )}
                </RNView>
              </RNView>
            </BlurView>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 28,
  },
  scrim: {
    backgroundColor: 'rgba(8,6,4,0.62)',
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    gap: 10,
  },
  successMessage: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: 'rgba(52,211,153,0.4)',
  },
  errorMessage: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(248,113,113,0.4)',
  },
  messageText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  successText: {
    color: '#6EE7B7',
  },
  errorText: {
    color: '#FCA5A5',
  },
  form: {
    gap: 0,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    backgroundColor: 'rgba(10,12,22,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,12,22,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitMainButton: {
    marginTop: 20,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledGradient: {
    opacity: 0.7,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  backToLoginText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  registerLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Disabled Google Sign-In styles
  disabledGoogleContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  disabledGoogleBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledGoogleWrapper: {
    position: 'relative',
    opacity: 0.6,
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    zIndex: 10,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(59,130,246,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
});