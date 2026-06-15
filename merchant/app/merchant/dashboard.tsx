/**
 * MerchantDashboard – React Native (Full Update)
 *
 * NEW features added (matching React web version):
 *  - Analytics tab: summary cards + scrollable bar chart
 *  - Order polling every 5 s with new-order badge on tab
 *  - IST date filtering (getTodayIST / filterTodayIST / formatIST)
 *  - Payment-method filter: All / UPI / Cash
 *  - Mark COD order as Paid button
 *  - Order pagination (Previous / Next)
 *  - DurationPicker component (replaces plain text input for offer duration)
 *  - Old-orders cleanup interval (every 30 s)
 *  - Settings tab (language toggle + app version)
 *
 * Dependencies (unchanged):
 *   npm install axios @expo/vector-icons expo-image-picker
 *   expo install expo-image-picker
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Modal, Animated, ActivityIndicator, Alert,
  StyleSheet, Dimensions, StatusBar, SafeAreaView,
  KeyboardAvoidingView, Platform, Pressable, Switch, Linking,
} from 'react-native';
import axios from 'axios';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const API_BASE_URL = 'https://basicsbox.pythonanywhere.com/api';
const logoImage = require('../../assets/images/icon.png');

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#060B14',
  card: '#0A1628',
  modal: '#0F172A',
  orange: '#F97316',
  orangeDim: 'rgba(249,115,22,0.15)',
  orangeBorder: 'rgba(249,115,22,0.3)',
  emerald: '#10B981',
  emeraldDim: 'rgba(16,185,129,0.1)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.1)',
  blue: '#60A5FA',
  blueDim: 'rgba(96,165,250,0.1)',
  yellow: '#FBBF24',
  yellowDim: 'rgba(251,191,36,0.1)',
  purple: '#A78BFA',
  purpleDim: 'rgba(167,139,250,0.1)',
  white: '#FFFFFF',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  border: 'rgba(255,255,255,0.05)',
  border10: 'rgba(255,255,255,0.10)',
};

// ─── Language Translations ────────────────────────────────────────────────────
type Language = 'en' | 'ta';

const translations = {
  en: {
    overview: 'Overview', myMenu: 'My Menu', reviews: 'Reviews',
    addItem: 'Add Item', settings: 'Settings', logout: 'Logout',
    orders: 'Orders', tamil: 'தமிழ்', english: 'English',
    analytics: 'Analytics',
    merchantDashboard: 'Merchant Dashboard',
    manageRestaurant: 'Manage your restaurant and menu items',
    restaurantProfile: 'Restaurant Profile',
    initializeRestaurant: 'Initialize Restaurant',
    updateProfile: 'Update Profile', edit: 'Edit', delete: 'Delete',
    open: 'Open', closed: 'Closed', openNow: 'Open Now', closedNow: 'Closed Now',
    openOn: 'Open on', menuItems: 'menu items',
    noRestaurant: 'No restaurant registered yet', view: 'View',
    registerRestaurant: 'Register Your Restaurant',
    cuisineType: 'Cuisine Type', tagsComma: 'Tags (comma separated)',
    operatingDays: 'Operating Days', openingTime: 'Opening Time',
    closingTime: 'Closing Time', clickToSetOpening: 'Tap to set opening time',
    clickToSetClosing: 'Tap to set closing time',
    operatingHours: 'Operating Hours', operatingDaysLabel: 'Operating Days',
    statusAutoUpdate: 'Status updates automatically based on time and day',
    cancel: 'Cancel', saveRestaurant: 'Save Restaurant',
    myMenuItems: 'My Menu Items', addNewItem: 'Add New Item',
    noMenuItems: 'No menu items found. Add your first dish!',
    addNewMenuItem: 'Add New Menu Item', itemName: 'Item Name',
    price: 'Price (₹)', description: 'Description', foodType: 'Food Type',
    vegetarian: 'Vegetarian', nonVegetarian: 'Non-Vegetarian',
    category: 'Category', itemImage: 'Item Image',
    clickToUpload: 'Tap to upload food image', imageFormat: 'JPG, PNG up to 5MB',
    addToMenu: 'Add to Menu', editItem: 'Edit —',
    replaceImage: 'Replace Image (optional)', uploadNewImage: 'Upload new image',
    saveChanges: 'Save Changes', confirmDelete: 'Confirm Delete',
    deleteWarning: 'Are you sure you want to delete',
    cannotUndo: 'This action cannot be undone.',
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
    friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
    meals: 'Meals', tiffin: 'Tiffin', snacks: 'Snacks', veg: 'Veg', nonVeg: 'Non-Veg',
    success: 'Success', error: 'Error', imageRequired: 'Image is required',
    addedSuccessfully: 'added successfully', updatedSuccessfully: 'updated successfully',
    deletedSuccessfully: 'deleted successfully', failed: 'Failed',
    cuisinePlaceholder: 'e.g. Italian, Indian, Chinese',
    tagsPlaceholder: 'e.g. spicy, vegan, fast food',
    itemNamePlaceholder: 'e.g. Margherita Pizza',
    pricePlaceholder: '0.00', descriptionPlaceholder: 'Describe your dish...',
    selectTime: 'Select time', viewOnMap: 'View on Google Maps',
    todaysOrders: "Today's Orders", todaysRevenue: "Today's Revenue",
    totalOrders: 'Total Orders', totalRevenue: 'Total Revenue',
    markPaid: 'Mark Paid', noOrdersToday: 'No orders for today',
    paymentAll: 'All', paymentUPI: 'UPI', paymentCash: 'Cash',
    noAnalytics: 'No analytics data yet', refresh: 'Refresh',
    settingsTitle: 'Settings', appVersion: 'App Version',
    offerDuration: 'Offer Duration (hours)',
  },
  ta: {
    overview: 'மேலோட்டம்', myMenu: 'என் மெனு', reviews: 'விமர்சனங்கள்',
    addItem: 'பொருள் சேர்', settings: 'அமைப்புகள்', logout: 'வெளியேறு',
    orders: 'ஆர்டர்கள்', tamil: 'தமிழ்', english: 'ஆங்கிலம்',
    analytics: 'பகுப்பாய்வு',
    merchantDashboard: 'வணிகர் கட்டுப்பாட்டகம்',
    manageRestaurant: 'உங்கள் உணவகம் மற்றும் மெனுவை நிர்வகிக்கவும்',
    restaurantProfile: 'உணவக சுயவிவரம்',
    initializeRestaurant: 'உணவகத்தை தொடங்கு',
    updateProfile: 'சுயவிவரத்தை புதுப்பி', edit: 'திருத்து', delete: 'நீக்கு',
    open: 'திறந்த', closed: 'மூடப்பட்ட', openNow: 'இப்போது திறந்துள்ளது',
    closedNow: 'இப்போது மூடப்பட்டுள்ளது', openOn: 'திறக்கும் நாட்கள்',
    menuItems: 'மெனு பொருட்கள்',
    noRestaurant: 'இதுவரை உணவகம் பதிவு செய்யப்படவில்லை', view: 'பார்க்க',
    registerRestaurant: 'உங்கள் உணவகத்தை பதிவு செய்யுங்கள்',
    cuisineType: 'சமையல் வகை', tagsComma: 'குறிச்சொற்கள் (கமாவால் பிரிக்கவும்)',
    operatingDays: 'இயங்கும் நாட்கள்', openingTime: 'திறக்கும் நேரம்',
    closingTime: 'மூடும் நேரம்',
    clickToSetOpening: 'திறக்கும் நேரத்தை அமைக்க தட்டவும்',
    clickToSetClosing: 'மூடும் நேரத்தை அமைக்க தட்டவும்',
    operatingHours: 'இயங்கும் நேரம்', operatingDaysLabel: 'இயங்கும் நாட்கள்',
    statusAutoUpdate: 'நிலை தானாக புதுப்பிக்கப்படும்',
    cancel: 'ரத்து செய்', saveRestaurant: 'உணவகத்தை சேமி',
    myMenuItems: 'என் மெனு பொருட்கள்', addNewItem: 'புதிய பொருளை சேர்',
    noMenuItems: 'மெனு பொருட்கள் இல்லை. உங்கள் முதல் உணவை சேர்க்கவும்!',
    addNewMenuItem: 'புதிய மெனு பொருளை சேர்க்கவும்',
    itemName: 'பொருளின் பெயர்', price: 'விலை (₹)',
    description: 'விளக்கம்', foodType: 'உணவு வகை',
    vegetarian: 'சைவம்', nonVegetarian: 'அசைவம்', category: 'பிரிவு',
    itemImage: 'பொருளின் படம்', clickToUpload: 'படத்தை பதிவேற்ற தட்டவும்',
    imageFormat: 'JPG, PNG 5MB வரை', addToMenu: 'மெனுவில் சேர்',
    editItem: 'திருத்து —', replaceImage: 'படத்தை மாற்று (விரும்பினால்)',
    uploadNewImage: 'புதிய படத்தை பதிவேற்று', saveChanges: 'மாற்றங்களை சேமி',
    confirmDelete: 'நீக்குவதை உறுதி செய்யுங்கள்',
    deleteWarning: 'நீக்க விரும்புகிறீர்களா?',
    cannotUndo: 'இந்த செயலை மீட்க முடியாது.',
    monday: 'திங்கள்', tuesday: 'செவ்வாய்', wednesday: 'புதன்',
    thursday: 'வியாழன்', friday: 'வெள்ளி', saturday: 'சனி', sunday: 'ஞாயிறு',
    meals: 'மீல்ஸ்', tiffin: 'டிபன்', snacks: 'ஸ்னாக்ஸ்',
    veg: 'சைவம்', nonVeg: 'அசைவம்',
    success: 'வெற்றி', error: 'பிழை', imageRequired: 'படம் அவசியம்',
    addedSuccessfully: 'வெற்றிகரமாக சேர்க்கப்பட்டது',
    updatedSuccessfully: 'வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    deletedSuccessfully: 'வெற்றிகரமாக நீக்கப்பட்டது', failed: 'தோல்வியடைந்தது',
    cuisinePlaceholder: 'எ.கா. இத்தாலியன், இந்தியன்',
    tagsPlaceholder: 'எ.கா. காரமான, சைவம்',
    itemNamePlaceholder: 'எ.கா. மார்கெரிட்டா பிஸ்ஸா',
    pricePlaceholder: '0.00', descriptionPlaceholder: 'உங்கள் உணவை விவரிக்கவும்...',
    selectTime: 'நேரத்தை தேர்வு செய்யவும்', viewOnMap: 'Google Maps இல் பார்க்க',
    todaysOrders: 'இன்றைய ஆர்டர்கள்', todaysRevenue: 'இன்றைய வருமானம்',
    totalOrders: 'மொத்த ஆர்டர்கள்', totalRevenue: 'மொத்த வருமானம்',
    markPaid: 'பணம் பெற்றது', noOrdersToday: 'இன்று ஆர்டர்கள் இல்லை',
    paymentAll: 'அனைத்தும்', paymentUPI: 'UPI', paymentCash: 'பண',
    noAnalytics: 'பகுப்பாய்வு தரவு இல்லை', refresh: 'புதுப்பி',
    settingsTitle: 'அமைப்புகள்', appVersion: 'பயன்பாட்டு பதிப்பு',
    offerDuration: 'சலுகை காலம் (மணி நேரம்)',
  },
} as const;

type TKey = keyof typeof translations.en;

const categoryMap: Record<string, TKey> = {
  Meals: 'meals', Tiffin: 'tiffin', Snacks: 'snacks', Veg: 'veg', 'Non-Veg': 'nonVeg',
};
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShortMap: Record<string, TKey> = {
  Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday',
  Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday', Sunday: 'sunday',
};
const MENU_CATEGORIES = ['Meals', 'Tiffin', 'Snacks', 'Veg', 'Non-Veg'];

type TabId = 'overview' | 'menu' | 'add-item' | 'reviews' | 'orders' | 'analytics' ;
type PaymentFilter = 'all' | 'upi' | 'cash';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string; name: string; price: number; description: string;
  is_veg: boolean; image?: string; category: string;
  has_offer?: boolean; offer_percentage?: number; offer_price?: number;
}
interface Restaurant {
  id: string; name: string; cuisine: string; tags: string[];
  is_open: boolean; image?: string; latitude?: number; longitude?: number;
  opening_time?: string; closing_time?: string; days_open?: string;
  manual_override?: boolean;
  manual_override_expiry?: string | null;
  manual_override_status?: boolean;
  manual_override_start_time?: string | null;
  manual_override_end_time?: string | null;
  is_manually_overridden?: boolean;
}
interface Review {
  user_email: string; rating: number; comment: string; created_at: string;
}
interface AnalyticsDay {
  date: string; displayDate: string; total_orders: number; total_revenue: number;
}
interface AnalyticsSummary {
  total_orders_all_time: number;
  total_revenue_all_time: string;
  today_orders_count: number;
  today_revenue: string;
}

// ─── Module-level IST Helpers (FIXED) ─────────────────────────────────────────────────
const getTodayIST = (): string => {
  try {
    // Get current UTC time
    const now = new Date();
    
    // Create UTC date components
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    
    // Create UTC timestamp
    const utcTimestamp = Date.UTC(year, month, day, hours, minutes, seconds);
    
    // Add IST offset (5 hours 30 minutes = 19800000 milliseconds)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istTimestamp = utcTimestamp + IST_OFFSET_MS;
    
    // Create IST date
    const istDate = new Date(istTimestamp);
    
    // Format as YYYY-MM-DD
    const istYear = istDate.getUTCFullYear();
    const istMonth = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const istDay = String(istDate.getUTCDate()).padStart(2, '0');
    
    return `${istYear}-${istMonth}-${istDay}`;
  } catch (error) {
    console.error('getTodayIST error:', error);
    // Fallback to local date
    return new Date().toISOString().split('T')[0];
  }
};

const filterTodayIST = (orders: any[]): any[] => {
  try {
    const todayIST = getTodayIST();
    console.log('🔍 Filtering for IST date:', todayIST);
    
    return orders.filter(order => {
      if (!order || !order.created_at) return false;
      
      try {
        // Parse the order date
        let orderDate: Date;
        
        // Handle different date formats
        if (typeof order.created_at === 'string') {
          if (order.created_at.includes('+') || order.created_at.endsWith('Z')) {
            // Already has timezone
            orderDate = new Date(order.created_at);
          } else if (order.created_at.includes('T')) {
            // ISO format without timezone, assume UTC
            orderDate = new Date(order.created_at + 'Z');
          } else {
            // Try parsing directly
            orderDate = new Date(order.created_at);
          }
        } else {
          orderDate = new Date(order.created_at);
        }
        
        if (isNaN(orderDate.getTime())) return false;
        
        // Get UTC components
        const year = orderDate.getUTCFullYear();
        const month = orderDate.getUTCMonth();
        const day = orderDate.getUTCDate();
        const hours = orderDate.getUTCHours();
        const minutes = orderDate.getUTCMinutes();
        const seconds = orderDate.getUTCSeconds();
        
        // Create UTC timestamp and add IST offset
        const utcTimestamp = Date.UTC(year, month, day, hours, minutes, seconds);
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istTimestamp = utcTimestamp + IST_OFFSET_MS;
        const istDate = new Date(istTimestamp);
        
        // Get IST date string
        const istYear = istDate.getUTCFullYear();
        const istMonth = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const istDay = String(istDate.getUTCDate()).padStart(2, '0');
        const orderISTDate = `${istYear}-${istMonth}-${istDay}`;
        
        const isToday = orderISTDate === todayIST;
        
        if (isToday) {
          console.log(`✅ Order ${order.order_number}: ${order.created_at} -> IST: ${orderISTDate} (Today)`);
        }
        
        return isToday;
      } catch (err) {
        console.error('Error processing order date:', order.created_at, err);
        return false;
      }
    });
  } catch (error) {
    console.error('filterTodayIST error:', error);
    return orders;
  }
};

const formatIST = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    let d: Date;
    if (dateString.includes('+') || dateString.endsWith('Z')) {
      d = new Date(dateString);
    } else if (dateString.includes('T')) {
      d = new Date(dateString + 'Z');
    } else {
      d = new Date(dateString);
    }
    
    if (isNaN(d.getTime())) return dateString;
    
    // Get UTC components and add IST offset
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();
    
    const utcTimestamp = Date.UTC(year, month, day, hours, minutes, seconds);
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istTimestamp = utcTimestamp + IST_OFFSET_MS;
    const istDate = new Date(istTimestamp);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[istDate.getUTCMonth()];
    const dayNum = istDate.getUTCDate();
    let hour12 = istDate.getUTCHours() % 12;
    hour12 = hour12 === 0 ? 12 : hour12;
    const minute = istDate.getUTCMinutes().toString().padStart(2, '0');
    const ampm = istDate.getUTCHours() >= 12 ? 'PM' : 'AM';
    
    return `${monthName} ${dayNum}, ${hour12}:${minute} ${ampm}`;
  } catch (error) {
    console.error('formatIST error:', error);
    return dateString;
  }
};
// ─── Other Helpers ────────────────────────────────────────────────────────────
const formatTimeForInput = (t?: string) => (t ? t.substring(0, 5) : '09:00');
const formatTimeForDisplay = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return t;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${(m || '00').padStart(2, '0')} ${ampm}`;
};
const daysStringToArray = (s?: string) => (s ? s.split(',').map(d => d.trim()) : []);
const daysArrayToString = (arr: string[]) => arr.join(',');

// ─── useFade ──────────────────────────────────────────────────────────────────
const useFade = (visible: boolean) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [visible]);
  return anim;
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ open, t }: { open: boolean; t: (k: TKey) => string }) => (
  <View style={[s.badge, open ? s.badgeOpen : s.badgeClosed]}>
    <Text style={[s.badgeTxt, { color: open ? C.emerald : C.red }]}>
      {open ? `● ${t('openNow')}` : `○ ${t('closedNow')}`}
    </Text>
  </View>
);

// ─── Tag ──────────────────────────────────────────────────────────────────────
const Tag = ({ label, color = C.orange }: { label: string; color?: string }) => (
  <View style={[s.tag, { borderColor: color + '50', backgroundColor: color + '18' }]}>
    <Text style={[s.tagTxt, { color }]}>{label}</Text>
  </View>
);

// ─── InputField ───────────────────────────────────────────────────────────────
const InputField = ({
  label, value, onChangeText, placeholder, multiline, keyboardType, style,
}: {
  label?: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any; style?: any;
}) => (
  <View style={[s.inputWrap, style]}>
    {label && <Text style={s.label}>{label}</Text>}
    <TextInput
      style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={C.slate600} multiline={multiline} keyboardType={keyboardType}
    />
  </View>
);

// ─── DurationPicker (NEW) ─────────────────────────────────────────────────────
const DurationPicker = ({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label: string;
}) => {
  const numVal = parseInt(value) || 0;
  const days = Math.floor(numVal / 24);
  const hrs = numVal % 24;
  const decrement = () => { if (numVal > 0) onChange(String(numVal - 1)); };
  const increment = () => onChange(String(numVal + 1));
  return (
    <View style={s.inputWrap}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <Text style={s.label}>{label}</Text>
        <Text style={{ color: C.slate500, fontSize: 11 }}>
          {days > 0 ? `${days}d ${hrs > 0 ? `${hrs}h` : ''}` : `${numVal} hr${numVal !== 1 ? 's' : ''}`}
        </Text>
      </View>
      <View style={[s.row, { justifyContent: 'center', gap: 16 }]}>
        <TouchableOpacity style={s.minBtn} onPress={decrement}>
          <Text style={s.minBtnTxt}>−</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', width: 72 }}>
          <Text style={{ color: C.orange, fontSize: 30, fontWeight: '700' }}>{value || '0'}</Text>
          <Text style={{ color: C.slate500, fontSize: 10 }}>hours</Text>
        </View>
        <TouchableOpacity style={s.minBtn} onPress={increment}>
          <Text style={s.minBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── AnalyticsChart (NEW) ─────────────────────────────────────────────────────
const AnalyticsChart = ({ data }: { data: AnalyticsDay[] }) => {
  const CHART_H = 160;
  const BAR_W = 32;
  const COL_W = 66;
  const maxOrders = Math.max(...data.map(d => d.total_orders), 1);
  return (
    <View>
      {/* Legend */}
      <View style={[s.row, { gap: 18, marginBottom: 12 }]}>
        <View style={s.row}>
          <View style={{ width: 12, height: 12, backgroundColor: C.orange, borderRadius: 3, marginRight: 6 }} />
          <Text style={{ color: C.slate400, fontSize: 11 }}>Orders</Text>
        </View>
        <View style={s.row}>
          <View style={{ width: 18, height: 2, backgroundColor: C.emerald, marginRight: 6 }} />
          <Text style={{ color: C.slate400, fontSize: 11 }}>Revenue (₹)</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H + 60 }}>
          {data.map((item, i) => {
            const barH = Math.max((item.total_orders / maxOrders) * CHART_H, item.total_orders > 0 ? 4 : 0);
            return (
              <View key={i} style={{ width: COL_W, alignItems: 'center', marginHorizontal: 4 }}>
                {item.total_orders > 0
                  ? <Text style={{ color: C.orange, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>{item.total_orders}</Text>
                  : <View style={{ height: 20 }} />
                }
                <View style={{ width: BAR_W, height: Math.max(barH, 2), backgroundColor: C.orange, borderRadius: 6, opacity: 0.9 }} />
                <Text style={{ color: C.emerald, fontSize: 10, marginTop: 5, textAlign: 'center' }}>
                  {item.total_revenue > 0
                    ? (item.total_revenue >= 1000 ? `₹${(item.total_revenue / 1000).toFixed(1)}k` : `₹${item.total_revenue}`)
                    : '—'}
                </Text>
                <Text style={{ color: C.slate500, fontSize: 9, marginTop: 3, textAlign: 'center' }}>{item.displayDate}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {data.length > 6 && (
        <Text style={{ color: C.slate600, fontSize: 10, textAlign: 'center', marginTop: 6 }}>← Scroll to see all dates →</Text>
      )}
    </View>
  );
};

// ─── DaysSelector ─────────────────────────────────────────────────────────────
const DaysSelector = ({ selected, onChange, t }: {
  selected: string[]; onChange: (d: string[]) => void; t: (k: TKey) => string;
}) => (
  <View>
    <Text style={s.label}>{t('operatingDays')}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {DAYS_OF_WEEK.map(day => {
        const active = selected.includes(day);
        return (
          <TouchableOpacity key={day}
            onPress={() => onChange(active ? selected.filter(d => d !== day) : [...selected, day])}
            style={[s.dayBtn, active && s.dayBtnActive]}>
            <Text style={[s.dayBtnTxt, active && { color: C.orange }]}>{t(dayShortMap[day])}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── TimePicker ───────────────────────────────────────────────────────────────
const TimePicker = ({ value, onChange, label, t }: {
  value: string; onChange: (v: string) => void; label: string; t: (k: TKey) => string;
}) => {
  const [show, setShow] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const p = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      setHour(h12); setMinute(m || 0); setPeriod(p);
    }
  }, [value]);
  const save = () => {
    let h24 = hour;
    if (period === 'PM' && hour !== 12) h24 = hour + 12;
    if (period === 'AM' && hour === 12) h24 = 0;
    onChange(`${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    setShow(false);
  };
  return (
    <>
      <View style={s.inputWrap}>
        <Text style={s.label}>{label}</Text>
        <TouchableOpacity style={[s.input, s.row, { justifyContent: 'space-between' }]} onPress={() => setShow(true)}>
          <Text style={{ color: value ? C.white : C.slate600, fontSize: 14 }}>
            {value ? formatTimeForDisplay(value) : t('selectTime')}
          </Text>
          <Feather name="clock" size={16} color={C.orange} />
        </TouchableOpacity>
      </View>
      <Modal visible={show} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalBox, { padding: 24 }]}>
            <Text style={[s.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>{t('selectTime')}</Text>
            <Text style={{ color: C.orange, fontSize: 44, fontWeight: '800', textAlign: 'center', marginBottom: 20 }}>
              {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} {period}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                <TouchableOpacity key={h} onPress={() => setHour(h)} style={[s.hourBtn, h === hour && s.hourBtnActive]}>
                  <Text style={[s.hourBtnTxt, h === hour && { color: C.white }]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.row, { justifyContent: 'center', gap: 20, marginBottom: 16 }]}>
              <TouchableOpacity style={s.minBtn} onPress={() => setMinute(m => (m - 1 + 60) % 60)}>
                <Text style={s.minBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: C.white, fontSize: 32, fontWeight: '700', width: 60, textAlign: 'center' }}>
                {minute.toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity style={s.minBtn} onPress={() => setMinute(m => (m + 1) % 60)}>
                <Text style={s.minBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.row, { gap: 12, marginBottom: 20 }]}>
              {(['AM', 'PM'] as const).map(p => (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)}
                  style={[s.periodBtn, period === p && s.periodBtnActive, { flex: 1 }]}>
                  <Text style={[s.periodBtnTxt, period === p && { color: C.white }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.row, { gap: 12 }]}>
              <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={() => setShow(false)}>
                <Text style={s.btnSecondaryTxt}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} onPress={save}>
                <Text style={s.btnPrimaryTxt}>{t('saveChanges')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── CategorySelector ─────────────────────────────────────────────────────────
const CategorySelector = ({ selected, onChange, t }: {
  selected: string; onChange: (c: string) => void; t: (k: TKey) => string;
}) => (
  <View>
    <Text style={s.label}>{t('category')}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {MENU_CATEGORIES.map(cat => {
        const active = selected === cat;
        return (
          <TouchableOpacity key={cat} onPress={() => onChange(cat)} style={[s.catBtn, active && s.catBtnActive]}>
            <Text style={[s.catBtnTxt, active && { color: C.orange }]}>{t(categoryMap[cat])}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── FoodTypeSelector ────────────────────────────────────────────────────────
const FoodTypeSelector = ({ veg, onChange, t }: {
  veg: boolean; onChange: (v: boolean) => void; t: (k: TKey) => string;
}) => (
  <View>
    <Text style={s.label}>{t('foodType')}</Text>
    <View style={[s.row, { gap: 24, marginTop: 8 }]}>
      {[{ label: t('vegetarian'), val: true }, { label: t('nonVegetarian'), val: false }].map(opt => (
        <TouchableOpacity key={String(opt.val)} onPress={() => onChange(opt.val)} style={[s.row, { gap: 8 }]}>
          <View style={[s.radio, { borderColor: opt.val ? C.emerald : C.red }]}>
            {veg === opt.val && <View style={[s.radioDot, { backgroundColor: opt.val ? C.emerald : C.red }]} />}
          </View>
          <Text style={{ color: C.white, fontSize: 14 }}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── MessageToast ─────────────────────────────────────────────────────────────
const MessageToast = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => {
  const fade = useFade(!!msg);
  if (!msg) return null;
  const isOk = msg.type === 'success';
  return (
    <Animated.View style={[s.toast, { opacity: fade, borderColor: isOk ? C.emerald + '40' : C.red + '40', backgroundColor: isOk ? C.emeraldDim : C.redDim }]}>
      <Feather name={isOk ? 'check-circle' : 'alert-circle'} size={16} color={isOk ? C.emerald : C.red} />
      <Text style={{ color: isOk ? C.emerald : C.red, fontSize: 13, flex: 1, marginLeft: 8 }}>{msg.text}</Text>
    </Animated.View>
  );
};

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ visible, label, onConfirm, onClose, loading, t }: {
  visible: boolean; label: string; onConfirm: () => void; onClose: () => void;
  loading: boolean; t: (k: TKey) => string;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={s.overlay}>
      <View style={s.modalBox}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{t('confirmDelete')}</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color={C.slate400} /></TouchableOpacity>
        </View>
        <Text style={{ color: C.slate400, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
          {t('deleteWarning')} <Text style={{ color: C.white, fontWeight: '700' }}>{label}</Text>? {t('cannotUndo')}
        </Text>
        <View style={[s.row, { gap: 12 }]}>
          <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={onClose}>
            <Text style={s.btnSecondaryTxt}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnDanger, { flex: 1 }]} onPress={onConfirm} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={C.white} /> : <Feather name="trash-2" size={14} color={C.white} />}
            <Text style={[s.btnPrimaryTxt, { marginLeft: 6 }]}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── OrderItemsModal ──────────────────────────────────────────────────────────
const OrderItemsModal = ({ order, onClose }: { order: any; onClose: () => void }) => (
  <Modal visible={!!order} transparent animationType="slide">
    <View style={s.overlay}>
      <View style={[s.modalBox, { maxHeight: SCREEN_H * 0.85 }]}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{order?.order_number} – Items</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color={C.slate400} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[s.infoBox, { marginBottom: 12 }]}>
            <Text style={s.infoLabel}>Customer</Text>
            <Text style={s.infoValue}>{order?.customer?.name || 'N/A'}</Text>
            <Text style={[s.infoLabel, { marginTop: 6 }]}>Phone</Text>
            <Text style={s.infoValue}>{order?.customer_phone}</Text>
          </View>
          <Text style={{ color: C.orange, fontWeight: '600', fontSize: 13, marginBottom: 8 }}>
            Items ({order?.item_count})
          </Text>
          {order?.items?.map((item: any, idx: number) => (
            <View key={item.id || idx} style={[s.infoBox, { marginBottom: 8 }]}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                <Text style={{ color: C.white, fontWeight: '600', fontSize: 14, flex: 1 }}>{item.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: C.orange, fontWeight: '700', fontSize: 14 }}>₹{item.price_at_time?.toFixed(2)}</Text>
                  <Text style={{ color: C.slate400, fontSize: 12 }}>x{item.quantity}</Text>
                </View>
              </View>
              <View style={[s.row, { justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={{ color: C.slate400, fontSize: 12 }}>Subtotal</Text>
                <Text style={{ color: C.emerald, fontWeight: '600', fontSize: 13 }}>₹{item.subtotal?.toFixed(2)}</Text>
              </View>
            </View>
          ))}
          <View style={[s.infoBox, { borderColor: C.orange + '40', backgroundColor: C.orangeDim, marginTop: 8 }]}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={{ color: C.orange, fontWeight: '600' }}>Total Amount</Text>
              <Text style={{ color: C.orange, fontWeight: '800', fontSize: 18 }}>₹{order?.total_amount?.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
        <TouchableOpacity style={[s.btnPrimary, { marginTop: 16 }]} onPress={onClose}>
          <Text style={s.btnPrimaryTxt}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── RestaurantCard ───────────────────────────────────────────────────────────
// Replace the existing RestaurantCard component with this updated version:

// ─── RestaurantCard (updated with override props) ───────────────────────────────────────────
const RestaurantCard = ({ restaurant, menuItems, reviews, t, onEdit, onDelete, onUpdateProfile, onForceOpen, onForceClose, onCancelOverride, overrideLoading }: {
  restaurant: Restaurant; menuItems: MenuItem[]; reviews: Review[];
  t: (k: TKey) => string; onEdit: () => void; onDelete: () => void; onUpdateProfile: () => void;
  onForceOpen: () => void; onForceClose: () => void; onCancelOverride: () => void; overrideLoading: boolean;
}) => (
  <View style={s.card}>
    <View style={{ height: 180, backgroundColor: C.orangeDim, overflow: 'hidden' }}>
      {restaurant.image
        ? <Image source={{ uri: restaurant.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <View style={[s.row, { flex: 1, justifyContent: 'center' }]}><MaterialCommunityIcons name="food-fork-drink" size={48} color={C.orange + '40'} /></View>
      }
      <StatusBadge open={restaurant.is_open} t={t} />
    </View>
    <View style={{ padding: 16 }}>
      <Text style={{ color: C.white, fontWeight: '800', fontSize: 18, marginBottom: 4 }}>{restaurant.name}</Text>
      <Text style={{ color: C.slate400, fontSize: 13, marginBottom: 12 }}>{restaurant.cuisine}</Text>
      <View style={[s.row, { flexWrap: 'wrap', gap: 6, marginBottom: 14 }]}>
        {restaurant.tags?.map((tag, i) => <Tag key={i} label={tag} />)}
      </View>
      {restaurant.opening_time && restaurant.closing_time && (
        <View style={{ marginBottom: 12 }}>
          <View style={[s.row, { gap: 6 }]}>
            <Feather name="clock" size={12} color={C.slate400} />
            <Text style={{ color: C.slate400, fontSize: 12 }}>
              {formatTimeForDisplay(restaurant.opening_time)} – {formatTimeForDisplay(restaurant.closing_time)}
            </Text>
          </View>
          {restaurant.days_open && (
            <View style={[s.row, { flexWrap: 'wrap', gap: 4, marginTop: 6 }]}>
              <Text style={{ color: C.slate500, fontSize: 11, marginRight: 4 }}>{t('openOn')}:</Text>
              {daysStringToArray(restaurant.days_open).map((d, i) => (
                <View key={i} style={[s.tag, { borderColor: C.border10, backgroundColor: C.border }]}>
                  <Text style={{ color: C.slate400, fontSize: 11 }}>{d}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
       {/* Override control buttons */}
      <View style={[s.row, { gap: 8, marginBottom: 12, flexWrap: 'wrap' }]}>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.emerald + '40', backgroundColor: C.emeraldDim }]}
          onPress={onForceOpen}
        >
          <Feather name="zap" size={12} color={C.emerald} />
          <Text style={{ color: C.emerald, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Force Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.red + '40', backgroundColor: C.redDim }]}
          onPress={onForceClose}
        >
          <Feather name="x-circle" size={12} color={C.red} />
          <Text style={{ color: C.red, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Force Close</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.orangeBorder, backgroundColor: C.orangeDim }]}
          onPress={onCancelOverride}
          disabled={overrideLoading}
        >
          {overrideLoading
            ? <ActivityIndicator size="small" color={C.orange} />
            : <Feather name="refresh-cw" size={12} color={C.orange} />
          }
          <Text style={{ color: C.orange, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Cancel Override</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.row, { gap: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, flexWrap: 'wrap' }]}>
        <TouchableOpacity onPress={() => restaurant.latitude && restaurant.longitude &&
          Linking.openURL(`https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`)}>
          <View style={[s.row, { gap: 6 }]}>
            <Feather name="map-pin" size={13} color={C.slate500} />
            <Text style={{ color: C.blue, fontSize: 12 }}>{t('view')}</Text>
          </View>
        </TouchableOpacity>
        <View style={[s.row, { gap: 6 }]}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={13} color={C.slate500} />
          <Text style={{ color: C.slate400, fontSize: 12 }}>{menuItems.length} {t('menuItems')}</Text>
        </View>
        <View style={[s.row, { gap: 6 }]}>
          <Feather name="star" size={13} color={C.slate500} />
          <Text style={{ color: C.slate400, fontSize: 12 }}>{reviews.length} {t('reviews')}</Text>
        </View>
      </View>
      <View style={[s.row, { gap: 8, marginTop: 14 }]}>
        <TouchableOpacity style={[s.actionBtn, { flex: 1, borderColor: C.orange + '40', backgroundColor: C.orangeDim }]} onPress={onUpdateProfile}>
          <Feather name="image" size={13} color={C.orange} />
          <Text style={{ color: C.orange, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{t('updateProfile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: C.border10, backgroundColor: C.border }]} onPress={onEdit}>
          <Feather name="edit-2" size={13} color={C.slate400} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: C.red + '40', backgroundColor: C.redDim }]} onPress={onDelete}>
          <Feather name="trash-2" size={13} color={C.red} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── MenuItemCard ─────────────────────────────────────────────────────────────
const MenuItemCard = ({ item, onEdit, onDelete }: { item: MenuItem; onEdit: () => void; onDelete: () => void }) => (
  <View style={s.menuCard}>
    <View style={{ height: 140, overflow: 'hidden', backgroundColor: C.card, borderRadius: 16 }}>
      {item.image
        ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <View style={[s.row, { flex: 1, justifyContent: 'center' }]}><MaterialCommunityIcons name="food-fork-drink" size={36} color={C.slate700} /></View>
      }
    </View>
    <View style={{ padding: 12 }}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
        <Text style={{ color: C.white, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={1}>{item.name}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          {item.has_offer && item.offer_price ? (
            <>
              <Text style={{ color: C.orange, fontWeight: '800', fontSize: 15 }}>₹{item.offer_price}</Text>
              <Text style={{ color: C.slate500, textDecorationLine: 'line-through', fontSize: 11 }}>₹{item.price}</Text>
            </>
          ) : (
            <Text style={{ color: C.orange, fontWeight: '800', fontSize: 15 }}>₹{item.price}</Text>
          )}
        </View>
      </View>
      <Text style={{ color: C.slate400, fontSize: 12, lineHeight: 18, marginBottom: 8 }} numberOfLines={2}>{item.description}</Text>
      <View style={[s.row, { flexWrap: 'wrap', gap: 4, marginBottom: 10 }]}>
        {item.category && <Tag label={item.category} color={C.blue} />}
        {item.has_offer && item.offer_price && <Tag label={`${item.offer_percentage}% OFF`} color={C.orange} />}
      </View>
      <View style={[s.row, { gap: 8 }]}>
        <TouchableOpacity style={[s.cardBtn, { flex: 1, backgroundColor: C.border, borderColor: C.border10 }]} onPress={onEdit}>
          <Feather name="edit-2" size={13} color={C.white} />
          <Text style={{ color: C.white, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.cardBtn, { backgroundColor: C.redDim, borderColor: C.red + '40' }]} onPress={onDelete}>
          <Feather name="trash-2" size={13} color={C.red} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── SidebarDrawer (updated with Analytics + Settings + badge) ────────────────
const SidebarDrawer = ({
  open, onClose, activeTab, setActiveTab, language, toggleLanguage,
  onLogout, t, newOrdersCount, onClearBadge,
}: {
  open: boolean; onClose: () => void; activeTab: TabId;
  setActiveTab: (t: TabId) => void; language: Language;
  toggleLanguage: () => void; onLogout: () => void; t: (k: TKey) => string;
  newOrdersCount: number; onClearBadge: () => void;
}) => {
  const translateX = useRef(new Animated.Value(-280)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: open ? 0 : -280, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: open ? 1 : 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [open]);

  const navItems: { id: TabId; icon: string; label: TKey }[] = [
    { id: 'overview',   icon: 'grid',        label: 'overview' },
    { id: 'menu',       icon: 'menu',        label: 'myMenu' },
    { id: 'reviews',    icon: 'star',        label: 'reviews' },
    { id: 'add-item',   icon: 'plus',        label: 'addItem' },
    { id: 'orders',     icon: 'shopping-bag', label: 'orders' },
    { id: 'analytics',  icon: 'bar-chart-2', label: 'analytics' },
    
  ];

  return (
    <>
      {open && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40, opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
      )}
      <Animated.View style={[s.sidebar, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[s.row, { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 16 }]}>
            <Image source={logoImage} style={{ width: 36, height: 36, borderRadius: 10, marginRight: 10 }} resizeMode="cover" />
            <Text style={s.headerTitle}>BasicsBox</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 12 }}>
            {navItems.map(item => {
              const active = activeTab === item.id;
              return (
                <TouchableOpacity key={item.id}
                  style={[s.navItem, active && s.navItemActive]}
                  onPress={() => {
                    setActiveTab(item.id);
                    if (item.id === 'orders') onClearBadge();
                    onClose();
                  }}>
                  <Feather name={item.icon as any} size={18} color={active ? C.orange : C.slate400} />
                  <Text style={[s.navLabel, active && { color: C.orange }]}>{t(item.label)}</Text>
                  {item.id === 'orders' && newOrdersCount > 0 && (
                    <View style={s.navBadge}>
                      <Text style={s.navBadgeTxt}>{newOrdersCount > 99 ? '99+' : newOrdersCount}</Text>
                    </View>
                  )}
                  {active && <Feather name="chevron-right" size={14} color={C.orange} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[s.sidebarBottom, { borderTopColor: C.border }]}>
            <TouchableOpacity style={s.navItem} onPress={toggleLanguage}>
              <Text style={{ fontSize: 18 }}>{language === 'en' ? '🇮🇳' : '🇬🇧'}</Text>
              <Text style={s.navLabel}>{language === 'en' ? t('tamil') : t('english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.navItem, { marginTop: 4 }]} onPress={onLogout}>
              <Feather name="log-out" size={18} color={C.red} />
              <Text style={[s.navLabel, { color: C.red }]}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

// ─── RestaurantFormView ───────────────────────────────────────────────────────
const RestaurantFormView = ({ form, setForm, onSubmit, onCancel, loading, t }: {
  form: any; setForm: (f: any) => void; onSubmit: () => void;
  onCancel: () => void; loading: boolean; t: (k: TKey) => string;
}) => (
  <View style={[s.card, { padding: 16, gap: 14 }]}>
    <Text style={{ color: C.white, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{t('registerRestaurant')}</Text>
    <InputField label={t('cuisineType')} value={form.cuisine} onChangeText={v => setForm({ ...form, cuisine: v })} placeholder={t('cuisinePlaceholder')} />
    <InputField label={t('tagsComma')} value={form.tags} onChangeText={v => setForm({ ...form, tags: v })} placeholder={t('tagsPlaceholder')} />
    <DaysSelector selected={form.days_open} onChange={days => setForm({ ...form, days_open: days })} t={t} />
    <View style={[s.row, { gap: 12 }]}>
      <View style={{ flex: 1 }}>
        <TimePicker value={form.opening_time} onChange={v => setForm({ ...form, opening_time: v })} label={t('openingTime')} t={t} />
      </View>
      <View style={{ flex: 1 }}>
        <TimePicker value={form.closing_time} onChange={v => setForm({ ...form, closing_time: v })} label={t('closingTime')} t={t} />
      </View>
    </View>
    {form.opening_time && form.closing_time && form.days_open.length > 0 && (
      <View style={[s.infoBox, { gap: 4 }]}>
        <Text style={{ color: C.slate400, fontSize: 12 }}>
          <Text style={{ color: C.emerald, fontWeight: '600' }}>{t('operatingHours')}: </Text>
          {formatTimeForDisplay(form.opening_time)} – {formatTimeForDisplay(form.closing_time)}
        </Text>
        <Text style={{ color: C.slate400, fontSize: 12 }}>
          <Text style={{ color: C.emerald, fontWeight: '600' }}>{t('operatingDaysLabel')}: </Text>
          {form.days_open.join(', ')}
        </Text>
        <Text style={{ color: C.slate500, fontSize: 11, marginTop: 2 }}>{t('statusAutoUpdate')}</Text>
      </View>
    )}
    <View style={[s.row, { gap: 12, marginTop: 4 }]}>
      <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={onCancel}>
        <Text style={s.btnSecondaryTxt}>{t('cancel')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} onPress={onSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator size="small" color={C.white} />
          : <><Feather name="save" size={14} color={C.white} /><Text style={[s.btnPrimaryTxt, { marginLeft: 6 }]}>{t('saveRestaurant')}</Text></>
        }
      </TouchableOpacity>
    </View>
  </View>
);

// ─── AddItemForm (updated with DurationPicker) ────────────────────────────────
const AddItemForm = ({ form, setForm, onSubmit, loading, t, isEdit = false }: {
  form: any; setForm: (f: any) => void; onSubmit: () => void;
  loading: boolean; t: (k: TKey) => string; isEdit?: boolean;
}) => {
  const offerPrice = form.price && form.offer_percentage
    ? (parseFloat(form.price) * (1 - parseFloat(form.offer_percentage) / 100)).toFixed(2)
    : null;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow photo access to upload images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setForm({ ...form, image: result.assets[0] });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ gap: 16 }}>
        <View style={[s.row, { gap: 12 }]}>
          <InputField style={{ flex: 1 }} label={t('itemName')} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder={t('itemNamePlaceholder')} />
          <InputField style={{ flex: 1 }} label={t('price')} value={form.price} onChangeText={v => setForm({ ...form, price: v })} placeholder={t('pricePlaceholder')} keyboardType="decimal-pad" />
        </View>
        <InputField label={t('description')} value={form.desc} onChangeText={v => setForm({ ...form, desc: v })} placeholder={t('descriptionPlaceholder')} multiline />
        <FoodTypeSelector veg={form.veg} onChange={v => setForm({ ...form, veg: v, category: isEdit ? form.category : (v ? 'Veg' : 'Non-Veg') })} t={t} />
        <CategorySelector selected={form.category} onChange={c => setForm({ ...form, category: c })} t={t} />

        {/* ── Offer section ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: C.border10, paddingTop: 14 }}>
          <View style={[s.row, { gap: 10 }]}>
            <Switch value={form.has_offer} onValueChange={v => setForm({ ...form, has_offer: v })}
              trackColor={{ false: C.border10, true: C.orange + '60' }}
              thumbColor={form.has_offer ? C.orange : C.slate500} />
            <Text style={{ color: C.orange, fontWeight: '600', fontSize: 14 }}>Add Offer</Text>
          </View>
          {form.has_offer && (
            <View style={{ marginTop: 12, paddingLeft: 12, gap: 12 }}>
              <InputField
                label="Offer Percentage (%)"
                value={form.offer_percentage}
                onChangeText={v => setForm({ ...form, offer_percentage: v })}
                placeholder="e.g. 10, 20, 30"
                keyboardType="numeric"
              />
              {/* DurationPicker replaces plain InputField */}
              <DurationPicker
                label={t('offerDuration')}
                value={form.offer_duration_hours}
                onChange={v => setForm({ ...form, offer_duration_hours: v })}
              />
              {offerPrice && (
                <View style={[s.infoBox, { borderColor: C.emerald + '40', backgroundColor: C.emeraldDim }]}>
                  <Text style={{ color: C.emerald, fontSize: 12 }}>Offer Price: ₹{offerPrice}</Text>
                  <Text style={{ color: C.slate500, fontSize: 11, marginTop: 2 }}>Original: ₹{parseFloat(form.price).toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Image picker ── */}
        <View>
          <Text style={s.label}>{isEdit ? t('replaceImage') : t('itemImage')}</Text>
          <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
            {form.image ? (
              <Image source={{ uri: form.image.uri || form.image }} style={{ width: '100%', height: '100%', borderRadius: 14 }} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Feather name="upload" size={24} color={C.slate500} />
                <Text style={{ color: C.slate400, fontSize: 13, textAlign: 'center' }}>{t('clickToUpload')}</Text>
                <Text style={{ color: C.slate600, fontSize: 11 }}>{t('imageFormat')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={onSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={C.white} />
            : <><Feather name="plus" size={16} color={C.white} /><Text style={[s.btnPrimaryTxt, { marginLeft: 6 }]}>{t(isEdit ? 'saveChanges' : 'addToMenu')}</Text></>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── EditItemModal ────────────────────────────────────────────────────────────
const EditItemModal = ({ item, onClose, onSave, loading, t }: {
  item: MenuItem | null; onClose: () => void;
  onSave: (form: any) => void; loading: boolean; t: (k: TKey) => string;
}) => {
  const [form, setForm] = useState({
    name: '', price: '', desc: '', veg: false, category: 'Meals',
    has_offer: false, offer_percentage: '', offer_duration_hours: '', image: null as any,
  });
  useEffect(() => {
    if (item) setForm({
      name: item.name, price: String(item.price), desc: item.description,
      veg: item.is_veg, category: item.category || 'Meals',
      has_offer: item.has_offer || false,
      offer_percentage: item.offer_percentage ? String(item.offer_percentage) : '',
      offer_duration_hours: '', image: null,
    });
  }, [item]);
  return (
    <Modal visible={!!item} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { maxHeight: SCREEN_H * 0.88 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('editItem')} {item?.name}</Text>
              <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color={C.slate400} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AddItemForm form={form} setForm={setForm} onSubmit={() => onSave(form)} loading={loading} t={t} isEdit />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── EditRestaurantModal ──────────────────────────────────────────────────────
const EditRestaurantModal = ({ visible, form, setForm, onSubmit, onClose, loading, t }: {
  visible: boolean; form: any; setForm: (f: any) => void;
  onSubmit: () => void; onClose: () => void; loading: boolean; t: (k: TKey) => string;
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={s.overlay}>
        <View style={[s.modalBox, { maxHeight: SCREEN_H * 0.88 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('edit')}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color={C.slate400} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <InputField label={t('cuisineType')} value={form.cuisine} onChangeText={v => setForm({ ...form, cuisine: v })} />
              <InputField label={t('tagsComma')} value={form.tags} onChangeText={v => setForm({ ...form, tags: v })} />
              <DaysSelector selected={form.days_open} onChange={days => setForm({ ...form, days_open: days })} t={t} />
              <View style={[s.row, { gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <TimePicker value={form.opening_time} onChange={v => setForm({ ...form, opening_time: v })} label={t('openingTime')} t={t} />
                </View>
                <View style={{ flex: 1 }}>
                  <TimePicker value={form.closing_time} onChange={v => setForm({ ...form, closing_time: v })} label={t('closingTime')} t={t} />
                </View>
              </View>
              <View style={[s.row, { gap: 12, marginTop: 8 }]}>
                <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={onClose}>
                  <Text style={s.btnSecondaryTxt}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} onPress={onSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.btnPrimaryTxt}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
// ─── OverrideModal ────────────────────────────────────────────────────────────
const OverrideModal = ({ visible, action, onClose, onConfirm, loading }: {
  visible: boolean;
  action: 'open' | 'close';
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
  loading: boolean;
}) => {
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setStartTime('10:00');
      setEndTime('11:00');
    }
  }, [visible]);

  const isOvernight = startTime > endTime;
  const t_dummy = (k: TKey) => translations.en[k] as string;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.modalBox, { borderRadius: 24, marginHorizontal: 16, marginBottom: 0 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              Force {action === 'open' ? 'OPEN' : 'CLOSED'} Restaurant
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={18} color={C.slate400} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: C.slate400, fontSize: 12, marginBottom: 16 }}>
            Set a time range for the override
          </Text>

          {/* Start Time */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Start Time</Text>
            <TouchableOpacity
              style={[s.input, s.row, { justifyContent: 'space-between' }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: C.white, fontSize: 14 }}>
                {formatTimeForDisplay(startTime)}
              </Text>
              <Feather name="clock" size={16} color={C.orange} />
            </TouchableOpacity>
          </View>

          {/* End Time */}
          <View style={[s.inputWrap, { marginTop: 12 }]}>
            <Text style={s.label}>End Time</Text>
            <TouchableOpacity
              style={[s.input, s.row, { justifyContent: 'space-between' }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={{ color: C.white, fontSize: 14 }}>
                {formatTimeForDisplay(endTime)}
              </Text>
              <Feather name="clock" size={16} color={C.orange} />
            </TouchableOpacity>
          </View>

          {isOvernight && (
            <View style={[s.infoBox, { borderColor: C.purple + '40', backgroundColor: C.purpleDim, marginTop: 10 }]}>
              <Text style={{ color: C.purple, fontSize: 12 }}>
                Overnight: {formatTimeForDisplay(startTime)} → {formatTimeForDisplay(endTime)} (next day)
              </Text>
            </View>
          )}

          <View style={[s.infoBox, { borderColor: C.yellow + '40', backgroundColor: C.yellowDim, marginTop: 10 }]}>
            <Text style={{ color: C.yellow, fontSize: 12 }}>
              After the override period ends, restaurant
                will automatically return to its normal schedule based on
                business hours.
            </Text>
          </View>

          <View style={[s.row, { gap: 12, marginTop: 18 }]}>
            <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={onClose}>
              <Text style={s.btnSecondaryTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnPrimary, { flex: 1, backgroundColor: action === 'open' ? C.emerald : C.red }]}
              disabled={loading}
              onPress={() => onConfirm(startTime, endTime)}
            >
              {loading
                ? <ActivityIndicator size="small" color={C.white} />
                : <Text style={s.btnPrimaryTxt}>Force {action === 'open' ? 'OPEN' : 'CLOSED'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Start Time Picker */}
      <Modal visible={showStartPicker} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalBox, { borderRadius: 24, marginHorizontal: 16 }]}>
            <TimePicker
              value={startTime}
              onChange={(v) => { setStartTime(v); setShowStartPicker(false); }}
              label="Start Time"
              t={t_dummy}
            />
            <TouchableOpacity style={[s.btnSecondary, { marginTop: 12 }]} onPress={() => setShowStartPicker(false)}>
              <Text style={s.btnSecondaryTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Time Picker */}
      <Modal visible={showEndPicker} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.modalBox, { borderRadius: 24, marginHorizontal: 16 }]}>
            <TimePicker
              value={endTime}
              onChange={(v) => { setEndTime(v); setShowEndPicker(false); }}
              label="End Time"
              t={t_dummy}
            />
            <TouchableOpacity style={[s.btnSecondary, { marginTop: 12 }]} onPress={() => setShowEndPicker(false)}>
              <Text style={s.btnSecondaryTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function MerchantDashboard() {
  const router = useRouter();
  const routerRef = useRef(router);

  const [language, setLanguage] = useState<Language>('en');
  const t = useCallback((key: TKey) => translations[language][key] as string, [language]);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Data
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [ordersStats, setOrdersStats] = useState({ total_orders: 0, today: { count: 0, total: 0 } });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Polling refs (avoid stale-closure)
  const lastOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstPollRef = useRef<boolean>(true);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDay[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Restaurant forms
  const [restaurantForm, setRestaurantForm] = useState({
    cuisine: '', tags: '', opening_time: '09:00', closing_time: '23:00', days_open: [] as string[],
  });
  const [editRestaurantOpen, setEditRestaurantOpen] = useState(false);
  const [editRestaurantForm, setEditRestaurantForm] = useState({
    cuisine: '', tags: '', opening_time: '09:00', closing_time: '23:00', days_open: [] as string[],
  });
  const [editRestaurantLoading, setEditRestaurantLoading] = useState(false);
  const [deleteRestaurantOpen, setDeleteRestaurantOpen] = useState(false);
  const [deleteRestaurantLoading, setDeleteRestaurantLoading] = useState(false);

  // Menu item forms
  const emptyMenuForm = {
    name: '', price: '', desc: '', veg: false, category: 'Meals',
    has_offer: false, offer_percentage: '', offer_duration_hours: '', image: null as any,
  };
  const [menuItemForm, setMenuItemForm] = useState(emptyMenuForm);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editItemLoading, setEditItemLoading] = useState(false);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
const [overrideAction, setOverrideAction] = useState<'open' | 'close'>('open');
const [overrideLoading, setOverrideLoading] = useState(false);

  // Update profile
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [updateProfileForm, setUpdateProfileForm] = useState({ restaurant_name: '', cover_image: null as any });
  const [updateProfileLoading, setUpdateProfileLoading] = useState(false);

  // ─── axios ──────────────────────────────────────────────────────────────────
  const authAxios = useRef(axios.create({ baseURL: API_BASE_URL })).current;
  const axiosInstance = useRef((() => {
    const inst = axios.create({ baseURL: API_BASE_URL });
    inst.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      const lang = await AsyncStorage.getItem('preferred_language') || 'en';
      config.headers['Accept-Language'] = lang;
      return config;
    });
    inst.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refresh = await AsyncStorage.getItem('refresh_token');
            const res = await authAxios.post('/auth/refresh/', { refresh_token: refresh });
            const newToken = res.data.access_token;
            await AsyncStorage.setItem('access_token', newToken);
            original.headers.Authorization = `Bearer ${newToken}`;
            return inst(original);
          } catch {
            await AsyncStorage.clear();
            routerRef.current.replace('/(tabs)');
          }
        }
        return Promise.reject(error);
      }
    );
    return inst;
  })()).current;

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const updateOrdersStats = (ordersData: any[]) => {
    const paid = ordersData.filter(o => o.payment_status === 'paid');
    setOrdersStats({
      total_orders: ordersData.length,
      today: {
        count: ordersData.length,
        total: paid.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      },
    });
  };

  // ─── Fetch functions ─────────────────────────────────────────────────────────
  const fetchData = async (forceLang?: string) => {
    setLoading(true);
    try {
      const lang = forceLang || await AsyncStorage.getItem('preferred_language') || 'en';
      const res = await axiosInstance.get('/merchant/restaurant/', { headers: { 'Accept-Language': lang } });
      const rd = res.data.restaurant;
      if (rd) {
        rd.opening_time = formatTimeForInput(rd.opening_time);
        rd.closing_time = formatTimeForInput(rd.closing_time);
      }
      setRestaurant(rd);
      const menuData = res.data.menu;
      let flat: MenuItem[] = [];
      if (Array.isArray(menuData)) { flat = menuData; }
      else if (menuData && typeof menuData === 'object') {
        Object.values(menuData).forEach((arr: any) => { if (Array.isArray(arr)) flat.push(...arr); });
      }
      setMenuItems(flat);
      setReviews(res.data.reviews || []);
      setIsAddingRestaurant(false);
    } catch (err: any) {
      if (err.response?.status === 404) { setRestaurant(null); setIsAddingRestaurant(true); }
    } finally { setLoading(false); }
  };

 const fetchOrders = async (page = 1) => {
  setOrdersLoading(true);
  setPaymentMethodFilter('all');
  try {
    const res = await axiosInstance.get(`/merchant/orders/?page=${page}&page_size=20`);
    const allOrders = res.data.orders || [];
    
    // Safely filter orders
    let todayOnly: any[] = [];
    try {
      todayOnly = filterTodayIST(allOrders);
    } catch (filterError) {
      console.error('Error filtering orders by IST:', filterError);
      todayOnly = allOrders; // Fallback to all orders
    }
    
    setOrders(todayOnly);
    setCurrentPage(res.data.current_page || 1);
    setTotalPages(res.data.total_pages || 1);
    updateOrdersStats(todayOnly);
  } catch (err: any) {
    if (err.response?.status === 404) setOrders([]);
    console.error('fetchOrders error:', err);
  } finally { 
    setOrdersLoading(false); 
  }
};

const fetchAnalytics = async () => {
  setAnalyticsLoading(true);
  try {
    // Fetch analytics summary from API
    const res = await axiosInstance.get('/merchant/analytics/');
    
    // Fetch all orders to calculate today's stats correctly in IST
    const ordersRes = await axiosInstance.get('/merchant/orders/?page=1&page_size=100');
    const allOrders = ordersRes.data.orders || [];
    
    // Get today's IST date
    const todayIST = getTodayIST();
    console.log('📊 Analytics - Today IST:', todayIST);
    
    // Filter orders for today using IST
    const todayOrdersIST = allOrders.filter((order: any) => {
      if (!order || !order.created_at) return false;
      try {
        let orderDate: Date;
        if (order.created_at.includes('+') || order.created_at.endsWith('Z')) {
          orderDate = new Date(order.created_at);
        } else if (order.created_at.includes('T')) {
          orderDate = new Date(order.created_at + 'Z');
        } else {
          orderDate = new Date(order.created_at);
        }
        
        if (isNaN(orderDate.getTime())) return false;
        
        // Get UTC components and add IST offset
        const year = orderDate.getUTCFullYear();
        const month = orderDate.getUTCMonth();
        const day = orderDate.getUTCDate();
        const utcTimestamp = Date.UTC(year, month, day);
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istTimestamp = utcTimestamp + IST_OFFSET_MS;
        const istDate = new Date(istTimestamp);
        
        const istYear = istDate.getUTCFullYear();
        const istMonth = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const istDay = String(istDate.getUTCDate()).padStart(2, '0');
        const orderISTDate = `${istYear}-${istMonth}-${istDay}`;
        
        return orderISTDate === todayIST;
      } catch {
        return false;
      }
    });
    
    // Calculate today's paid orders revenue
    const todayPaidOrders = todayOrdersIST.filter((o: any) => o.payment_status === 'paid');
    const todayRevenue = todayPaidOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    
    console.log(`📊 Today orders: ${todayOrdersIST.length}, Revenue: ₹${todayRevenue}`);
    
    // Fix the summary with correct today's values
    const fixedSummary = {
      total_orders_all_time: res.data.summary?.total_orders_all_time || 0,
      total_revenue_all_time: res.data.summary?.total_revenue_all_time || '0',
      today_orders_count: todayOrdersIST.length,
      today_revenue: todayRevenue.toString(),
    };
    
    // Process daily breakdown
    const breakdown = (res.data.daily_breakdown || [])
      .slice()
      .reverse()
      .map((day: any) => {
        let displayDate = day.date;
        try {
          const d = new Date(day.date);
          displayDate = d.toLocaleDateString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            month: 'short', 
            day: 'numeric' 
          });
        } catch {}
        return {
          date: day.date,
          displayDate: displayDate,
          total_orders: day.total_orders || 0,
          total_revenue: parseFloat((day.total_revenue || 0).toFixed(2)),
        };
      });
    
    setAnalyticsData(breakdown);
    setAnalyticsSummary(fixedSummary);
  } catch (err) {
    console.error('fetchAnalytics error:', err);
    showMsg('error', 'Failed to load analytics');
  } finally { 
    setAnalyticsLoading(false); 
  }
};

const forceRestaurantStatus = async (forceOpen: boolean, startTime: string, endTime: string) => {
  setOverrideLoading(true);
  try {
    const response = await axiosInstance.post('/merchant/override-status/', {
      force_open: forceOpen,
      start_time: startTime,
      end_time: endTime,
    });

    if (response.data.success) {
      showMsg('success', `Restaurant forced ${forceOpen ? 'OPEN' : 'CLOSED'} until ${endTime}`);
      setShowOverrideModal(false);

      // Update local state immediately
      if (restaurant) {
        const now = new Date();
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const expiry = new Date(now);
        expiry.setHours(endHour, endMinute, 0, 0);
        if (expiry < now) expiry.setDate(expiry.getDate() + 1);

        setRestaurant({
          ...restaurant,
          is_open: forceOpen,
          is_manually_overridden: true,
          manual_override: true,
          manual_override_status: forceOpen,
          manual_override_expiry: expiry.toISOString(),
          manual_override_start_time: startTime,
          manual_override_end_time: endTime,
        });
      }

      setTimeout(() => fetchData(), 500);
    } else {
      showMsg('error', response.data.error || 'Failed to override status');
    }
  } catch (err: any) {
    showMsg('error', err.response?.data?.error || 'Failed to override status');
  } finally {
    setOverrideLoading(false);
  }
};

const cancelOverride = async () => {
  setOverrideLoading(true);
  try {
    await axiosInstance.post('/merchant/cancel-override/');
    showMsg('success', 'Override cancelled. Restaurant follows auto schedule.');

    if (restaurant) {
      // Calculate auto status from business hours
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      let shouldBeOpen = false;

      if (restaurant.opening_time && restaurant.closing_time) {
        const [oh, om] = restaurant.opening_time.split(':').map(Number);
        const [ch, cm] = restaurant.closing_time.split(':').map(Number);
        const openMins = oh * 60 + (om || 0);
        const closeMins = ch * 60 + (cm || 0);
        shouldBeOpen = closeMins < openMins
          ? currentMins >= openMins || currentMins <= closeMins
          : currentMins >= openMins && currentMins <= closeMins;
      }

      setRestaurant({
        ...restaurant,
        is_open: shouldBeOpen,
        is_manually_overridden: false,
        manual_override: false,
        manual_override_expiry: null,
        manual_override_status: undefined,
        manual_override_start_time: null,
        manual_override_end_time: null,
      });
    }

    setTimeout(() => fetchData(), 500);
  } catch (err: any) {
    showMsg('error', err.response?.data?.error || 'Failed to cancel override');
  } finally {
    setOverrideLoading(false);
  }
};

  // ─── Action handlers ─────────────────────────────────────────────────────────
  const deleteOldOrders = async () => {
    try { await axiosInstance.post('/admin/delete-old-orders/'); } catch { /* silent */ }
  };

const markCODAsPaid = async (orderId: string, orderNumber: string) => {
  Alert.alert(
    'Confirm Payment',
    `Mark order ${orderNumber} as PAID?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid', 
        onPress: async () => {
          setOrdersLoading(true);
          try {
            const res = await axiosInstance.post(`/merchant/orders/${orderId}/mark-cod-paid/`);
            
            if (res.data.success) {
              showMsg('success', `Order ${orderNumber} marked as paid`);
              
              // ✅ UPDATE LOCAL STATE IMMEDIATELY
              // Update orders list
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === orderId 
                    ? { ...order, payment_status: 'paid', status: 'confirmed' }
                    : order
                )
              );
              
              // Update displayedOrders (filtered version)
              // Update ordersStats
              setOrdersStats(prevStats => {
                const updatedOrders = orders.map(order => 
                  order.id === orderId 
                    ? { ...order, payment_status: 'paid' }
                    : order
                );
                
                const paidOrders = updatedOrders.filter(o => o.payment_status === 'paid');
                const todayTotal = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                
                return {
                  ...prevStats,
                  today: {
                    count: updatedOrders.length,
                    total: todayTotal
                  },
                  statistics: {
                    paid: {
                      count: paidOrders.length,
                      total: todayTotal
                    },
                    pending: {
                      count: updatedOrders.length - paidOrders.length,
                      total: updatedOrders.filter(o => o.payment_status !== 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0)
                    }
                  }
                };
              });
              
              // Optional: Refresh from server in background
              setTimeout(() => {
                fetchOrders(currentPage);
              }, 2000);
            }
          } catch (e: any) { 
            showMsg('error', e.response?.data?.error || 'Failed to mark as paid'); 
          } finally { 
            setOrdersLoading(false); 
          }
        }
      },
    ]
  );
};
  const handleAddRestaurant = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/restaurants/add/', {
        cuisine: restaurantForm.cuisine,
        tags: restaurantForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        opening_time: restaurantForm.opening_time,
        closing_time: restaurantForm.closing_time,
        days_open: daysArrayToString(restaurantForm.days_open),
      });
      showMsg('success', `${t('restaurantProfile')} ${t('addedSuccessfully')}`);
      setIsAddingRestaurant(false); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setLoading(false); }
  };

  const handleUpdateRestaurant = async () => {
    setEditRestaurantLoading(true);
    try {
      await axiosInstance.put('/restaurants/update/', {
        cuisine: editRestaurantForm.cuisine,
        tags: editRestaurantForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        opening_time: editRestaurantForm.opening_time,
        closing_time: editRestaurantForm.closing_time,
        days_open: daysArrayToString(editRestaurantForm.days_open),
      });
      showMsg('success', `${t('restaurantProfile')} ${t('updatedSuccessfully')}`);
      setEditRestaurantOpen(false); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setEditRestaurantLoading(false); }
  };

  const handleDeleteRestaurant = async () => {
    setDeleteRestaurantLoading(true);
    try {
      await axiosInstance.delete('/restaurants/delete/');
      showMsg('success', `${t('restaurantProfile')} ${t('deletedSuccessfully')}`);
      setDeleteRestaurantOpen(false); setRestaurant(null); setMenuItems([]); setReviews([]); setIsAddingRestaurant(true);
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setDeleteRestaurantLoading(false); }
  };

  const handleAddMenuItem = async () => {
    if (!menuItemForm.image) { showMsg('error', t('imageRequired')); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', menuItemForm.name); fd.append('price', menuItemForm.price);
      fd.append('desc', menuItemForm.desc); fd.append('veg', String(menuItemForm.veg));
      fd.append('category', menuItemForm.category);
      if (menuItemForm.has_offer) {
        fd.append('offer_percentage', String(Number(menuItemForm.offer_percentage)));
        fd.append('offer_duration_hours', String(Number(menuItemForm.offer_duration_hours)));
      }
      fd.append('image', { uri: menuItemForm.image.uri, name: 'image.jpg', type: 'image/jpeg' } as any);
      await axiosInstance.post('/menu/add/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('success', `${menuItemForm.name} ${t('addedSuccessfully')}`);
      setMenuItemForm(emptyMenuForm); setActiveTab('menu'); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setLoading(false); }
  };

  // Helper function to send local notification
const sendLocalNotification = async (order: any, isPaid: boolean) => {
  try {
    const orderType = isPaid ? 'PAID' : 'COD';
    const title = isPaid ? `💰 New Paid Order - ${order.order_number}` : `📦 New COD Order - ${order.order_number}`;
    const body = isPaid 
      ? `₹${order.total_amount?.toFixed(2)} - Payment already completed via ${order.payment_method}`
      : `₹${order.total_amount?.toFixed(2)} - Cash on Delivery - Mark as paid after delivery`;
    
    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { 
          type: 'new_order', 
          orderId: order.id,
          orderNumber: order.order_number,
          isPaid: isPaid
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
    
    console.log(`📱 Local notification sent for order ${order.order_number} (${orderType})`);
  } catch (error) {
    console.error('Failed to send local notification:', error);
  }
};

  const handleUpdateMenuItem = async (form: any) => {
    if (!editItem) return;
    setEditItemLoading(true);
    try {
      const fd = new FormData();
      if (form.name !== editItem.name) fd.append('name', form.name);
      if (form.price !== String(editItem.price)) fd.append('price', form.price);
      if (form.desc !== editItem.description) fd.append('desc', form.desc);
      if (form.veg !== editItem.is_veg) fd.append('veg', String(form.veg));
      if (form.category !== editItem.category) fd.append('category', form.category);
      if (form.image) fd.append('image', { uri: form.image.uri, name: 'image.jpg', type: 'image/jpeg' } as any);
      await axiosInstance.put(`/menu/update/${editItem.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('success', `${editItem.name} ${t('updatedSuccessfully')}`);
      setEditItem(null); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setEditItemLoading(false); }
  };

  const handleDeleteMenuItem = async () => {
    if (!deleteItem) return;
    setDeleteItemLoading(true);
    try {
      await axiosInstance.delete(`/menu/delete/${deleteItem.id}/`);
      showMsg('success', `${deleteItem.name} ${t('deletedSuccessfully')}`);
      setDeleteItem(null); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setDeleteItemLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setUpdateProfileLoading(true);
    try {
      const fd = new FormData();
      if (updateProfileForm.restaurant_name) fd.append('restaurant_name', updateProfileForm.restaurant_name);
      if (updateProfileForm.cover_image)
        fd.append('cover_image', { uri: updateProfileForm.cover_image.uri, name: 'cover.jpg', type: 'image/jpeg' } as any);
      await axiosInstance.put('/restaurant/profile/update/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('success', `${t('restaurantProfile')} ${t('updatedSuccessfully')}`);
      setUpdateProfileOpen(false); fetchData();
    } catch (e: any) { showMsg('error', e.response?.data?.error || t('failed')); }
    finally { setUpdateProfileLoading(false); }
  };

  const handleLogout = async () => { await AsyncStorage.clear(); router.replace('/(tabs)'); };

  const toggleLanguage = async () => {
    setTranslating(true);
    const newLang = language === 'en' ? 'ta' : 'en';
    setLanguage(newLang);
    await AsyncStorage.setItem('preferred_language', newLang);
    await fetchData(newLang);
    setTranslating(false);
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
// Request notification permissions on app start
useEffect(() => {
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications to receive order alerts when new orders come in.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
    
    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F97316',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
  };
  
  requestPermissions();
}, []);
  // Initial load
  useEffect(() => { fetchData(); }, []);

  // Fetch orders when switching to orders tab
  useEffect(() => { if (activeTab === 'orders') fetchOrders(); }, [activeTab]);

  // Fetch analytics when switching to analytics tab
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);

  // Order polling every 5 s
// Order polling every 5 seconds - only show paid UPI orders and pending COD orders
// Order polling every 5 seconds - only show paid UPI orders and pending COD orders
useEffect(() => {
  let isMounted = true;
  let lastOrderIds: Set<string> = new Set<string>(); // ✅ Explicitly type as Set<string>
  let isFirstRun = true;
  
  const checkForNewOrders = async () => {
    if (!isMounted) return;
    
    try {
      const res = await axiosInstance.get('/merchant/orders/?page=1&page_size=50');
      const ordersData = res.data.orders || [];
      
      if (!isMounted) return;
      
      // ✅ FIX: Show BOTH paid UPI orders AND pending cash orders
      const relevantOrders = ordersData.filter((order: any) => {
        const paymentStatus = order.payment_status;
        const paymentMethod = order.payment_method?.toLowerCase();
        
        // Show if:
        // 1. Order is paid (UPI success OR Cash marked as paid)
        // 2. OR Order is cash/COD and pending (not yet paid)
        if (paymentStatus === 'paid') return true;
        if ((paymentMethod === 'cash' || paymentMethod === 'cod') && paymentStatus === 'pending') return true;
        
        return false;
      });
      
      // Filter for today's IST date
      const todayIST = getTodayIST();
      const todayOrdersOnly = relevantOrders.filter((order: any) => {
        let orderDate;
        if (order.created_at.includes('+') || order.created_at.includes('Z')) {
          orderDate = new Date(order.created_at);
        } else if (order.created_at.includes('T')) {
          orderDate = new Date(order.created_at + 'Z');
        } else {
          orderDate = new Date(order.created_at);
        }
        const istDate = new Date(orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const istDateStr = istDate.toISOString().split('T')[0];
        return istDateStr === todayIST;
      });
      
      console.log(`📅 Polling: Found ${todayOrdersOnly.length} orders for today`);
      console.log(`   - Paid: ${todayOrdersOnly.filter((o: any) => o.payment_status === 'paid').length}`);
      console.log(`   - Pending Cash: ${todayOrdersOnly.filter((o: any) => o.payment_status === 'pending' && (o.payment_method === 'cash' || o.payment_method === 'cod')).length}`);
      
      const currentIds: Set<string> = new Set(todayOrdersOnly.map((o: any) => String(o.id)));
      
      if (isFirstRun) {
        lastOrderIds = currentIds;
        setOrders(todayOrdersOnly);
        updateOrdersStats(todayOrdersOnly);
        setOrdersLoading(false);
        isFirstRun = false;
        return;
      }
      
      // Find NEW orders
      const newOrders = todayOrdersOnly.filter((o: any) => !lastOrderIds.has(String(o.id)));
      
      if (newOrders.length > 0) {
        console.log(`🆕 NEW ORDER(S): ${newOrders.length}`);
        
        // Show notification for EACH new order
        for (const order of newOrders) {
          const isPaid = order.payment_status === 'paid';
          const isCash = order.payment_method === 'cash' || order.payment_method === 'cod';
          
          // Show notification for:
          // 1. PAID UPI orders (payment already completed)
          // 2. PENDING COD orders (need merchant attention)
          if (isPaid || (isCash && order.payment_status === 'pending')) {
            await sendLocalNotification(order, isPaid);
          }
        }
        
        setOrders(todayOrdersOnly);
        updateOrdersStats(todayOrdersOnly);
        
        // Show badge count for ALL new relevant orders
        setNewOrdersCount(prev => prev + newOrders.length);
      }
      
      lastOrderIds = currentIds;
      setOrdersLoading(false);
      
    } catch (error) {
      console.error('Polling error:', error);
      if (isMounted) setOrdersLoading(false);
    }
  };
  
  // Run immediately
  checkForNewOrders();
  
  // Run every 5 seconds
  const interval = setInterval(checkForNewOrders, 5000);
  
  return () => {
    console.log('Stopping order polling');
    isMounted = false;
    clearInterval(interval);
  };
}, [axiosInstance]);

  // Old-orders cleanup every 30 s
  useEffect(() => {
    deleteOldOrders();
    const interval = setInterval(deleteOldOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────────
  const filteredMenu = selectedCategory === 'All' ? menuItems : menuItems.filter(i => i.category === selectedCategory);

  const displayedOrders = orders.filter(order => {
    if (paymentMethodFilter === 'all') return true;
    const method = String(order.payment_method || '').toLowerCase();
    if (paymentMethodFilter === 'upi') return method.includes('upi') || method.includes('qr');
    if (paymentMethodFilter === 'cash') return method.includes('cash') || method.includes('cod');
    return true;
  });
// Replace the notification useEffect with this:
useEffect(() => {
  let notificationListener: any;
  let responseListener: any;

  const registerForPushNotifications = async () => {
  try {
    // Skip in Expo Go
    if (!Device.isDevice || __DEV__) {
      console.log('⚠️ Notifications only work in production build');
      return;
    }

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable notifications to receive order alerts');
      return;
    }

    // Create channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Notifications',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Get token with error handling
    let token;
    try {
      const response = await Notifications.getExpoPushTokenAsync({
        projectId: '69a1f4d2-575c-40be-99e2-3570ade1b46c',
      });
      token = response.data;
    } catch (tokenError) {
      console.error('Failed to get push token:', tokenError);
      return;
    }
    
    // Register with backend
    if (token) {
      await axiosInstance.post('/merchant/register-expo-token/', {
        expo_push_token: token,
        platform: Platform.OS,
      });
      console.log('✅ Push token registered successfully');
    }
  } catch (error) {
    console.error('Error in registerForPushNotifications:', error);
    // Don't let this error break the app
  }
};
  // Foreground notification
  notificationListener = Notifications.addNotificationReceivedListener(notification => {
    Alert.alert(
      'New Order!',
      notification.request.content.body ?? '',
      [
        { 
          text: 'View', 
          onPress: () => {
            setActiveTab('orders');
            fetchOrders();
          }
        },
        { text: 'Dismiss' }
      ]
    );
  });

  // ✅ CRITICAL: Handle notification tap when app is CLOSED or in BACKGROUND
  responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification tapped - opening orders tab');
    
    // Navigate to orders tab
    setActiveTab('orders');
    
    // Fetch fresh orders
    setTimeout(() => {
      fetchOrders();
    }, 500);
  });

  // ✅ CRITICAL: Handle app opening from notification when completely closed
  const checkInitialNotification = async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      console.log('📱 App opened from closed state via notification');
      setActiveTab('orders');
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    }
  };
  
  checkInitialNotification();
  registerForPushNotifications();

  return () => {
    if (notificationListener) notificationListener.remove();
    if (responseListener) responseListener.remove();
  };
}, [axiosInstance]);

// Auto-cancel expired overrides
useEffect(() => {
  if (!restaurant?.manual_override || !restaurant?.manual_override_expiry) return;

  const check = async () => {
    try {
      const expiryStr = restaurant.manual_override_expiry;
      if (!expiryStr) return;

      const expiry = new Date(expiryStr);
      if (isNaN(expiry.getTime())) return;

      if (new Date() >= expiry) {
        console.log('⏰ Override expired, auto-cancelling...');
        await cancelOverride();
      }
    } catch (err) {
      console.error('Auto-cancel check error:', err);
    }
  };

  check();
  const interval = setInterval(check, 5000);
  return () => clearInterval(interval);
}, [restaurant?.manual_override, restaurant?.manual_override_expiry]);

// Set up background notification handler
useEffect(() => {
  // Set up notification categories for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationCategoryAsync('orders', [
      {
        identifier: 'view',
        buttonTitle: 'View Order',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }
  
  // Handle notification response (when user taps notification)
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'new_order') {
      console.log('📱 Notification tapped - opening orders tab');
      setActiveTab('orders');
      
      // Fetch fresh orders
      setTimeout(() => {
        fetchOrders();
      }, 500);
    }
  });
  
  // Handle app opened from notification when completely closed
  const checkInitialNotification = async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      console.log('📱 App opened from closed state via notification');
      const data = response.notification.request.content.data;
      if (data.type === 'new_order') {
        setActiveTab('orders');
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      }
    }
  };
  
  checkInitialNotification();
  
  return () => {
    subscription.remove();
  };
}, []);
  // ─────────────────────────────────────────────────────────────────────────────
  // ─── RENDER ──────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <SafeAreaView style={{ backgroundColor: C.card, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View style={s.header}>
          <View style={s.row}>
            <Image source={logoImage} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }} resizeMode="cover" />
            <Text style={s.headerTitle}>BasicsBox</Text>
          </View>
          <View style={s.row}>
            {translating && <ActivityIndicator size="small" color={C.orange} style={{ marginRight: 8 }} />}
            <TouchableOpacity onPress={toggleLanguage} style={{ padding: 8, marginRight: 4 }}>
              <Text style={{ fontSize: 20 }}>{language === 'en' ? '🇮🇳' : '🇬🇧'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ padding: 8, marginRight: 4 }}>
              <Feather name="log-out" size={20} color={C.red} />
            </TouchableOpacity>
            <View style={s.avatarBox}><Text style={s.avatarTxt}>M</Text></View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Page title ── */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{t('merchantDashboard')}</Text>
        <Text style={s.pageSubtitle}>{t('manageRestaurant')}</Text>
      </View>

      {/* ── Toast ── */}
      <View style={{ paddingHorizontal: 16 }}><MessageToast msg={message} /></View>

      {/* ── Content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* ──────────────── OVERVIEW ──────────────── */}
          {activeTab === 'overview' && (
            <View style={{ gap: 16 }}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={s.sectionTitle}>{t('restaurantProfile')}</Text>
                {!restaurant && (
                  <TouchableOpacity style={s.pillBtn} onPress={() => setIsAddingRestaurant(true)}>
                    <Feather name="plus" size={13} color={C.orange} />
                    <Text style={[s.pillBtnTxt, { color: C.orange }]}>{t('initializeRestaurant')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {loading && !restaurant
                ? <View style={s.emptyBox}><ActivityIndicator size="large" color={C.orange} /></View>
                : restaurant
                  ? <RestaurantCard
                    restaurant={restaurant} menuItems={menuItems} reviews={reviews} t={t}
                    onEdit={() => {
                      setEditRestaurantForm({
                        cuisine: restaurant.cuisine, tags: restaurant.tags?.join(', ') || '',
                        opening_time: formatTimeForInput(restaurant.opening_time),
                        closing_time: formatTimeForInput(restaurant.closing_time),
                        days_open: daysStringToArray(restaurant.days_open),
                      });
                      setEditRestaurantOpen(true);
                    }}
                    onDelete={() => setDeleteRestaurantOpen(true)}
                    onUpdateProfile={() => { setUpdateProfileForm({ restaurant_name: restaurant.name, cover_image: null }); setUpdateProfileOpen(true); }}
                     onForceOpen={() => { setOverrideAction('open'); setShowOverrideModal(true); }}
  onForceClose={() => { setOverrideAction('close'); setShowOverrideModal(true); }}
  onCancelOverride={cancelOverride}
  overrideLoading={overrideLoading}
                  />
                  : !isAddingRestaurant
                    ? <View style={s.emptyBox}>
                      <MaterialCommunityIcons name="food-fork-drink" size={48} color={C.slate700} />
                      <Text style={s.emptyTxt}>{t('noRestaurant')}</Text>
                    </View>
                    : null
              }
              {isAddingRestaurant && (
                <RestaurantFormView form={restaurantForm} setForm={setRestaurantForm}
                  onSubmit={handleAddRestaurant} onCancel={() => setIsAddingRestaurant(false)}
                  loading={loading} t={t} />
              )}
            </View>
          )}

          {/* ──────────────── MENU ──────────────── */}
          {activeTab === 'menu' && (
            <View style={{ gap: 14 }}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={s.sectionTitle}>{t('myMenuItems')} ({menuItems.length})</Text>
                <TouchableOpacity style={[s.btnPrimary, { paddingVertical: 8, paddingHorizontal: 14 }]} onPress={() => setActiveTab('add-item')}>
                  <Feather name="plus" size={14} color={C.white} />
                  <Text style={[s.btnPrimaryTxt, { marginLeft: 4, fontSize: 13 }]}>{t('addNewItem')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {['All', ...MENU_CATEGORIES].map(cat => (
                  <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}
                    style={[s.filterChip, selectedCategory === cat && s.filterChipActive]}>
                    <Text style={[s.filterChipTxt, selectedCategory === cat && { color: C.orange }]}>
                      {cat === 'All' ? 'All' : t(categoryMap[cat])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {filteredMenu.length > 0
                ? filteredMenu.map(item => (
                  <MenuItemCard key={item.id} item={item}
                    onEdit={() => setEditItem(item)} onDelete={() => setDeleteItem(item)} />
                ))
                : <View style={s.emptyBox}>
                  <MaterialCommunityIcons name="food-fork-drink" size={48} color={C.slate700} />
                  <Text style={s.emptyTxt}>{t('noMenuItems')}</Text>
                </View>
              }
            </View>
          )}

          {/* ──────────────── ADD ITEM ──────────────── */}
          {activeTab === 'add-item' && (
            <View>
              <Text style={[s.sectionTitle, { marginBottom: 16 }]}>{t('addNewMenuItem')}</Text>
              <View style={s.card}>
                <AddItemForm form={menuItemForm} setForm={setMenuItemForm} onSubmit={handleAddMenuItem} loading={loading} t={t} />
              </View>
            </View>
          )}

          {/* ──────────────── REVIEWS ──────────────── */}
          {activeTab === 'reviews' && (
            <View style={{ gap: 12 }}>
              <Text style={s.sectionTitle}>{t('reviews')} ({reviews.length})</Text>
              {reviews.length > 0
                ? reviews.map((review, i) => (
                  <View key={i} style={s.card}>
                    <View style={{ padding: 16 }}>
                      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }]}>
                        <View style={s.row}>
                          <View style={s.reviewAvatar}>
                            <Text style={s.reviewAvatarTxt}>{review.user_email.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ marginLeft: 10 }}>
                            <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{review.user_email}</Text>
                            <Text style={{ color: C.slate500, fontSize: 11 }}>{new Date(review.created_at).toLocaleDateString()}</Text>
                          </View>
                        </View>
                        <Text style={{ color: '#FBBF24', letterSpacing: 2, fontSize: 14 }}>
                          {[...Array(5)].map((_, s) => s < review.rating ? '★' : '☆').join('')}
                        </Text>
                      </View>
                      <Text style={{ color: C.slate400, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>"{review.comment}"</Text>
                    </View>
                  </View>
                ))
                : <View style={s.emptyBox}>
                  <Feather name="star" size={48} color={C.slate700} />
                  <Text style={s.emptyTxt}>{t('reviews')}</Text>
                </View>
              }
            </View>
          )}

          {/* ──────────────── ORDERS (fully updated) ──────────────── */}
          {activeTab === 'orders' && (
            <View style={{ gap: 14 }}>
              {/* Header row */}
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                  <Text style={s.sectionTitle}>{t('orders')} ({displayedOrders.length})</Text>
                  <Text style={{ color: C.slate500, fontSize: 11, marginTop: 2 }}>{getTodayIST()}</Text>
                </View>
                <TouchableOpacity style={s.pillBtn} onPress={() => fetchOrders(currentPage)}>
                  {ordersLoading
                    ? <ActivityIndicator size="small" color={C.orange} />
                    : <><Feather name="refresh-cw" size={13} color={C.orange} /><Text style={[s.pillBtnTxt, { color: C.orange, marginLeft: 4 }]}>{t('refresh')}</Text></>
                  }
                </TouchableOpacity>
              </View>

              {/* Stats cards */}
              <View style={[s.row, { gap: 12 }]}>
                <View style={[s.statCard, { flex: 1 }]}>
                  <Text style={s.statLabel}>{t('todaysOrders')}</Text>
                  <Text style={[s.statVal, { color: C.orange }]}>{ordersStats.today?.count || 0}</Text>
                </View>
                <View style={[s.statCard, { flex: 1 }]}>
                  <Text style={s.statLabel}>{t('todaysRevenue')}</Text>
                  <Text style={[s.statVal, { color: C.emerald }]}>₹{(ordersStats.today?.total || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Payment method filter */}
              <View>
                <Text style={{ color: C.slate500, fontSize: 11, marginBottom: 8 }}>Filter by Payment:</Text>
                <View style={[s.row, { gap: 8, flexWrap: 'wrap' }]}>
                  {([
                    { key: 'all' as PaymentFilter, label: t('paymentAll'), color: C.white, dimColor: C.border10 },
                    { key: 'upi' as PaymentFilter, label: t('paymentUPI'), color: C.purple, dimColor: C.purpleDim },
                    { key: 'cash' as PaymentFilter, label: t('paymentCash'), color: C.emerald, dimColor: C.emeraldDim },
                  ]).map(({ key, label, color, dimColor }) => {
                    const active = paymentMethodFilter === key;
                    return (
                      <TouchableOpacity key={key} onPress={() => setPaymentMethodFilter(key)}
                        style={[s.payFilterBtn, active && { borderColor: color + '60', backgroundColor: dimColor }]}>
                        <Text style={[s.payFilterTxt, active && { color }]}>{label}</Text>
                        {active && (
                          <View style={[s.payFilterBadge, { backgroundColor: color + '30' }]}>
                            <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{displayedOrders.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Order list */}
              {ordersLoading
                ? <View style={s.emptyBox}><ActivityIndicator size="large" color={C.orange} /></View>
                : displayedOrders.length > 0
                  ? displayedOrders.map(order => {
                    const isCash = String(order.payment_method || '').toLowerCase().includes('cash') ||
                      String(order.payment_method || '').toLowerCase().includes('cod');
                    const isPaid = order.payment_status === 'paid';
                    return (
                      <View key={order.id} style={s.orderCard}>
                        {/* Top row */}
                        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
                          <Text style={{ color: C.orange, fontWeight: '700', fontSize: 14 }}>{order.order_number}</Text>
                          <View style={[s.row, { gap: 6 }]}>
                            <View style={[s.statusPill, { borderColor: isPaid ? C.emerald + '40' : C.yellow + '40', backgroundColor: isPaid ? C.emeraldDim : C.yellowDim }]}>
                              <Text style={{ color: isPaid ? C.emerald : C.yellow, fontSize: 11, fontWeight: '600' }}>{order.payment_status}</Text>
                            </View>
                            <View style={[s.statusPill, { borderColor: C.blue + '40', backgroundColor: C.blueDim }]}>
                              <Text style={{ color: C.blue, fontSize: 11, fontWeight: '600' }}>{order.payment_method}</Text>
                            </View>
                          </View>
                        </View>
                        {/* Customer + amount */}
                        <View style={[s.row, { justifyContent: 'space-between' }]}>
                          <View>
                            <Text style={{ color: C.white, fontWeight: '600', fontSize: 13 }}>{order.customer?.name || 'N/A'}</Text>
                            <Text style={{ color: C.slate400, fontSize: 12 }}>{order.customer_phone}</Text>
                          </View>
                          <Text style={{ color: C.emerald, fontWeight: '800', fontSize: 16 }}>₹{order.total_amount?.toFixed(2)}</Text>
                        </View>
                        {/* IST date + view items */}
                        <View style={[s.row, { justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }]}>
                          <Text style={{ color: C.slate500, fontSize: 11 }}>{formatIST(order.created_at)}</Text>
                          <TouchableOpacity onPress={() => setSelectedOrder(order)}>
                            <Text style={{ color: C.orange, fontSize: 12, fontWeight: '600' }}>View Items ({order.item_count})</Text>
                          </TouchableOpacity>
                        </View>
                     {/* Action row: Map + Mark Paid */}
<View style={[s.row, { gap: 8, marginTop: 10 }]}>
  {order.delivery_address && (
    <TouchableOpacity
      style={[s.orderActionBtn, { borderColor: C.blue + '40', backgroundColor: C.blueDim }]}
      onPress={() => Linking.openURL(order.delivery_address)}>
      <Feather name="map-pin" size={12} color={C.blue} />
      <Text style={{ color: C.blue, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>Map</Text>
    </TouchableOpacity>
  )}
  
  {/* ✅ Use the updated payment_status from state */}
  {isCash && order.payment_status !== 'paid' && (
    <TouchableOpacity
      style={[s.orderActionBtn, { borderColor: C.emerald + '40', backgroundColor: C.emeraldDim }]}
      onPress={() => markCODAsPaid(order.id, order.order_number)}>
      <Feather name="check-circle" size={12} color={C.emerald} />
      <Text style={{ color: C.emerald, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>{t('markPaid')}</Text>
    </TouchableOpacity>
  )}
</View>
                      </View>
                    );
                  })
                  : <View style={s.emptyBox}>
                    <Feather name="shopping-bag" size={48} color={C.slate700} />
                    <Text style={s.emptyTxt}>{t('noOrdersToday')}</Text>
                  </View>
              }

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={[s.row, { justifyContent: 'center', gap: 12, marginTop: 8 }]}>
                  <TouchableOpacity
                    style={[s.pageBtn, currentPage === 1 && { opacity: 0.4 }]}
                    disabled={currentPage === 1}
                    onPress={() => { const p = currentPage - 1; setCurrentPage(p); fetchOrders(p); }}>
                    <Feather name="chevron-left" size={16} color={C.slate400} />
                    <Text style={s.pageBtnTxt}>Prev</Text>
                  </TouchableOpacity>
                  <View style={[s.statCard, { paddingHorizontal: 16, paddingVertical: 8 }]}>
                    <Text style={{ color: C.slate400, fontSize: 13 }}>{currentPage} / {totalPages}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.pageBtn, currentPage === totalPages && { opacity: 0.4 }]}
                    disabled={currentPage === totalPages}
                    onPress={() => { const p = currentPage + 1; setCurrentPage(p); fetchOrders(p); }}>
                    <Text style={s.pageBtnTxt}>Next</Text>
                    <Feather name="chevron-right" size={16} color={C.slate400} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ──────────────── ANALYTICS (NEW) ──────────────── */}
          {activeTab === 'analytics' && (
            <View style={{ gap: 16 }}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={s.sectionTitle}>{t('analytics')}</Text>
                <TouchableOpacity style={s.pillBtn} onPress={fetchAnalytics}>
                  {analyticsLoading
                    ? <ActivityIndicator size="small" color={C.orange} />
                    : <><Feather name="refresh-cw" size={13} color={C.orange} /><Text style={[s.pillBtnTxt, { color: C.orange, marginLeft: 4 }]}>{t('refresh')}</Text></>
                  }
                </TouchableOpacity>
              </View>

              {analyticsLoading && !analyticsSummary
                ? <View style={s.emptyBox}><ActivityIndicator size="large" color={C.orange} /></View>
                : (
                  <>
                    {/* Summary cards */}
                    {analyticsSummary && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {[
                          { label: t('totalOrders'), value: String(analyticsSummary.total_orders_all_time), color: C.orange },
                          { label: t('totalRevenue'), value: `₹${parseFloat(String(analyticsSummary.total_revenue_all_time)).toFixed(2)}`, color: C.emerald },
                          { label: t('todaysOrders'), value: String(analyticsSummary.today_orders_count), color: C.blue },
                          { label: t('todaysRevenue'), value: `₹${parseFloat(String(analyticsSummary.today_revenue)).toFixed(2)}`, color: C.yellow },
                        ].map(card => (
                          <View key={card.label} style={[s.statCard, { flex: 1, minWidth: '45%' }]}>
                            <Text style={[s.statLabel, { marginBottom: 6 }]}>{card.label}</Text>
                            <Text style={[s.statVal, { fontSize: 20, color: card.color }]}>{card.value}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Chart */}
                    {analyticsData.length > 0
                      ? <View style={[s.card, { padding: 16 }]}>
                        <Text style={{ color: C.slate400, fontSize: 13, fontWeight: '600', marginBottom: 14 }}>
                          Daily Orders & Revenue
                        </Text>
                        <AnalyticsChart data={analyticsData} />
                      </View>
                      : <View style={s.emptyBox}>
                        <Feather name="bar-chart-2" size={48} color={C.slate700} />
                        <Text style={s.emptyTxt}>{t('noAnalytics')}</Text>
                      </View>
                    }
                  </>
                )}
            </View>
          )}

         

        </ScrollView>
      </KeyboardAvoidingView>

{/* ── Bottom Tab Bar (Two Rows) ── */}
<SafeAreaView style={{ backgroundColor: C.card }}>
  <View style={s.tabBarContainer}>
    {/* First Row - 4 main tabs */}
    <View style={s.tabBarRow}>
      {([
        { id: 'overview', icon: 'grid', label: 'overview' },
        { id: 'menu', icon: 'menu', label: 'myMenu' },
        { id: 'add-item', icon: 'plus-circle', label: 'addItem' },
        { id: 'orders', icon: 'shopping-bag', label: 'orders' },
      ] as { id: TabId; icon: string; label: TKey }[]).map(item => {
        const active = activeTab === item.id;
        return (
          <TouchableOpacity key={item.id} style={s.tabItem} onPress={() => {
            setActiveTab(item.id);
            if (item.id === 'orders') setNewOrdersCount(0);
          }}>
            <View>
              <Feather name={item.icon as any} size={item.id === 'add-item' ? 26 : 20} color={active ? C.orange : C.slate500} />
              {item.id === 'orders' && newOrdersCount > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeTxt}>{newOrdersCount > 99 ? '99+' : newOrdersCount}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tabLabel, active && { color: C.orange }]}>{t(item.label)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>

    {/* Second Row - 2 tabs evenly spaced (reviews, analytics) */}
    <View style={[s.tabBarRow, { justifyContent: 'center', gap: 60 }]}>
      {([
        { id: 'reviews', icon: 'star', label: 'reviews' },
        { id: 'analytics', icon: 'bar-chart-2', label: 'analytics' },
      ] as { id: TabId; icon: string; label: TKey }[]).map(item => {
        const active = activeTab === item.id;
        return (
          <TouchableOpacity key={item.id} style={[s.tabItem, { flex: 0, minWidth: 80 }]} onPress={() => {
            setActiveTab(item.id);
          }}>
            <Feather name={item.icon as any} size={20} color={active ? C.orange : C.slate500} />
            <Text style={[s.tabLabel, active && { color: C.orange }]}>{t(item.label)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
</SafeAreaView>

      {/* ── Modals ── */}
      <EditRestaurantModal
        visible={editRestaurantOpen} form={editRestaurantForm} setForm={setEditRestaurantForm}
        onSubmit={handleUpdateRestaurant} onClose={() => setEditRestaurantOpen(false)}
        loading={editRestaurantLoading} t={t}
      />
      <ConfirmDeleteModal
        visible={deleteRestaurantOpen} label={t('restaurantProfile')}
        onConfirm={handleDeleteRestaurant} onClose={() => setDeleteRestaurantOpen(false)}
        loading={deleteRestaurantLoading} t={t}
      />
      <EditItemModal item={editItem} onClose={() => setEditItem(null)} onSave={handleUpdateMenuItem} loading={editItemLoading} t={t} />
      <ConfirmDeleteModal
        visible={!!deleteItem} label={deleteItem?.name || ''}
        onConfirm={handleDeleteMenuItem} onClose={() => setDeleteItem(null)}
        loading={deleteItemLoading} t={t}
      />

      {/* Update Profile Modal */}
      <Modal visible={updateProfileOpen} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={s.overlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{t('updateProfile')}</Text>
                <TouchableOpacity onPress={() => setUpdateProfileOpen(false)}><Feather name="x" size={18} color={C.slate400} /></TouchableOpacity>
              </View>
              <InputField label={t('restaurantProfile')} value={updateProfileForm.restaurant_name}
                onChangeText={v => setUpdateProfileForm({ ...updateProfileForm, restaurant_name: v })} />
              <TouchableOpacity style={[s.imagePicker, { marginTop: 12, height: 100 }]} onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
                if (!result.canceled && result.assets[0]) setUpdateProfileForm({ ...updateProfileForm, cover_image: result.assets[0] });
              }}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Feather name="upload" size={22} color={C.slate500} />
                  <Text style={{ color: C.slate400, fontSize: 13 }}>
                    {updateProfileForm.cover_image ? 'Image selected ✓' : t('clickToUpload')}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={[s.row, { gap: 12, marginTop: 16 }]}>
                <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={() => setUpdateProfileOpen(false)}>
                  <Text style={s.btnSecondaryTxt}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} disabled={updateProfileLoading} onPress={handleUpdateProfile}>
                  {updateProfileLoading ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.btnPrimaryTxt}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <OrderItemsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        <OverrideModal
  visible={showOverrideModal}
  action={overrideAction}
  onClose={() => setShowOverrideModal(false)}
  onConfirm={(startTime, endTime) => forceRestaurantStatus(overrideAction === 'open', startTime, endTime)}
  loading={overrideLoading}
/>

    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: 'row', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.white, fontWeight: '800', fontSize: 18 },
  avatarBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.orangeDim, borderWidth: 1, borderColor: C.orangeBorder, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.orange, fontWeight: '800', fontSize: 14 },
  pageHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { color: C.white, fontWeight: '800', fontSize: 20 },
  pageSubtitle: { color: C.slate400, fontSize: 13, marginTop: 2 },

  // Content
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { color: C.white, fontWeight: '800', fontSize: 18 },

  // Sidebar
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 264, backgroundColor: C.card + 'F5', borderRightWidth: 1, borderRightColor: C.border, zIndex: 50 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  navItemActive: { backgroundColor: C.orangeDim },
  navLabel: { color: C.slate400, fontWeight: '600', fontSize: 14, flex: 1 },
  sidebarBottom: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  navBadge: { backgroundColor: C.orange, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navBadgeTxt: { color: C.white, fontSize: 10, fontWeight: '800' },

  // Bottom Tab
  // Bottom Tab
tabBarContainer: {
  backgroundColor: C.card,
  borderTopWidth: 1,
  borderTopColor: C.border,
  paddingTop: 8,
  paddingBottom: Platform.OS === 'ios' ? 24 : 12,
},
tabBarRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 4,
},
tabItem: {
  flex: 1,
  alignItems: 'center',
  paddingVertical: 8,
  gap: 4,
},
tabLabel: {
  color: C.slate500,
  fontSize: 11,
  fontWeight: '500',
},
tabBadge: {
  position: 'absolute',
  top: -8,
  right: -12,
  backgroundColor: C.orange,
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 4,
},
tabBadgeTxt: {
  color: C.white,
  fontSize: 9,
  fontWeight: '800',
},
  // Cards
  card: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 2 },
  orderCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  statCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  statLabel: { color: C.slate400, fontSize: 13, marginBottom: 4 },
  statVal: { color: C.white, fontWeight: '800', fontSize: 24 },

  // Badge / Status
  badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeOpen: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  badgeClosed: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  badgeTxt: { fontWeight: '700', fontSize: 11 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },

  // Tag
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagTxt: { fontSize: 11, fontWeight: '500' },

  // Form
  inputWrap: {},
  label: { color: C.slate400, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, color: C.white, fontSize: 14, minHeight: 44 },
  imagePicker: { width: '100%', height: 140, backgroundColor: C.bg, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  // Days
  dayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border10, backgroundColor: C.border },
  dayBtnActive: { borderColor: C.orangeBorder, backgroundColor: C.orangeDim },
  dayBtnTxt: { color: C.slate400, fontSize: 12, fontWeight: '600' },

  // Category
  catBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.border10, backgroundColor: C.border },
  catBtnActive: { borderColor: C.orangeBorder, backgroundColor: C.orangeDim },
  catBtnTxt: { color: C.slate400, fontSize: 13, fontWeight: '600' },

  // Radio
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },

  // Buttons
  btnPrimary: { backgroundColor: C.orange, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnPrimaryTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  btnSecondary: { borderWidth: 1, borderColor: C.border10, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnSecondaryTxt: { color: C.slate400, fontWeight: '600', fontSize: 14 },
  btnDanger: { backgroundColor: C.redDim, borderWidth: 1, borderColor: C.red + '40', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.orangeBorder, backgroundColor: C.orangeDim, gap: 4 },
  pillBtnTxt: { fontSize: 12, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, gap: 4, minHeight: 36 },
  cardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, gap: 4, minHeight: 36 },

  // Filter
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border10, backgroundColor: C.border },
  filterChipActive: { borderColor: C.orangeBorder, backgroundColor: C.orangeDim },
  filterChipTxt: { color: C.slate400, fontSize: 12, fontWeight: '600' },

  // Payment filter
  payFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border10, backgroundColor: C.border },
  payFilterTxt: { color: C.slate400, fontSize: 12, fontWeight: '600' },
  payFilterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },

  // Order actions
  orderActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4 },

  // Pagination
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border10, backgroundColor: C.border },
  pageBtnTxt: { color: C.slate400, fontSize: 13, fontWeight: '600' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.modal, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: C.border10, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { color: C.white, fontWeight: '800', fontSize: 16 },

  // Time picker
  hourBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.border10, alignItems: 'center', justifyContent: 'center' },
  hourBtnActive: { backgroundColor: C.orange },
  hourBtnTxt: { color: C.slate400, fontWeight: '700', fontSize: 16 },
  minBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.border10, alignItems: 'center', justifyContent: 'center' },
  minBtnTxt: { color: C.white, fontSize: 24, fontWeight: '300' },
  periodBtn: { paddingVertical: 12, borderRadius: 12, backgroundColor: C.border10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: C.orange },
  periodBtnTxt: { color: C.slate400, fontWeight: '600', fontSize: 16 },

  // Info box
  infoBox: { backgroundColor: C.border, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border10 },
  infoLabel: { color: C.slate400, fontSize: 11 },
  infoValue: { color: C.white, fontWeight: '600', fontSize: 14, marginTop: 2 },

  // Toast
  toast: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },

  // Empty
  emptyBox: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 48, alignItems: 'center', gap: 12 },
  emptyTxt: { color: C.slate400, fontSize: 14, textAlign: 'center' },

  // Review
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.border10, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarTxt: { color: C.slate400, fontWeight: '700', fontSize: 14 },

  // Settings
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingsLabel: { color: C.white, fontSize: 14, fontWeight: '500' },
});