from pathlib import Path
from corsheaders.defaults import default_headers


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-secret-key'
DEBUG = True
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'basicsbox.pythonanywhere.com'
]

INSTALLED_APPS = [
    'api',
    'corsheaders',
    'rest_framework',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://basicsbox.vercel.app",
     "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:19000",
    "exp://10.1.0.95:8081",
    "exp://192.168.0.103:8081",  # Add your IP
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
]
# Add these lines to your settings.py
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Also add this
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',  # ← add this
    ],
}

ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'
TIME_ZONE = 'Asia/Kolkata'  # Set to your local timezone
USE_TZ = True  # Make sure this is True

STATIC_URL = 'static/'

# ==============================
# SUPABASE CONFIG
# ==============================

SUPABASE_URL = "https://vtxgisleuillpebynsvt.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eGdpc2xldWlsbHBlYnluc3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQyMjcxNCwiZXhwIjoyMDg2OTk4NzE0fQ.GYE_FR0U6Y-8lFVJonCAYmayjBVMlKd59h2gUdCe344"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eGdpc2xldWlsbHBlYnluc3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjI3MTQsImV4cCI6MjA4Njk5ODcxNH0.z-NRM4P_s_ZCrceKZ2hES_091OiHybTHofdmF2f2WB0"

# ==============================
# JWT SECRET
# ==============================

JWT_SECRET = "MrJyttg8CH+aWVJ2NEDPH4/LxfFvih8xHAisxrNpLUzaPxe/tUZOR+P/3PddxuXC54wPq4cmekNXjJn6afYIAA=="

# ==============================
# EMAIL (GMAIL APP PASSWORD)
# ==============================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False  # Explicitly set to False
EMAIL_HOST_USER = 'basicsbox.in@gmail.com'
EMAIL_HOST_PASSWORD = 'wuuh prfu dgsw jpou'  # Your Gmail app password
DEFAULT_FROM_EMAIL = 'basicsbox.in@gmail.com'
SERVER_EMAIL = 'basicsbox.in@gmail.com'  # For error emails


# settings.py - Add at the bottom
import firebase_admin
from firebase_admin import credentials

# Firebase Admin SDK initialization
# You need to download your service account key from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key
FIREBASE_CREDENTIALS = {
    "type": "service_account",
    "project_id": "basicsbox-38e64",
    "private_key_id": "1e2ab7f8daf198d46015abd2a318586c518263c7",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCn3OnXx0EGTVBq\nZ1EVy6ZK1ITBMS9QNn4WxOzQ87dpzJnGcq0EqJNujMSZaaZ0/c0MfB1ErHnQF6Yl\nN3QPK8ObeqeWJQqMx8Un5Rs/BKQhDx/2BpXnHnfe9gHojoRalzfO8QG4OgWRDDWM\nTjxz7DsVICQ/aw66H5zSA2ehO6OVvXIr3Z+J19Fmy5x8edQuanE3kNh+GgWqSOqU\n1NjPOXjmKvHDwXNmJzQgDBWdi3WiUU2e+bjGmQfPh7dI3Jjej9HcbdF5ct1huwJ7\nZddiSv3AN7omvydQJojBf99bFtsXzZgDkcb7rDduO4D1Fnjl+WZaFO6YiTBaoYiM\nmkMTODAlAgMBAAECggEAPJzsAWLtC2oCdhFteYnKN64Ka7onY/bxS6Z6/q5qVbUv\n97Tz3cFDT0FcQisglJEKqA3vAZun9qh7cWfXLB046hz9g51HdHM0MUYssvIpk9hi\nyZMyMLzTOvqo0MEZcJ62464p2Ux2Mxxt/4ZGlPNBmEy9Wfr9295LYZgiJNmkpY4n\nhMFH2yjlxBMVX5c5j2MUrfA5kAD4EAOZwgq6Xfi6w4g/BsB4kUzX3tB4m7Fw4uGl\nv0OqDluvMzYUYZ1/u5246KX50GjgJZLFTVsnhiq4YaN/qZZ58RxqlWzjDo2227AU\nX/pIM+NsMLb+PK41dj5w/3YNeXp7L87kUpruiBAq1wKBgQDQHmwv85yf1ibI4LQJ\ncTJL8m2wylh1Q19HhAQg6Jh524I72Rk5bwJ7TPvQapbftjYmuNyRD/cfysWp0qTG\nNoQs8T9FkH2uYBaX1CQdYi55ts/dQ9MoPtKZqiG+YWBjav0RbDt1idhaU1U0Rq2v\n2KCSILQtUJ2quUHtrMdVC48k0wKBgQDOe4n5nk3VacFSTOMy4bvMcbPh2p55u7kg\naTrnAVe2m4xgv1TdnvZdjsASnODWMt71tfxtc2FjRftBsD8cQTSnkgnJqOXF3i07\nWcpQhyYDaz/a4ljVuIO256UWxloVaWt1e2dX8yNN1NirZTzY0dmBVUV2UAdLjonl\nZ3pBCoOcJwKBgQDNY0i3pf6LS0fpdMCYlOrjQrP4Bil4SG3uYR3F8GYR1IzZTW50\nXNahIp9c1uRgkS0t18BtNMlYyb960lQk/UZCKC+eEnPGNDP30Ld3fB6LpdvL7JSm\nIiGq3tkATo9Wbg6kNCEV5Vzr/1OWDK56XRpSPA40rlt7Uer7iUkK6CZzWwKBgAem\nVApHbyLE9ECUUKaF7ms4my126AAikE0/GMuOJS3CvYSoEgDT7tSwgTUvUrUc1V3N\nDDkR2T3QTeq1GOF3GPhMVMh/1WNrQ8m7Hd+14hamVotJb3kbiOWx10/ssVGxwiVs\nGPwNKfWsOQrAiWyO+bvs6NHlTR/jfABfwQu/0/hpAoGACPlbjam7FDHL1EzrzV7l\naUCSRr8831RPqwOlgUtMYrLm1Q7Ad63WjS30UNFGi6ELNzsXj2eQurqUkHNvleni\nQGCSkXd36AXeJZhLncwBJCUZebCZ9rRRadoZ4pxYSHb/9CbIDZIhAlIVkk+y3uIw\nLTEHoEMZ8eW6xcOQtbbZ2tQ=\n-----END PRIVATE KEY-----\n".replace('\\n', '\n'),
    "client_email": "firebase-adminsdk-fbsvc@basicsbox-38e64.iam.gserviceaccount.com",
    "client_id": "105480433445862185194",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40basicsbox-38e64.iam.gserviceaccount.com"
}

try:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization error: {e}")

import os

# Path to your mobile service account JSON file
MOBILE_FIREBASE_CRED_PATH = os.path.join(BASE_DIR, 'firebase-service-account.json')

if os.path.exists(MOBILE_FIREBASE_CRED_PATH):
    try:
        mobile_cred = credentials.Certificate(MOBILE_FIREBASE_CRED_PATH)
        firebase_admin.initialize_app(mobile_cred, name='mobile')
        print("✅ Mobile Firebase initialized for push notifications")
    except Exception as e:
        print(f"❌ Mobile Firebase init error: {e}")
else:
    print(f"⚠️ Mobile Firebase config not found at: {MOBILE_FIREBASE_CRED_PATH}")