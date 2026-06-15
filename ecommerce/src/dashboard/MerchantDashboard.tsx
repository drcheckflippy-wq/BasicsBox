/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Utensils, LayoutDashboard, Settings, LogOut, Upload,
  CheckCircle2, AlertCircle, Loader2, Image as ImageIcon,
  ChevronRight, Trash2, Pencil, X, Save, Star,
  MapPin,
  ForkKnifeCrossed,
  StarIcon,

  Menu,
  Clock,
  Flame,
  ShoppingBag,
  RefreshCw,
  Banknote,
  Phone,
  BarChart2
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://basicsbox.pythonanywhere.com/api';

// ─── Language Translations ────────────────────────────────────────────────────
type Language = 'en' | 'ta';

const translations = {
  en: {
    // Sidebar
    overview: "Overview",
    myMenu: "My Menu",
    reviews: "Reviews",
    addItem: "Add Item",
    settings: "Settings",
    logout: "Logout",
    tamil: "தமிழ்",
    english: "English",
    
    // Header
    merchantDashboard: "Merchant Dashboard",
    manageRestaurant: "Manage your restaurant and menu items",
    
    // Overview Tab
    restaurantProfile: "Restaurant Profile",
    initializeRestaurant: "Initialize Restaurant",
    updateProfile: "Update Profile",
    edit: "Edit",
    delete: "Delete",
    open: "Open",
    closed: "Closed",
    openNow: "Open Now",
    closedNow: "Closed Now",
    openOn: "Open on",
    menuItems: "menu items",
    noRestaurant: "No restaurant registered yet",
    view: "View",
    
    // Add Restaurant Form
    registerRestaurant: "Register Your Restaurant",
    cuisineType: "Cuisine Type",
    tagsComma: "Tags (comma separated)",
    operatingDays: "Operating Days",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
    clickToSetOpening: "Click to set opening time",
    clickToSetClosing: "Click to set closing time",
    operatingHours: "Operating Hours",
    operatingDaysLabel: "Operating Days",
    statusAutoUpdate: "Status will be automatically updated based on current time and day",
    cancel: "Cancel",
    saveRestaurant: "Save Restaurant",
    
    // Menu Tab
    myMenuItems: "My Menu Items",
    addNewItem: "Add New Item",
    noMenuItems: "No menu items found. Add your first dish!",
    
    // Add Item Form
    addNewMenuItem: "Add New Menu Item",
    itemName: "Item Name",
    price: "Price (₹)",
    description: "Description",
    foodType: "Food Type",
    vegetarian: "Vegetarian",
    nonVegetarian: "Non-vegetarian",
    category: "Category",
    itemImage: "Item Image",
    clickToUpload: "Click to upload food image",
    imageFormat: "JPG, PNG up to 5MB",
    addToMenu: "Add to Menu",
    
    // Edit Item Modal
    editItem: "Edit —",
    replaceImage: "Replace Image (optional)",
    uploadNewImage: "Upload new image",
    saveChanges: "Save Changes",
    
    // Confirm Delete Modal
    confirmDelete: "Confirm Delete",
    deleteWarning: "Are you sure you want to delete",
    cannotUndo: "This action cannot be undone.",
    
    // Days
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
    mondayFull: "Monday",
    tuesdayFull: "Tuesday",
    wednesdayFull: "Wednesday",
    thursdayFull: "Thursday",
    fridayFull: "Friday",
    saturdayFull: "Saturday",
    sundayFull: "Sunday",
    
    // Categories
    meals: "Meals",
    tiffin: "Tiffin",
    snacks: "Snacks",
    veg: "Veg",
    nonVeg: "Non-Veg",
    
    // Messages
    success: "Success",
    error: "Error",
    imageRequired: "Image is required",
    addedSuccessfully: "added successfully",
    updatedSuccessfully: "updated successfully",
    deletedSuccessfully: "deleted successfully",
    failed: "Failed",
    
    // Placeholders
    cuisinePlaceholder: "e.g. Italian, Indian, Chinese",
    tagsPlaceholder: "e.g. spicy, vegan, fast food",
    itemNamePlaceholder: "e.g. Margherita Pizza",
    pricePlaceholder: "0.00",
    descriptionPlaceholder: "Describe your dish...",
    selectTime: "Select time",
    
    // Map
    viewOnMap: "View on Google Maps",
    orders: "Orders",
    todaysOrders: "Today's Orders",
    todaysRevenue: "Today's Revenue"
  },
  ta: {
    // Sidebar - Tamil
    orders: "ஆர்டர்கள்",
    overview: "மேலோட்டம்",
    myMenu: "என் மெனு",
    reviews: "விமர்சனங்கள்",
    addItem: "பொருள் சேர்",
    settings: "அமைப்புகள்",
    logout: "வெளியேறு",
    tamil: "தமிழ்",
    english: "ஆங்கிலம்",
    
    // Header
    merchantDashboard: "வணிகர் கட்டுப்பாட்டகம்",
    manageRestaurant: "உங்கள் உணவகம் மற்றும் மெனு பொருட்களை நிர்வகிக்கவும்",
    
    // Overview Tab
    restaurantProfile: "உணவக சுயவிவரம்",
    initializeRestaurant: "உணவகத்தை தொடங்கு",
    updateProfile: "சுயவிவரத்தை புதுப்பி",
    edit: "திருத்து",
    delete: "நீக்கு",
    open: "திறந்த",
    closed: "மூடப்பட்ட",
    openNow: "இப்போது திறந்துள்ளது",
    closedNow: "இப்போது மூடப்பட்டுள்ளது",
    openOn: "திறக்கும் நாட்கள்",
    menuItems: "மெனு பொருட்கள்",
    noRestaurant: "இதுவரை உணவகம் பதிவு செய்யப்படவில்லை",
    view: "பார்க்க",
    
    // Add Restaurant Form
    registerRestaurant: "உங்கள் உணவகத்தை பதிவு செய்யுங்கள்",
    cuisineType: "சமையல் வகை",
    tagsComma: "குறிச்சொற்கள் (கமாவால் பிரிக்கவும்)",
    operatingDays: "இயங்கும் நாட்கள்",
    openingTime: "திறக்கும் நேரம்",
    closingTime: "மூடும் நேரம்",
    clickToSetOpening: "திறக்கும் நேரத்தை அமைக்க கிளிக் செய்யவும்",
    clickToSetClosing: "மூடும் நேரத்தை அமைக்க கிளிக் செய்யவும்",
    operatingHours: "இயங்கும் நேரம்",
    operatingDaysLabel: "இயங்கும் நாட்கள்",
    statusAutoUpdate: "தற்போதைய நேரம் மற்றும் நாள் அடிப்படையில் நிலை தானாக புதுப்பிக்கப்படும்",
    cancel: "ரத்து செய்",
    saveRestaurant: "உணவகத்தை சேமி",
    
    // Menu Tab
    myMenuItems: "என் மெனு பொருட்கள்",
    addNewItem: "புதிய பொருளை சேர்",
    noMenuItems: "மெனு பொருட்கள் இல்லை. உங்கள் முதல் உணவை சேர்க்கவும்!",
    
    // Add Item Form
    addNewMenuItem: "புதிய மெனு பொருளை சேர்க்கவும்",
    itemName: "பொருளின் பெயர்",
    price: "விலை (₹)",
    description: "விளக்கம்",
    foodType: "உணவு வகை",
    vegetarian: "சைவம்",
    nonVegetarian: "அசைவம்",
    category: "பிரிவு",
    itemImage: "பொருளின் படம்",
    clickToUpload: "உணவு படத்தை பதிவேற்ற கிளிக் செய்யவும்",
    imageFormat: "JPG, PNG 5MB வரை",
    addToMenu: "மெனுவில் சேர்",
    
    // Edit Item Modal
    editItem: "திருத்து —",
    replaceImage: "படத்தை மாற்று (விரும்பினால்)",
    uploadNewImage: "புதிய படத்தை பதிவேற்று",
    saveChanges: "மாற்றங்களை சேமி",
    
    // Confirm Delete Modal
    confirmDelete: "நீக்குவதை உறுதி செய்யுங்கள்",
    deleteWarning: "நீக்க விரும்புகிறீர்களா?",
    cannotUndo: "இந்த செயலை மீட்க முடியாது.",
    
    // Days
    monday: "திங்கள்",
    tuesday: "செவ்வாய்",
    wednesday: "புதன்",
    thursday: "வியாழன்",
    friday: "வெள்ளி",
    saturday: "சனி",
    sunday: "ஞாயிறு",
    mondayFull: "திங்கள்",
    tuesdayFull: "செவ்வாய்",
    wednesdayFull: "புதன்",
    thursdayFull: "வியாழன்",
    fridayFull: "வெள்ளி",
    saturdayFull: "சனி",
    sundayFull: "ஞாயிறு",
    
    // Categories
    meals: "மீல்ஸ்",
    tiffin: "டிபன்",
    snacks: "ஸ்னாக்ஸ்",
    veg: "சைவம்",
    nonVeg: "அசைவம்",
    
    // Messages
    success: "வெற்றி",
    error: "பிழை",
    imageRequired: "படம் அவசியம்",
    addedSuccessfully: "வெற்றிகரமாக சேர்க்கப்பட்டது",
    updatedSuccessfully: "வெற்றிகரமாக புதுப்பிக்கப்பட்டது",
    deletedSuccessfully: "வெற்றிகரமாக நீக்கப்பட்டது",
    failed: "தோல்வியடைந்தது",
    
    // Placeholders
    cuisinePlaceholder: "எ.கா. இத்தாலியன், இந்தியன், சைனீஸ்",
    tagsPlaceholder: "எ.கா. காரமான, சைவம், வேகமான உணவு",
    itemNamePlaceholder: "எ.கா. மார்கெரிட்டா பிஸ்ஸா",
    pricePlaceholder: "0.00",
    descriptionPlaceholder: "உங்கள் உணவை விவரிக்கவும்...",
    selectTime: "நேரத்தை தேர்வு செய்யவும்",
    
    // Map
    viewOnMap: "Google Maps இல் பார்க்க",
    todaysOrders: "இன்றைய ஆர்டர்கள்",
    todaysRevenue: "இன்றைய வருமானம்"
  }
};

const categoryMap: Record<string, keyof typeof translations.en> = {
  'Meals': 'meals',
  'Tiffin': 'tiffin',
  'Snacks': 'snacks',
  'Veg': 'veg',
  'Non-Veg': 'nonVeg'
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  is_veg: boolean;
  image?: string;
  category: string;
  has_offer?: boolean;
  offer_percentage?: number;
  offer_price?: number;
  offer_expiry?: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  tags: string[];
  is_open: boolean;
  image?: string;
  latitude?: number;
  longitude?: number;
  opening_time?: string;
  closing_time?: string;
  days_open?: string;
   manual_override?: boolean;
  manual_override_expiry?: string | null;
  manual_override_status?: boolean;
  manual_override_start_time?: string | null;
  manual_override_end_time?: string | null;
  is_manually_overridden?: boolean;
}

interface Review {
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, }: { title: string; onClose: () => void; children: React.ReactNode; language: Language }) {
 
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0F172A] z-10">
          <h3 className="font-bold text-base sm:text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ label, onConfirm, onClose, loading, language }: {
  label: string; onConfirm: () => void; onClose: () => void; loading: boolean; language: Language;
}) {
  const t = (key: keyof typeof translations.en) => translations[language][key];
  
  return (
    <Modal title={t('confirmDelete')} onClose={onClose} language={language}>
      <p className="text-text-secondary mb-6 text-sm sm:text-base">
        {t('deleteWarning')} <span className="text-white font-semibold">{label}</span>? {t('cannotUndo')}
      </p>
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:bg-white/5 transition-all font-medium order-2 sm:order-1">
          {t('cancel')}
        </button>
        <button onClick={onConfirm} disabled={loading} className="px-5 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 order-1 sm:order-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {t('delete')}
        </button>
      </div>
    </Modal>
  );
}
// ─── Order Items Modal ────────────────────────────────────────────────────
function OrderItemsModal({ order, onClose, language }: { order: any; onClose: () => void; language: Language }) {
  
  
  if (!order) return null;
  
  return (
    <Modal title={`${order.order_number} - Items`} onClose={onClose} language={language}>
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-xs text-slate-400">Customer</p>
          <p className="text-sm font-medium text-white">{order.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-400 mt-2">Phone</p>
          <p className="text-sm text-white">{order.customer_phone}</p>
        </div>
        
        {/* Items List */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          <p className="text-sm font-medium text-orange-400 sticky top-0 bg-[#0F172A] py-2">Items ({order.item_count})</p>
          {order.items && order.items.map((item: any, index: number) => (
            <div key={item.id || index} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.category && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20">
                        {item.category}
                      </span>
                    )}
                    {item.is_veg !== undefined && (
                      <span className={`px-2 py-0.5 text-[10px] rounded border ${
                        item.is_veg 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-400">₹{item.price_at_time.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">x{item.quantity}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-slate-400">Subtotal</span>
                <span className="text-sm font-medium text-emerald-400">₹{item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Total */}
        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-orange-400">Total Amount</span>
            <span className="text-lg font-bold text-orange-400">₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg font-medium text-white transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// ─── Days Selection Component ─────────────────────────────────────────────────
const DaysSelection = ({ selectedDays, onChange, language }: { 
  selectedDays: string[], 
  onChange: (days: string[]) => void;
  language: Language;
}) => {
  const t = (key: keyof typeof translations.en) => translations[language][key];
  
  const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const dayMap: Record<string, keyof typeof translations.en> = {
    'Monday': 'monday',
    'Tuesday': 'tuesday',
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday'
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">{t('operatingDays')}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all border
              ${selectedDays.includes(day) 
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {t(dayMap[day])}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-1">
        {t('operatingDays')}
      </p>
    </div>
  );
};


// ─── ClockPicker Component ────────────────────────────────────────────────────
const ClockPicker = ({ value, onChange, onClose, language }: { 
  value: string; 
  onChange: (time: string) => void;
  onClose: () => void;
  language: Language;
}) => {
  const t = (key: keyof typeof translations.en) => translations[language][key];
  
  const parseTime = () => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      
      let hour12 = hour % 12;
      hour12 = hour12 === 0 ? 12 : hour12;
      const period = hour >= 12 ? 'PM' : 'AM';
      
      return { hour12, minute, period };
    }
    return { hour12: 9, minute: 0, period: 'AM' as const };
  };

  const { hour12: initialHour, minute: initialMinute, period: initialPeriod } = parseTime();
  
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialPeriod as 'AM' | 'PM');

  useEffect(() => {
    const { hour12, minute, period } = parseTime();
    setSelectedHour(hour12);
    setSelectedMinute(minute);
    setSelectedPeriod(period as 'AM' | 'PM');
  }, [value]);

  const get24HourTime = () => {
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };


  const handleSave = () => {
    onChange(get24HourTime());
    onClose();
  };

  const incrementMinute = () => {
    setSelectedMinute((prev) => (prev + 1) % 60);
  };

  const decrementMinute = () => {
    setSelectedMinute((prev) => (prev - 1 + 60) % 60);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 shadow-2xl w-80"
    >
      <h3 className="text-center font-bold text-lg mb-4">{t('selectTime')}</h3>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-orange-400 mb-2">
          {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
        </div>
        <div className="text-xl text-slate-400">{selectedPeriod}</div>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2">{t('openingTime')}</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
            <button
              key={hour}
              onClick={() => setSelectedHour(hour)}
              className={`
                py-3 rounded-xl text-lg font-bold transition-all
                ${selectedHour === hour 
                  ? 'bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/30' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }
              `}
            >
              {hour}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2">{t('closingTime')}</label>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={decrementMinute}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-2xl"
          >
            -
          </button>
          <div className="text-3xl font-bold text-white w-20 text-center">
            {selectedMinute.toString().padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={incrementMinute}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-2xl"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setSelectedPeriod('AM')}
          className={`
            py-3 rounded-xl text-lg font-medium transition-all
            ${selectedPeriod === 'AM' 
              ? 'bg-orange-500 text-white' 
              : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }
          `}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => setSelectedPeriod('PM')}
          className={`
            py-3 rounded-xl text-lg font-medium transition-all
            ${selectedPeriod === 'PM' 
              ? 'bg-orange-500 text-white' 
              : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }
          `}
        >
          PM
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm font-medium"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium transition-all text-sm"
        >
          {t('saveChanges')}
        </button>
      </div>
    </motion.div>
  );
};

// ─── DurationPicker Component ─────────────────────────────────────────────────
const DurationPicker = ({ value, onChange,  }: { 
  value: string; 
  onChange: (value: string) => void;
  language: Language;
}) => {

  
  const parseDuration = (val: string) => {
    const num = parseInt(val) || 0;
    if (num <= 24) return { hours: num, days: 0 };
    return { hours: num % 24, days: Math.floor(num / 24) };
  };

  const { hours, days } = parseDuration(value);
  
  const increment = () => {
    const currentNum = parseInt(value) || 0;
    onChange(String(currentNum + 1));
  };
  
  const decrement = () => {
    const currentNum = parseInt(value) || 0;
    if (currentNum > 0) {
      onChange(String(currentNum - 1));
    }
  };

  const setToHours = () => {
    onChange(String(hours));
  };

  const setToDays = () => {
    onChange(String((days * 24) + (hours || 24)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-medium text-slate-400">
          Offer Duration
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setToHours}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              days === 0 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Hours
          </button>
          <button
            type="button"
            onClick={setToDays}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              days > 0 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Days
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          className="w-10 h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl font-bold transition-all"
        >
          -
        </button>
        
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {value || '0'}
          </div>
          <div className="text-xs text-slate-500">
            {days > 0 
              ? `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}`
              : `${hours} hour${hours !== 1 ? 's' : ''}`
            }
          </div>
        </div>
        
        <button
          type="button"
          onClick={increment}
          className="w-10 h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl font-bold transition-all"
        >
          +
        </button>
      </div>
      
      <p className="text-[10px] text-slate-500 text-center">
        {days === 0 
          ? 'Up to 24 hours (click Days for longer offers)'
          : `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} total`
        }
      </p>
    </div>
  );
};
// ─── TimeRangePicker Component ─────────────────────────────────────────────────

// ─── SidebarLink Component ────────────────────────────────────────────────────
function SidebarLink({ active, onClick, icon, label, children }: {
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  children?: React.ReactNode;
  language: Language;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all font-medium text-xs sm:text-sm ${
        active ? 'bg-orange-500/10 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}>
      {icon}
      <span>{label}</span>
      {children}
      {active && <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px] ml-auto" />}
    </button>
  );
}
function OverrideModal({
  show,
  onClose,
  onConfirm,
  loading,
  action,
}: {
  show: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
  loading: boolean;
  action: "open" | "close";
}) {
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState("10:00");
  const [tempEndTime, setTempEndTime] = useState("11:00");

  useEffect(() => {
    if (show) {
      setStartTime("10:00");
      setEndTime("11:00");
      setTempStartTime("10:00");
      setTempEndTime("11:00");
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [show]);

  if (!show) return null;

  const formatDisplay = (time: string) => {
    if (!time) return "Select time";
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const isOvernight = startTime > endTime;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="font-bold text-lg">
              Force {action === "open" ? "OPEN" : "CLOSED"} Restaurant
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Set a time range for the override
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Start Time
              </label>
              <button
                type="button"
                onClick={() => setShowStartPicker(true)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left text-white flex justify-between items-center hover:bg-white/10 transition-all"
              >
                <span>{formatDisplay(startTime)}</span>
                <Clock size={16} className="text-orange-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                End Time
              </label>
              <button
                type="button"
                onClick={() => setShowEndPicker(true)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left text-white flex justify-between items-center hover:bg-white/10 transition-all"
              >
                <span>{formatDisplay(endTime)}</span>
                <Clock size={16} className="text-orange-400" />
              </button>
            </div>

            {isOvernight && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-purple-400 text-xs flex items-center gap-2">
                  Overnight override:{" "}
                  {formatDisplay(startTime)} → {formatDisplay(endTime)} (next
                  day)
                </p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-400 text-xs">
                After the override period ends, restaurant
                will automatically return to its normal schedule based on
                business hours.
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(startTime, endTime)}
              disabled={loading || !startTime || !endTime}
              className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all ${
                action === "open"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                  : "bg-red-500 hover:bg-red-400 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin mx-auto" />
              ) : (
                `Force ${action === "open" ? "OPEN" : "CLOSED"}`
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {showStartPicker && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStartPicker(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ClockPicker
              value={tempStartTime}
              onChange={(time) => {
                setTempStartTime(time);
                setStartTime(time);
                setShowStartPicker(false);
              }}
              onClose={() => setShowStartPicker(false)}
              language="en"
            />
          </div>
        </div>
      )}

      {showEndPicker && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEndPicker(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ClockPicker
              value={tempEndTime}
              onChange={(time) => {
                setTempEndTime(time);
                setEndTime(time);
                setShowEndPicker(false);
              }}
              onClose={() => setShowEndPicker(false)}
              language="en"
            />
          </div>
        </div>
      )}
    </>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: keyof typeof translations.en) => translations[language][key];
  
 const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'add-item' | 'reviews' | 'settings' | 'orders' | 'analytics'>('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [translating, setTranslating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOnlyToday] = useState(false);
const [todayOrders, setTodayOrders] = useState<any[]>([]);
const [, setTodayLoading] = useState(false);
const [showOrderItemsModal, setShowOrderItemsModal] = useState(false);
const [ordersLoading, setOrdersLoading] = useState(false);
const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'upi' | 'cash'>('all');
const [ordersStats, setOrdersStats] = useState({
  total_orders: 0,
  today: { count: 0, total: 0 },
  statistics: { paid: { count: 0, total: 0 }, pending: { count: 0, total: 0 } }
});
const [analyticsData, setAnalyticsData] = useState<any[]>([]);
const [analyticsLoading, setAnalyticsLoading] = useState(false);
const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  
  // Clock picker states
  const [showOpeningClock, setShowOpeningClock] = useState(false);
  const [showClosingClock, setShowClosingClock] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'opening' | 'closing' | null>(null);
  
  // Update Profile
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [updateProfileForm, setUpdateProfileForm] = useState({ restaurant_name: '', cover_image: null as File | null });
  const [updateProfileLoading, setUpdateProfileLoading] = useState(false);
  const [updateProfilePreview, setUpdateProfilePreview] = useState<string | null>(null);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  // Add these states with your other useState declarations
const [newOrdersCount, setNewOrdersCount] = useState(0);
const [, setLastOrderIds] = useState<Set<string>>(new Set());
// Add these with your other useState declarations
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [showOverrideModal, setShowOverrideModal] = useState(false);
const [] = useState(4);
const [overrideAction, setOverrideAction] = useState<'open' | 'close'>('open');
const [overrideLoading, setOverrideLoading] = useState(false);


  // Add Restaurant
  const [restaurantForm, setRestaurantForm] = useState({ 
    cuisine: '', 
    tags: '',
    opening_time: '09:00',
    closing_time: '23:00',
    days_open: [] as string[]
  });

  // Add Menu Item
  const [menuItemForm, setMenuItemForm] = useState({
    name: '', 
    price: '', 
    desc: '', 
    veg: false, 
    category: 'Meals',
    has_offer: false,
    offer_percentage: '',
    offer_duration_hours: '',
    image: null as File | null
  });

  // Edit Restaurant
  const [editRestaurantOpen, setEditRestaurantOpen] = useState(false);
  const [editRestaurantForm, setEditRestaurantForm] = useState({ 
    cuisine: '', 
    tags: '', 
    opening_time: '09:00',
    closing_time: '23:00',
    days_open: [] as string[]
  });
  const [editRestaurantLoading, setEditRestaurantLoading] = useState(false);

  // Delete Restaurant
  const [deleteRestaurantOpen, setDeleteRestaurantOpen] = useState(false);
  const [deleteRestaurantLoading, setDeleteRestaurantLoading] = useState(false);

  // Edit Menu Item
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({ 
    name: '', 
    price: '', 
    desc: '', 
    veg: false, 
    category: 'Meals',
    has_offer: false,
    offer_percentage: '',
    offer_duration_hours: '',
    image: null as File | null 
  });
  const [editItemLoading, setEditItemLoading] = useState(false);

  // Delete Menu Item
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);

  const MENU_CATEGORIES = ["Meals", "Tiffin", "Snacks", "Veg", "Non-Veg"];
    // Add this function inside the MerchantDashboard component (before return)
const formatIST = (dateString: string): string => {
  try {
    if (!dateString) return 'No date';
    
    // Parse the date string
    let date: Date;
    
    // Check if the string has timezone info
    if (dateString.includes('+') || dateString.includes('Z')) {
      // Already has timezone (like 2026-03-29T03:06:01+00:00)
      date = new Date(dateString);
    } else if (dateString.includes('T')) {
      // ISO format without timezone, assume UTC
      date = new Date(dateString + 'Z');
    } else {
      // Try parsing directly
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
    
    // Format to IST
    const formatted = date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};
// Get today's date in IST format for API calls
const getTodayIST = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istDate.toISOString().split('T')[0];
};

// Filter orders that belong to today in IST
const filterTodayIST = (orders: any[]) => {
  const todayIST = getTodayIST();
  return orders.filter(order => {
    const orderDate = new Date(order.created_at);
    // Convert order date to IST
    const istOrderDate = new Date(orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const istOrderDateStr = istOrderDate.toISOString().split('T')[0];
    return istOrderDateStr === todayIST;
  });
};
const displayedOrders = (showOnlyToday ? todayOrders : orders).filter(order => {
  if (paymentMethodFilter === 'all') return true;
  const method = String(order.payment_method || '').toLowerCase();
  if (paymentMethodFilter === 'upi') return method.includes('upi') || method.includes('qr');
  if (paymentMethodFilter === 'cash') return method.includes('cash') || method.includes('cod');
  return true;
});

  // ============================================
  // CORRECT ORDER - DO NOT CHANGE THIS SEQUENCE
  // ============================================

  // 1. FIRST - Create authAxios (independent instance for authentication)
  const authAxios = axios.create({
    baseURL: API_BASE_URL
  });

  // 2. SECOND - Define refreshAccessToken (uses authAxios)
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return null;
    }

    try {
      console.log('🔄 Refreshing token...');
      const response = await authAxios.post('/auth/refresh/', {
        refresh_token: refreshToken
      });
      
      const newAccessToken = response.data.access_token;
      localStorage.setItem('access_token', newAccessToken);
      console.log('✅ Token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      localStorage.clear();
      navigate('/merchant', { replace: true });
      return null;
    }
  };

  // 3. THIRD - Define checkAndRefreshToken (uses refreshAccessToken)
  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('⚠️ Token expires soon, refreshing...');
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('❌ Token check failed:', error);
    }
  };

// 4. FOURTH - Define main axiosInstance with a function to get current language
const [axiosInstance] = useState(() => {
  const instance = axios.create({ baseURL: API_BASE_URL });
  
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      const currentLang = localStorage.getItem('preferred_language') || 'en';
      config.headers['Accept-Language'] = currentLang;
      
      // Add cache busting
      if (config.method?.toLowerCase() === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      console.log('📤 Request:', config.method?.toUpperCase(), config.url, 'with language:', currentLang);
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => {
      // LOG THE FULL RESPONSE DATA HERE
      console.log('📥 Raw API Response for', response.config.url, ':', response.data);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');
          
          const response = await authAxios.post('/auth/refresh/', {
            refresh_token: refreshToken
          });
          
          const newAccessToken = response.data.access_token;
          localStorage.setItem('access_token', newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          navigate('/merchant', { replace: true });
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
});

const updateOrdersStats = (ordersData: any[]) => {
  const paidOrders = ordersData.filter((o: any) => o.payment_status === 'paid');
  const pendingOrders = ordersData.filter((o: any) => o.payment_status === 'pending');
  
  const today = new Date().toISOString().split('T')[0];
  const todayOrdersData = ordersData.filter((o: any) => o.created_at?.startsWith(today));
  const todayPaidOrders = todayOrdersData.filter((o: any) => o.payment_status === 'paid');
  
  setOrdersStats({
    total_orders: ordersData.length,
    today: {
      count: todayOrdersData.length,
      total: todayPaidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0)
    },
    statistics: {
      paid: {
        count: paidOrders.length,
        total: paidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0)
      },
      pending: {
        count: pendingOrders.length,
        total: pendingOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0)
      }
    }
  });
};

// Replace the existing forceRestaurantStatus function with this:
const forceRestaurantStatus = async (forceOpen: boolean, startTime: string, endTime: string) => {
  console.log('🚀 Force restaurant status called:', { forceOpen, startTime, endTime });
  setOverrideLoading(true);
  try {
    const response = await axiosInstance.post('/merchant/override-status/', {
      force_open: forceOpen,
      start_time: startTime,
      end_time: endTime
    });
    
    console.log('📡 Override API response:', response.data);
    
    if (response.data.success) {
      const statusText = forceOpen ? 'OPEN' : 'CLOSED';
      showMsg('success', `Restaurant forced ${statusText} from ${response.data.override_start_time} to ${response.data.override_end_time}`);
      
      // Close modal first
      setShowOverrideModal(false);
      
      // Calculate expiry time
      const now = new Date();
      const [endHour, endMinute] = endTime.split(':').map(Number);
      let expiryDate = new Date(now);
      expiryDate.setHours(endHour, endMinute, 0, 0);
      
      // If end time is less than current time, add a day
      if (expiryDate < now) {
        expiryDate.setDate(expiryDate.getDate() + 1);
      }
      
      console.log(`📅 Calculated expiry: ${expiryDate.toISOString()}`);
      
      // Update local restaurant state immediately
      if (restaurant) {
        const updatedRestaurant = {
          ...restaurant,
          manual_override: true,
          manual_override_expiry: expiryDate.toISOString(),
          manual_override_status: forceOpen,
          manual_override_start_time: startTime,
          manual_override_end_time: endTime,
          is_open: forceOpen,
          is_manually_overridden: true
        };
        console.log('🔄 Updated local restaurant state:', updatedRestaurant);
        setRestaurant(updatedRestaurant);
      }
      
      // Refresh in background to ensure consistency
      setTimeout(() => {
        console.log('🔄 Fetching fresh data after override...');
        fetchData();
      }, 500);
      
      localStorage.setItem('force_restaurant_refresh', Date.now().toString());
    } else {
      console.error('❌ Override API returned error:', response.data);
      showMsg('error', response.data.error || 'Failed to override status');
    }
  } catch (error: any) {
    console.error('❌ Override error:', error);
    console.error('Error details:', error.response?.data);
    showMsg('error', error.response?.data?.error || 'Failed to override status');
  } finally {
    setOverrideLoading(false);
  }
};
const cancelOverride = async () => {
  console.log('🚀 Cancel override called');
  setOverrideLoading(true);
  try {
    console.log('📡 Calling cancel-override API...');
    const response = await axiosInstance.post('/merchant/cancel-override/');
    console.log('✅ Cancel override response:', response.data);
    
    showMsg('success', 'Manual override cancelled. Restaurant now follows auto schedule.');
    
    setShowOverrideModal(false);
    
    // Update local restaurant state immediately (no page refresh)
    if (restaurant) {
      // Calculate what the status should be based on current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      let shouldBeOpen = false;
      if (restaurant.opening_time && restaurant.closing_time) {
        const [openHour, openMinute] = restaurant.opening_time.split(':').map(Number);
        const [closeHour, closeMinute] = restaurant.closing_time.split(':').map(Number);
        
        const openMinutes = openHour * 60 + (openMinute || 0);
        const closeMinutes = closeHour * 60 + (closeMinute || 0);
        
        if (closeMinutes < openMinutes) {
          shouldBeOpen = currentTimeMinutes >= openMinutes || currentTimeMinutes <= closeMinutes;
        } else {
          shouldBeOpen = currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
        }
      }
      
      console.log(`🔄 Updating local state: is_open from ${restaurant.is_open} to ${shouldBeOpen}`);
      
      // Update local state immediately
      setRestaurant({
        ...restaurant,
        manual_override: false,
        manual_override_expiry: undefined,
        manual_override_status: undefined,
        manual_override_start_time: undefined,
        manual_override_end_time: undefined,
        is_open: shouldBeOpen,
        is_manually_overridden: false
      });
    }
    
    // Refresh in background to ensure consistency with server
    setTimeout(() => {
      console.log('🔄 Fetching fresh data after cancel...');
      fetchData();
    }, 500);
    
    localStorage.setItem('force_restaurant_refresh', Date.now().toString());
    
  } catch (error: any) {
    console.error('❌ Cancel override error:', error);
    console.error('Error details:', error.response?.data);
    showMsg('error', error.response?.data?.error || 'Failed to cancel override');
  } finally {
    setOverrideLoading(false);
  }
};
// 5. FIFTH - Update localStorage when language changes
useEffect(() => {
  console.log('🔄 Saving language to localStorage:', language);
  localStorage.setItem('preferred_language', language);
}, [language]);

  // 6. SIXTH - Initial useEffect for authentication and data fetching
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const role = localStorage.getItem('role');
    
    if (!token || !refreshToken || role !== 'merchant') {
      navigate('/merchant', { replace: true });
      return;
    }

    checkAndRefreshToken();

    const refreshInterval = setInterval(() => {
      checkAndRefreshToken();
    }, 5 * 60 * 1000);

    fetchData();

    return () => clearInterval(refreshInterval);
  }, []);
  // Pre-fetch orders when dashboard first loads
useEffect(() => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  
  if (token && role === 'merchant') {
    console.log('📡 Pre-fetching orders on dashboard load...');
    fetchOrders().catch(err => console.log('Background orders fetch error:', err));
  }
}, []); // Empty dependency array - runs once when component mounts

  // 7. SEVENTH - Resize handler effect
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
useEffect(() => {
  const role = localStorage.getItem('role');
  if (role !== 'merchant') return;
  
  console.log('🔄 Order polling started (checks every 5 seconds)');
  
  let isMounted = true;
  let lastIds = new Set<string>();
  let isFirstRun = true;
  
 // Replace the existing filter in the polling useEffect

const checkForNewOrders = async () => {
  if (!isMounted) return;
  
  try {
    const response = await axiosInstance.get('/merchant/orders/?page=1&page_size=50');
    const ordersData = response.data.orders || [];
    
    if (!isMounted) return;
    
    // ✅ FIX: Show BOTH paid UPI orders AND pending cash orders
    const relevantOrders = ordersData.filter((order: any) => {
      const paymentStatus = order.payment_status;
      const paymentMethod = order.payment_method?.toLowerCase();
      
      // Show if:
      // 1. Order is paid (UPI success OR Cash marked as paid)
      // 2. OR Order is cash/COD and pending (not yet paid)
      if (paymentStatus === 'paid') return true;
      if (paymentMethod === 'cash' && paymentStatus === 'pending') return true;
      if (paymentMethod === 'cod' && paymentStatus === 'pending') return true;
      
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
    console.log(`   - Pending Cash: ${todayOrdersOnly.filter((o: any) => o.payment_status === 'pending' && o.payment_method === 'cash').length}`);
    
    const currentIds = new Set<string>(todayOrdersOnly.map((o: any) => o.id));
    
    if (isFirstRun) {
      lastIds = currentIds;
      setLastOrderIds(currentIds);
      setNewOrdersCount(0);
      setOrders(todayOrdersOnly);
      updateOrdersStats(todayOrdersOnly);
      setOrdersLoading(false);
      isFirstRun = false;
      return;
    }
    
    const newOrders = todayOrdersOnly.filter((o: any) => !lastIds.has(o.id));
    
    if (newOrders.length > 0) {
      console.log(`🆕 POLLING: ${newOrders.length} new order(s)`);
      console.log(`   - Paid: ${newOrders.filter((o: any) => o.payment_status === 'paid').length}`);
      console.log(`   - Pending Cash: ${newOrders.filter((o: any) => o.payment_status === 'pending' && o.payment_method === 'cash').length}`);
      
      setOrders(todayOrdersOnly);
      updateOrdersStats(todayOrdersOnly);
      
      // Show badge for ALL new orders (both cash and UPI)
      setNewOrdersCount((prev: number) => prev + newOrders.length);
      
      if (Notification.permission === 'granted' && newOrders.length > 0) {
        const paidCount = newOrders.filter((o: any) => o.payment_status === 'paid').length;
        const cashCount = newOrders.filter((o: any) => o.payment_status === 'pending' && o.payment_method === 'cash').length;
        
        let notificationBody = '';
        if (paidCount > 0 && cashCount > 0) {
          notificationBody = `${paidCount} paid, ${cashCount} COD orders`;
        } else if (paidCount > 0) {
          notificationBody = `${paidCount} paid UPI order(s)`;
        } else {
          notificationBody = `${cashCount} COD order(s)`;
        }
        
        new Notification(`${newOrders.length} New Order${newOrders.length > 1 ? 's' : ''}!`, {
          body: notificationBody,
          icon: '/logo192.png'
        });
      }
    }
    
    lastIds = currentIds;
    setLastOrderIds(currentIds);
    setOrdersLoading(false);
    
  } catch (error) {
    console.error('Order polling error:', error);
    if (isMounted) setOrdersLoading(false);
  }
};
  
  // Request notification permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
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
  // Fetch orders when component mounts and when tab changes to orders
useEffect(() => {
  if (activeTab === 'orders') {
    setOrdersLoading(true); // Set loading true before fetch
    fetchOrders();
  }
}, [activeTab]);


useEffect(() => {
  // Call immediately when dashboard loads
  deleteOldOrders();
  
  // Set up interval to call every 30 seconds (or whatever interval you want)
  const interval = setInterval(() => {
    deleteOldOrders();
  }, 30000); // 30 seconds - adjust as needed
  
  // Cleanup interval on component unmount
  return () => clearInterval(interval);
}, []); // Empty dependency array means this runs once when component mounts
useEffect(() => {
  if (activeTab === 'analytics') {
    fetchAnalytics();
  }
}, [activeTab]);
// Refresh analytics data when tab changes to analytics
// Refresh analytics data when tab changes to analytics
useEffect(() => {
  if (activeTab === 'analytics') {
    // Use the same IST filtering
    const fetchAnalyticsWithIST = async () => {
      setAnalyticsLoading(true);
      try {
        // Fetch analytics summary from API
        const response = await axiosInstance.get('/merchant/analytics/');
        
        // IMPORTANT: Don't trust the API's today stats - recalculate using IST
        const allOrdersResponse = await axiosInstance.get('/merchant/orders/?page=1&page_size=100');
        const allOrders = allOrdersResponse.data.orders || [];
        
        // Get today's date in IST
        const todayIST = getTodayIST();
        console.log('📅 Analytics - Today IST date:', todayIST);
        
        // Filter orders for today in IST
        const todayOrdersIST = allOrders.filter((order: any) => {
          // Parse the order date correctly
          let orderDate;
          
          if (order.created_at.includes('+') || order.created_at.includes('Z')) {
            orderDate = new Date(order.created_at);
          } else if (order.created_at.includes('T')) {
            orderDate = new Date(order.created_at + 'Z');
          } else {
            orderDate = new Date(order.created_at);
          }
          
          // Convert to IST and get date string
          const istDate = new Date(orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const istDateStr = istDate.toISOString().split('T')[0];
          
          return istDateStr === todayIST;
        });
        
        console.log(`📊 Analytics: Found ${todayOrdersIST.length} orders for today (${todayIST})`);
        
        // Calculate today's paid orders revenue
        const todayPaidOrders = todayOrdersIST.filter((o: any) => o.payment_status === 'paid');
        const todayRevenue = todayPaidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
        
        // Update the summary with correct today's values
        const fixedSummary = {
          ...response.data.summary,
          today_orders_count: todayOrdersIST.length,
          today_revenue: todayRevenue
        };
        
        // Process daily breakdown - ensure dates are in IST
        const breakdown = (response.data.daily_breakdown || [])
          .map((day: any) => {
            // Convert the API date to IST date string for consistency
            const apiDate = new Date(day.date);
            const istDate = new Date(apiDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const istDateStr = istDate.toISOString().split('T')[0];
            
            return {
              date: istDateStr,
              displayDate: new Date(istDateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
              total_orders: day.total_orders,
              total_revenue: parseFloat(day.total_revenue.toFixed(2)),
            };
          })
          .filter((day: any, index: number, self: any[]) => 
            // Remove duplicates if any
            index === self.findIndex((d: any) => d.date === day.date)
          )
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically
        
        console.log('📊 Processed breakdown dates:', breakdown.map((d: { date: any; }) => d.date));
        
        setAnalyticsData(breakdown);
        setAnalyticsSummary(fixedSummary);
        
      } catch (error: any) {
        console.error('Analytics error:', error);
        showMsg('error', 'Failed to load analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    };
    
    fetchAnalyticsWithIST();
  }
}, [activeTab]);

// Auto-check for expired overrides and automatically cancel them
useEffect(() => {
  let isMounted = true;
  let intervalId: ReturnType<typeof setTimeout> | null = null;
  
  const checkAndAutoCancelExpiredOverrides = async () => {
    if (!restaurant) {
      console.log('⏰ Auto-check: No restaurant data available');
      return;
    }
    
    // Check if there's an active override
    const hasOverride = restaurant.manual_override === true;
    const expiryStr = restaurant.manual_override_expiry;
    
    console.log('🔍 Auto-check running:', {
      hasOverride,
      expiryStr,
      restaurantName: restaurant.name,
      currentIsOpen: restaurant.is_open
    });
    
    if (hasOverride && expiryStr) {
      try {
        // Parse expiry time
        let expiryDate: Date;
        if (expiryStr.includes('T')) {
          expiryDate = new Date(expiryStr);
        } else {
          expiryDate = new Date(expiryStr.replace(' ', 'T') + '+05:30');
        }
        
        const now = new Date();
        
        console.log(`⏰ Override expiry check:`, {
          now: now.toISOString(),
          expiry: expiryDate.toISOString(),
          isExpired: now >= expiryDate
        });
        
        // If override has expired, automatically call cancelOverride
        if (now >= expiryDate) {
          console.log('🚨 OVERRIDE EXPIRED! Auto-cancelling now...');
          
          // Call cancelOverride API directly
          setOverrideLoading(true);
          try {
            console.log('📡 Calling cancel-override API...');
            const response = await axiosInstance.post('/merchant/cancel-override/');
            console.log('✅ Cancel override API response:', response.data);
            
            if (isMounted) {
              // ✅ Show the success message
              showMsg('success', 'Override expired. Restaurant has reverted to business hours.');
              
              // Update restaurant state locally without full page refresh
              if (restaurant) {
                // Calculate auto status based on current time and NEW business hours
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTimeMinutes = currentHour * 60 + currentMinute;
                
                let shouldBeOpen = false;
                if (restaurant.opening_time && restaurant.closing_time) {
                  const [openHour, openMinute] = restaurant.opening_time.split(':').map(Number);
                  const [closeHour, closeMinute] = restaurant.closing_time.split(':').map(Number);
                  
                  const openMinutes = openHour * 60 + (openMinute || 0);
                  const closeMinutes = closeHour * 60 + (closeMinute || 0);
                  
                  if (closeMinutes < openMinutes) {
                    shouldBeOpen = currentTimeMinutes >= openMinutes || currentTimeMinutes <= closeMinutes;
                  } else {
                    shouldBeOpen = currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
                  }
                }
                
                console.log(`🔄 Updating local restaurant state: is_open from ${restaurant.is_open} to ${shouldBeOpen}`);
                
                // Update local restaurant state
                setRestaurant({
                  ...restaurant,
                  manual_override: false,
                  manual_override_expiry: undefined,
                  manual_override_status: undefined,
                  manual_override_start_time: undefined,
                  manual_override_end_time: undefined,
                  is_open: shouldBeOpen,
                  is_manually_overridden: false
                });
              }
              
              // Also refresh data in background to ensure consistency
              console.log('🔄 Fetching fresh data in background...');
              setTimeout(() => {
                fetchData();
              }, 5000);
            }
          } catch (error: any) {
            console.error('❌ Auto cancel failed:', error);
            console.error('Error details:', error.response?.data);
          } finally {
            if (isMounted) setOverrideLoading(false);
          }
        } else {
          const timeRemaining = (expiryDate.getTime() - now.getTime()) / 1000;
          console.log(`✅ Override still active, expires in ${timeRemaining.toFixed(1)} seconds`);
        }
      } catch (err) {
        console.error('❌ Error checking override expiry:', err);
      }
    } else {
      console.log('ℹ️ No active override found');
    }
  };
  
  // Start polling every 5 seconds
  const startPolling = () => {
    if (intervalId) clearInterval(intervalId);
    console.log('🚀 Starting auto-cancel polling (every 5 seconds)');
    intervalId = setInterval(() => {
      checkAndAutoCancelExpiredOverrides();
    }, 5000);
  };
  
  // Run immediately on mount and when restaurant changes
  checkAndAutoCancelExpiredOverrides();
  startPolling();
  
  // Cleanup
  return () => {
    console.log('🛑 Stopping auto-cancel polling');
    isMounted = false;
    if (intervalId) clearInterval(intervalId);
  };
}, [restaurant, axiosInstance]);
  // ============================================
  // Helper Functions
  // ============================================

  const daysStringToArray = (daysString: string | undefined): string[] => {
    if (!daysString) return [];
    return daysString.split(',').map(day => day.trim());
  };

  const daysArrayToString = (daysArray: string[]): string => {
    return daysArray.join(',');
  };

  const formatTimeForInput = (time: string | undefined): string => {
    if (!time) return '09:00';
    return time.substring(0, 5);
  };

  const formatTimeForDisplay = (time: string | undefined): string => {
    if (!time) return '';
    try {
      let timeStr = time;
      
      if (time.includes(':')) {
        const parts = time.split(':');
        if (parts.length >= 2) {
          timeStr = `${parts[0]}:${parts[1]}`;
        }
      }
      
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      
      if (isNaN(hour) || isNaN(parseInt(minutes, 10))) {
        return time;
      }
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      let hour12 = hour % 12;
      hour12 = hour12 === 0 ? 12 : hour12;
      const formattedMinutes = minutes.padStart(2, '0');
      
      return `${hour12}:${formattedMinutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  };

const fetchData = async () => {
  console.log('📡 fetchData called with language:', language);
  setLoading(true);
  try {
    const response = await axiosInstance.get('/merchant/restaurant/');
    console.log('✅ API Response received:', response.data);
    
    const restaurantData = response.data.restaurant;
    
    // DEBUG: Log the raw is_open value from API
    console.log('🔍 RAW is_open from API:', restaurantData?.is_open);
    console.log('🔍 Type of is_open:', typeof restaurantData?.is_open);
    
    if (restaurantData) {
      // Store original is_open before formatting
      const originalIsOpen = restaurantData.is_open;
      console.log('🔍 Original is_open before formatting:', originalIsOpen);
      
      restaurantData.opening_time = formatTimeForInput(restaurantData.opening_time);
      restaurantData.closing_time = formatTimeForInput(restaurantData.closing_time);
      
      // Make sure is_open remains unchanged
      restaurantData.is_open = originalIsOpen;
      
      // DEBUG: Log after formatting
      console.log('🔍 Restaurant after formatting:', {
        name: restaurantData.name,
        is_open: restaurantData.is_open,
        opening_time: restaurantData.opening_time,
        closing_time: restaurantData.closing_time,
        days_open: restaurantData.days_open
      });
    }
    
    setRestaurant(restaurantData);
    
    // DEBUG: Log immediately after setting state
    console.log('🔍 Restaurant state updated with is_open:', restaurantData?.is_open);
    
    const menuData = response.data.menu;
    let flattenedMenu: MenuItem[] = [];
    
    if (Array.isArray(menuData)) {
      flattenedMenu = menuData;
    } else if (menuData && typeof menuData === 'object') {
      Object.keys(menuData).forEach(category => {
        if (Array.isArray(menuData[category])) {
          flattenedMenu.push(...menuData[category]);
        }
      });
    }
    
    setMenuItems(flattenedMenu);
    setReviews(response.data.reviews || []);
    setIsAddingRestaurant(false);
    
  } catch (error: any) {
    console.error('❌ Fetch error:', error);
    if (error.response?.status === 404) {
      setRestaurant(null);
      setIsAddingRestaurant(true);
    }
  } finally {
    setLoading(false);
  }
};
const fetchOrders = async (page = 1) => {
  console.log('📡 Fetching orders with language:', language, 'page:', page);
  setOrdersLoading(true);
  setPaymentMethodFilter('all');
  try {
    const response = await axiosInstance.get(`/merchant/orders/?page=${page}&page_size=20`);
    console.log('✅ Orders received:', response.data);
    
    const allOrders = response.data.orders || [];
    
    // Show BOTH paid orders AND pending cash orders
    const relevantOrders = allOrders.filter((order: any) => {
      const isPaid = order.payment_status === 'paid';
      const isPendingCash = (order.payment_method === 'cash' || order.payment_method === 'cod') && order.payment_status === 'pending';
      return isPaid || isPendingCash;
    });
    
    // Filter for today's IST date
    const todayIST = getTodayIST();
    console.log('📅 Filtering orders for IST date:', todayIST);
    
    const todayOrdersList = relevantOrders.filter((order: any) => {
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
    
    console.log(`📅 Found ${todayOrdersList.length} orders for today (${todayIST})`);
    console.log(`   - Paid: ${todayOrdersList.filter((o: any) => o.payment_status === 'paid').length}`);
    console.log(`   - Pending Cash: ${todayOrdersList.filter((o: any) => o.payment_status === 'pending' && (o.payment_method === 'cash' || o.payment_method === 'cod')).length}`);
    
    setOrders(todayOrdersList);
    setCurrentPage(response.data.current_page || 1);
    setTotalPages(response.data.total_pages || 1);
    
    // ✅ FIX: Calculate revenue ONLY from PAID orders
    const paidOrders = todayOrdersList.filter((o: any) => o.payment_status === 'paid');
    const pendingCashOrders = todayOrdersList.filter((o: any) => o.payment_status === 'pending' && (o.payment_method === 'cash' || o.payment_method === 'cod'));
    
    const paidTotal = paidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    const pendingCashTotal = pendingCashOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    
    setOrdersStats({
      total_orders: todayOrdersList.length,
      today: { 
        count: todayOrdersList.length, 
        total: paidTotal  // ✅ ONLY PAID orders count towards revenue!
      },
      statistics: {
        paid: { 
          count: paidOrders.length, 
          total: paidTotal 
        },
        pending: { 
          count: pendingCashOrders.length, 
          total: pendingCashTotal  // Keep this for reference, but NOT included in revenue
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching orders:', error);
    if (error.response?.status === 404) {
      setOrders([]);
    }
  } finally {
    setOrdersLoading(false);
  }
};

const fetchTodayOrders = async () => {
  console.log('📡 Fetching today\'s orders with language:', language);
  setTodayLoading(true);
  setPaymentMethodFilter('all');
  try {
    // Get today's date in IST
    const todayIST = getTodayIST();
    console.log('📅 Today IST date:', todayIST);
    
    // Fetch all orders (without date filter) then filter client-side
    const response = await axiosInstance.get('/merchant/orders/?page=1&page_size=100');
    console.log('✅ All orders received:', response.data.orders?.length || 0);
    
    const allOrders = response.data.orders || [];
    
    // Filter orders for today in IST
    const todayOrdersList = filterTodayIST(allOrders);
    console.log(`📅 Found ${todayOrdersList.length} orders for today (${todayIST})`);
    
    setTodayOrders(todayOrdersList);
    
    // Calculate today's stats from filtered orders
    const todayPaidOrders = todayOrdersList.filter((o: any) => o.payment_status === 'paid');
    const todayTotal = todayPaidOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
    
    setOrdersStats({
      total_orders: response.data.total_orders || 0,
      today: { 
        count: todayOrdersList.length, 
        total: todayTotal 
      },
      statistics: response.data.statistics || { paid: { count: 0, total: 0 }, pending: { count: 0, total: 0 } }
    });
    
    if (todayOrdersList.length > 0) {
      showMsg('success', `Found ${todayOrdersList.length} orders for today (${todayIST})`);
    } else {
      showMsg('success', `No orders found for today (${todayIST})`);
    }
  } catch (error: any) {
    console.error('❌ Error fetching today\'s orders:', error);
    showMsg('error', 'Error fetching today\'s orders');
  } finally {
    setTodayLoading(false);
  }
};
const fetchAnalytics = async () => {
  setAnalyticsLoading(true);
  try {
    const response = await axiosInstance.get('/merchant/analytics/');
    const breakdown = (response.data.daily_breakdown || [])
      .slice()
      .reverse() // oldest → newest for left-to-right chart
      .map((day: any) => ({
        date: day.date,
        displayDate: new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        total_orders: day.total_orders,
        total_revenue: parseFloat(day.total_revenue.toFixed(2)),
      }));
    setAnalyticsData(breakdown);
    setAnalyticsSummary(response.data.summary);
  } catch (error: any) {
    showMsg('error', 'Failed to load analytics');
  } finally {
    setAnalyticsLoading(false);
  }
};

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

 const toggleLanguage = async () => {
  const newLanguage = language === 'en' ? 'ta' : 'en';
  console.log('🔄 Toggling language to:', newLanguage);
  
  setTranslating(true);
  
  // Save to localStorage FIRST
  localStorage.setItem('preferred_language', newLanguage);
  
  // Clear existing data
  setRestaurant(null);
  setMenuItems([]);
  setReviews([]);
  setOrders([]); // Clear orders too
  
  // Update language state
  setLanguage(newLanguage);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    console.log('📡 Fetching data with new language:', newLanguage);
    
    // Fetch restaurant data
    const response = await axiosInstance.get('/merchant/restaurant/');
    console.log('✅ Data received:', response.data);
    
    const restaurantData = response.data.restaurant;
    if (restaurantData) {
      restaurantData.opening_time = formatTimeForInput(restaurantData.opening_time);
      restaurantData.closing_time = formatTimeForInput(restaurantData.closing_time);
    }
    
    setRestaurant(restaurantData);
    
    const menuData = response.data.menu;
    let flattenedMenu: MenuItem[] = [];
    if (Array.isArray(menuData)) {
      flattenedMenu = menuData;
    } else if (menuData && typeof menuData === 'object') {
      Object.keys(menuData).forEach(category => {
        if (Array.isArray(menuData[category])) {
          flattenedMenu.push(...menuData[category]);
        }
      });
    }
    setMenuItems(flattenedMenu);
    setReviews(response.data.reviews || []);
    
    // Also fetch orders if on orders tab
    if (activeTab === 'orders') {
      await fetchOrders();
    }
    
    console.log('✅ Data updated for language:', newLanguage);
    console.log('Restaurant name:', restaurantData?.name);
    
  } catch (error) {
    console.error('❌ Error toggling language:', error);
    showMsg('error', 'Error changing language');
  } finally {
    setTranslating(false);
  }
};
  // ============================================
  // CRUD Handlers
  // ============================================

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsArray = restaurantForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      await axiosInstance.post('/restaurants/add/', {
        cuisine: restaurantForm.cuisine,
        tags: tagsArray,
        opening_time: restaurantForm.opening_time,
        closing_time: restaurantForm.closing_time,
        days_open: daysArrayToString(restaurantForm.days_open)
      });
      
      showMsg('success', `${t('restaurantProfile')} ${t('addedSuccessfully')}`);
      setIsAddingRestaurant(false);
      fetchData();
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('addNewItem')}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditRestaurant = () => {
    if (!restaurant) return;
    setEditRestaurantForm({
      cuisine: restaurant.cuisine,
      tags: restaurant.tags?.join(', ') || '',
      opening_time: formatTimeForInput(restaurant.opening_time) || '09:00',
      closing_time: formatTimeForInput(restaurant.closing_time) || '23:00',
      days_open: daysStringToArray(restaurant.days_open)
    });
    setEditRestaurantOpen(true);
  };

 const handleUpdateRestaurant = async (e: React.FormEvent) => {
  e.preventDefault();
  setEditRestaurantLoading(true);
  try {
    const tagsArray = editRestaurantForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    await axiosInstance.put('/restaurants/update/', {
      cuisine: editRestaurantForm.cuisine,
      tags: tagsArray,
      opening_time: editRestaurantForm.opening_time,
      closing_time: editRestaurantForm.closing_time,
      days_open: daysArrayToString(editRestaurantForm.days_open)
    });
    
    // ✅ CRITICAL: Clear override after updating business hours
    // Because the business hours changed, any active override should be cancelled
    try {
      console.log('🔄 Clearing override after business hours update...');
      await axiosInstance.post('/merchant/cancel-override/');
      console.log('✅ Override cleared after hours update');
    } catch (overrideError) {
      console.log('No active override to clear or error clearing:', overrideError);
    }
    
    showMsg('success', `${t('restaurantProfile')} ${t('updatedSuccessfully')}`);
    setEditRestaurantOpen(false);
    fetchData();
  } catch (error: any) {
    showMsg('error', error.response?.data?.error || `${t('failed')} ${t('updateProfile')}`);
  } finally {
    setEditRestaurantLoading(false);
  }
};

  const handleDeleteRestaurant = async () => {
    setDeleteRestaurantLoading(true);
    try {
      await axiosInstance.delete('/restaurants/delete/');
      showMsg('success', `${t('restaurantProfile')} ${t('deletedSuccessfully')}`);
      setDeleteRestaurantOpen(false);
      setRestaurant(null);
      setMenuItems([]);
      setReviews([]);
      setIsAddingRestaurant(true);
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('delete')}`);
    } finally {
      setDeleteRestaurantLoading(false);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemForm.image) {
      showMsg('error', t('imageRequired'));
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', menuItemForm.name);
      formData.append('price', menuItemForm.price);
      formData.append('desc', menuItemForm.desc);
      formData.append('veg', String(menuItemForm.veg));
      formData.append('category', menuItemForm.category);
      
      if (menuItemForm.has_offer) {
        formData.append('offer_percentage', String(Number(menuItemForm.offer_percentage)));
        formData.append('offer_duration_hours', String(Number(menuItemForm.offer_duration_hours)));
      }
      
      formData.append('image', menuItemForm.image);
      
      await axiosInstance.post('/menu/add/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showMsg('success', `${menuItemForm.name} ${t('addedSuccessfully')}`);
      setMenuItemForm({
        name: '',
        price: '',
        desc: '',
        veg: false,
        category: 'Meals',
        has_offer: false,
        offer_percentage: '',
        offer_duration_hours: '',
        image: null
      });
      setActiveTab('menu');
      fetchData();
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('addNewItem')}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditItem = (item: MenuItem) => {
    setEditItem(item);
    setEditItemForm({
      name: item.name,
      price: String(item.price),
      desc: item.description,
      veg: item.is_veg,
      category: item.category || 'Meals',
      has_offer: item.has_offer || false,
      offer_percentage: item.offer_percentage ? String(item.offer_percentage) : '',
      offer_duration_hours: '',
      image: null
    });
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    setEditItemLoading(true);
    try {
      const formData = new FormData();
      
      if (editItemForm.name !== editItem.name) {
        formData.append('name', editItemForm.name);
      }
      if (editItemForm.price !== String(editItem.price)) {
        formData.append('price', editItemForm.price);
      }
      if (editItemForm.desc !== editItem.description) {
        formData.append('desc', editItemForm.desc);
      }
      if (editItemForm.veg !== editItem.is_veg) {
        formData.append('veg', String(editItemForm.veg));
      }
      if (editItemForm.category !== editItem.category) {
        formData.append('category', editItemForm.category);
      }
      
      if (editItemForm.has_offer !== editItem.has_offer) {
        if (editItemForm.has_offer) {
          formData.append('offer_percentage', String(Number(editItemForm.offer_percentage)));
          formData.append('offer_duration_hours', String(Number(editItemForm.offer_duration_hours)));
        } else {
          formData.append('remove_offer', 'true');
        }
      } else if (editItemForm.has_offer && editItemForm.offer_percentage !== String(editItem.offer_percentage)) {
        formData.append('offer_percentage', String(Number(editItemForm.offer_percentage)));
        if (editItemForm.offer_duration_hours) {
          formData.append('offer_duration_hours', String(Number(editItemForm.offer_duration_hours)));
        }
      }
      
      if (editItemForm.image) {
        formData.append('image', editItemForm.image);
      }

      await axiosInstance.put(`/menu/update/${editItem.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showMsg('success', `${editItem.name} ${t('updatedSuccessfully')}`);
      setEditItem(null);
      fetchData();
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('updateProfile')}`);
    } finally {
      setEditItemLoading(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!deleteItem) return;
    
    setDeleteItemLoading(true);
    try {
      await axiosInstance.delete(`/menu/delete/${deleteItem.id}/`);
      showMsg('success', `${deleteItem.name} ${t('deletedSuccessfully')}`);
      setDeleteItem(null);
      fetchData();
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('delete')}`);
    } finally {
      setDeleteItemLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/merchant', { replace: true });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateProfileLoading(true);
    try {
      const formData = new FormData();
      if (updateProfileForm.restaurant_name) {
        formData.append('restaurant_name', updateProfileForm.restaurant_name);
      }
      if (updateProfileForm.cover_image) {
        formData.append('cover_image', updateProfileForm.cover_image);
      }

      await axiosInstance.put('/restaurant/profile/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showMsg('success', `${t('restaurantProfile')} ${t('updatedSuccessfully')}`);
      setUpdateProfileOpen(false);
      setUpdateProfileForm({ restaurant_name: '', cover_image: null });
      setUpdateProfilePreview(null);
      fetchData();
    } catch (error: any) {
      showMsg('error', error.response?.data?.error || `${t('failed')} ${t('updateProfile')}`);
    } finally {
      setUpdateProfileLoading(false);
    }
  };
  // Add this function - Mark COD order as paid
const markCODAsPaid = async (orderId: string, orderNumber: string) => {
  if (!window.confirm(`Mark order ${orderNumber} as PAID? This will archive the order.`)) {
    return;
  }
  
  setOrdersLoading(true);
  try {
    const response = await axiosInstance.post(`/merchant/orders/${orderId}/mark-cod-paid/`);
    
    if (response.data.success) {
      showMsg('success', `Order ${orderNumber} marked as paid and archived`);
      // Refresh orders list
      if (showOnlyToday) {
        fetchTodayOrders();
      } else {
        fetchOrders();
      }
    }
  } catch (error: any) {
    showMsg('error', error.response?.data?.error || 'Failed to mark order as paid');
  } finally {
    setOrdersLoading(false);
  }
};
const deleteOldOrders = async () => {
  try {
    // Call the admin delete endpoint (requires admin, so it might fail - that's OK)
    const response = await axiosInstance.post('/admin/delete-old-orders/');
    console.log('🧹 Old orders cleanup result:', response.data);
  } catch (error: any) {
    // Silently fail - this is expected if not admin
    console.log('Cleanup not needed or not authorized');
  }
};

  const filteredMenuItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-[#060B14] text-white flex flex-col lg:flex-row" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A1628] border-b border-white/5 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Utensils size={16} />
          </div>
          <span className="font-bold text-lg tracking-tight">MerchantHub</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <aside className={`
          fixed lg:sticky top-0 left-0 h-full w-64 shrink-0 bg-[#0A1628]/80 border-r border-white/5 
          flex flex-col transition-transform duration-300 z-50 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center gap-2 mb-8 sm:mb-10">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Utensils size={16} />
              </div>
              <span className="font-bold text-lg tracking-tight">MerchantHub</span>
            </div>
            <nav className="space-y-1">
              <SidebarLink 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} 
                icon={<LayoutDashboard size={18} />} 
                label={t('overview')} 
                language={language}
              />
              <SidebarLink 
                active={activeTab === 'menu'} 
                onClick={() => { setActiveTab('menu'); setSidebarOpen(false); }} 
                icon={<Utensils size={18} />} 
                label={t('myMenu')} 
                language={language}
              />
              <SidebarLink 
                active={activeTab === 'reviews'} 
                onClick={() => { setActiveTab('reviews'); setSidebarOpen(false); }} 
                icon={<Star size={18} />} 
                label={t('reviews')} 
                language={language}
              />
              <SidebarLink 
                active={activeTab === 'add-item'} 
                onClick={() => { setActiveTab('add-item'); setSidebarOpen(false); }} 
                icon={<Plus size={18} />} 
                label={t('addItem')} 
                language={language}
              />
             <SidebarLink 
  active={activeTab === 'orders'} 
  onClick={() => { 
    setActiveTab('orders'); 
    setSidebarOpen(false);
    // Reset badge count when clicking on orders tab
    setNewOrdersCount(0);
  }} 
  icon={<ShoppingBag size={18} />} 
  label={t('orders')} 
  language={language}
>
  {newOrdersCount > 0 && (
    <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
      {newOrdersCount > 99 ? '99+' : newOrdersCount}
    </span>
  )}
</SidebarLink>
              <SidebarLink 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} 
                icon={<Settings size={18} />} 
                label={t('settings')} 
                language={language}
              />
              <SidebarLink
  active={activeTab === 'analytics'}
  onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
  icon={<BarChart2 size={18} />}
  label="Analytics"
  language={language}
/>
            </nav>
          </div>
          
          {/* Language Toggle Button */}
          <div className="px-4 sm:px-6 py-2 border-t border-white/5">
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-orange-400 hover:bg-orange-500/10 transition-all font-medium text-sm sm:text-base"
            >
              <span className="text-lg">{language === 'en' ? '🇮🇳' : '🇬🇧'}</span>
              <span>{language === 'en' ? t('tamil') : t('english')}</span>
            </button>
          </div>
          
          <div className="mt-auto px-4 sm:px-6 py-4 sm:py-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm sm:text-base">
              <LogOut size={18} />
              {t('logout')}
            </button>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen lg:min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('merchantDashboard')}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t('manageRestaurant')}</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs sm:text-sm text-slate-400 hidden sm:block">{localStorage.getItem('email')}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs sm:text-sm">
              {localStorage.getItem('email')?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-sm sm:text-base ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translating Indicator */}
        {translating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400"
          >
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{language === 'ta' ? 'மொழிபெயர்க்கிறது...' : 'Translating...'}</span>
          </motion.div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold">{t('restaurantProfile')}</h2>
              <div className="flex flex-wrap gap-2">
                {!restaurant && (
                  <button onClick={() => setIsAddingRestaurant(true)}
                    className="px-3 sm:px-4 py-2 bg-orange-500/10 text-orange-400 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 text-xs sm:text-sm">
                    <Plus size={14} className="sm:w-4 sm:h-4" /> {t('initializeRestaurant')}
                  </button>
                )}
                {restaurant && (
                  <>
                    <button onClick={() => {
                      setUpdateProfileForm({ restaurant_name: restaurant.name, cover_image: null });
                      setUpdateProfilePreview(null);
                      setUpdateProfileOpen(true);
                    }}
                      className="px-3 sm:px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm transition-all border border-orange-500/20">
                      <ImageIcon size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden xs:inline">{t('updateProfile')}</span>
                    </button>
                    <button onClick={openEditRestaurant}
                      className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm transition-all border border-white/5">
                      <Pencil size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden xs:inline">{t('edit')}</span>
                    </button>
                    <button onClick={() => setDeleteRestaurantOpen(true)}
                      className="px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm transition-all border border-red-500/20">
                      <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden xs:inline">{t('delete')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {restaurant ? (
              <div className="bg-[#0A1628] border border-white/5 rounded-2xl overflow-hidden">
                <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 w-full overflow-hidden bg-gradient-to-br from-orange-500/20 to-amber-500/5">
                  {restaurant.image ? (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Utensils size={32} className="sm:w-12 sm:h-12 text-orange-500/30" />
                    </div>
                  )}
                  {restaurant && (
  <>
    {/* Add this debug line right before the badge */}
    {console.log('🎨 Rendering with is_open:', restaurant.is_open)}
    
    <span className={`absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
      restaurant.is_open 
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
        : 'bg-red-500/20 text-red-400 border border-red-500/30'
    }`}>
      {restaurant.is_open ? `● ${t('openNow')}` : `○ ${t('closedNow')}`}
    </span>
  </>
)}
{/* Inside the restaurant profile card, next to the Open Now badge */}
{restaurant && (restaurant as any).is_manually_overridden && (
  <div className="absolute top-3 left-3">
    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
      <Flame size={10} /> Manual Override
    </span>
  </div>
)}
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-slate-400 mb-3 sm:mb-4">{restaurant.cuisine}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {restaurant.tags?.map((tag, i) => (
                      <span key={i} className="px-2 sm:px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[10px] sm:text-xs font-medium border border-orange-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Operating Hours & Days */}
                  {restaurant.opening_time && restaurant.closing_time && (
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          <Clock size={12} className="inline mr-1 text-slate-400" />
                          <span className="text-slate-300">
                            {formatTimeForDisplay(restaurant.opening_time)} - {formatTimeForDisplay(restaurant.closing_time)}
                          </span>
                        </span>
                      </div>
                      
                      {/* Days Open Display */}
                      {restaurant.days_open && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-slate-500 mr-1">{t('openOn')}:</span>
                          {daysStringToArray(restaurant.days_open).map((day, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-slate-300"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Add these buttons inside the Overview tab, where you have Edit and Delete buttons */}
{restaurant && (
  <div className="flex flex-wrap gap-2 mt-4">
    <button
      onClick={() => {
        setOverrideAction('open');
        setShowOverrideModal(true);
      }}
      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-medium flex items-center gap-2 text-sm transition-all border border-emerald-500/20"
    >
      <Flame size={14} /> Force Open
    </button>
    
    <button
      onClick={() => {
        setOverrideAction('close');
        setShowOverrideModal(true);
      }}
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium flex items-center gap-2 text-sm transition-all border border-red-500/20"
    >
      <X size={14} /> Force Closed
    </button>
    
    <button
      onClick={cancelOverride}
      disabled={overrideLoading}
      className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg font-medium flex items-center gap-2 text-sm transition-all border border-orange-500/20"
    >
      {overrideLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
      Cancel Override
    </button>
  </div>
)}
                  
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin size={12} className="sm:w-[14px] sm:h-[14px] text-slate-500" />
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`,
                            "_blank"
                          )
                        }
                        className="text-blue-600 hover:underline text-xs sm:text-sm"
                      >
                        {t('view')}
                      </button>
                    </span>
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <ForkKnifeCrossed size={12} className="sm:w-[14px] sm:h-[14px] text-slate-500" /> 
                      <span>{menuItems.length} {t('menuItems')}</span>
                    </span>
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <StarIcon size={12} className="sm:w-[14px] sm:h-[14px] text-slate-500" /> 
                      <span>{reviews.length} {t('reviews')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : !isAddingRestaurant ? (
              <div className="bg-[#0A1628] border border-white/5 rounded-2xl p-8 sm:p-12 text-center">
                <Utensils className="mx-auto text-slate-600 mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                <p className="text-sm sm:text-base text-slate-400">{t('noRestaurant')}</p>
              </div>
            ) : null}

            {/* Add Restaurant Form */}
            {isAddingRestaurant && (
              <form onSubmit={handleAddRestaurant} className="bg-[#0A1628] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('registerRestaurant')}</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('cuisineType')}</label>
                  <input className="auth-input text-sm" placeholder={t('cuisinePlaceholder')} value={restaurantForm.cuisine}
                    onChange={e => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} required />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('tagsComma')}</label>
                  <input className="auth-input text-sm" placeholder={t('tagsPlaceholder')} value={restaurantForm.tags}
                    onChange={e => setRestaurantForm({ ...restaurantForm, tags: e.target.value })} />
                </div>

                <DaysSelection 
                  selectedDays={restaurantForm.days_open}
                  onChange={(days) => setRestaurantForm({ ...restaurantForm, days_open: days })}
                  language={language}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('openingTime')}</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTimeField('opening');
                          setShowOpeningClock(true);
                        }}
                        className="auth-input text-sm pl-10 text-left w-full flex items-center justify-between"
                      >
                        <span>{restaurantForm.opening_time ? formatTimeForDisplay(restaurantForm.opening_time) : t('selectTime')}</span>
                        <Clock size={16} className="text-orange-400" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{t('clickToSetOpening')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('closingTime')}</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTimeField('closing');
                          setShowClosingClock(true);
                        }}
                        className="auth-input text-sm pl-10 text-left w-full flex items-center justify-between"
                      >
                        <span>{restaurantForm.closing_time ? formatTimeForDisplay(restaurantForm.closing_time) : t('selectTime')}</span>
                        <Clock size={16} className="text-orange-400" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{t('clickToSetClosing')}</p>
                  </div>
                </div>

                {restaurantForm.opening_time && restaurantForm.closing_time && restaurantForm.days_open.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1">
                    <p className="text-xs text-slate-400">
                      <span className="text-emerald-400 font-medium">{t('operatingHours')}:</span>{' '}
                      {restaurantForm.opening_time} - {restaurantForm.closing_time}
                    </p>
                    <p className="text-xs text-slate-400">
                      <span className="text-emerald-400 font-medium">{t('operatingDaysLabel')}:</span>{' '}
                      {restaurantForm.days_open.join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {t('statusAutoUpdate')}
                    </p>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddingRestaurant(false)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-slate-400 hover:text-white font-medium transition-all text-sm">{t('cancel')}</button>
                  <button type="submit" disabled={loading}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                    {loading ? <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" /> : <Save size={14} className="sm:w-4 sm:h-4" />} {t('saveRestaurant')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold">{t('myMenuItems')} ({menuItems.length})</h2>
              <button onClick={() => setActiveTab('add-item')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold flex items-center gap-2 transition-all text-xs sm:text-sm w-full sm:w-auto justify-center">
                <Plus size={14} className="sm:w-4 sm:h-4" /> {t('addNewItem')}
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'All' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {MENU_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {t(categoryMap[cat] || 'meals')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredMenuItems.length > 0 ? filteredMenuItems.map(item => (
                <div key={item.id} className="bg-[#0A1628] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all">
                  <div className="aspect-video relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                        <Utensils size={32} className="sm:w-10 sm:h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 items-center justify-center gap-3 transition-all hidden sm:flex">
                      <button onClick={() => openEditItem(item)}
                        className="p-2 sm:p-2.5 bg-white/90 hover:bg-white rounded-xl text-slate-800 transition-all">
                        <Pencil size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button onClick={() => setDeleteItem(item)}
                        className="p-2 sm:p-2.5 bg-red-500/90 hover:bg-red-500 rounded-xl text-white transition-all">
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm sm:text-base">{item.name}</h3>
                      {item.has_offer && item.offer_price ? (
                        <div className="text-right">
                          <span className="text-orange-400 font-bold text-sm sm:text-base">₹{item.offer_price}</span>
                          <span className="text-slate-500 line-through text-xs ml-2">₹{item.price}</span>
                        </div>
                      ) : (
                        <span className="text-orange-400 font-bold text-sm sm:text-base">₹ {item.price}</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-2 sm:mb-3">{item.description}</p>
                    
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.category && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] sm:text-[10px] font-medium rounded border border-blue-500/20">
                          {item.category}
                        </span>
                      )}
                    
                      {item.has_offer && item.offer_price && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[8px] sm:text-[10px] font-bold rounded border border-orange-500/20 flex items-center gap-1">
                          <Flame size={10} className="text-orange-400" />
                          {item.offer_percentage}% OFF
                        </span>
                      )}
                    </div>
                    
                    {/* Mobile action buttons */}
                    <div className="flex gap-2 sm:hidden ml-auto">
                      <button onClick={() => openEditItem(item)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteItem(item)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 sm:py-20 text-center bg-[#0A1628] rounded-2xl border border-white/5">
                  <Utensils className="mx-auto text-slate-700 mb-4 w-8 h-8 sm:w-12 sm:h-12" size={32} />
                  <p className="text-sm sm:text-base text-slate-400">{t('noMenuItems')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Item Tab */}
        {activeTab === 'add-item' && (
          <div className="max-w-full sm:max-w-2xl">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">{t('addNewMenuItem')}</h2>
            <form onSubmit={handleAddMenuItem} className="bg-[#0A1628] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('itemName')}</label>
                  <input className="auth-input text-sm" placeholder={t('itemNamePlaceholder')} value={menuItemForm.name}
                    onChange={e => setMenuItemForm({ ...menuItemForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('price')}</label>
                  <input className="auth-input text-sm" type="number" step="0.01" placeholder={t('pricePlaceholder')} value={menuItemForm.price}
                    onChange={e => setMenuItemForm({ ...menuItemForm, price: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('description')}</label>
                <textarea className="auth-input resize-none text-sm" rows={3} placeholder={t('descriptionPlaceholder')}
                  value={menuItemForm.desc} onChange={e => setMenuItemForm({ ...menuItemForm, desc: e.target.value })} required />
              </div>

              {/* Food Type Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">{t('foodType')}</label>
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="foodType"
                      checked={menuItemForm.veg === true}
                      onChange={() => setMenuItemForm({ ...menuItemForm, veg: true, category: 'Veg' })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-emerald-500"
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('vegetarian')}</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="foodType"
                      checked={menuItemForm.veg === false}
                      onChange={() => setMenuItemForm({ ...menuItemForm, veg: false, category: 'Non-Veg' })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-red-500"
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('nonVegetarian')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">{t('category')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MENU_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMenuItemForm({ ...menuItemForm, category: cat })}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-medium transition-all border
                        ${menuItemForm.category === cat 
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      {t(categoryMap[cat] || 'meals')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="has_offer"
                    checked={menuItemForm.has_offer}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, has_offer: e.target.checked })}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label htmlFor="has_offer" className="text-sm font-medium text-orange-400">
                    Add Offer
                  </label>
                </div>

                <AnimatePresence>
                  {menuItemForm.has_offer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pl-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">
                            Offer Percentage (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            step="1"
                            className="auth-input text-sm"
                            placeholder="e.g. 10, 20, 30"
                            value={menuItemForm.offer_percentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 90)) {
                                setMenuItemForm({ ...menuItemForm, offer_percentage: val });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <DurationPicker
                            value={menuItemForm.offer_duration_hours}
                            onChange={(val) => setMenuItemForm({ ...menuItemForm, offer_duration_hours: val })}
                            language={language}
                          />
                        </div>
                      </div>
                      
                      {menuItemForm.price && menuItemForm.offer_percentage && (
                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400">
                            Offer Price: ₹{(parseFloat(menuItemForm.price) * (1 - parseFloat(menuItemForm.offer_percentage || '0')/100)).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Original price: ₹{parseFloat(menuItemForm.price).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Item Image */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('itemImage')}</label>
                <input type="file" id="add-image" className="hidden" accept="image/*"
                  onChange={e => { if (e.target.files?.[0]) setMenuItemForm({ ...menuItemForm, image: e.target.files[0] }); }} />
                <label htmlFor="add-image"
                  className="flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-[#060B14] border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-orange-500/40 transition-all overflow-hidden group">
                  {menuItemForm.image ? (
                    <div className="relative w-full h-full">
                      <img src={URL.createObjectURL(menuItemForm.image)} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <p className="text-white font-bold text-xs sm:text-sm">{t('replaceImage')}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="sm:w-6 sm:h-6 text-slate-500 mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-slate-400 font-medium text-center px-4">{t('clickToUpload')}</p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">{t('imageFormat')}</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 shadow-lg shadow-orange-500/20 text-sm">
                  {loading ? <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" /> : <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  {t('addToMenu')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold">{t('reviews')} ({reviews.length})</h2>
            <div className="space-y-3 sm:space-y-4">
              {reviews.length > 0 ? reviews.map((review, i) => (
                <div key={i} className="bg-[#0A1628] border border-white/5 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 font-bold text-xs sm:text-sm">
                        {review.user_email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">{review.user_email}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs sm:text-sm">
                      {[...Array(5)].map((_, s) => (
                        <span key={s} className={s < review.rating ? '' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic">"{review.comment}"</p>
                </div>
              )) : (
                <div className="py-12 sm:py-20 text-center bg-[#0A1628] rounded-2xl border border-white/5">
                  <Star className="mx-auto text-slate-700 mb-4 w-8 h-8 sm:w-12 sm:h-12" />
                  <p className="text-sm sm:text-base text-slate-400">{t('reviews')}</p>
                </div>
              )}
            </div>
          </div>
        )}
       {/* Orders Tab */}
{activeTab === 'orders' && (
  <div className="space-y-4 sm:space-y-6">
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
  <h2 className="text-lg sm:text-xl font-bold">
    {t('orders')} ({orders.length}) - {getTodayIST()}
  </h2>
  <button 
    onClick={() => fetchOrders()}
    className="px-4 py-2 bg-white/5 text-slate-400 rounded-lg font-medium hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
  >
    <RefreshCw size={16} className={ordersLoading ? 'animate-spin' : ''} />
    Refresh
  </button>
</div>

{/* Today's Stats - Only show when not in today's view */}
{!showOnlyToday && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="bg-[#0A1628] border border-white/5 rounded-xl p-4">
      <p className="text-sm text-slate-400 mb-1">{t('todaysOrders')}</p>
      <p className="text-2xl font-bold text-orange-400">
        {ordersStats.today?.count || 0}
      </p>
      <p className="text-[10px] text-slate-500 mt-1">{getTodayIST()}</p>
    </div>
    <div className="bg-[#0A1628] border border-white/5 rounded-xl p-4">
      <p className="text-sm text-slate-400 mb-1">{t('todaysRevenue')}</p>
      <p className="text-2xl font-bold text-emerald-400">
        ₹{(ordersStats.today?.total || 0).toFixed(2)}
      </p>
    </div>
  </div>
)}

{/* Payment Method Filter Toggles */}
<div className="flex items-center gap-3">
  <span className="text-xs text-slate-500 font-medium">Filter by Payment:</span>
  <div className="flex gap-2">
    {/* All */}
    <button
      onClick={() => setPaymentMethodFilter('all')}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
        paymentMethodFilter === 'all'
          ? 'bg-white/10 text-white border-white/20'
          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
      }`}
    >
      All
    </button>

    {/* UPI */}
    <button
      onClick={() => setPaymentMethodFilter(paymentMethodFilter === 'upi' ? 'all' : 'upi')}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
        paymentMethodFilter === 'upi'
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/20'
      }`}
    >
      <span className="text-base leading-none"><Phone /></span>
      UPI
      {paymentMethodFilter === 'upi' && (
        <span className="ml-1 px-1.5 py-0.5 bg-purple-500/30 rounded-full text-[10px]">
          {displayedOrders.length}
        </span>
      )}
    </button>

    {/* Cash */}
    <button
      onClick={() => setPaymentMethodFilter(paymentMethodFilter === 'cash' ? 'all' : 'cash')}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
        paymentMethodFilter === 'cash'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/20'
      }`}
    >
      <span className="text-base leading-none"><Banknote /></span>
      Cash
      {paymentMethodFilter === 'cash' && (
        <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/30 rounded-full text-[10px]">
          {displayedOrders.length}
        </span>
      )}
    </button>
  </div>
</div>
{/* Orders Table - Showing ONLY Today's Orders */}
{ordersLoading ? (
  <div className="flex justify-center py-12">
    <Loader2 size={32} className="animate-spin text-orange-500" />
  </div>
) : orders.length > 0 ? (
  <div className="bg-[#0A1628] border border-white/5 rounded-2xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Order</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Items</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Method</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-orange-400">
                {order.order_number}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {formatIST(order.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-white">
                  {order.customer?.name || 'N/A'}
                </div>
                <div className="text-xs text-slate-400">
                  {order.customer_phone}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-300">
                  {order.item_count} items
                </div>
                <button 
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderItemsModal(true);
                  }}
                  className="text-xs text-orange-400 hover:underline mt-1"
                >
                  View Items
                </button>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-emerald-400">
                  ₹{order.total_amount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  order.payment_status === 'paid' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                }`}>
                  {order.payment_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {order.payment_method}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => window.open(order.delivery_address, '_blank')}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 w-full justify-center"
                >
                  <MapPin size={12} />
                  Map
                </button>
                
                {/* Mark as Paid button - only for COD/cash orders that are not paid */}
                {order.payment_method?.toLowerCase() === 'cash' && order.payment_status !== 'paid' && (
                  <button
                    onClick={() => markCODAsPaid(order.id, order.order_number)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 mt-2 w-full justify-center"
                    disabled={ordersLoading}
                  >
                    {ordersLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Mark Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
) : (
  <div className="bg-[#0A1628] border border-white/5 rounded-2xl p-12 text-center">
    <ShoppingBag className="mx-auto text-slate-600 mb-4 w-12 h-12" />
    <p className="text-slate-400">
      No orders found for today ({getTodayIST()})
    </p>
  </div>
)}
    {/* Pagination Controls */}
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-3 mt-6">
    <button
      onClick={() => {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        fetchOrders(newPage);
      }}
      disabled={currentPage === 1}
      className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 disabled:opacity-50 hover:bg-white/10 transition-all text-sm"
    >
      ← Previous
    </button>
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">
        Page {currentPage} of {totalPages}
      </span>
      <select
        value={20}
        onChange={(e) => {
          // You can implement page size change here
          console.log('Page size changed to:', e.target.value);
        }}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300"
      >
        <option value={20}>20 per page</option>
        <option value={50}>50 per page</option>
        <option value={100}>100 per page</option>
      </select>
    </div>
    <button
      onClick={() => {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        fetchOrders(newPage);
      }}
      disabled={currentPage === totalPages}
      className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 disabled:opacity-50 hover:bg-white/10 transition-all text-sm"
    >
      Next →
    </button>
  </div>
)}
  </div>
  
)}
{/* Analytics Tab */}
{activeTab === 'analytics' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg sm:text-xl font-bold">Analytics</h2>
      <button
        onClick={fetchAnalytics}
        className="px-4 py-2 bg-white/5 text-slate-400 rounded-lg font-medium hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
      >
        <RefreshCw size={16} className={analyticsLoading ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>

    {analyticsLoading ? (
      <div className="flex justify-center py-24">
        <Loader2 size={36} className="animate-spin text-orange-500" />
      </div>
    ) : (
      <>
        {/* Summary Cards */}
        {analyticsSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Orders',
                value: analyticsSummary.total_orders_all_time,
                icon: <ShoppingBag size={18} className="text-orange-400" />,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10 border-orange-500/20',
              },
              {
                label: 'Total Revenue',
                value: `₹${parseFloat(analyticsSummary.total_revenue_all_time).toFixed(2)}`,
                icon: <Banknote size={18} className="text-emerald-400" />,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                label: "Today's Orders",
                value: analyticsSummary.today_orders_count,
                icon: <Clock size={18} className="text-blue-400" />,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
              },
              {
                label: "Today's Revenue",
                value: `₹${parseFloat(analyticsSummary.today_revenue).toFixed(2)}`,
                icon: <Flame size={18} className="text-amber-400" />,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
              },
            ].map((card) => (
              <div key={card.label} className={`bg-[#0A1628] border rounded-2xl p-4 sm:p-5 ${card.bg}`}>
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                  {card.icon}
                  {card.label}
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}
{/* Chart */}
{analyticsData.length > 0 ? (
  <div className="bg-[#0A1628] border border-white/5 rounded-2xl p-4 sm:p-6">
    <h3 className="text-sm font-semibold text-slate-300 mb-5">Daily Orders & Revenue</h3>

    {/* Legend */}
    <div className="flex items-center gap-6 mb-5">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />
        <span className="text-xs text-slate-400">Total Orders</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 h-0.5 bg-emerald-400 inline-block rounded" />
        <span className="text-xs text-slate-400">Total Revenue (₹)</span>
      </div>
    </div>

    {/* Scrollable wrapper */}
    <div className="w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
      {(() => {
        const PER_BAR = 90;          // px per data point — drives scroll width
        const PADDING = { top: 40, right: 70, bottom: 70, left: 68 };
        const H = 340;

        const chartW = Math.max(analyticsData.length * PER_BAR, 400);
        const W = chartW + PADDING.left + PADDING.right;
        const chartH = H - PADDING.top - PADDING.bottom;

        const maxOrders  = Math.max(...analyticsData.map(d => d.total_orders), 1);
        const maxRevenue = Math.max(...analyticsData.map(d => d.total_revenue), 1);

        // Round up to a nice number for axis
        const niceMax = (v: number) => {
          if (v <= 5)  return 5;
          if (v <= 10) return 10;
          if (v <= 20) return 20;
          const mag = Math.pow(10, Math.floor(Math.log10(v)));
          return Math.ceil(v / mag) * mag;
        };
        const ordersMax  = niceMax(maxOrders);
        const revenueMax = niceMax(maxRevenue);

        const toX       = (i: number) => PADDING.left + i * PER_BAR + PER_BAR / 2;
        const toOrderY  = (v: number) => PADDING.top + chartH - (v / ordersMax)  * chartH;
        const toRevY    = (v: number) => PADDING.top + chartH - (v / revenueMax) * chartH;

        const TICKS = 5;
        const orderTicks   = Array.from({ length: TICKS + 1 }, (_, i) => Math.round((ordersMax  / TICKS) * i));
        const revTicks     = Array.from({ length: TICKS + 1 }, (_, i) => Math.round((revenueMax / TICKS) * i));

        const barW = Math.min(40, PER_BAR * 0.5);

        const linePath = analyticsData
          .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toRevY(d.total_revenue)}`)
          .join(' ');

        const areaPath = analyticsData.length > 1
          ? `${linePath} L${toX(analyticsData.length - 1)},${PADDING.top + chartH} L${toX(0)},${PADDING.top + chartH} Z`
          : '';

        return (
          <svg
            width={W}
            height={H}
            style={{ display: 'block', minWidth: W }}
          >
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#34d399" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0"    />
              </linearGradient>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fb923c" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>
            </defs>

            {/* ── Grid lines + left axis (Orders) + right axis (Revenue) ── */}
            {orderTicks.map((tick, i) => {
              const y = toOrderY(tick);
              return (
                <g key={i}>
                  <line
                    x1={PADDING.left} y1={y}
                    x2={PADDING.left + chartW} y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? '0' : '4 4'}
                  />
                  {/* Left label — Orders */}
                  <text
                    x={PADDING.left - 10} y={y + 4}
                    textAnchor="end" fontSize="11"
                    fill="rgba(249,115,22,0.75)"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {tick}
                  </text>
                  {/* Right label — Revenue at matching proportional position */}
                  <text
                    x={PADDING.left + chartW + 10}
                    y={toRevY(revTicks[i]) + 4}
                    textAnchor="start" fontSize="11"
                    fill="rgba(52,211,153,0.75)"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {revTicks[i] >= 1000
                      ? `₹${(revTicks[i] / 1000).toFixed(1)}k`
                      : `₹${revTicks[i]}`}
                  </text>
                </g>
              );
            })}

            {/* ── Axis borders ── */}
            <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + chartH}
              stroke="rgba(249,115,22,0.2)" strokeWidth="1" />
            <line x1={PADDING.left + chartW} y1={PADDING.top} x2={PADDING.left + chartW} y2={PADDING.top + chartH}
              stroke="rgba(52,211,153,0.15)" strokeWidth="1" />
            <line x1={PADDING.left} y1={PADDING.top + chartH} x2={PADDING.left + chartW} y2={PADDING.top + chartH}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* ── Bars — Total Orders ── */}
            {analyticsData.map((d, i) => {
              const x  = toX(i);
              const bH = Math.max((d.total_orders / ordersMax) * chartH, d.total_orders > 0 ? 4 : 0);
              const y  = PADDING.top + chartH - bH;
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={x - barW / 2} y={y}
                    width={barW} height={bH}
                    rx="5" ry="5"
                    fill="url(#barGrad)"
                    opacity="0.9"
                  />
                  {/* Count label — always above bar, never inside it */}
                  {d.total_orders > 0 && (
                    <text
                      x={x} y={y - 7}
                      textAnchor="middle" fontSize="12"
                      fontWeight="700"
                      fill="#fb923c"
                      fontFamily="DM Sans, sans-serif"
                    >
                      {d.total_orders}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Revenue area fill ── */}
            {analyticsData.length > 1 && (
              <path d={areaPath} fill="url(#revGrad)" />
            )}

            {/* ── Revenue line ── */}
            {analyticsData.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* ── Revenue dots + labels (alternating above/below to prevent collision) ── */}
            {analyticsData.map((d, i) => {
              const x  = toX(i);
              const y  = toRevY(d.total_revenue);
              // Alternate label position: even = above dot, odd = below dot
              const above = i % 2 === 0;
              const labelY = above ? y - 10 : y + 18;
              return (
                <g key={`dot-${i}`}>
                  <circle cx={x} cy={y} r="5.5" fill="#34d399" stroke="#0A1628" strokeWidth="2.5" />
                  {d.total_revenue > 0 && (
                    <text
                      x={x} y={labelY}
                      textAnchor="middle" fontSize="10"
                      fontWeight="600"
                      fill="rgba(52,211,153,0.9)"
                      fontFamily="DM Sans, sans-serif"
                    >
                      {d.total_revenue >= 1000
                        ? `₹${(d.total_revenue / 1000).toFixed(1)}k`
                        : `₹${d.total_revenue}`}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── X-axis date labels (rotated 45° to prevent overlap) ── */}
            {analyticsData.map((d, i) => (
              <text
                key={`lbl-${i}`}
                x={toX(i)}
                y={PADDING.top + chartH + 16}
                textAnchor="end"
                fontSize="11"
                fill="rgba(148,163,184,0.75)"
                fontFamily="DM Sans, sans-serif"
                transform={`rotate(-40, ${toX(i)}, ${PADDING.top + chartH + 16})`}
              >
                {d.displayDate}
              </text>
            ))}

            {/* ── Axis titles ── */}
            <text
              x={16}
              y={PADDING.top + chartH / 2}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(249,115,22,0.55)"
              fontFamily="DM Sans, sans-serif"
              transform={`rotate(-90, 16, ${PADDING.top + chartH / 2})`}
            >
              Orders
            </text>
            <text
              x={W - 12}
              y={PADDING.top + chartH / 2}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(52,211,153,0.55)"
              fontFamily="DM Sans, sans-serif"
              transform={`rotate(90, ${W - 12}, ${PADDING.top + chartH / 2})`}
            >
              Revenue (₹)
            </text>
          </svg>
        );
      })()}
    </div>

    {/* Scroll hint for mobile */}
    {analyticsData.length > 7 && (
      <p className="text-[10px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1">
        <span>← Scroll to see all dates →</span>
      </p>
    )}
  </div>
) : (
  <div className="bg-[#0A1628] border border-white/5 rounded-2xl p-16 text-center">
    <BarChart2 className="mx-auto text-slate-700 mb-4 w-12 h-12" />
    <p className="text-slate-400 text-sm">No analytics data available yet</p>
  </div>
)}
      </>
    )}
  </div>
)}
{/* Order Items Modal */}
<AnimatePresence>
  {showOrderItemsModal && selectedOrder && (
    <OrderItemsModal
      order={selectedOrder}
      onClose={() => {
        setShowOrderItemsModal(false);
        setSelectedOrder(null);
      }}
      language={language}
    />
  )}
</AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Edit Restaurant Modal */}
        {editRestaurantOpen && (
          <Modal title={t('edit')} onClose={() => setEditRestaurantOpen(false)} language={language}>
            <form onSubmit={handleUpdateRestaurant} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('cuisineType')}</label>
                <input className="auth-input text-sm" value={editRestaurantForm.cuisine}
                  onChange={e => setEditRestaurantForm({ ...editRestaurantForm, cuisine: e.target.value })} required />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('tagsComma')}</label>
                <input className="auth-input text-sm" value={editRestaurantForm.tags}
                  onChange={e => setEditRestaurantForm({ ...editRestaurantForm, tags: e.target.value })} />
              </div>

              <DaysSelection 
                selectedDays={editRestaurantForm.days_open}
                onChange={(days) => setEditRestaurantForm({ ...editRestaurantForm, days_open: days })}
                language={language}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('openingTime')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTimeField('opening');
                        setShowOpeningClock(true);
                      }}
                      className="auth-input text-sm pl-10 text-left w-full flex items-center justify-between"
                    >
                      <span>{editRestaurantForm.opening_time ? formatTimeForDisplay(editRestaurantForm.opening_time) : t('selectTime')}</span>
                      <Clock size={16} className="text-orange-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('closingTime')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTimeField('closing');
                        setShowClosingClock(true);
                      }}
                      className="auth-input text-sm pl-10 text-left w-full flex items-center justify-between"
                    >
                      <span>{editRestaurantForm.closing_time ? formatTimeForDisplay(editRestaurantForm.closing_time) : t('selectTime')}</span>
                      <Clock size={16} className="text-orange-400" />
                    </button>
                  </div>
                </div>
              </div>

              {editRestaurantForm.opening_time && editRestaurantForm.closing_time && editRestaurantForm.days_open.length > 0 && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1">
                  <p className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-medium">{t('operatingHours')}:</span>{' '}
                    {formatTimeForDisplay(editRestaurantForm.opening_time)} - {formatTimeForDisplay(editRestaurantForm.closing_time)}
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-medium">{t('operatingDaysLabel')}:</span>{' '}
                    <span className="text-slate-300">{editRestaurantForm.days_open.join(', ')}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t('statusAutoUpdate')}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditRestaurantOpen(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={editRestaurantLoading}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                  {editRestaurantLoading ? <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" /> : <Save size={14} className="sm:w-4 sm:h-4" />}
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Update Profile Modal */}
        {updateProfileOpen && (
          <Modal title={t('updateProfile')} onClose={() => {
            setUpdateProfileOpen(false);
            setUpdateProfilePreview(null);
          }} language={language}>
            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('restaurantProfile')}</label>
                <input
                  className="auth-input text-sm"
                  placeholder={t('restaurantProfile')}
                  value={updateProfileForm.restaurant_name}
                  onChange={e => setUpdateProfileForm({ ...updateProfileForm, restaurant_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">{t('itemImage')}</label>
                <input
                  type="file"
                  id="profile-image"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUpdateProfileForm({ ...updateProfileForm, cover_image: file });
                      setUpdateProfilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <label
                  htmlFor="profile-image"
                  className="flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-[#060B14] border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-orange-500/40 transition-all overflow-hidden group"
                >
                  {updateProfilePreview ? (
                    <div className="relative w-full">
                      <img src={updateProfilePreview} alt="Preview" className="w-full block" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <p className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                          <Upload size={12} className="sm:w-4 sm:h-4" /> {t('replaceImage')}
                        </p>
                      </div>
                    </div>
                  ) : restaurant?.image ? (
                    <div className="relative w-full">
                      <img src={restaurant.image} alt="Current" className="w-full block opacity-50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                        <Upload size={16} className="sm:w-5 sm:h-5 text-slate-400 mb-1" />
                        <p className="text-xs sm:text-sm text-slate-400 font-medium text-center">{t('replaceImage')}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="sm:w-6 sm:h-6 text-slate-500 mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-slate-400 font-medium text-center px-4">{t('clickToUpload')}</p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">{t('imageFormat')}</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setUpdateProfileOpen(false); setUpdateProfilePreview(null); }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updateProfileLoading}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                >
                  {updateProfileLoading ? <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" /> : <Save size={14} className="sm:w-4 sm:h-4" />}
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Restaurant Modal */}
        {deleteRestaurantOpen && (
          <ConfirmDeleteModal
            label={t('restaurantProfile')}
            onConfirm={handleDeleteRestaurant}
            onClose={() => setDeleteRestaurantOpen(false)}
            loading={deleteRestaurantLoading}
            language={language}
          />
        )}

        {/* Edit Menu Item Modal */}
        {editItem && (
          <Modal title={`${t('editItem')} ${editItem.name}`} onClose={() => setEditItem(null)} language={language}>
            <form onSubmit={handleUpdateMenuItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">{t('itemName')}</label>
                  <input className="auth-input text-sm" value={editItemForm.name}
                    onChange={e => setEditItemForm({ ...editItemForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">{t('price')}</label>
                  <input className="auth-input text-sm" type="number" step="0.01" value={editItemForm.price}
                    onChange={e => setEditItemForm({ ...editItemForm, price: e.target.value })} required />
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">{t('description')}</label>
                <textarea className="auth-input resize-none text-sm" rows={3} value={editItemForm.desc}
                  onChange={e => setEditItemForm({ ...editItemForm, desc: e.target.value })} />
              </div>
              
              {/* Food Type Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">{t('foodType')}</label>
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="editFoodType"
                      checked={editItemForm.veg === true}
                      onChange={() => setEditItemForm({ ...editItemForm, veg: true })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-emerald-500"
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('vegetarian')}</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="editFoodType"
                      checked={editItemForm.veg === false}
                      onChange={() => setEditItemForm({ ...editItemForm, veg: false })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-red-500"
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('nonVegetarian')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">{t('category')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MENU_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditItemForm({ ...editItemForm, category: cat })}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-medium transition-all border
                        ${editItemForm.category === cat 
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      {t(categoryMap[cat] || 'meals')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Section */}
              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="edit_has_offer"
                    checked={editItemForm.has_offer}
                    onChange={(e) => setEditItemForm({ ...editItemForm, has_offer: e.target.checked })}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label htmlFor="edit_has_offer" className="text-sm font-medium text-orange-400">
                    Add Offer
                  </label>
                </div>

                <AnimatePresence>
                  {editItemForm.has_offer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pl-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">
                            Offer Percentage (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            step="1"
                            className="auth-input text-sm"
                            placeholder="e.g. 10, 20, 30"
                            value={editItemForm.offer_percentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 90)) {
                                setEditItemForm({ ...editItemForm, offer_percentage: val });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <DurationPicker
                            value={editItemForm.offer_duration_hours}
                            onChange={(val) => setEditItemForm({ ...editItemForm, offer_duration_hours: val })}
                            language={language}
                          />
                        </div>
                      </div>
                      
                      {editItemForm.price && editItemForm.offer_percentage && (
                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400">
                            Offer Price: ₹{(parseFloat(editItemForm.price) * (1 - parseFloat(editItemForm.offer_percentage || '0')/100)).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Original price: ₹{parseFloat(editItemForm.price).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5">{t('replaceImage')}</label>
                <input type="file" id="edit-image" className="hidden" accept="image/*"
                  onChange={e => { if (e.target.files?.[0]) setEditItemForm({ ...editItemForm, image: e.target.files[0] }); }} />
                <label htmlFor="edit-image"
                  className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-orange-500/40 text-slate-400 hover:text-orange-400 transition-all text-xs sm:text-sm font-medium">
                  <Upload size={14} className="sm:w-4 sm:h-4" />
                  {editItemForm.image ? editItemForm.image.name : t('uploadNewImage')}
                </label>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditItem(null)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={editItemLoading}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                  {editItemLoading ? <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" /> : <Save size={14} className="sm:w-4 sm:h-4" />}
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Menu Item Modal */}
        {deleteItem && (
          <ConfirmDeleteModal
            label={deleteItem.name}
            onConfirm={handleDeleteMenuItem}
            onClose={() => setDeleteItem(null)}
            loading={deleteItemLoading}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Clock Pickers */}
      <AnimatePresence>
        {showOpeningClock && activeTimeField === 'opening' && !editRestaurantOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <ClockPicker
              value={restaurantForm.opening_time}
              onChange={(time) => {
                setRestaurantForm({ ...restaurantForm, opening_time: time });
              }}
              onClose={() => {
                setShowOpeningClock(false);
                setActiveTimeField(null);
              }}
              language={language}
            />
          </div>
        )}

        {showClosingClock && activeTimeField === 'closing' && !editRestaurantOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <ClockPicker
              value={restaurantForm.closing_time}
              onChange={(time) => {
                setRestaurantForm({ ...restaurantForm, closing_time: time });
              }}
              onClose={() => {
                setShowClosingClock(false);
                setActiveTimeField(null);
              }}
              language={language}
            />
          </div>
        )}

        {showOpeningClock && activeTimeField === 'opening' && editRestaurantOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <ClockPicker
              value={editRestaurantForm.opening_time}
              onChange={(time) => {
                setEditRestaurantForm({ ...editRestaurantForm, opening_time: time });
              }}
              onClose={() => {
                setShowOpeningClock(false);
                setActiveTimeField(null);
              }}
              language={language}
            />
          </div>
        )}

        {showClosingClock && activeTimeField === 'closing' && editRestaurantOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <ClockPicker
              value={editRestaurantForm.closing_time}
              onChange={(time) => {
                setEditRestaurantForm({ ...editRestaurantForm, closing_time: time });
              }}
              onClose={() => {
                setShowClosingClock(false);
                setActiveTimeField(null);
              }}
              language={language}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Full page loading overlay */}
      {translating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0F172A] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-4"
          >
            <Loader2 size={40} className="animate-spin text-orange-500" />
            <p className="text-white font-medium">
              {language === 'ta' ? 'மொழிபெயர்க்கிறது...' : 'Translating...'}
            </p>
            <p className="text-sm text-slate-400">
              {language === 'ta' ? 'உங்கள் மொழியில் உள்ளடக்கத்தை ஏற்றுகிறது' : 'Loading content in your language'}
            </p>
          </motion.div>
        </div>
      )}
      {/* Find this in the JSX and update the onConfirm prop */}
<OverrideModal
  show={showOverrideModal}
  onClose={() => setShowOverrideModal(false)}
  onConfirm={(startTime, endTime) => forceRestaurantStatus(overrideAction === 'open', startTime, endTime)}
  loading={overrideLoading}
  action={overrideAction}
/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .auth-input {
          width: 100%;
          background-color: #060B14;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: white;
          transition: all 0.2s;
          font-size: 0.875rem;
        }
        
        @media (max-width: 640px) {
          .auth-input {
            padding: 0.625rem 0.875rem;
            font-size: 0.8125rem;
          }
        }
        
        .auth-input:focus {
          outline: none;
          border-color: #F97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        textarea.auth-input { font-family: inherit; }
        
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }
        
        @media (max-width: 768px) {
          button, 
          [role="button"],
          .cursor-pointer {
            min-height: 44px;
            min-width: 44px;
          }
          
          button.sm\\:min-h-0 {
            min-height: 0;
          }
        }
      `}</style>
    </div>
  );
}