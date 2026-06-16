# E-Commerce Platform - Complete Setup & Installation Guide

Welcome to the **E-Commerce Platform**! This is a full-stack multi-service application that powers a complete food delivery & restaurant management ecosystem. This document provides an overview of all components and how to get everything running.

---

## 🏗️ Project Architecture Overview

This is a **microservices-based** platform with multiple independent services:

```
┌─────────────────────────────────────────────────────────────┐
│                   E-Commerce Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Django API     │  │ Flask Translator │                │
│  │   (Backend)      │  │    (Service)     │                │
│  │  Port: 8000      │  │  Port: 5000      │                │
│  └──────────────────┘  └──────────────────┘                │
│           ▲                      ▲                           │
│           │                      │                           │
│           └──────────┬───────────┘                          │
│                      │                                       │
│    ┌─────────────────┼─────────────────┐                   │
│    │                 │                 │                   │
│  ┌─────────┐   ┌──────────┐    ┌──────────┐               │
│  │Ecommerce│   │ Customer │    │ Merchant │               │
│  │Frontend │   │   App    │    │   App    │               │
│  │(React)  │   │  (RN)    │    │  (RN)    │               │
│  │:5173    │   │ Expo     │    │  Expo    │               │
│  └─────────┘   └──────────┘    └──────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
e:\Ecommerce/
├── backend/                    # Django REST API Backend
│   ├── api/                   # Main API app
│   ├── backend/               # Django settings
│   ├── manage.py
│   ├── db.sqlite3
│   └── README.md              # Backend setup guide
│
├── translator_service/        # Flask Translation Microservice
│   ├── app.py
│   └── README.md              # Translator setup guide
│
├── ecommerce/                 # React + Vite Web Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md              # Web frontend setup guide
│
├── customer/                  # React Native Expo Mobile App (Customers)
│   ├── app/
│   ├── components/
│   ├── package.json
│   ├── app.json
│   └── README.md              # Customer app setup guide
│
├── merchant/                  # React Native Expo Mobile App (Merchants)
│   ├── app/
│   ├── components/
│   ├── package.json
│   ├── app.json
│   └── README.md              # Merchant app setup guide
│
└── README.md                  # This file
```

---

## 🎯 Services Overview

### 1. **Backend API** (Django REST Framework)
- **Purpose:** Central API server for all applications
- **Port:** `8000`
- **Technology:** Python, Django, PostgreSQL/SQLite
- **Key Features:** Authentication, Orders, Restaurants, Payments, Analytics
- **Setup Guide:** See [backend/README.md](backend/README.md)

### 2. **Translator Service** (Flask)
- **Purpose:** Real-time multi-language translation API
- **Port:** `5000`
- **Technology:** Python, Flask, Google Translate
- **Key Features:** Batch translation, caching, multi-language support
- **Setup Guide:** See [translator_service/README.md](translator_service/README.md)

### 3. **Ecommerce Frontend** (React + Vite)
- **Purpose:** Web-based admin dashboard and customer portal
- **Port:** `5173`
- **Technology:** React 19, TypeScript, Tailwind CSS, Firebase
- **Key Features:** Responsive design, animations, real-time updates
- **Setup Guide:** See [ecommerce/README.md](ecommerce/README.md)

### 4. **Customer Mobile App** (React Native + Expo)
- **Purpose:** Customer-facing mobile application
- **Platforms:** iOS, Android, Web
- **Technology:** React Native, Expo, Firebase
- **Key Features:** Order placement, tracking, payments, reviews
- **Setup Guide:** See [customer/README.md](customer/README.md)

### 5. **Merchant Mobile App** (React Native + Expo)
- **Purpose:** Merchant/restaurant management app
- **Platforms:** Android (primarily)
- **Technology:** React Native, Expo
- **Key Features:** Order management, analytics, menu management
- **Setup Guide:** See [merchant/README.md](merchant/README.md)

---

## 🚀 Quick Start - Run Everything Locally

### Prerequisites (Install First)

```bash
# 1. Python 3.8+ (for backend & translator)
# Download from https://www.python.org/downloads/

# 2. Node.js 18+ & npm (for all frontend apps)
# Download from https://nodejs.org/

# 3. Verify installations
python --version
node --version
npm --version
```

### Step 1: Start Backend API

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install Django djangorestframework django-cors-headers requests

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
# Output: http://127.0.0.1:8000/
```

### Step 2: Start Translator Service (New Terminal)

```bash
cd translator_service

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install Flask googletrans==4.0.0

# Start server
python app.py
# Output: http://127.0.0.1:5000/
```

### Step 3: Start Ecommerce Frontend (New Terminal)

```bash
cd ecommerce

# Install dependencies
npm install

# Create .env.local file
# VITE_API_BASE_URL=http://localhost:8000/api
# VITE_TRANSLATOR_URL=http://localhost:5000

# Start dev server
npm run dev
# Output: http://localhost:5173/
```

### Step 4: Start Customer App (New Terminal)

```bash
cd customer

# Install dependencies
npm install

# Create .env.local file
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
# EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000

# Start Expo dev server
npm start

# Options:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator (Mac)
# - Press 'w' for web
# - Scan QR code with Expo Go app
```

### Step 5: Start Merchant App (New Terminal)

```bash
cd merchant

# Install dependencies
npm install

# Create .env.local file
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
# EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000

# Start Expo dev server
npm start

# Options:
# - Press 'a' for Android emulator
# - Press 'w' for web
# - Scan QR code with Expo Go app
```

---

## 🌐 Access Points

Once all services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | http://localhost:8000/api/ | API endpoints |
| **Django Admin** | http://localhost:8000/admin/ | Admin dashboard |
| **Translator** | http://localhost:5000/translate | Translation endpoint |
| **Web Frontend** | http://localhost:5173 | Main web app |
| **Customer App** | Expo Go / Emulator | Mobile app |
| **Merchant App** | Expo Go / Emulator | Mobile app |

---

## 🔧 Environment Variables Setup

### Backend (backend/.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_NAME=db.sqlite3
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:19006
```

### Translator (translator_service/.env)
```env
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
```

### Web Frontend (ecommerce/.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_TRANSLATOR_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_APP_ENV=development
```

### Customer App (customer/.env.local)
```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key
EXPO_PUBLIC_APP_ENV=development
```

### Merchant App (merchant/.env.local)
```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_TRANSLATOR_URL=http://10.0.2.2:5000
EXPO_PUBLIC_APP_ENV=development
```

---

## 🧬 Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Django | 3.2+ |
| **API Framework** | Django REST | 3.14+ |
| **Backend Language** | Python | 3.8+ |
| **Translation** | Flask | 2.3+ |
| **Translation Lib** | googletrans | 4.0.0 |
| **Frontend** | React | 19.2 |
| **Frontend Build** | Vite | 7.3 |
| **Mobile** | React Native | 0.81 |
| **Mobile Dev** | Expo | 54 |
| **Styling** | Tailwind CSS | 4.2 |
| **Auth** | Firebase | 12.x |
| **Database** | SQLite/PostgreSQL | Latest |
| **Language** | TypeScript | 5.9 |

---

## 📚 Documentation Structure

Each folder has its own comprehensive README:

1. **[backend/README.md](backend/README.md)** - Django API setup & deployment
   - Installation steps
   - Database migrations
   - API endpoints
   - Troubleshooting

2. **[translator_service/README.md](translator_service/README.md)** - Flask translator setup
   - Installation steps
   - API endpoints
   - Caching system
   - Language codes

3. **[ecommerce/README.md](ecommerce/README.md)** - React/Vite frontend setup
   - npm scripts
   - Firebase integration
   - Deployment options
   - Performance optimization

4. **[customer/README.md](customer/README.md)** - React Native customer app
   - Expo setup
   - Running on devices/emulators
   - Firebase auth
   - State management

5. **[merchant/README.md](merchant/README.md)** - React Native merchant app
   - Expo setup
   - Order management
   - Analytics
   - Image uploads

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all `SECRET_KEY` values
- [ ] Set `DEBUG=False` in production
- [ ] Configure HTTPS/SSL certificates
- [ ] Set secure CORS origins (don't use * in production)
- [ ] Use environment variables for all sensitive data
- [ ] Set up database backups
- [ ] Configure email backend for notifications
- [ ] Enable two-factor authentication (if applicable)
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting on API
- [ ] Add API key authentication for microservices

---

## 📊 Port Reference

Keep track of all ports used:

```
Port 5000  → Flask Translator Service
Port 5173  → React Vite Frontend (dev)
Port 8000  → Django Backend API
Port 8081  → Expo App (default)
Port 19000 → Expo Client Protocol
Port 19006 → Expo Web Protocol
Port 19007 → Expo Web Protocol (alternate)
```

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot connect to backend from app"
**Solution:**
- Ensure backend is running: `python manage.py runserver`
- Check CORS_ALLOWED_ORIGINS in Django settings
- For Android emulator: use `10.0.2.2` instead of `localhost`
- For iOS simulator: use `localhost`

### Issue: "Translator service not responding"
**Solution:**
- Ensure translator service is running: `python app.py`
- Check port 5000 is available: `netstat -an | grep 5000`
- Restart the service

### Issue: "npm install fails with peer dependency error"
**Solution:**
```bash
npm install --legacy-peer-deps
```

### Issue: "Expo can't find emulator"
**Solution:**
```bash
# List available emulators
emulator -list-avds

# Start emulator manually
emulator -avd EmulatorName

# Then run
npm run android
```

### Issue: "Module not found" in Python
**Solution:**
```bash
# Ensure virtual environment is activated
# Windows:
venv\Scripts\activate

# Then reinstall:
pip install -r requirements.txt
```

---

## 🚀 Deployment Guide

### Backend Deployment (PythonAnywhere)
1. Upload code to PythonAnywhere
2. Configure WSGI file
3. Set environment variables
4. Run migrations
5. Collect static files

### Frontend Deployment (Vercel)
```bash
npm run build
vercel
```

### Mobile Apps (Google Play & App Store)
```bash
eas build --platform android
eas build --platform ios
```

---

## 📞 Support Resources

- **Django:** https://docs.djangoproject.com/
- **Flask:** https://flask.palletsprojects.com/
- **React:** https://react.dev/
- **React Native:** https://reactnative.dev/
- **Expo:** https://docs.expo.dev/
- **Firebase:** https://firebase.google.com/docs
- **Tailwind:** https://tailwindcss.com/

---

## ✅ Getting Started Checklist

- [ ] Install Python 3.8+
- [ ] Install Node.js 18+
- [ ] Install Git
- [ ] Clone repository
- [ ] Create .env files in each folder
- [ ] Install dependencies (backend - pip, others - npm)
- [ ] Run database migrations
- [ ] Start all services (in separate terminals)
- [ ] Test API endpoints
- [ ] Test frontend apps
- [ ] Review troubleshooting if issues

---

## 📈 Project Statistics

- **Total Services:** 5 (1 Backend, 1 Translator, 3 Frontend)
- **Programming Languages:** Python (Backend), JavaScript/TypeScript (Frontend)
- **Mobile Platforms:** iOS, Android, Web
- **Database:** SQLite (dev), PostgreSQL (production)
- **API Type:** RESTful

---

## 🎉 You're All Set!

You now have a complete understanding of the E-Commerce Platform. Each folder has its own detailed README with step-by-step setup instructions.

**Start with:**
1. Read the main [backend/README.md](backend/README.md)
2. Then follow frontend setups as needed
3. Refer to individual READMEs for specific help

**Happy coding! 🚀**

For any issues, check the troubleshooting sections in each service's README.

---

## 📞 Quick Reference

| Service | Language | Command | Port |
|---------|----------|---------|------|
| Backend | Python | `python manage.py runserver` | 8000 |
| Translator | Python | `python app.py` | 5000 |
| Frontend | Node/npm | `npm run dev` | 5173 |
| Customer | Node/npm | `npm start` | Expo |
| Merchant | Node/npm | `npm start` | Expo |

---

**Last Updated:** 2026-06-16  
**Version:** 1.0  
**Status:** Complete Setup Guide Created ✅
