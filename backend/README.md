# Backend API - Django REST Framework

Welcome to the Backend API for the E-Commerce Platform! This is a **Django REST Framework (DRF)** based API that powers the entire e-commerce ecosystem, handling user authentication, order management, restaurant listings, payment processing, and more.

---

## 📋 Project Overview

This backend serves as the central hub for three applications:
- **Customer Mobile App** (React Native)
- **Merchant Dashboard** (React Native)
- **Admin/Ecommerce Frontend** (React/Vite)

**Key Features:**
- User Authentication (Customers, Merchants, Admins)
- Google OAuth Integration
- Restaurant & Menu Management
- Order Management System
- Payment Processing (Cashfree Integration)
- Review & Rating System
- Analytics & Reporting
- CSV Export Functionality
- Push Notifications Support

---

## 📁 Folder Structure

```
backend/
├── manage.py                    # Django management script
├── db.sqlite3                   # SQLite database (development)
├── backend/                     # Main Django project settings
│   ├── __init__.py
│   ├── settings.py             # Configuration (databases, apps, middleware)
│   ├── urls.py                 # Main URL routing
│   ├── asgi.py                 # ASGI configuration for async
│   └── wsgi.py                 # WSGI configuration for deployment
├── api/                         # Main API application
│   ├── models.py               # Database models (User, Order, Restaurant, etc.)
│   ├── views.py                # API endpoints/views
│   ├── urls.py                 # API URL patterns
│   ├── serializers.py          # DRF Serializers (if exists)
│   ├── admin.py                # Django admin configuration
│   ├── apps.py                 # App configuration
│   ├── utils.py                # Utility functions
│   ├── supabase_client.py      # Supabase integration
│   ├── tests.py                # Unit tests
│   └── migrations/             # Database migrations
│       └── __init__.py
└── db.sqlite3                   # SQLite database file
```

---

## 🛠️ Prerequisites & Requirements

Before you start, make sure you have:

1. **Python 3.8+** installed ([Download Python](https://www.python.org/downloads/))
   - Verify: `python --version`
   
2. **pip** (Python package manager - comes with Python)
   - Verify: `pip --version`

3. **Git** installed ([Download Git](https://git-scm.com/))
   - Verify: `git --version`

4. **Text Editor/IDE** (VS Code, PyCharm, etc.)

5. **Required API Keys/Credentials:**
   - Cashfree payment gateway credentials (Account ID, Secret Key)
   - Firebase credentials (optional, for some features)
   - Supabase project URL and API key (if using Supabase)
   - Google OAuth credentials

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Clone the Repository

```bash
cd e:\Ecommerce
git clone <repository-url>
cd backend
```

### Step 2: Create a Virtual Environment

A virtual environment isolates project dependencies from your system Python installation.

```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

**Activate the virtual environment:**

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

### Step 3: Install Python Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install all required packages
pip install Django
pip install djangorestframework
pip install django-cors-headers
pip install requests
pip install Pillow
pip install python-dotenv
pip install gunicorn
pip install dj-database-url
pip install psycopg2-binary
pip install firebase-admin
pip install supabase
pip install googletrans==4.0.0
pip install cashfree-pg
```

**Or use a requirements.txt file (if available):**
```bash
pip install -r requirements.txt
```

### Step 4: Create Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,basicsbox.pythonanywhere.com

# Database
DATABASE_NAME=db.sqlite3

# Cashfree Payment Gateway
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key

# Firebase
FIREBASE_CREDENTIALS=path/to/firebase-credentials.json

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:19006,http://localhost:19000,exp://10.1.0.95:8081
```

### Step 5: Apply Database Migrations

Migrations create database tables based on your models:

```bash
# Show pending migrations
python manage.py showmigrations

# Apply all migrations
python manage.py migrate

# Create a new migration if you modified models
python manage.py makemigrations

# Apply new migrations
python manage.py migrate
```

### Step 6: Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account:
- Username: `admin`
- Email: `admin@example.com`
- Password: (enter a secure password)

### Step 7: Verify Settings

Open `backend/settings.py` and verify:

```python
# INSTALLED_APPS should include
INSTALLED_APPS = [
    'api',
    'corsheaders',
    'rest_framework',
    'django.contrib.auth',
    # ... other apps
]

# CORS_ALLOWED_ORIGINS should match your frontend URLs
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Ecommerce frontend
    "http://localhost:19006",     # Expo web
    "http://localhost:19000",     # Expo client
    "exp://10.1.0.95:8081",       # Customer app
    "exp://192.168.0.103:8081",   # Merchant app
]
```

---

## ▶️ Running the Development Server

### Start the Django Server

```bash
python manage.py runserver
```

**Success output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### Access the Application

- **API Base URL:** `http://localhost:8000/api/`
- **Django Admin:** `http://localhost:8000/admin/` (login with superuser credentials)

### Test the API

```bash
# Test a simple endpoint using curl
curl http://localhost:8000/api/restaurants/

# Or use Postman/Insomnia for testing
```

---

## 📡 Main API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/customer/` | Register a customer |
| POST | `/api/auth/login/customer/` | Customer login |
| POST | `/api/auth/register/merchant/` | Register a merchant |
| POST | `/api/auth/login/merchant/` | Merchant login |
| POST | `/api/auth/google/customer/` | Google OAuth for customers |
| POST | `/api/auth/google/merchant/` | Google OAuth for merchants |

### Restaurant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants/` | Get all restaurants |
| POST | `/api/restaurants/add/` | Add new restaurant (merchant) |
| GET | `/api/restaurants/{id}/menu/` | Get restaurant menu |
| POST | `/api/menu/add/` | Add menu item |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/create/` | Create order |
| GET | `/api/orders/customer/` | Get customer orders |
| GET | `/api/orders/merchant/` | Get merchant orders |
| PUT | `/api/orders/{id}/status/` | Update order status |
| POST | `/api/orders/{id}/cancel/` | Cancel order |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/cashfree/create/` | Create Cashfree payment |
| POST | `/api/payment/verify/` | Verify payment |
| POST | `/api/payment/webhook/` | Payment webhook |

### Review Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/add/` | Add review |
| GET | `/api/reviews/{restaurant_id}/` | Get restaurant reviews |

---

## 🔧 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `DEBUG` | Enable/disable debug mode | `True` (dev), `False` (production) |
| `SECRET_KEY` | Django secret key for security | Random string, keep it secret! |
| `ALLOWED_HOSTS` | Allowed domains to access the API | `localhost,127.0.0.1` |
| `CASHFREE_APP_ID` | Cashfree payment app ID | From Cashfree dashboard |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs allowed to access API | Your frontend/mobile app URLs |

---

## 📦 Key Python Packages Explained

| Package | Purpose |
|---------|---------|
| `Django` | Web framework |
| `djangorestframework` | REST API framework |
| `django-cors-headers` | Enable CORS for cross-origin requests |
| `requests` | HTTP library |
| `Pillow` | Image processing |
| `firebase-admin` | Firebase integration |
| `supabase` | Supabase database client |
| `dj-database-url` | Parse database URLs |
| `gunicorn` | Production WSGI server |

---

## ⚠️ Common Issues & Troubleshooting

### Issue 1: ModuleNotFoundError
```
Error: ModuleNotFoundError: No module named 'django'
```
**Solution:** 
- Ensure virtual environment is activated
- Reinstall: `pip install django djangorestframework django-cors-headers`

### Issue 2: Database Migration Error
```
Error: django.db.migrations.exceptions.MigrationSConflictError
```
**Solution:**
```bash
python manage.py showmigrations --plan
python manage.py migrate --fake <app_name> <migration_name>
```

### Issue 3: Port 8000 Already in Use
```
Error: OSError: [Errno 10048] Only one usage of each socket address
```
**Solution:**
```bash
python manage.py runserver 8001  # Use different port
```

### Issue 4: CORS Error in Frontend
```
Error: Cross-Origin Request Blocked
```
**Solution:**
- Add your frontend URL to `CORS_ALLOWED_ORIGINS` in settings.py
- Ensure `corsheaders` is in `INSTALLED_APPS`
- Check middleware order: CorsMiddleware should be first

### Issue 5: Superuser Creation Failed
```bash
# Reset and recreate
python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.all().delete()
# Exit shell and recreate
python manage.py createsuperuser
```

---

## 🧪 Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test api

# Run specific test class
python manage.py test api.tests.TestClass

# Run with verbose output
python manage.py test -v 2
```

---

## 📱 Integration with Frontend Apps

### For Customer App (React Native):
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
const response = await axios.post(`${API_BASE_URL}/auth/login/customer/`, {
  email: 'customer@example.com',
  password: 'password'
});
```

### For Merchant App (React Native):
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
const response = await axios.get(`${API_BASE_URL}/orders/merchant/`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### For Ecommerce Frontend (React/Vite):
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
// Use in API service files
```

---

## 🚀 Deployment

### Deploy to PythonAnywhere

1. Create account at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload code via Git or web interface
3. Configure WSGI file
4. Set environment variables
5. Enable HTTPS

### Deploy to Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Push code
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Create superuser
heroku run python manage.py createsuperuser
```

---

## 📚 Useful Django Commands

```bash
# Create new app
python manage.py startapp app_name

# Show all URLs
python manage.py show_urls

# Database shell
python manage.py dbshell

# Python interactive shell
python manage.py shell

# Collect static files (production)
python manage.py collectstatic

# Create migrations
python manage.py makemigrations

# Show migration status
python manage.py showmigrations
```

---

## 📞 Support & Documentation

- **Django Docs:** https://docs.djangoproject.com/
- **DRF Docs:** https://www.django-rest-framework.org/
- **Cashfree Docs:** https://docs.cashfree.com/
- **Firebase Docs:** https://firebase.google.com/docs

---

## ✅ Checklist Before Going Live

- [ ] Set `DEBUG=False` in production
- [ ] Change `SECRET_KEY` to a secure value
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up HTTPS/SSL
- [ ] Configure email backend for password reset
- [ ] Test all payment endpoints
- [ ] Test Google OAuth integration
- [ ] Enable CORS only for production domains
- [ ] Set up logging and monitoring
- [ ] Backup database regularly

---

**Happy Coding! 🎉**

For questions or issues, check the troubleshooting section above or consult the official Django documentation.
