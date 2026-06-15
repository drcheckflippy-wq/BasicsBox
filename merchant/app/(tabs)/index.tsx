/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
  View as RNView,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'https://basicsbox.pythonanywhere.com/api';

type AuthViewType = 'login' | 'register' | 'forgot-password' | 'reset-password';
const backgroundImage = { uri: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop' };
const logoImage = require('../../assets/images/icon.png');

export default function MerchantAuth() {
  const router = useRouter();
  const [view, setView] = useState<AuthViewType>('login');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'neutral' | 'strong' | ''>('');
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Use a ref to track if redirect has happened (refs don't trigger re-renders)
  const hasRedirected = React.useRef(false);
  
  const [formData, setFormData] = useState({
    name: '',
    restaurant_name: '',
    email: '',
    business_number: '',
    password: '',
    new_password: '',
    document: null as any,
    cover_image: null as any,
    latitude: '',
    longitude: '',
  });

  // ✅ FIXED: Auth check - runs only once
  useEffect(() => {
    let isMounted = true;
    
    const checkExistingLogin = async () => {
      // Prevent multiple redirects using ref
      if (hasRedirected.current) return;
      
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        console.log('🔐 Auth Check - Access token:', !!accessToken);
        console.log('🔐 Auth Check - Refresh token:', !!refreshToken);
        
        if (accessToken && refreshToken && !hasRedirected.current) {
          try {
            const response = await axios.get(`${API_BASE_URL}/merchant/restaurant/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (isMounted && !hasRedirected.current) {
              hasRedirected.current = true;
              router.replace('/merchant/dashboard');
            }
            return;
          } catch (error: any) {
            if (error.response?.status === 401 && !hasRedirected.current) {
              try {
                const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                  refresh_token: refreshToken
                });
                await AsyncStorage.setItem('access_token', refreshRes.data.access_token);
                if (isMounted && !hasRedirected.current) {
                  hasRedirected.current = true;
                  router.replace('/merchant/dashboard');
                }
                return;
              } catch {
                console.log('Refresh failed, staying on login');
              }
            }
          }
        }
      } catch (error) {
        console.log('Check existing login error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkExistingLogin();
    
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty dependency array - runs only once

  // Auto-dismiss messages
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // Location permission effect
  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setFormData((prev) => ({
            ...prev,
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString(),
          }));
        }
      } catch (error) {
        console.log('Location error:', error);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

if (isLoading) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} /> 
      <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </RNView>
    </>
  );
}
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') checkPasswordStrength(value);
  };

  const handleConfirmPassword = (val: string) => {
    setConfirmPassword(val);
    setPasswordMatch(val === formData.password);
  };

  const pickImage = async (type: 'document' | 'cover_image') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'document' ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        setFormData((prev) => ({ ...prev, [type]: result.assets[0] }));
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setFormData((prev) => ({
          ...prev,
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString(),
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    } finally {
      setLocationLoading(false);
    }
  };

  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) return setPasswordStrength('');
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const neutral = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (strong.test(pwd)) setPasswordStrength('strong');
    else if (neutral.test(pwd)) setPasswordStrength('neutral');
    else setPasswordStrength('weak');
  };

  const handleSubmit = async () => {
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
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('restaurant_name', formData.restaurant_name);
        formDataObj.append('email', formData.email);
        formDataObj.append('business_number', formData.business_number);
        formDataObj.append('password', formData.password);
        if (formData.document) {
          formDataObj.append('document', {
            uri: formData.document.uri,
            type: formData.document.mimeType || 'image/jpeg',
            name: formData.document.fileName || 'document.jpg',
          } as any);
        }
        if (formData.cover_image) {
          formDataObj.append('cover_image', {
            uri: formData.cover_image.uri,
            type: formData.cover_image.mimeType || 'image/jpeg',
            name: formData.cover_image.fileName || 'cover.jpg',
          } as any);
        }
        if (formData.latitude) formDataObj.append('latitude', formData.latitude);
        if (formData.longitude) formDataObj.append('longitude', formData.longitude);
        data = formDataObj;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else if (view === 'forgot-password') {
        endpoint = '/forgot-password/';
        data = { email: formData.email, role: 'merchant' };
      } else if (view === 'reset-password') {
        endpoint = '/reset-password/';
        data = { new_password: formData.new_password };
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, { headers });

      setMessage({
        type: 'success',
        text: response.data.message || (view === 'login' ? 'Login Successful!' : 'Request Processed Successfully'),
      });

      if (view === 'login') {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
        await AsyncStorage.setItem('email', response.data.email);
        await AsyncStorage.setItem('role', 'merchant');
        setTimeout(() => {
          router.replace('/merchant/dashboard');
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

  const openMaps = () => {
    const url = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;
    Linking.openURL(url);
  };

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <ImageBackground source={backgroundImage} style={styles.container}>
      {/* Stronger dark gradient overlay for text contrast */}
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
            {/* Glass card: high-intensity blur + dark tint */}
            <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
              {/* Extra dark scrim layer inside the blur */}
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
                      colors={['#F97316', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.badge}
                    >
                      <Ionicons name="storefront" size={16} color="#fff" />
                      <Text style={styles.badgeText}>Merchant Portal</Text>
                    </LinearGradient>
                  </RNView>

                  {/* Title Section */}
                  <RNView style={styles.titleContainer}>
                    <Text style={styles.title}>
                      {view === 'login' ? 'Login' :
                       view === 'register' ? 'Register' :
                       view === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {view === 'login' ? 'Access your merchant dashboard.' :
                       view === 'register' ? 'Create your merchant account.' :
                       'Follow the instructions to proceed.'}
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

                    {/* Email - non-register, non-reset */}
                    {view !== 'reset-password' && view !== 'register' && (
                      <RNView style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="name@example.com"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          value={formData.email}
                          onChangeText={(val) => handleInputChange('email', val)}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </RNView>
                    )}

                    {/* Login password */}
                    {view === 'login' && (
                      <RNView style={styles.inputGroup}>
                        <RNView style={styles.passwordHeader}>
                          <Text style={styles.label}>PASSWORD</Text>
                          <TouchableOpacity onPress={() => setView('forgot-password')}>
                            <Text style={styles.forgotPassword}>Forgot Password?</Text>
                          </TouchableOpacity>
                        </RNView>
                        <RNView style={styles.passwordContainer}>
                          <TextInput
                            style={styles.passwordInput}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={formData.password}
                            onChangeText={(val) => handleInputChange('password', val)}
                            secureTextEntry={!showPassword}
                          />
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.7)" />
                          </TouchableOpacity>
                        </RNView>
                      </RNView>
                    )}

                    {/* Register - 2 steps */}
                    {view === 'register' && (
                      <AnimatePresence>
                        {registerStep === 1 ? (
                          <MotiView
                            key="step1"
                            from={{ opacity: 0, translateX: -40 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: -40 }}
                            transition={{ type: 'timing', duration: 250 }}
                          >
                            <RNView style={styles.inputGroup}>
                              <Text style={styles.label}>FULL NAME</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="Surrender"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={formData.name}
                                onChangeText={(val) => handleInputChange('name', val)}
                              />
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>RESTAURANT NAME</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="The Gourmet Kitchen"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={formData.restaurant_name}
                                onChangeText={(val) => handleInputChange('restaurant_name', val)}
                              />
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>BUSINESS NUMBER</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="BN-12345678"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={formData.business_number}
                                onChangeText={(val) => handleInputChange('business_number', val)}
                              />
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>EMAIL ADDRESS</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={formData.email}
                                onChangeText={(val) => handleInputChange('email', val)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                              />
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>PASSWORD</Text>
                              <RNView style={styles.passwordContainer}>
                                <TextInput
                                  style={styles.passwordInput}
                                  placeholder="••••••••"
                                  placeholderTextColor="rgba(255,255,255,0.35)"
                                  value={formData.password}
                                  onChangeText={(val) => handleInputChange('password', val)}
                                  secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                              </RNView>

                              {passwordStrength !== '' && (
                                <RNView style={styles.strengthContainer}>
                                  <RNView style={styles.strengthBars}>
                                    {['weak', 'neutral', 'strong'].map((level) => (
                                      <RNView
                                        key={level}
                                        style={[
                                          styles.strengthBar,
                                          passwordStrength === 'weak' && level === 'weak' && styles.strengthWeak,
                                          passwordStrength === 'neutral' && (level === 'weak' || level === 'neutral') && styles.strengthNeutral,
                                          passwordStrength === 'strong' && styles.strengthStrong,
                                        ]}
                                      />
                                    ))}
                                  </RNView>
                                  <Text style={[
                                    styles.strengthText,
                                    passwordStrength === 'weak' && styles.weakText,
                                    passwordStrength === 'neutral' && styles.neutralText,
                                    passwordStrength === 'strong' && styles.strongText,
                                  ]}>
                                    {passwordStrength}
                                  </Text>
                                </RNView>
                              )}
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>CONFIRM PASSWORD</Text>
                              <TextInput
                                style={[
                                  styles.input,
                                  passwordMatch === false && styles.inputError,
                                  passwordMatch === true && styles.inputSuccess,
                                ]}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={confirmPassword}
                                onChangeText={handleConfirmPassword}
                                secureTextEntry
                              />
                              {passwordMatch === false && (
                                <Text style={styles.matchErrorText}>Passwords do not match</Text>
                              )}
                              {passwordMatch === true && (
                                <Text style={styles.matchSuccessText}>Passwords match ✓</Text>
                              )}
                            </RNView>

                            <TouchableOpacity
                              onPress={() => {
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
                              style={styles.nextButton}
                            >
                              <LinearGradient
                                colors={['#F97316', '#F59E0B']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                              >
                                <Text style={styles.buttonText}>Next</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                              </LinearGradient>
                            </TouchableOpacity>
                          </MotiView>
                        ) : (
                          <MotiView
                            key="step2"
                            from={{ opacity: 0, translateX: 40 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 40 }}
                            transition={{ type: 'timing', duration: 250 }}
                          >
                            <RNView style={styles.inputGroup}>
                              <Text style={styles.label}>BUSINESS DOCUMENT</Text>
                              <TouchableOpacity onPress={() => pickImage('document')} style={styles.fileButton}>
                                <Text style={styles.fileButtonText} numberOfLines={1}>
                                  {formData.document ? formData.document.fileName : 'Upload PDF/Image'}
                                </Text>
                                <Ionicons name="cloud-upload" size={18} color="#F97316" />
                              </TouchableOpacity>
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>COVER IMAGE</Text>
                              <TouchableOpacity onPress={() => pickImage('cover_image')} style={styles.fileButton}>
                                <Text style={styles.fileButtonText} numberOfLines={1}>
                                  {formData.cover_image ? formData.cover_image.fileName : 'Upload Cover Image'}
                                </Text>
                                <Ionicons name="cloud-upload" size={18} color="#F97316" />
                              </TouchableOpacity>
                            </RNView>

                            <RNView style={[styles.inputGroup, { marginTop: 16 }]}>
                              <Text style={styles.label}>
                                LOCATION {locationLoading && '(detecting...)'}
                              </Text>
                              <RNView style={styles.locationRow}>
                                <TextInput
                                  style={[styles.input, styles.locationInput]}
                                  placeholder="Latitude"
                                  placeholderTextColor="rgba(255,255,255,0.35)"
                                  value={formData.latitude}
                                  onChangeText={(val) => handleInputChange('latitude', val)}
                                />
                                <TextInput
                                  style={[styles.input, styles.locationInput]}
                                  placeholder="Longitude"
                                  placeholderTextColor="rgba(255,255,255,0.35)"
                                  value={formData.longitude}
                                  onChangeText={(val) => handleInputChange('longitude', val)}
                                />
                                <TouchableOpacity onPress={fetchLocation} style={styles.locationButton}>
                                  {locationLoading ? (
                                    <ActivityIndicator size="small" color="#F97316" />
                                  ) : (
                                    <Ionicons name="location" size={18} color="#F97316" />
                                  )}
                                </TouchableOpacity>
                              </RNView>
                              {formData.latitude && formData.longitude && (
                                <TouchableOpacity onPress={openMaps}>
                                  <Text style={styles.mapLink}>Preview on Google Maps</Text>
                                </TouchableOpacity>
                              )}
                            </RNView>

                            <RNView style={styles.buttonRow}>
                              <TouchableOpacity onPress={() => setRegisterStep(1)} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={18} color="#fff" />
                                <Text style={styles.backButtonText}>Back</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                style={[styles.submitButton, loading && styles.disabledButton]}
                              >
                                <LinearGradient
                                  colors={['#F97316', '#F59E0B']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={[styles.gradientButton, loading && styles.disabledGradient]}
                                >
                                  {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <>
                                      <Text style={styles.buttonText}>Submit</Text>
                                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </>
                                  )}
                                </LinearGradient>
                              </TouchableOpacity>
                            </RNView>
                          </MotiView>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Reset password field */}
                    {view === 'reset-password' && (
                      <RNView style={styles.inputGroup}>
                        <Text style={styles.label}>NEW PASSWORD</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          value={formData.new_password}
                          onChangeText={(val) => handleInputChange('new_password', val)}
                          secureTextEntry
                        />
                      </RNView>
                    )}

                    {/* Submit button - non-register views */}
                    {view !== 'register' && (
                      <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        style={[styles.submitMainButton, loading && styles.disabledButton]}
                      >
                        <LinearGradient
                          colors={['#F97316', '#F59E0B']}
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
                                 view === 'forgot-password' ? 'Send Reset Link' : 'Update Password'}
                              </Text>
                              <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {/* Back to Login */}
                    {view !== 'login' && (
                      <TouchableOpacity
                        onPress={() => { setView('login'); setRegisterStep(1); }}
                        style={styles.backToLogin}
                      >
                        <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
                      </TouchableOpacity>
                    )}
                  </RNView>

                  {/* Register Link */}
                  {view === 'login' && (
                    <RNView style={styles.registerContainer}>
                      <Text style={styles.registerText}>Don't have an account? </Text>
                      <TouchableOpacity onPress={() => { setView('register'); setRegisterStep(1); }}>
                        <Text style={styles.registerLink}>Register as Merchant</Text>
                      </TouchableOpacity>
                    </RNView>
                  )}

                </RNView>
              </RNView>
            </BlurView>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    // Stronger overlay so background is subdued but still visible
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

  // ── Card shell ─────────────────────────────────────────────────────────────
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    // Glowing amber shadow to match brand
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    // Subtle warm-tinted border (top-left highlight)
    borderWidth: 1,
    borderColor: 'rgba(255,200,120,0.18)',
  },

  // BlurView: high intensity + dark tint = readable frosted glass
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 28,
  },

  // Extra dark scrim layer placed INSIDE the blur for reliable text contrast
  scrim: {
    backgroundColor: 'rgba(8,6,4,0.62)',
  },

  content: {
    padding: 24,
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
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
    color: '#F97316',
    letterSpacing: 0.5,
  },

  // ── Badge ──────────────────────────────────────────────────────────────────
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

  // ── Title ──────────────────────────────────────────────────────────────────
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textTransform: 'capitalize',
    // Subtle text shadow to lift text off glass
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },

  // ── Alert messages ─────────────────────────────────────────────────────────
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

  // ── Form layout ────────────────────────────────────────────────────────────
  form: {
    gap: 0, // We control spacing manually per group
  },
  inputGroup: {
    gap: 6,
  },

  // ── Labels: bright white, uppercase, spaced ────────────────────────────────
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 2,
    // Subtle shadow so label is legible over any background
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Inputs: solid-dark bg = always readable ────────────────────────────────
  input: {
    // Solid enough to guarantee contrast; dark navy-black
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
  inputError: {
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  inputSuccess: {
    borderColor: '#34D399',
    borderWidth: 1.5,
  },

  // ── Password field ─────────────────────────────────────────────────────────
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 11,
    color: '#FCD34D',
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

  // ── Password strength ──────────────────────────────────────────────────────
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
  },
  strengthWeak: { backgroundColor: '#F87171' },
  strengthNeutral: { backgroundColor: '#FBBF24' },
  strengthStrong: { backgroundColor: '#34D399' },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    minWidth: 46,
    textAlign: 'right',
  },
  weakText: { color: '#F87171' },
  neutralText: { color: '#FBBF24' },
  strongText: { color: '#34D399' },

  // Inline match feedback
  matchErrorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginTop: 2,
  },
  matchSuccessText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginTop: 2,
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  nextButton: {
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
  submitMainButton: {
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledGradient: {
    opacity: 0.7,
  },

  // ── File picker ────────────────────────────────────────────────────────────
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,12,22,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fileButtonText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },

  // ── Location row ───────────────────────────────────────────────────────────
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(10,12,22,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLink: {
    fontSize: 12,
    color: '#FB923C',
    marginTop: 6,
    marginLeft: 2,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  // ── Button row (step 2) ────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
  },

  // ── Back to login link ─────────────────────────────────────────────────────
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

  // ── Register link at bottom ────────────────────────────────────────────────
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
    color: '#FB923C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});