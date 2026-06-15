import hashlib
import firebase_admin
from firebase_admin import auth, credentials
import jwt
from datetime import datetime, timedelta
from translate import Translator
import time
from typing import List, Dict, Any, Union
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import traceback

@csrf_exempt
def debug_firebase_token(request):
    """Quick debug endpoint for Firebase token"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            token = data.get('id_token')

            print("\n🔴=== FIREBASE DEBUG ===")
            print(f"Token received: {token[:50]}...")
            print(f"Token length: {len(token)}")

            # Try to verify
            from firebase_admin import auth
            decoded = auth.verify_id_token(token)

            return JsonResponse({
                'success': True,
                'email': decoded.get('email'),
                'uid': decoded.get('uid')
            })
        except Exception as e:
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=401)

    return JsonResponse({'error': 'POST required'}, status=405)

from django.conf import settings

SECRET_KEY = settings.JWT_SECRET
REFRESH_SECRET_KEY = "your_refresh_secret_key"

def generate_jwt_token(email, role="admin", refresh=False):
    """
    Generate JWT token (access or refresh) for any user role.
    """
    if refresh:
        payload = {
            "email": email,
            "role": role,
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, REFRESH_SECRET_KEY, algorithm="HS256")
    else:
        payload = {
            "email": email,
            "role": role,
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return token
def generate_reset_token(email, role):
    """Generate a JWT token for password reset, expires in 10 minutes"""
    payload = {
        "email": email,
        "role": role,
        "type": "reset",
        "exp": datetime.utcnow() + timedelta(minutes=10)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hash_from_db: str) -> bool:
    return hash_password(password) == hash_from_db

def verify_admin(request):
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if not auth:
        return False

    try:
        token_type, token = auth.split()
        if token_type.lower() != "bearer":
            return False

        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        # Only accept admin access tokens
        if decoded.get("role") == "admin" and decoded.get("type") == "access":
            return True
        return False
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return False
    except jwt.InvalidTokenError:
        print("Invalid token")
        return False


def verify_reset_token(token):
    """Verify the reset token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "reset":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def verify_role(request, required_role):
    token = request.headers.get("Authorization")

    if not token:
        return None

    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])

        if payload["role"] != required_role:
            return None

        return payload  # ✅ RETURN USER DATA
    except:
        return None
def is_restaurant_open(opening_time, closing_time):
    now = datetime.now().time()

    if not opening_time or not closing_time:
        return False

    # Convert string → time (Supabase returns string sometimes)
    if isinstance(opening_time, str):
        opening_time = datetime.strptime(opening_time, "%H:%M:%S").time()

    if isinstance(closing_time, str):
        closing_time = datetime.strptime(closing_time, "%H:%M:%S").time()

    # Handle overnight timing (e.g. 10 PM → 3 AM)
    if opening_time > closing_time:
        return now >= opening_time or now <= closing_time

    return opening_time <= now <= closing_time
# Initialize Firebase Admin SDK once
def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials from settings"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
    except ValueError:
        # Not initialized, initialize now
        try:
            # Get credentials from settings
            cred_dict = settings.FIREBASE_CREDENTIALS.copy()

            # Fix private key formatting - ensure it has proper newlines
            if 'private_key' in cred_dict:
                # The private key might have literal '\n' strings that need to be converted
                private_key = cred_dict['private_key']
                if isinstance(private_key, str):
                    # Replace literal '\n' with actual newlines if present
                    if '\\n' in private_key:
                        private_key = private_key.replace('\\n', '\n')
                    # Ensure the key has proper PEM formatting
                    if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
                        private_key = '-----BEGIN PRIVATE KEY-----\n' + private_key + '\n-----END PRIVATE KEY-----\n'
                    cred_dict['private_key'] = private_key

            # Create credentials object
            cred = credentials.Certificate(cred_dict)

            # Initialize Firebase
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully with credentials")
        except Exception as e:
            print(f"❌ Failed to initialize Firebase: {e}")
            # Don't re-raise, let the app continue but token verification will fail

# Call initialization
initialize_firebase()
def verify_firebase_token(id_token):
    """Verify Firebase ID token with time tolerance"""
    print("\n" + "="*50)
    print("🔍 DEBUG: Starting Firebase token verification")
    print("="*50)

    try:
        from firebase_admin import auth

        if not id_token:
            print("❌ No token provided")
            return None

        print(f"📝 Token received (first 50 chars): {id_token[:50]}...")
        print(f"📝 Token length: {len(id_token)}")

        # Check if Firebase is initialized
        try:
            firebase_admin.get_app()
            print("✅ Firebase app already initialized")
        except:
            print("❌ Firebase not initialized")
            return None

        # Verify the token with clock skew tolerance (max 60 seconds)
        print("🔄 Attempting to verify token...")

        # Use 60 seconds max tolerance
        decoded_token = auth.verify_id_token(
            id_token,
            clock_skew_seconds=60  # Max allowed is 60 seconds
        )

        print("✅ Token verified successfully!")
        print(f"📝 Decoded token contents:")
        print(f"   - UID: {decoded_token.get('uid')}")
        print(f"   - Email: {decoded_token.get('email')}")
        print(f"   - Name: {decoded_token.get('name')}")

        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name', ''),
            'picture': decoded_token.get('picture', ''),
            'email_verified': decoded_token.get('email_verified', False)
        }

    except auth.InvalidIdTokenError as e:
        print(f"❌ Invalid ID token error: {str(e)}")
        if "Token used too early" in str(e):
            print("⚠️ Clock synchronization issue detected!")
            print(f"🕐 Server time needs to be synced (off by ~8 seconds)")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return None
def generate_tokens(email, role):
    """Generate JWT tokens for authenticated user"""
    access_payload = {
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=60)
    }
    refresh_payload = {
        "email": email,
        "role": role,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    access_token = jwt.encode(access_payload, settings.JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm="HS256")
    return access_token, refresh_token
import requests
from typing import List

class SimpleTranslator:
    BASE_URL = "https://translator.pythonanywhere.com/translate"

    def translate(self, text: str, to_lang: str = "ta") -> str:
        if not text:
            return text

        try:
            response = requests.post(
                self.BASE_URL,
                json={
                    "texts": [text],   # ✅ LIST
                    "target": to_lang
                },
                timeout=3
            )
            response.raise_for_status()

            return response.json()["translated"][0]  # ✅ FIRST ITEM

        except Exception as e:
            print("Translation error:", e)
            return text

    def translate_batch(
        self,
        texts: List[str],
        to_lang: str = "ta"
    ) -> List[str]:
        if not texts:
            return texts

        try:
            response = requests.post(
                self.BASE_URL,
                json={
                    "texts": texts,   # ✅ LIST
                    "target": to_lang
                },
                timeout=5
            )
            response.raise_for_status()

            return response.json()["translated"]

        except Exception as e:
            print("Batch translation error:", e)
            return texts


translator = SimpleTranslator()