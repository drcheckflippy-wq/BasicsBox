# Ecommerce Frontend - React + Vite

Welcome to the Ecommerce Frontend! This is a modern, fast, and responsive **React + Vite** web application that serves as the admin dashboard and main ecommerce platform. Built with cutting-edge technologies, it provides a seamless user experience with TypeScript support and modern UI components.

---

## 📋 Project Overview

The Ecommerce Frontend is the web-based interface for the e-commerce platform featuring:

**Key Features:**
- Modern React 19 with TypeScript
- Lightning-fast Vite build tool
- Responsive design with Tailwind CSS
- Real-time animations with Framer Motion
- Firebase authentication
- Supabase backend integration
- Animated charts and visualizations
- Excel/CSV export functionality
- Dark mode support
- SEO optimized
- Mobile responsive

**Built For:**
- Admin dashboard
- Customer web shopping experience
- Merchant management (web version)
- Analytics and reporting

---

## 📁 Folder Structure

```
ecommerce/
├── public/                          # Static assets
│   └── [static files]
├── src/                             # Source code
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root component
│   ├── index.css                    # Global styles
│   ├── App.css                      # App styles
│   ├── supabaseClient.ts            # Supabase client setup
│   ├── assets/                      # Images, fonts, etc.
│   ├── auth/                        # Authentication logic
│   │   └── [auth components]
│   ├── components/                  # Reusable components
│   │   └── [component files]
│   ├── config/                      # Configuration files
│   │   └── firebase.ts              # Firebase config
│   ├── context/                     # React Context providers
│   │   └── [context files]
│   ├── dashboard/                   # Dashboard pages
│   │   └── [dashboard pages]
│   ├── hooks/                       # Custom React hooks
│   │   └── [hook files]
│   ├── pages/                       # Page components
│   │   └── [page files]
│   └── [other directories]
├── index.html                       # HTML entry point
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json               # TypeScript app config
├── tsconfig.node.json              # TypeScript node config
├── vite.config.ts                  # Vite configuration
├── postcss.config.js               # PostCSS config (Tailwind)
├── eslint.config.js                # ESLint configuration
├── vercel.json                     # Vercel deployment config
├── README.md                        # This file
└── .gitignore                       # Git ignore file
```

### Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| `src/` | Main source code directory |
| `src/components/` | Reusable UI components |
| `src/pages/` | Page components (routed pages) |
| `src/dashboard/` | Dashboard-specific pages |
| `src/auth/` | Authentication components |
| `src/context/` | Global state management (Context API) |
| `src/hooks/` | Custom React hooks |
| `src/config/` | Configuration for Firebase, Supabase, etc. |
| `src/assets/` | Images, fonts, icons |
| `public/` | Static files served directly |

---

## 🛠️ Prerequisites & Requirements

Before you start, make sure you have:

1. **Node.js 16+** and **npm** (or yarn/pnpm)
   - [Download Node.js](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Git** (optional, for cloning)
   - [Download Git](https://git-scm.com/)

3. **Text Editor/IDE** (VS Code recommended)
   - [Download VS Code](https://code.visualstudio.com/)

4. **Required Accounts & API Keys:**
   - Firebase project & credentials
   - Supabase project & API key
   - Backend API URL (Django backend)

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Navigate to Project Directory

```bash
cd e:\Ecommerce\ecommerce
```

### Step 2: Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

**What gets installed:**
- React 19 & React DOM
- Vite (build tool)
- TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Firebase for authentication
- Supabase client for database
- Axios for HTTP requests
- And many more...

### Step 3: Create Environment Variables

Create a `.env.local` file in the `ecommerce/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
VITE_API_BASE_URL=http://localhost:8000/api
VITE_TRANSLATOR_URL=http://localhost:5000

# Environment
VITE_APP_ENV=development
```

### Step 4: Verify Installation

```bash
# Check if everything is installed correctly
npm list

# You should see React, Vite, TypeScript, etc.
```

### Step 5: Configure Firebase (if using authentication)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a web app
4. Copy credentials and paste in `.env.local`

### Step 6: Configure Supabase (if using database)

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Get project URL and API key
4. Paste in `.env.local`

---

## ▶️ Running the Development Server

### Start Development Server

```bash
# Run the development server
npm run dev
```

**Success output:**
```
  VITE v7.3.1  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Access the Application

Open your browser and go to:
```
http://localhost:5173
```

### Development Features

- ✅ Hot Module Replacement (HMR) - Changes reflect instantly
- ✅ Fast refresh - Preserves component state during edits
- ✅ Source maps - Easy debugging
- ✅ TypeScript checking

---

## 📦 Available npm Scripts

```bash
# Development
npm run dev              # Start dev server (hot reload)

# Building
npm run build           # Build for production
npm run build:preview   # Build and preview production

# Linting & Code Quality
npm run lint            # Run ESLint to check code quality
npm run lint --fix      # Fix ESLint issues automatically

# Preview
npm run preview         # Preview production build locally
```

---

## 🏗️ Building for Production

### Create Production Build

```bash
# Build the project
npm run build

# This creates a 'dist/' folder with optimized production build
```

### Preview Production Build

```bash
# Preview the production build locally
npm run preview

# Open http://localhost:4173 in your browser
```

### Output

The `dist/` folder contains:
- Optimized JavaScript bundles
- Minified CSS
- Optimized images
- Source maps (for debugging)

---

## 🔧 Configuration Files

### `vite.config.ts`

Vite configuration - controls build behavior, dev server, plugins, etc.

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### `tsconfig.json`

TypeScript configuration - controls type checking, module resolution, etc.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true
  }
}
```

### `postcss.config.js`

PostCSS configuration for Tailwind CSS processing.

### `eslint.config.js`

ESLint configuration for code quality checks.

---

## 🎨 Key Technologies & Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI library |
| TypeScript | ~5.9 | Type safety |
| Vite | 7.3 | Build tool & dev server |
| Tailwind CSS | 4.2 | Utility-first CSS framework |
| Framer Motion | 12.34 | Animation library |
| Firebase | 12.10 | Authentication & storage |
| Supabase | 2.97 | Backend database |
| Axios | 1.13 | HTTP client |
| React Router | 7.13 | Client-side routing |
| LottieFiles | 0.18 | Animated SVG files |

---

## 📱 Project Structure Best Practices

### Component Organization

```typescript
// src/components/Button/Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onClick,
  children
}) => {
  // Component logic
};
```

### Custom Hooks

```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  // Authentication logic
  return { user, login, logout, isLoading };
};
```

### Context Setup

```typescript
// src/context/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🌐 API Integration

### Axios Setup

```typescript
// src/config/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Making API Calls

```typescript
// In a component
import api from '@/config/api';

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

## 🔐 Firebase Authentication

### Setup Firebase

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Using Authentication

```typescript
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
  }
};

const logout = async () => {
  await signOut(auth);
};
```

---

## 🎨 Tailwind CSS

### Using Tailwind Classes

```typescript
export const Card = () => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
    <p className="text-gray-600">Content</p>
  </div>
);
```

### Dark Mode

```typescript
// Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

---

## ⚡ Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

export const App = () => (
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
);
```

### Image Optimization

```typescript
// Use next-generation image format
<img 
  src="image.webp" 
  alt="description" 
  loading="lazy" 
  width="300" 
  height="200" 
/>
```

### Bundle Analysis

```bash
npm install --save-dev vite-plugin-visualizer
# Add to vite.config.ts and build to see bundle size
```

---

## 🧪 Testing

### Unit Testing Setup

```bash
# Install testing library
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

### Example Test

```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## ⚠️ Common Issues & Troubleshooting

### Issue 1: npm install fails

```
Error: npm ERR! code ERESOLVE
```
**Solution:**
```bash
npm install --legacy-peer-deps
```

### Issue 2: Port 5173 Already in Use

```
Error: listen EADDRINUSE: address already in use :::5173
```
**Solution:**
```bash
# Use different port
npm run dev -- --port 5174
```

### Issue 3: Vite not updating on file changes

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Issue 4: Environment Variables Not Loading

```bash
# Make sure .env.local file exists and has correct format
# Variables must start with VITE_ prefix
# Restart dev server after adding new variables
```

### Issue 5: Build Fails with TypeScript Errors

```bash
# Check TypeScript errors
npm run build

# Fix errors or use --nocheck if temporary
tsc --noEmit
```

### Issue 6: Firebase Not Authenticating

**Solution:**
- Verify Firebase credentials are correct
- Check Firebase project rules allow access
- Ensure OAuth domain is configured in Firebase Console
- Check browser console for specific error messages

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or connect GitHub repo at https://vercel.com
```

**Vercel Configuration** (`vercel.json` already configured):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

```bash
# Build
npm run build

# Deploy to GitHub Pages
npm install --save-dev gh-pages
npm run deploy
```

### Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 📝 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |
| `VITE_TRANSLATOR_URL` | Translator service URL | `http://localhost:5000` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_APP_ENV` | Environment (dev/prod) | `development` |

---

## 📚 Useful Resources

- **Vite Docs:** https://vitejs.dev/
- **React Docs:** https://react.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Test all API endpoints
- [ ] Test authentication flows
- [ ] Test responsive design on mobile
- [ ] Run linting: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] No console errors or warnings
- [ ] Performance optimized (bundle size checked)
- [ ] Analytics integrated (if using)
- [ ] Security headers configured

---

## 🆘 Getting Help

1. Check the troubleshooting section above
2. Review Vite documentation
3. Check React documentation
4. Search GitHub issues
5. Ask in community forums (Reddit, Discord, etc.)

---

**Happy coding! 🚀**

For questions or issues, refer to the official documentation or check the troubleshooting section above.
