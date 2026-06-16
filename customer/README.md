# Customer App - React Native + Expo

Welcome to the Customer Mobile Application! This is a **React Native** app built with **Expo** that provides a seamless mobile shopping experience for customers. Available on both iOS and Android, it features authentication, real-time order tracking, payments, and more.

---

## 📋 Project Overview

The Customer App is the primary mobile interface for end customers featuring:

**Key Features:**
- User Authentication (Email, Google Sign-In)
- Browse Restaurants & Menus
- Shopping Cart Management
- Real-time Order Tracking
- Multiple Payment Methods (Cashfree)
- Order History & Management
- Ratings & Reviews
- Location-Based Services
- Push Notifications
- Dark Mode Support
- Async Storage for offline data

**Technology Stack:**
- React Native 0.81
- Expo 54 (development framework)
- React Navigation for routing
- Firebase for authentication
- Axios for API calls
- Async Storage for local persistence

---

## 📁 Folder Structure

```
customer/
├── app/                             # App screens and routing
│   ├── _layout.tsx                 # Root layout/navigation
│   ├── index.tsx                   # Home screen
│   ├── modal.tsx                   # Modal screen
│   ├── payment-callback.tsx        # Payment callback screen
│   ├── (auth)/                     # Auth stack screens
│   │   ├── _layout.tsx             # Auth layout
│   │   ├── customer-auth.tsx       # Login/signup screen
│   │   ├── loading.tsx             # Loading screen
│   │   └── [more screens]
│   └── (tabs)/                     # Tab-based screens
│       ├── _layout.tsx             # Tabs layout
│       ├── [screen files].tsx
│       └── [more screens]
├── components/                      # Reusable components
│   ├── external-link.tsx
│   ├── GoogleAuthButton.tsx
│   ├── haptic-tab.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   ├── ui/                         # UI component library
│   │   └── [component files]
│   └── [more components]
├── assets/                          # Static assets
│   └── images/                     # App images
├── config/                          # Configuration
│   └── firebase.ts                 # Firebase setup
├── constants/                       # App constants
│   └── theme.ts                    # Theme configuration
├── context/                         # Global state (Context API)
│   ├── AuthContext.tsx             # Authentication state
│   ├── CartContext.tsx             # Shopping cart state
│   ├── ThemeContext.tsx            # Theme state
│   └── [more contexts]
├── hooks/                           # Custom React hooks
│   ├── useAuth.ts                  # Authentication hook
│   ├── use-color-scheme.ts         # Color scheme hook
│   ├── use-theme-color.ts          # Theme color hook
│   └── [more hooks]
├── services/                        # API & external services
│   ├── api.ts                      # API calls
│   ├── authService.ts              # Auth service
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
| `components/` | Reusable UI components |
| `assets/` | Images, fonts, and other static files |
| `context/` | Global state management with React Context |
| `hooks/` | Custom React hooks for common logic |
| `services/` | API calls, authentication, external services |
| `config/` | Firebase and other configurations |
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
   - Firebase project credentials
   - Google OAuth credentials
   - Backend API URL (Django backend)
   - Expo account (for EAS builds - optional)

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Navigate to Project Directory

```bash
cd e:\Ecommerce\customer
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
- Firebase SDK
- Axios for HTTP requests
- Async Storage for local data
- And many more...

### Step 3: Create Environment Variables

Create a `.env.local` file in the `customer/` directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Backend API
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000

# Google OAuth (Android)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your_android_google_client_id

# Google OAuth (iOS)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your_ios_google_client_id
```

**Note:** Use `EXPO_PUBLIC_` prefix for variables to be accessible in the app.

### Step 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Add a new app (iOS and Android)
4. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
5. Place `google-services.json` in the `customer/` root directory

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
expo-router-app@0.0.1 start
expo start

Starting Expo CLI...
Starting Metro bundler
...
[Your connection information]
```

### Running on Physical Device

**Option 1: Expo Go App**

1. Download "Expo Go" from App Store (iOS) or Play Store (Android)
2. Scan QR code shown in terminal with your phone camera (Android) or Expo Go app (iOS)
3. App loads on your device

**Option 2: Using USB Connection**

```bash
# Android with USB debugging
npm run android

# iOS (Mac only)
npm run ios
```

### Running on Emulator

**Android Emulator:**
```bash
# Make sure Android Studio is open with emulator running
npm run android
```

**iOS Simulator (Mac only):**
```bash
npm run ios
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
    "name": "customer",
    "slug": "customer-app",
    "version": "1.0.0",
    "scheme": "customer",
    "platforms": ["ios", "android", "web"],
    "plugins": [
      ["@react-native-google-signin/google-signin", {}],
      ["expo-build-properties", {}]
    ]
  }
}
```

### `eas.json` - EAS Build Configuration

For building APK/IPA for distribution:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "release"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

### `tsconfig.json` - TypeScript Configuration

TypeScript settings for type safety and IntelliSense.

### `expo-env.d.ts` - Expo Type Definitions

Type definitions for Expo environment variables.

---

## 🎨 Key Technologies & Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| React Native | 0.81 | Mobile UI framework |
| Expo | 54 | Development platform |
| React Navigation | 7.1 | Navigation between screens |
| Firebase | 12.11 | Authentication & storage |
| Axios | 1.13 | HTTP requests |
| React Hook Form | 7.72 | Form handling |
| Async Storage | 2.2 | Local data persistence |
| Reanimated | 4.1 | Smooth animations |
| Moti | 0.30 | Animation components |

---

## 🔐 Firebase Authentication

### Setup Firebase

```typescript
// services/authService.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Using Authentication Hook

```typescript
// In any screen component
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();

  return (
    <View>
      <Text>Welcome, {user?.email}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

---

## 🛒 Global State Management

### Using Context for Cart

```typescript
// context/CartContext.tsx
import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Using in components
import { useContext } from 'react';
import { CartContext } from '@/context/CartContext';

export default function MenuScreen() {
  const { addToCart } = useContext(CartContext);

  return (
    <Button
      title="Add to Cart"
      onPress={() => addToCart(item)}
    />
  );
}
```

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
  const token = await AsyncStorage.getItem('authToken');
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

const fetchRestaurants = async () => {
  try {
    const response = await api.get('/restaurants/');
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
  }
};
```

---

## 📍 Navigation Structure

The app uses **Expo Router** for file-based routing:

```
app/
├── (auth)/                    # Auth screens
│   ├── _layout.tsx
│   └── customer-auth.tsx      # Login/signup
├── (tabs)/                    # Tab-based navigation
│   ├── _layout.tsx
│   ├── home.tsx               # Home tab
│   ├── orders.tsx             # Orders tab
│   ├── profile.tsx            # Profile tab
│   └── settings.tsx           # Settings tab
├── _layout.tsx                # Root layout
├── index.tsx                  # Initial route
└── payment-callback.tsx       # Payment result
```

---

## 🏪 Local Data Persistence

### Using Async Storage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
const saveUserPreferences = async (prefs) => {
  try {
    await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

// Load data
const loadUserPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem('userPreferences');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
};

// Clear data
const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userPreferences');
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
# Clear cache and restart
npm start -- --reset-cache
```

### Issue 2: Dependencies Not Installed

```
Error: Cannot find module 'react-native'
```
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue 3: Android Emulator Not Detected

```
Error: No Android device connected
```
**Solution:**
```bash
# List available emulators
emulator -list-avds

# Start emulator manually before running
emulator -avd EmulatorName
```

### Issue 4: Firebase Authentication Fails

```
Error: Firebase app initialization failed
```
**Solution:**
- Verify Google services JSON file is in correct location
- Check Firebase credentials in .env.local
- Ensure Firebase app is configured for your app

### Issue 5: API Calls Return 404

```
Error: Request failed with status code 404
```
**Solution:**
- Verify backend API is running
- Check `EXPO_PUBLIC_API_BASE_URL` is correct
- For Android emulator, use `http://10.0.2.2:8000` (not localhost)
- For iOS simulator, use `http://localhost:8000`

### Issue 6: Port Already in Use

```
Error: Port 19000 is already in use
```
**Solution:**
```bash
# Use different port
npm start -- --port 19001
```

---

## 🧪 Testing

### Unit Testing Setup

```bash
npm install --save-dev jest @testing-library/react-native
```

### Example Test

```typescript
// __tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should login user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });

    expect(result.current.user).toBeDefined();
  });
});
```

---

## 🚀 Building for Production

### Build for Android

```bash
# Using EAS (recommended)
eas build --platform android

# Or build locally
npm run android -- --release
```

### Build for iOS

```bash
# Using EAS (Mac only)
eas build --platform ios

# Or build locally
npm run ios -- --release
```

### Using EAS CLI

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build and submit to stores
eas build --platform android --auto-submit
eas build --platform ios --auto-submit
```

---

## 📝 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `http://10.0.2.2:8000/api` |
| `EXPO_PUBLIC_TRANSLATOR_URL` | Translator service | `http://10.0.2.2:5000` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase key | `AIza...` |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | Google OAuth (Android) | `xxx.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | Google OAuth (iOS) | `xxx.apps.googleusercontent.com` |

---

## 📚 Useful Resources

- **React Native Docs:** https://reactnative.dev/
- **Expo Docs:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **Firebase Docs:** https://firebase.google.com/docs
- **Axios Docs:** https://axios-http.com/

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Firebase configured for iOS and Android
- [ ] Google OAuth credentials added
- [ ] API endpoints tested
- [ ] All screens tested on device/emulator
- [ ] Performance optimized
- [ ] No console errors or warnings
- [ ] App icon and splash screen configured
- [ ] App name and version updated
- [ ] Privacy policy and terms added

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
