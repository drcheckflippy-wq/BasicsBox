# Merchant App - React Native + Expo

Welcome to the Merchant Mobile Application! This is a **React Native** app built with **Expo** that provides merchants with a comprehensive dashboard to manage their restaurants, menus, orders, and business analytics. Available on both iOS and Android.

---

## 📋 Project Overview

The Merchant App is the primary interface for restaurant merchants featuring:

**Key Features:**
- Merchant Authentication & Authorization
- Restaurant Profile Management
- Menu & Dish Management
- Real-time Order Management
- Order Status Tracking & Updates
- Payment & Revenue Tracking
- Customer Reviews & Ratings Management
- Business Analytics & Insights
- Notification Management (Push notifications)
- Image Upload for Menu Items
- Daily/Weekly Revenue Reports
- Location-based Ordering
- Commission Tracking

**Technology Stack:**
- React Native 0.81
- Expo 54 (development framework)
- React Navigation for routing
- Axios for API calls
- Async Storage for local data
- Image Picker for media uploads
- Notifications API

---

## 📁 Folder Structure

```
merchant/
├── app/                             # App screens and routing
│   ├── _layout.tsx                 # Root layout/navigation
│   ├── (tabs)/                     # Tab-based navigation
│   │   ├── _layout.tsx             # Tabs layout
│   │   ├── dashboard.tsx           # Dashboard/home tab
│   │   ├── orders.tsx              # Orders management tab
│   │   ├── menu.tsx                # Menu management tab
│   │   ├── analytics.tsx           # Analytics tab
│   │   └── settings.tsx            # Settings tab
│   └── merchant/                   # Merchant-specific screens
│       ├── [merchant screens]
├── components/                      # Reusable components
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   ├── ui/                         # UI component library
│   │   └── [component files]
│   └── [more components]
├── assets/                          # Static assets
│   └── images/                     # App images
├── constants/                       # App constants
│   └── theme.ts                    # Theme configuration
├── hooks/                           # Custom React hooks
│   ├── use-color-scheme.ts         # Color scheme hook
│   ├── use-theme-color.ts          # Theme color hook
│   └── [more hooks]
├── services/                        # API & external services
│   ├── api.ts                      # API calls
│   └── [more services]
├── types/                           # TypeScript types
│   ├── images.d.ts                 # Image type definitions
│   └── [more types]
├── scripts/                         # Utility scripts
│   └── reset-project.js            # Reset project script
├── app.json                         # Expo app config
├── eas.json                         # Expo App Services config
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── expo-env.d.ts                   # Expo environment types
├── eslint.config.js                # ESLint configuration
├── google-services.json            # Firebase config (Android)
├── android/                         # Android-specific files
│   ├── app/
│   ├── build/
│   └── gradle/
└── README.md                        # This file
```

### Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| `app/` | Screen components and navigation (Expo Router) |
| `app/(tabs)/` | Tab-based main application screens |
| `app/merchant/` | Merchant-specific screens and flows |
| `components/` | Reusable UI components |
| `assets/` | Images, fonts, and other static files |
| `hooks/` | Custom React hooks for common logic |
| `services/` | API calls and external services |
| `constants/` | Theme and configuration constants |
| `types/` | TypeScript type definitions |
| `android/` | Android-specific native code |

---

## 🛠️ Prerequisites & Requirements

Before you start, make sure you have:

1. **Node.js 18+** and **npm** (or yarn)
   - [Download Node.js](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Git** (for cloning repository)
   - [Download Git](https://git-scm.com/)

3. **Expo CLI** (for development)
   ```bash
   npm install -g expo-cli
   ```

4. **Android Studio** (for Android emulator - Optional)
   - [Download Android Studio](https://developer.android.com/studio)
   - Set up Android emulator

5. **Xcode** (for iOS simulator - Mac only)
   - Download from App Store on Mac

6. **Text Editor/IDE** (VS Code recommended)
   - [Download VS Code](https://code.visualstudio.com/)

7. **Required API Keys & Credentials:**
   - Backend API URL (Django backend)
   - Firebase credentials (if using authentication)
   - Expo account (for EAS builds - optional)

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Navigate to Project Directory

```bash
cd e:\Ecommerce\merchant
```

### Step 2: Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using yarn
yarn install
```

**What gets installed:**
- React Native 0.81
- Expo 54
- React Navigation
- Axios for HTTP requests
- Async Storage for local data
- Image Picker for media management
- Notifications API
- And many more...

### Step 3: Create Environment Variables

Create a `.env.local` file in the `merchant/` directory:

```env
# Backend API
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0

# Firebase Configuration (optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

**Note:** Use `EXPO_PUBLIC_` prefix for variables to be accessible in the app.

### Step 4: Configure Firebase (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Add a new app (Android)
4. Download `google-services.json`
5. Place `google-services.json` in the `merchant/` root directory

### Step 5: Verify Installation

```bash
# Check dependencies
npm list

# Check Expo setup
expo --version

# Verify project structure
npm run lint
```

---

## ▶️ Running the Development App

### Start Expo Development Server

```bash
# Start the Expo dev server
npm start
```

**Success output:**
```
merchant@1.0.0 start
expo start

Starting Expo CLI...
Starting Metro bundler
...
[Your connection information]
```

### Running on Physical Device

**Option 1: Expo Go App**

1. Download "Expo Go" from Play Store (Android)
2. Scan QR code shown in terminal with Expo Go app
3. App loads on your device

**Option 2: Development Build**

```bash
# Android with development build
npm run android

# Build with EAS
eas build --platform android --profile preview
```

### Running on Emulator

**Android Emulator:**
```bash
# Make sure Android Studio is open with emulator running
npm run android
```

### Web Development (Testing)

```bash
# Run web version
npm run web

# Access at http://localhost:19006
```

---

## 📦 Available npm Scripts

```bash
# Development
npm start              # Start Expo development server
npm run web           # Run web version

# Mobile
npm run android       # Run on Android emulator/device
npm run ios          # Run on iOS simulator (Mac only)

# Project Management
npm run reset-project # Reset project to initial state

# Code Quality
npm run lint          # Check code with ESLint
npm run lint --fix    # Fix ESLint issues automatically

# Production Builds
npm run build:android  # Build Android APK (with EAS)
npm run build:ios      # Build iOS app (with EAS)
```

---

## 🔧 Key Configuration Files

### `app.json` - Expo App Configuration

```json
{
  "expo": {
    "name": "merchant",
    "slug": "merchant-app",
    "version": "1.0.0",
    "scheme": "merchant",
    "platforms": ["android", "web"],
    "plugins": [
      ["expo-image-picker", {}],
      ["expo-notifications", {}],
      ["expo-build-properties", {}]
    ]
  }
}
```

### `eas.json` - EAS Build Configuration

For building APK for distribution:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "release"
      }
    }
  }
}
```

### `tsconfig.json` - TypeScript Configuration

TypeScript settings for type safety and IntelliSense.

---

## 🎨 Key Technologies & Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| React Native | 0.81 | Mobile UI framework |
| Expo | 54 | Development platform |
| React Navigation | 7.1 | Navigation between screens |
| Axios | 1.13 | HTTP requests |
| Async Storage | 2.2 | Local data persistence |
| Image Picker | 17.0 | Image selection from device |
| Notifications | 0.32 | Push notifications |
| Reanimated | 4.1 | Smooth animations |
| Moti | 0.30 | Animation components |

---

## 📡 API Integration

### API Service Setup

```typescript
// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('merchantToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Making API Calls

```typescript
// In a screen component
import api from '@/services/api';

const fetchOrders = async () => {
  try {
    const response = await api.get('/orders/merchant/');
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status/`, {
      status: status
    });
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
  }
};
```

---

## 📊 Main API Endpoints for Merchant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/merchant/` | Merchant login |
| POST | `/api/auth/register/merchant/` | Merchant registration |
| GET | `/api/merchant/profile/` | Get merchant profile |
| PUT | `/api/merchant/profile/` | Update merchant profile |
| GET | `/api/orders/merchant/` | Get merchant orders |
| PUT | `/api/orders/{id}/status/` | Update order status |
| GET | `/api/analytics/merchant/` | Get analytics |
| POST | `/api/menu/add/` | Add menu item |
| PUT | `/api/menu/{id}/` | Update menu item |
| DELETE | `/api/menu/{id}/` | Delete menu item |
| GET | `/api/reviews/{restaurant_id}/` | Get restaurant reviews |

---

## 📍 Navigation Structure

The app uses **Expo Router** for file-based routing:

```
app/
├── (tabs)/                    # Tab-based main navigation
│   ├── _layout.tsx            # Tabs configuration
│   ├── dashboard.tsx          # Home/Dashboard screen
│   ├── orders.tsx             # Orders management screen
│   ├── menu.tsx               # Menu management screen
│   ├── analytics.tsx          # Analytics screen
│   └── settings.tsx           # Settings screen
├── merchant/                  # Merchant-specific flows
│   ├── login.tsx              # Login screen
│   ├── register.tsx           # Registration screen
│   ├── profile.tsx            # Profile management
│   └── [more screens]
├── _layout.tsx                # Root layout
└── index.tsx                  # Initial route
```

---

## 🏪 Order Management Flow

```typescript
// Example: Processing orders workflow
const processOrder = async (orderId) => {
  try {
    // Get order details
    const orderResponse = await api.get(`/orders/${orderId}/`);
    const order = orderResponse.data;

    // Update order status to "processing"
    await api.patch(`/orders/${orderId}/status/`, {
      status: 'processing'
    });

    // Send notification to customer
    // ... notification logic ...

    // When ready, mark as "ready for pickup"
    await api.patch(`/orders/${orderId}/status/`, {
      status: 'ready'
    });

  } catch (error) {
    console.error('Error processing order:', error);
  }
};
```

---

## 📸 Image Upload for Menu Items

```typescript
import * as ImagePicker from 'expo-image-picker';
import FormData from 'form-data';

const pickAndUploadImage = async () => {
  try {
    // Request permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      
      // Upload to API
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'menu-item.jpg'
      });
      
      const response = await api.post('/menu/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};
```

---

## 🔔 Push Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Setup notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for notifications
const registerForPushNotifications = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
    
    // Send token to backend
    await api.post('/notifications/register/', { token });
  } catch (error) {
    console.error('Error registering for notifications:', error);
  }
};
```

---

## 📊 Analytics & Reporting

```typescript
const fetchAnalytics = async (period = 'weekly') => {
  try {
    const response = await api.get('/analytics/merchant/', {
      params: { period }
    });
    
    const {
      total_orders,
      total_revenue,
      average_order_value,
      top_items,
      hourly_orders
    } = response.data;

    return {
      totalOrders: total_orders,
      totalRevenue: total_revenue,
      avgOrderValue: average_order_value,
      topItems: top_items,
      ordersByHour: hourly_orders
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
};
```

---

## 🏪 Local Data Persistence

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save merchant data
const saveMerchantData = async (data) => {
  try {
    await AsyncStorage.setItem('merchantData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving merchant data:', error);
  }
};

// Load merchant data
const loadMerchantData = async () => {
  try {
    const data = await AsyncStorage.getItem('merchantData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading merchant data:', error);
  }
};

// Clear data on logout
const clearMerchantData = async () => {
  try {
    await AsyncStorage.removeItem('merchantToken');
    await AsyncStorage.removeItem('merchantData');
    await AsyncStorage.removeItem('merchantId');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
```

---

## ⚠️ Common Issues & Troubleshooting

### Issue 1: Metro Bundler Crashes

```
Error: Metro bundler crashed
```
**Solution:**
```bash
npm start -- --reset-cache
```

### Issue 2: Dependencies Not Installed

```
Error: Cannot find module 'react-native'
```
**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue 3: Android Emulator Not Detected

```
Error: No Android device connected
```
**Solution:**
```bash
emulator -list-avds
emulator -avd EmulatorName
```

### Issue 4: Image Picker Permission Denied

```
Error: Permissions not granted
```
**Solution:**
- Check `app.json` plugins configuration
- Rebuild app with EAS or development build
- Check device permissions settings

### Issue 5: API Calls Return 401 Unauthorized

```
Error: Request failed with status code 401
```
**Solution:**
- Verify merchant token is valid
- Check token in AsyncStorage
- Ensure token hasn't expired
- Re-authenticate if needed

### Issue 6: Port Already in Use

```
Error: Port 19000 is already in use
```
**Solution:**
```bash
npm start -- --port 19001
```

---

## 🚀 Building for Production

### Build for Android

```bash
# Using EAS
eas build --platform android

# Build for store distribution
eas build --platform android --auto-submit
```

### Using EAS CLI

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build and submit to Play Store
eas build --platform android --auto-submit
```

---

## 📝 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `http://10.0.2.2:8000/api` |
| `EXPO_PUBLIC_TRANSLATOR_URL` | Translator service | `http://10.0.2.2:5000` |
| `EXPO_PUBLIC_APP_ENV` | Environment (dev/prod) | `development` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project | `xxx` |

---

## 📚 Useful Resources

- **React Native Docs:** https://reactnative.dev/
- **Expo Docs:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **Axios Docs:** https://axios-http.com/

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Firebase configured (if using)
- [ ] API endpoints tested
- [ ] All screens tested on device/emulator
- [ ] Image upload functionality working
- [ ] Notifications setup complete
- [ ] Performance optimized
- [ ] No console errors or warnings
- [ ] App icon and splash screen configured
- [ ] App name and version updated

---

## 🆘 Getting Help

1. Check the troubleshooting section above
2. Review React Native documentation
3. Check Expo documentation
4. Search GitHub issues
5. Ask in Expo community forums

---

**Happy coding! 📱**

For questions or issues, refer to the official documentation or check the troubleshooting section above.
