import json
import math
import uuid
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from django.views.decorators.csrf import csrf_exempt
from .supabase_client import supabase
from django.utils.translation import gettext as _
from django.utils import translation
from .utils import generate_reset_token, hash_password, is_restaurant_open, verify_password, verify_admin, verify_reset_token, verify_role, translator
from .utils import verify_firebase_token, generate_tokens
import requests
import pytz
from datetime import datetime, timedelta, time as dt_time
from django.utils import timezone

# ====================================
# 🔹 HELPER: GENERATE ACCESS & REFRESH TOKENS
# ====================================
def generate_tokens(email, role):
    """Generate access and refresh JWT tokens"""
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

# ====================================
# 🔐 ADMIN REGISTER
# ====================================
@api_view(["POST"])
def admin_register(request):
    data = request.data
    hashed_password = hash_password(data["password"])

    response = supabase.table("admins").insert({
        "email": data["email"],
        "password_hash": hashed_password
    }).execute()

    return Response({"message": "Admin registered successfully", "data": response.data})

# ====================================
# 🔐 ADMIN LOGIN
# ====================================
@api_view(["POST"])
def admin_login(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")

    resp = supabase.table("admins").select("*").eq("email", email).execute()
    if not resp.data:
        return Response({"error": "Admin not found"}, status=404)

    admin = resp.data[0]
    if not verify_password(password, admin["password_hash"]):
        return Response({"error": "Invalid credentials"}, status=400)

    access_token, refresh_token = generate_tokens(email, "admin")

    return Response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "admin",
        "email": admin["email"]
    })
@api_view(["POST"])
def customer_register(request):
    """Register customer directly - NO pending approval required"""
    data = request.data
    hashed_password = hash_password(data["password"])

    # Check if email already exists
    existing = supabase.table("users").select("*").eq("email", data["email"]).eq("role", "customer").execute()
    if existing.data:
        return Response({"error": "Email already registered"}, status=400)

    # Insert directly into users table (approved immediately)
    user_data = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "password_hash": hashed_password,
        "role": "customer",
        "auth_provider": "email"
    }

    supabase.table("users").insert(user_data).execute()

    # Generate tokens and login immediately
    access_token, refresh_token = generate_tokens(data["email"], "customer")

    # Send welcome email
    try:
        send_mail(
            subject="Welcome to Basics Box!",
            message=f"""
Dear {data["name"]},

Welcome to Basics Box! 🎉

Your customer account has been successfully created.

You can now start ordering your favorite food from our platform.

Happy ordering!

Best regards,
Basics Box Team
""",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[data["email"]],
            fail_silently=True
        )
    except Exception as e:
        print(f"Welcome email failed: {e}")

    return Response({
        "message": "Registration successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "customer",
        "email": data["email"],
        "name": data["name"]
    })

# ====================================
# 🏪 MERCHANT REGISTER
# ====================================
@api_view(["POST"])
def merchant_register(request):
    data = request.data
    document = request.FILES.get("document")
    cover_image = request.FILES.get("cover_image")  # ✅ NEW
    hashed_password = hash_password(data["password"])

    latitude = data.get("latitude")   # ✅ NEW
    longitude = data.get("longitude") # ✅ NEW

    document_url = None
    cover_image_url = None

    # ==============================
    # 📄 Upload Document
    # ==============================
    if document:
        unique_filename = f"{uuid.uuid4()}_{document.name}"
        supabase.storage.from_("merchant-documents").upload(
            path=unique_filename,
            file=document.read(),
            file_options={"content-type": document.content_type or "application/pdf"}
        )
        document_url = supabase.storage.from_("merchant-documents").get_public_url(unique_filename)

    # ==============================
    # 🖼 Upload Cover Image
    # ==============================
    if cover_image:
        unique_filename = f"{uuid.uuid4()}_{cover_image.name}"
        supabase.storage.from_("cover-images").upload(
            path=unique_filename,
            file=cover_image.read(),
            file_options={"content-type": cover_image.content_type or "image/jpeg"}
        )
        cover_image_url = supabase.storage.from_("cover-images").get_public_url(unique_filename)

    # ==============================
    # 📍 Google Maps URL
    # ==============================
    google_maps_url = None
    if latitude and longitude:
        google_maps_url = f"https://www.google.com/maps?q={latitude},{longitude}"

    # ==============================
    # 🗄 Insert into pending
    # ==============================
    supabase.table("pending_merchants").insert({
        "name": data["name"],
        "restaurant_name": data["restaurant_name"],
        "email": data["email"],
        "business_number": data["business_number"],
        "password_hash": hashed_password,
        "document_url": document_url,
        "cover_image_url": cover_image_url,   # ✅ NEW
        "latitude": latitude,                 # ✅ NEW
        "longitude": longitude,               # ✅ NEW
        "google_maps_url": google_maps_url    # ✅ NEW
    }).execute()

    # ==============================
    # 📧 Notify Admin
    # ==============================
    send_mail(
        subject="New Merchant Registration Approval Needed",
        message=f"""
A new merchant has registered and is awaiting approval.

Name: {data["name"]}
Restaurant: {data["restaurant_name"]}
Email: {data["email"]}
Business Number: {data["business_number"]}

📄 Document: {document_url}
🖼 Cover Image: {cover_image_url}
📍 Location: {google_maps_url}

Please review in admin panel.
""",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=["basicsbox.in@gmail.com"],
        fail_silently=False
    )

    return Response({"message": "Merchant registration sent for admin approval"})

@api_view(["GET"])
def get_pending_customers(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    resp = supabase.table("pending_customers").select("*").execute()

    customers = []
    for c in resp.data:
        customers.append({
            "id": c.get("id"),
            "name": c.get("name"),
            "email": c.get("email"),
            "phone": c.get("phone"),
            "created_at": c.get("created_at")
        })

    return Response(customers)

@api_view(["GET"])
def get_pending_merchants(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    resp = supabase.table("pending_merchants").select("*").execute()

    merchants = []
    for m in resp.data:
        merchants.append({
    "id": m.get("id"),
    "name": m.get("name"),
    "restaurant_name": m.get("restaurant_name"),
    "email": m.get("email"),
    "business_number": m.get("business_number"),
    "document_url": m.get("document_url"),
    "cover_image_url": m.get("cover_image_url"),  # ✅ NEW
    "latitude": m.get("latitude"),                # ✅ NEW
    "longitude": m.get("longitude"),              # ✅ NEW
    "google_maps_url": m.get("google_maps_url"),  # ✅ NEW
    "created_at": m.get("created_at")
})

    return Response(merchants)
# ====================================
# ✅ APPROVE CUSTOMER
# ====================================
# Update approve_customer function to handle Firebase users
@api_view(["POST"])
def approve_customer(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    email = request.data["email"]

    pending = supabase.table("pending_customers").select("*").eq("email", email).execute()
    if not pending.data:
        return Response({"error": "User not found"}, status=404)

    user = pending.data[0]

    # ✅ Move to users table with all fields including Firebase data
    user_data = {
        "role": "customer",
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "password_hash": user.get("password_hash"),  # Will be None for Google users
        "firebase_uid": user.get("firebase_uid"),
        "auth_provider": user.get("auth_provider", "email")
    }

    # Remove None values
    user_data = {k: v for k, v in user_data.items() if v is not None}

    supabase.table("users").insert(user_data).execute()

    # ✅ Remove from pending
    supabase.table("pending_customers").delete().eq("email", email).execute()

    # Send approval email
    login_url = "https://basicsbox.vercel.app/customer"
    message = f"""
Dear {user["name"]},

Congratulations! 🎉

Your customer account has been successfully approved by our admin team.

You can now log in and start using our platform.

🔗 Login here:
{login_url}

If you have any issues logging in, please feel free to contact support.

Welcome aboard!

Best regards,
Admin Team
"""

    send_mail(
        subject="Your Account Has Been Approved",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )

    return Response({"message": "Customer approved and email sent"})

# ====================================
# ❌ REJECT CUSTOMER
# ====================================
@api_view(["POST"])
def reject_customer(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    email = request.data.get("email")
    reason = request.data.get("reason")  # 👈 NEW FIELD

    if not reason:
        return Response({"error": "Rejection reason is required"}, status=400)

    supabase.table("pending_customers").delete().eq("email", email).execute()

    # ✉️ Professional Email Format
    message = f"""
Dear User,

Thank you for registering with our platform.

We regret to inform you that your account registration has been **rejected** after review by our admin team.

🔍 Reason for Rejection:
{reason}

If you believe this was a mistake or would like to reapply, please ensure that all details are correct and complete.

You may register again at any time.

Best regards,
Admin Team
"""

    send_mail(
        subject="Account Registration Rejected",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )

    return Response({"message": "Customer rejected with reason"})

# ====================================
# ✅ APPROVE MERCHANT
# ====================================
@api_view(["POST"])
def approve_merchant(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    email = request.data["email"]

    pending = supabase.table("pending_merchants").select("*").eq("email", email).execute()
    if not pending.data:
        return Response({"error": "Merchant not found"}, status=404)

    merchant = pending.data[0]

    # ✅ Move to users table with all fields
    user_data = {
        "role": "merchant",
        "name": merchant["name"],
        "restaurant_name": merchant["restaurant_name"],
        "email": merchant["email"],
        "business_number": merchant.get("business_number", ""),
        "password_hash": merchant.get("password_hash"),
        "document_url": merchant.get("document_url"),
        "cover_image_url": merchant.get("cover_image_url"),
        "latitude": merchant.get("latitude"),
        "longitude": merchant.get("longitude"),
        "google_maps_url": merchant.get("google_maps_url"),
        "firebase_uid": merchant.get("firebase_uid"),
        "auth_provider": merchant.get("auth_provider", "email")
    }

    # Remove None values
    user_data = {k: v for k, v in user_data.items() if v is not None}

    supabase.table("users").insert(user_data).execute()

    # ✅ Remove from pending
    supabase.table("pending_merchants").delete().eq("email", email).execute()

    # Send approval email
    login_url = "https://basicsbox.vercel.app/merchant"
    message = f"""
Dear {merchant["name"]},

Congratulations! 🎉

Your merchant account for "{merchant["restaurant_name"]}" has been successfully approved by our admin team.

You can now log in and start managing your business on our platform.

🔗 Login here:
{login_url}

If you need any assistance, feel free to contact support.

Welcome aboard!

Best regards,
Admin Team
"""

    send_mail(
        subject="Merchant Account Approved",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )

    return Response({"message": "Merchant approved and email sent"})

# ====================================
# ❌ REJECT MERCHANT
# ====================================
@api_view(["POST"])
def reject_merchant(request):
    if not verify_admin(request):
        return Response({"error": "Unauthorized"}, status=401)

    email = request.data.get("email")
    reason = request.data.get("reason")  # ✅ NEW

    if not reason:
        return Response({"error": "Rejection reason is required"}, status=400)

    supabase.table("pending_merchants").delete().eq("email", email).execute()

    # ✉️ Professional Email
    message = f"""
Dear Merchant,

Thank you for registering your business with our platform.

After careful review, we regret to inform you that your merchant account application has been **rejected**.

🔍 Reason for Rejection:
{reason}

We encourage you to correct the above issue(s) and reapply.

If you believe this decision was made in error, please contact our support team.

Best regards,
Admin Team
"""

    send_mail(
        subject="Merchant Application Rejected",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )

    return Response({"message": "Merchant rejected with reason"})

# ====================================
# 👤 CUSTOMER LOGIN
# ====================================
@api_view(["POST"])
def customer_login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    resp = supabase.table("users").select("*").eq("email", email).eq("role", "customer").execute()
    if not resp.data:
        return Response({"error": "Invalid credentials"}, status=400)

    user = resp.data[0]
    if not verify_password(password, user["password_hash"]):
        return Response({"error": "Invalid credentials"}, status=400)

    access_token, refresh_token = generate_tokens(email, "customer")

    return Response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "customer",
        "email": user["email"]
    })

# ====================================
# 🏪 MERCHANT LOGIN
# ====================================
@api_view(["POST"])
def merchant_login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    resp = supabase.table("users").select("*").eq("email", email).eq("role", "merchant").execute()
    if not resp.data:
        return Response({"error": "Invalid credentials"}, status=400)

    user = resp.data[0]
    if not verify_password(password, user["password_hash"]):
        return Response({"error": "Invalid credentials"}, status=400)

    access_token, refresh_token = generate_tokens(email, "merchant")

    return Response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "merchant",
        "email": user["email"]
    })

# ====================================
# 🔑 FORGOT PASSWORD (send email)
# ====================================
@api_view(["POST"])
def forgot_password(request):
    email = request.data.get("email")
    role = request.data.get("role")  # "admin", "customer", "merchant"

    if role == "admin":
        resp = supabase.table("admins").select("*").eq("email", email).execute()
    else:
        resp = supabase.table("users").select("*").eq("email", email).eq("role", role).execute()

    if not resp.data:
        return Response({"error": "User not found"}, status=404)

    token = generate_reset_token(email, role)
    reset_link = f"https://basicsbox.vercel.app/reset-password/?token={token}"

    # Send email
    send_mail(
        subject="Reset Your Password",
        message=f"Click the following link to reset your password. This link will expire in 10 minutes:\n\n{reset_link}",
        from_email="yourgmail@gmail.com",
        recipient_list=[email],
        fail_silently=False
    )

    return Response({"message": "Password reset link sent to your email"})

# ====================================
# 🔑 RESET PASSWORD (update password)
# ====================================
@api_view(["POST"])
def reset_password(request):
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    payload = verify_reset_token(token)
    if not payload:
        return Response({"error": "Invalid or expired token"}, status=400)

    email = payload["email"]
    role = payload["role"]
    hashed_password = hash_password(new_password)

    if role == "admin":
        supabase.table("admins").update({"password_hash": hashed_password}).eq("email", email).execute()
    else:
        supabase.table("users").update({"password_hash": hashed_password}).eq("email", email).eq("role", role).execute()

    return Response({"message": "Password has been reset successfully"})

# ====================================
# 📍 DISTANCE CALCULATION (HAVERSINE)
# ====================================
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))

    a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


# ====================================
# ✅ 1. ADD RESTAURANT (MERCHANT)
# ====================================
@api_view(["POST"])
def add_restaurant(request):
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]

    merchant_resp = supabase.table("users") \
        .select("*") \
        .eq("email", email) \
        .eq("role", "merchant") \
        .execute()

    if not merchant_resp.data:
        return Response({"error": "Merchant not found"}, status=404)

    merchant = merchant_resp.data[0]
    data = request.data

    restaurant_name = merchant["restaurant_name"]
    cover_image = merchant.get("cover_image_url")
    latitude = merchant.get("latitude")
    longitude = merchant.get("longitude")

    cuisine = data.get("cuisine")
    tags = data.get("tags", [])

    opening_time = data.get("opening_time")
    closing_time = data.get("closing_time")
    days_open = data.get("days_open")
    valid_days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

    if days_open:
        input_days = [d.strip() for d in days_open.split(",")]
        for d in input_days:
            if d not in valid_days:
                return Response({"error": f"Invalid day: {d}"}, status=400)

    # Validate time
    try:
        opening_time_obj = datetime.strptime(opening_time, "%H:%M").time()
        closing_time_obj = datetime.strptime(closing_time, "%H:%M").time()
    except:
        return Response({"error": "Time must be in HH:MM format"}, status=400)

    # AUTO is_open calculation
    now = datetime.now().time()
    is_open = opening_time_obj <= now <= closing_time_obj

    existing = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if existing.data:
        return Response({"error": "Restaurant already exists"}, status=400)

    supabase.table("restaurants").insert({
        "name": restaurant_name,
        "cuisine": cuisine,
        "image": cover_image,
        "latitude": latitude,
        "longitude": longitude,
        "tags": tags,
        "is_open": is_open,
        "rating": 0,
        "reviews_count": 0,
        "rating_sum": 0,
        "merchant_email": email,
        "opening_time": opening_time,
        "closing_time": closing_time,
        "days_open": days_open
    }).execute()

    return Response({"message": "Restaurant added successfully"})

@api_view(["GET"])
def get_restaurants(request):
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    try:
        user_lat = float(request.GET.get("lat"))
        user_lng = float(request.GET.get("lng"))
    except:
        error_msg = "Invalid location"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=400)

    MAX_DISTANCE_KM = 5.0
    restaurants_resp = supabase.table("restaurants").select("*").execute()

    if not restaurants_resp.data:
        return Response({"message": "No restaurants found"}, status=200)

    result = []

    for restaurant in restaurants_resp.data:
        distance = calculate_distance(user_lat, user_lng, restaurant["latitude"], restaurant["longitude"])

        if distance > MAX_DISTANCE_KM:
            continue

        # ✅ Get final status (auto + manual override)
        is_open, is_overridden = get_final_open_status(restaurant)

        clean_expired_offers()

        menu = supabase.table("menu_items") \
            .select("*") \
            .eq("restaurant_id", restaurant["id"]) \
            .execute()

        reviews = supabase.table("reviews") \
            .select("user_email, rating, comment, created_at") \
            .eq("restaurant_id", restaurant["id"]) \
            .order("created_at", desc=True) \
            .execute()

        min_time = int(distance * 5)
        max_time = int(distance * 10)
        delivery_time = f"{min_time}-{max_time} min"
        km_text = "km" if language != 'ta' else translator.translate("km")
        distance_formatted = f"{round(distance, 1)} {km_text}"

        # If language is Tamil, translate fields
        if language == 'ta':
            print(f"\n  - Translating to Tamil for restaurant {restaurant['id']}...")

            # Translate restaurant fields
            try:
                translated_name = translator.translate(restaurant["name"])
                print(f"    - Name: '{restaurant['name']}' -> '{translated_name}'")
            except:
                translated_name = restaurant["name"]

            try:
                translated_cuisine = translator.translate(restaurant["cuisine"])
                print(f"    - Cuisine: '{restaurant['cuisine']}' -> '{translated_cuisine}'")
            except:
                translated_cuisine = restaurant["cuisine"]

            # Translate tags
            translated_tags = []
            for tag in restaurant["tags"]:
                try:
                    translated_tags.append(translator.translate(tag))
                except:
                    translated_tags.append(tag)

            # Translate days
            translated_days = restaurant.get("days_open")
            if translated_days:
                try:
                    days_list = [d.strip() for d in translated_days.split(",")]
                    translated_days_list = []
                    for day in days_list:
                        translated_days_list.append(translator.translate(day))
                    translated_days = ",".join(translated_days_list)
                except:
                    pass

            translated_restaurant = {
                "id": restaurant["id"],
                "name": translated_name,
                "cuisine": translated_cuisine,
                "image": restaurant["image"],
                "latitude": restaurant["latitude"],
                "longitude": restaurant["longitude"],
                "tags": translated_tags,
                "rating": restaurant["rating"],
                "reviews_count": restaurant["reviews_count"],
                "opening_time": restaurant.get("opening_time"),
                "closing_time": restaurant.get("closing_time"),
                "days_open": translated_days,
                "is_open": is_open
            }

            # Translate menu items
            translated_menu = []
            for item in menu.data:
                try:
                    translated_item = {
                        "id": item.get("id"),
                        "name": translator.translate(item.get("name", "")),
                        "price": item.get("price"),
                        "description": translator.translate(item.get("description", "")),
                        "image": item.get("image"),
                        "is_veg": item.get("is_veg"),
                        "category": translator.translate(item.get("category", "Uncategorized"))
                    }

                    # Add offer details if active
                    if item.get("has_offer"):
                        translated_item.update({
                            "has_offer": True,
                            "offer_percentage": item.get("offer_percentage"),
                            "offer_price": item.get("offer_price"),
                            "offer_expiry": item.get("offer_expiry")
                        })

                    translated_menu.append(translated_item)
                except:
                    translated_menu.append(dict(item))

            # Translate reviews
            translated_reviews = []
            for review in reviews.data:
                try:
                    translated_reviews.append({
                        "user_email": review.get("user_email"),
                        "rating": review.get("rating"),
                        "comment": translator.translate(review.get("comment", "")),
                        "created_at": review.get("created_at")
                    })
                except:
                    translated_reviews.append(dict(review))

            result.append({
                "restaurant": translated_restaurant,
                "menu": translated_menu,
                "reviews": translated_reviews,
                "distance": distance_formatted,      # Added distance field
                "deliveryTime": delivery_time,       # Added delivery time field
                "deliveryFee": 0                     # Added delivery fee field (always 0)
            })

        else:
            # Return English data with added distance and delivery info
            processed_menu = []
            for item in menu.data:
                menu_item = dict(item)
                processed_menu.append(menu_item)

            result.append({
                "restaurant": {
                    "id": restaurant["id"],
                    "name": restaurant["name"],
                    "cuisine": restaurant["cuisine"],
                    "image": restaurant["image"],
                    "latitude": restaurant["latitude"],
                    "longitude": restaurant["longitude"],
                    "tags": restaurant["tags"],
                    "rating": restaurant["rating"],
                    "reviews_count": restaurant["reviews_count"],
                    "opening_time": restaurant.get("opening_time"),
                    "closing_time": restaurant.get("closing_time"),
                    "days_open": restaurant.get("days_open"),
                    "is_open": is_open
                },
                "menu": processed_menu,
                "reviews": reviews.data,
                "distance": distance_formatted,
                "deliveryTime": delivery_time,
                "deliveryFee": 0
            })

    # Sort by distance (nearest first)
    result.sort(key=lambda x: float(x["distance"].split()[0]))

    print(f"🔍 DEBUG - Found {len(result)} restaurants within {MAX_DISTANCE_KM}km radius with free delivery")
    return Response(result)

# ====================================
# 🍽️ 3. GET ALL FOOD ITEM NAMES & IMAGES (NO AUTH)
# ====================================
@api_view(["GET"])
def get_all_food_item_names(request):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    # 🔍 DEBUG: Print the language header
    print("\n" + "="*50)
    print(f"🔍 DEBUG - Food Item Names - Language Header: '{language}'")
    print("="*50)

    try:
        # Fetch names and images from menu_items table
        resp = supabase.table("menu_items").select("id, name, image").execute()

        if not resp.data:
            return Response({"message": "No food items found"}, status=200)

        result = []

        for item in resp.data:
            # If language is Tamil, translate name
            if language == 'ta':
                translated_name = translator.translate(item["name"])
                result.append({
                    "id": item["id"],
                    "name": translated_name,
                    "image": item["image"]  # Keep original image URL
                })
            else:
                # Return English name
                result.append({
                    "id": item["id"],
                    "name": item["name"],
                    "image": item["image"]
                })

        print(f"🔍 DEBUG - Returning {len(result)} food items with language: {language}")
        return Response(result)

    except Exception as e:
        print(f"❌ ERROR in get_all_food_item_names: {str(e)}")
        error_msg = "Failed to fetch food items"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=500)

# ====================================
# ⭐ 3. ADD REVIEW
# ====================================
@api_view(["POST"])
def add_review(request):
    data = request.data

    restaurant_id = data["restaurant_id"]
    user = verify_role(request, "customer")
    if not user:
     return Response({"error": "Unauthorized"}, status=401)
    user_email = user["email"]

    try:
        rating = int(data["rating"])
    except:
        return Response({"error": "Invalid rating"}, status=400)

    comment = data.get("comment")

    # ❗ Check duplicate review
    existing = supabase.table("reviews") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .eq("user_email", user_email) \
        .execute()

    if existing.data:
        return Response({"error": "Already reviewed"}, status=400)

    # ✅ Insert review
    supabase.table("reviews").insert({
        "restaurant_id": restaurant_id,
        "user_email": user_email,
        "rating": rating,
        "comment": comment
    }).execute()

    # ✅ Get restaurant
    res = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()

    if not res.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant = res.data[0]

    new_sum = restaurant["rating_sum"] + rating
    new_count = restaurant["reviews_count"] + 1
    new_rating = round(new_sum / new_count, 1)

    supabase.table("restaurants").update({
        "rating_sum": new_sum,
        "reviews_count": new_count,
        "rating": new_rating
    }).eq("id", restaurant_id).execute()

    return Response({"message": "Review added successfully"})


# ====================================
# 🧾 4. GET REVIEWS
# ====================================
@api_view(["GET"])
def get_reviews(request, restaurant_id):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    resp = supabase.table("reviews") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if language == 'ta':
        translated_reviews = []
        for review in resp.data:
            translated_reviews.append({
                "id": review.get("id"),
                "user_email": review.get("user_email"),
                "rating": review.get("rating"),
                "comment": translator.translate(review.get("comment", "")),
                "created_at": review.get("created_at")
            })
        return Response(translated_reviews)

    return Response(resp.data)


# ====================================
# ✏️ 5. UPDATE REVIEW
# ====================================
@api_view(["PUT"])
def update_review(request):
    data = request.data

    restaurant_id = data["restaurant_id"]
    user = verify_role(request, "customer")
    if not user:
     return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]

    try:
        new_rating = int(data["rating"])
    except:
        return Response({"error": "Invalid rating"}, status=400)

    new_comment = data.get("comment")

    review = supabase.table("reviews") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .eq("user_email", email) \
        .execute()

    if not review.data:
        return Response({"error": "Review not found"}, status=404)

    old_rating = review.data[0]["rating"]

    # ✅ Update review
    supabase.table("reviews").update({
        "rating": new_rating,
        "comment": new_comment
    }).eq("restaurant_id", restaurant_id).eq("user_email", email).execute()

    # ✅ Update restaurant rating
    res = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()

    if not res.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant = res.data[0]

    new_sum = restaurant["rating_sum"] - old_rating + new_rating
    new_avg = round(new_sum / restaurant["reviews_count"], 1)

    supabase.table("restaurants").update({
        "rating_sum": new_sum,
        "rating": new_avg
    }).eq("id", restaurant_id).execute()

    return Response({"message": "Review updated successfully"})


# ====================================
# ❌ 6. DELETE REVIEW
# ====================================
@api_view(["DELETE"])
def delete_review(request):
    restaurant_id = request.data["restaurant_id"]
    user = verify_role(request, "customer")
    if not user:
     return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]

    review = supabase.table("reviews") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .eq("user_email", email) \
        .execute()

    if not review.data:
        return Response({"error": "Review not found"}, status=404)

    old_rating = review.data[0]["rating"]

    # ❌ Delete
    supabase.table("reviews").delete() \
        .eq("restaurant_id", restaurant_id) \
        .eq("user_email", email) \
        .execute()

    # ✅ Update restaurant
    res = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()

    if not res.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant = res.data[0]

    new_sum = restaurant["rating_sum"] - old_rating
    new_count = restaurant["reviews_count"] - 1
    new_rating = round(new_sum / new_count, 1) if new_count > 0 else 0

    supabase.table("restaurants").update({
        "rating_sum": new_sum,
        "reviews_count": new_count,
        "rating": new_rating
    }).eq("id", restaurant_id).execute()

    return Response({"message": "Review deleted successfully"})
# ====================================
# 🍽️ 6. ADD MENU ITEM (WITH OFFER)
# ====================================
@api_view(["POST"])
def add_menu_item(request):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    translation.activate(language)

    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": _("Unauthorized")}, status=401)

    email = user["email"]
    data = request.data
    image_file = request.FILES.get("image")

    if not image_file:
        return Response({"error": _("Image required")}, status=400)

    ALLOWED_CATEGORIES = ["Meals", "Tiffin", "Snacks", "Veg", "Non-Veg"]
    category = data.get("category")

    if category and category not in ALLOWED_CATEGORIES:
        return Response({
            "error": f"{_('Invalid category')}. {_('Allowed')}: {ALLOWED_CATEGORIES}"
        }, status=400)

    # Get restaurant
    restaurant = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant.data:
        return Response({"error": _("Restaurant not found")}, status=404)

    restaurant_id = restaurant.data[0]["id"]

    # Upload image
    file_name = f"{uuid.uuid4()}.jpg"

    supabase.storage.from_("menu_bucket").upload(
        file_name,
        image_file.read(),
        {"content-type": image_file.content_type}
    )

    image_url = supabase.storage.from_("menu_bucket").get_public_url(file_name)

    # ====================================
    # OFFER HANDLING
    # ====================================
    regular_price = float(data.get("price"))
    offer_percentage = data.get("offer_percentage")  # Optional: e.g., 10, 20, 30
    offer_duration_hours = data.get("offer_duration_hours")  # Optional: 2, 12, 24, 48

    offer_price = None
    offer_expiry = None
    has_offer = False

    if offer_percentage and offer_duration_hours:
        try:
            offer_percentage = float(offer_percentage)
            offer_duration_hours = int(offer_duration_hours)

            # Calculate offer price
            discount = (regular_price * offer_percentage) / 100
            offer_price = round(regular_price - discount, 2)

            # Calculate expiry time
            offer_expiry = datetime.now() + timedelta(hours=offer_duration_hours)
            has_offer = True

            # Validate offer percentage
            if offer_percentage <= 0 or offer_percentage > 90:
                return Response({"error": _("Offer percentage must be between 1 and 90")}, status=400)

            # Validate duration
            valid_durations = [2, 12, 24, 48]
            if offer_duration_hours not in valid_durations:
                return Response({
                    "error": f"{_('Invalid duration')}. {_('Allowed')}: 2, 12, 24, 48 hours"
                }, status=400)

        except (ValueError, TypeError):
            return Response({"error": _("Invalid offer values")}, status=400)

    # Insert into DB
    menu_item_data = {
        "restaurant_id": restaurant_id,
        "name": data.get("name"),
        "price": regular_price,
        "description": data.get("desc"),
        "image": image_url,
        "is_veg": data.get("veg", False),
        "category": category,
        # Offer fields
        "has_offer": has_offer,
        "offer_percentage": offer_percentage if has_offer else None,
        "offer_price": offer_price if has_offer else None,
        "offer_expiry": offer_expiry.isoformat() if has_offer else None
    }

    # Remove None values
    menu_item_data = {k: v for k, v in menu_item_data.items() if v is not None}

    supabase.table("menu_items").insert(menu_item_data).execute()

    response_data = {
        "message": _("Menu item added successfully"),
        "category": category,
        "regular_price": regular_price
    }

    if has_offer:
        response_data.update({
            "has_offer": True,
            "offer_percentage": offer_percentage,
            "offer_price": offer_price,
            "offer_expiry": offer_expiry.isoformat(),
            "offer_duration_hours": offer_duration_hours
        })

    return Response(response_data)
@api_view(["GET"])
def get_menu(request, restaurant_id):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    # Fetch all menu items
    resp = supabase.table("menu_items") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not resp.data:
        return Response({"menu": []})

    # Format menu items
    formatted_menu = []
    for item in resp.data:
        # Check if offer is still valid
        current_item = dict(item)
        if current_item.get("has_offer") and current_item.get("offer_expiry"):
            try:
                expiry = datetime.fromisoformat(current_item["offer_expiry"].replace('Z', '+00:00'))
                if datetime.now() > expiry:
                    # Offer expired - update in database and clear offer fields
                    current_item["has_offer"] = False
                    current_item["offer_percentage"] = None
                    current_item["offer_price"] = None
                    current_item["offer_expiry"] = None

                    # Update database
                    supabase.table("menu_items") \
                        .update({
                            "has_offer": False,
                            "offer_percentage": None,
                            "offer_price": None,
                            "offer_expiry": None
                        }) \
                        .eq("id", item["id"]) \
                        .execute()
            except:
                pass

        if language == 'ta':
            name = translator.translate(current_item.get("name", ""))
            description = translator.translate(current_item.get("description", ""))
            category = translator.translate(current_item.get("category", "Uncategorized"))
        else:
            name = current_item.get("name")
            description = current_item.get("description")
            category = current_item.get("category") or "Uncategorized"

        # Build menu item with offer info
        menu_item = {
            "id": current_item.get("id"),
            "name": name,
            "regular_price": current_item.get("price"),
            "description": description,
            "image": current_item.get("image"),
            "is_veg": current_item.get("is_veg"),
            "category": category
        }

        # Add offer information if available and valid
        if current_item.get("has_offer") and current_item.get("offer_price"):
            menu_item.update({
                "has_offer": True,
                "offer_price": current_item.get("offer_price"),
                "offer_percentage": current_item.get("offer_percentage"),
                "offer_expiry": current_item.get("offer_expiry")
            })

        formatted_menu.append(menu_item)

    # Group by category
    menu_by_category = {}
    for item in formatted_menu:
        cat = item["category"]
        if cat not in menu_by_category:
            menu_by_category[cat] = []
        menu_by_category[cat].append(item)

    return Response({
        "restaurant_id": restaurant_id,
        "menu": menu_by_category
    })
def calculate_override_expiry(current_datetime, start_time, end_time):
    """
    Calculate the expiry datetime based on time range
    Handles overnight ranges (e.g., 22:00 to 02:00)
    """
    current_time = current_datetime.time()

    # Replace current_datetime's time with end_time
    end_datetime = current_datetime.replace(
        hour=end_time.hour,
        minute=end_time.minute,
        second=0,
        microsecond=0
    )

    # Handle overnight range (e.g., 22:00 to 02:00)
    if end_time <= start_time:
        # Overnight: end is on next day
        end_datetime = end_datetime + timedelta(days=1)
    else:
        # Normal range (end > start)
        # If end_time is already passed today, set expiry to tomorrow
        if current_time > end_time:
            end_datetime = end_datetime + timedelta(days=1)

    return end_datetime

@api_view(["POST"])
def merchant_override_status(request):
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]
    data = request.data

    force_open = data.get("force_open", True)
    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")

    if not start_time_str or not end_time_str:
        return Response({"error": "Both start_time and end_time are required"}, status=400)

    # Validate time format
    try:
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
    except ValueError:
        return Response({"error": "Time must be in HH:MM format (24-hour)"}, status=400)

    if start_time == end_time:
        return Response({"error": "Start time and end time cannot be the same"}, status=400)

    restaurant_resp = supabase.table("restaurants") \
        .select("id, name") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]
    restaurant_name = restaurant_resp.data[0]["name"]

    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)

    # Calculate expiry datetime
    expiry_ist = calculate_override_expiry(now_ist, start_time, end_time)

    # Format the expiry for database storage (keep as string without timezone for consistency)
    expiry_str = expiry_ist.strftime("%Y-%m-%d %H:%M:%S")

    # CRITICAL: Update ALL override fields
    update_data = {
        "manual_override": True,
        "manual_override_expiry": expiry_str,
        "manual_override_status": force_open,
        "manual_override_start_time": start_time_str,
        "manual_override_end_time": end_time_str,
        "is_open": force_open
    }

    print(f"📝 Updating restaurant {restaurant_id} with:")
    print(f"   - manual_override: {update_data['manual_override']}")
    print(f"   - manual_override_start_time: {update_data['manual_override_start_time']}")
    print(f"   - manual_override_end_time: {update_data['manual_override_end_time']}")
    print(f"   - manual_override_expiry: {update_data['manual_override_expiry']}")
    print(f"   - manual_override_status: {update_data['manual_override_status']}")
    print(f"   - is_open: {update_data['is_open']}")

    # Execute the update
    result = supabase.table("restaurants").update(update_data).eq("id", restaurant_id).execute()

    # Verify the update was successful
    if result.data:
        print(f"✅ Update successful: {result.data[0]}")
    else:
        print(f"❌ Update failed!")

    status_text = "OPEN" if force_open else "CLOSED"
    start_display = format_time_12hr(start_time_str)
    end_display = format_time_12hr(end_time_str)

    return Response({
        "success": True,
        "message": f"Restaurant forced {status_text} from {start_display} to {end_display}",
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_name,
        "status": status_text,
        "override_start_time": start_time_str,
        "override_end_time": end_time_str,
        "expires_at": expiry_str
    })



def format_time_12hr(time_str):
    """Convert 24-hour time string to 12-hour format with AM/PM"""
    if not time_str:
        return ""
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            hour = int(parts[0])
            minute = parts[1][:2]
            ampm = "AM" if hour < 12 else "PM"
            hour12 = hour % 12
            hour12 = 12 if hour12 == 0 else hour12
            return f"{hour12}:{minute} {ampm}"
    except:
        return time_str
    return time_str

@api_view(["POST"])
def merchant_cancel_override(request):
    """
    Cancel manual override and revert to auto schedule
    """
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]

    restaurant_resp = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]

    # Calculate auto status first
    auto_status = calculate_auto_status(restaurant_resp.data[0])

    # Clear ALL override fields AND update is_open
    update_data = {
        "manual_override": False,
        "manual_override_expiry": None,
        "manual_override_status": None,
        "manual_override_start_time": None,
        "manual_override_end_time": None,
        "is_open": auto_status
    }

    print(f"📝 Clearing override for restaurant {restaurant_id} and setting is_open to {auto_status}")

    supabase.table("restaurants").update(update_data).eq("id", restaurant_id).execute()

    status_text = "OPEN" if auto_status else "CLOSED"

    return Response({
        "success": True,
        "message": f"Manual override cancelled. Restaurant now follows auto schedule. Current status: {status_text}",
        "auto_status": auto_status
    })
@api_view(["GET"])
def get_merchant_restaurant(request):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    # 🔍 DEBUG: Print the language header
    print("\n" + "="*50)
    print(f"🔍 DEBUG - Language Header: '{language}'")
    print("="*50)

    user = verify_role(request, "merchant")
    if not user:
        error_msg = "Unauthorized"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=401)

    email = user["email"]
    print(f"🔍 DEBUG - Merchant Email: {email}")

    # Get restaurant
    res = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not res.data:
        error_msg = "Restaurant not found"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=404)

    restaurant = res.data[0]
    print(f"🔍 DEBUG - Restaurant Found: {restaurant['name']}")

    # Read values from database
    is_open = restaurant.get("is_open", False)
    manual_override = restaurant.get("manual_override", False)
    manual_status = restaurant.get("manual_override_status", False)
    manual_expiry = restaurant.get("manual_override_expiry")
    override_start = restaurant.get("manual_override_start_time")
    override_end = restaurant.get("manual_override_end_time")

    # Check if manual override is active and not expired
    is_overridden = False
    if manual_override and manual_expiry:
        try:
            ist = pytz.timezone('Asia/Kolkata')
            now_ist = datetime.now(ist)

            # Parse expiry - handle different formats
            if isinstance(manual_expiry, str):
                # Try to parse the expiry string
                try:
                    # Try ISO format first (with timezone)
                    expiry = datetime.fromisoformat(manual_expiry)
                except:
                    # Try format like "2026-05-08 11:08:00" (no timezone)
                    expiry = datetime.strptime(manual_expiry, "%Y-%m-%d %H:%M:%S")

                # Make it timezone-aware (IST)
                if expiry.tzinfo is None:
                    expiry_ist = ist.localize(expiry)
                else:
                    expiry_ist = expiry.astimezone(ist)
            else:
                expiry_ist = manual_expiry
                if expiry_ist.tzinfo is None:
                    expiry_ist = ist.localize(expiry_ist)

            print(f"🔍 Current IST: {now_ist}")
            print(f"🔍 Expiry IST: {expiry_ist}")
            print(f"🔍 Is expired: {now_ist >= expiry_ist}")

            # Check if still valid
            if now_ist < expiry_ist:
                # Also check if within time range
                if override_start and override_end:
                    current_time = now_ist.time()
                    start_time = datetime.strptime(override_start, "%H:%M").time()
                    end_time = datetime.strptime(override_end, "%H:%M").time()

                    # Check if current time is within the override time range
                    if end_time <= start_time:  # Overnight range
                        is_in_range = current_time >= start_time or current_time <= end_time
                    else:
                        is_in_range = start_time <= current_time <= end_time

                    if is_in_range:
                        is_overridden = True
                        is_open = manual_status
                        print(f"✅ Manual override ACTIVE: {restaurant['name']} -> {'OPEN' if is_open else 'CLOSED'}")
                        print(f"   Time range: {override_start} to {override_end}")
                    else:
                        # Outside time range - clear the override
                        print(f"⏰ Override cleared - outside time range")
                        supabase.table("restaurants").update({
                            "manual_override": False,
                            "manual_override_expiry": None,
                            "manual_override_status": None,
                            "manual_override_start_time": None,
                            "manual_override_end_time": None
                        }).eq("id", restaurant["id"]).execute()
                else:
                    # No time range, just use expiry
                    is_overridden = True
                    is_open = manual_status
                    print(f"✅ Manual override ACTIVE (no time range): {restaurant['name']} -> {'OPEN' if is_open else 'CLOSED'}")
            else:
                # Expired - clear it
                print(f"⏰ Manual override EXPIRED for {restaurant['name']}")
                auto_status = calculate_auto_status(restaurant)
                supabase.table("restaurants").update({
                    "manual_override": False,
                    "manual_override_expiry": None,
                    "manual_override_status": None,
                    "manual_override_start_time": None,
                    "manual_override_end_time": None,
                    "is_open": auto_status
                }).eq("id", restaurant["id"]).execute()
                is_open = auto_status
                print(f"🔄 Updated is_open to: {'OPEN' if auto_status else 'CLOSED'}")
        except Exception as e:
            print(f"Error checking override expiry: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n✅ FINAL STATUS for {restaurant['name']}: {'OPEN' if is_open else 'CLOSED'}")
    if is_overridden:
        print(f"   (Manual Override Active)")
    print("="*50)

    # Clean expired offers before fetching menu
    clean_expired_offers()

    # Get menu items
    menu = supabase.table("menu_items") \
        .select("*") \
        .eq("restaurant_id", restaurant["id"]) \
        .execute()

    print(f"🔍 DEBUG - Menu Items Count: {len(menu.data)}")

    # Get reviews
    reviews = supabase.table("reviews") \
        .select("user_email, rating, comment, created_at") \
        .eq("restaurant_id", restaurant["id"]) \
        .order("created_at", desc=True) \
        .execute()

    print(f"🔍 DEBUG - Reviews Count: {len(reviews.data)}")

    # 🔍 DEBUG: Test translator with a simple string
    if language == 'ta':
        test_text = "Hello World"
        try:
            translated_test = translator.translate(test_text)
            print(f"🔍 DEBUG - Translator Test: '{test_text}' -> '{translated_test}'")
            if translated_test == test_text:
                print("⚠️ WARNING: Translator returned same text! Check if translate package is working.")
            else:
                print("✅ Translator is working!")
        except Exception as e:
            print(f"❌ ERROR - Translator exception: {e}")

    # If language is Tamil, translate EVERYTHING
    if language == 'ta':
        print("\n🔍 DEBUG - Translating to Tamil...")

        # Translate restaurant - ALL fields
        try:
            translated_name = translator.translate(restaurant["name"])
            print(f"  - Restaurant name: '{restaurant['name']}' -> '{translated_name}'")
        except Exception as e:
            print(f"  ❌ Error translating name: {e}")
            translated_name = restaurant["name"]

        try:
            translated_cuisine = translator.translate(restaurant["cuisine"])
            print(f"  - Cuisine: '{restaurant['cuisine']}' -> '{translated_cuisine}'")
        except Exception as e:
            print(f"  ❌ Error translating cuisine: {e}")
            translated_cuisine = restaurant["cuisine"]

        # Translate tags
        translated_tags = []
        print(f"  - Tags ({len(restaurant['tags'])} items):")
        for i, tag in enumerate(restaurant["tags"]):
            try:
                translated_tag = translator.translate(tag)
                print(f"    {i+1}. '{tag}' -> '{translated_tag}'")
                translated_tags.append(translated_tag)
            except Exception as e:
                print(f"    ❌ Error translating tag '{tag}': {e}")
                translated_tags.append(tag)

        # Translate days
        translated_days = restaurant.get("days_open")
        if translated_days:
            try:
                days_list = [d.strip() for d in translated_days.split(",")]
                translated_days_list = []
                print(f"  - Days ({len(days_list)} items):")
                for day in days_list:
                    translated_day = translator.translate(day)
                    print(f"    '{day}' -> '{translated_day}'")
                    translated_days_list.append(translated_day)
                translated_days = ",".join(translated_days_list)
            except Exception as e:
                print(f"  ❌ Error translating days: {e}")

        # Translate opening and closing times to 12-hour format with Tamil
        opening_time_display = restaurant.get("opening_time", "")
        closing_time_display = restaurant.get("closing_time", "")

        def format_time_12hr(time_str):
            if not time_str:
                return ""
            try:
                if ':' in time_str:
                    parts = time_str.split(':')
                    hour = int(parts[0])
                    minute = parts[1][:2]
                    ampm = "AM" if hour < 12 else "PM"
                    hour12 = hour % 12
                    hour12 = 12 if hour12 == 0 else hour12

                    if language == 'ta':
                        ampm_ta = "காலை" if hour < 12 else "மாலை"
                        return f"{hour12}:{minute} {ampm_ta}"
                    return f"{hour12}:{minute} {ampm}"
            except:
                return time_str
            return time_str

        translated_opening = format_time_12hr(restaurant.get("opening_time", ""))
        translated_closing = format_time_12hr(restaurant.get("closing_time", ""))

        translated_restaurant = {
            "id": restaurant["id"],
            "name": translated_name,
            "cuisine": translated_cuisine,
            "image": restaurant["image"],
            "latitude": restaurant["latitude"],
            "longitude": restaurant["longitude"],
            "tags": translated_tags,
            "rating": restaurant["rating"],
            "reviews_count": restaurant["reviews_count"],
            "opening_time": restaurant.get("opening_time"),
            "closing_time": restaurant.get("closing_time"),
            "days_open": translated_days,
            "is_open": is_open,
            "is_manually_overridden": is_overridden,
            "opening_time_display": translated_opening,
            "closing_time_display": translated_closing,
            "manual_override": restaurant.get("manual_override", False),
        "manual_override_expiry": restaurant.get("manual_override_expiry"),
        "manual_override_status": restaurant.get("manual_override_status"),
        "manual_override_start_time": restaurant.get("manual_override_start_time"),
        "manual_override_end_time": restaurant.get("manual_override_end_time")
        }

        # Translate menu items - only active offers will remain after clean_expired_offers()
        translated_menu = []
        print(f"\n  - Menu Items ({len(menu.data)} items):")
        for i, item in enumerate(menu.data):
            try:
                translated_name = translator.translate(item.get("name", ""))
                translated_desc = translator.translate(item.get("description", ""))
                translated_category = translator.translate(item.get("category", "Uncategorized"))

                print(f"    {i+1}. '{item.get('name')}' -> '{translated_name}'")

                translated_item = {
                    "id": item.get("id"),
                    "name": translated_name,
                    "price": item.get("price"),
                    "description": translated_desc,
                    "image": item.get("image"),
                    "is_veg": item.get("is_veg"),
                    "category": translated_category
                }

                # Add offer details only if offer is active
                if item.get("has_offer"):
                    translated_item.update({
                        "has_offer": True,
                        "offer_percentage": item.get("offer_percentage"),
                        "offer_price": item.get("offer_price"),
                        "offer_expiry": item.get("offer_expiry")
                    })
                    print(f"       (OFFER: {item.get('offer_percentage')}% off, valid until {item.get('offer_expiry')})")

                translated_menu.append(translated_item)

            except Exception as e:
                print(f"    ❌ Error translating menu item {i+1}: {e}")
                translated_menu.append({
                    "id": item.get("id"),
                    "name": item.get("name", ""),
                    "price": item.get("price"),
                    "description": item.get("description", ""),
                    "image": item.get("image"),
                    "is_veg": item.get("is_veg"),
                    "category": item.get("category", "Uncategorized")
                })

        # Translate reviews
        translated_reviews = []
        print(f"\n  - Reviews ({len(reviews.data)} items):")
        for i, review in enumerate(reviews.data):
            try:
                translated_comment = translator.translate(review.get("comment", ""))
                print(f"    {i+1}. '{review.get('comment')}' -> '{translated_comment}'")
                translated_reviews.append({
                    "user_email": review.get("user_email"),
                    "rating": review.get("rating"),
                    "comment": translated_comment,
                    "created_at": review.get("created_at")
                })
            except Exception as e:
                print(f"    ❌ Error translating review {i+1}: {e}")
                translated_reviews.append({
                    "user_email": review.get("user_email"),
                    "rating": review.get("rating"),
                    "comment": review.get("comment", ""),
                    "created_at": review.get("created_at")
                })

        print("\n" + "="*50)
        print("✅ Translation complete!")
        print("="*50 + "\n")

        return Response({
            "restaurant": translated_restaurant,
            "menu": translated_menu,
            "reviews": translated_reviews
        })
    else:
        print("\n🔍 DEBUG - Returning English data (no translation)\n")

        # Clean expired offers before processing
        clean_expired_offers()

        # Get fresh menu data after cleanup
        menu = supabase.table("menu_items") \
            .select("*") \
            .eq("restaurant_id", restaurant["id"]) \
            .execute()

        # Process menu items - only active offers will remain
        processed_menu = []
        for item in menu.data:
            menu_item = dict(item)
            processed_menu.append(menu_item)

        # Format times for display in English
        def format_time_12hr_en(time_str):
            if not time_str:
                return ""
            try:
                if ':' in time_str:
                    parts = time_str.split(':')
                    hour = int(parts[0])
                    minute = parts[1][:2]
                    ampm = "AM" if hour < 12 else "PM"
                    hour12 = hour % 12
                    hour12 = 12 if hour12 == 0 else hour12
                    return f"{hour12}:{minute} {ampm}"
            except:
                return time_str
            return time_str

        return Response({
            "restaurant": {
                "id": restaurant["id"],
                "name": restaurant["name"],
                "cuisine": restaurant["cuisine"],
                "image": restaurant["image"],
                "latitude": restaurant["latitude"],
                "longitude": restaurant["longitude"],
                "tags": restaurant["tags"],
                "rating": restaurant["rating"],
                "reviews_count": restaurant["reviews_count"],
                "opening_time": restaurant.get("opening_time"),
                "closing_time": restaurant.get("closing_time"),
                "days_open": restaurant.get("days_open"),
                "is_open": is_open,
                "is_manually_overridden": is_overridden,
                "opening_time_display": format_time_12hr_en(restaurant.get("opening_time", "")),
                "closing_time_display": format_time_12hr_en(restaurant.get("closing_time", "")),
                "manual_override": restaurant.get("manual_override", False),
        "manual_override_expiry": restaurant.get("manual_override_expiry"),
        "manual_override_status": restaurant.get("manual_override_status"),
        "manual_override_start_time": restaurant.get("manual_override_start_time"),
        "manual_override_end_time": restaurant.get("manual_override_end_time")
            },
            "menu": processed_menu,
            "reviews": reviews.data
        })
@api_view(["GET"])
def get_merchant_orders(request):
    """
    Get paid and pending orders with PAGINATION
    """
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    user = verify_role(request, "merchant")
    if not user:
        error_msg = "Unauthorized"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=401)

    merchant_email = user["email"]

    restaurant_resp = supabase.table("restaurants") \
        .select("id, name") \
        .eq("merchant_email", merchant_email) \
        .limit(1) \
        .execute()

    if not restaurant_resp.data:
        error_msg = "Restaurant not found"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]
    restaurant_name = restaurant_resp.data[0]["name"]

    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    offset = (page - 1) * page_size

    # Count for pagination
    count_resp = supabase.table("orders") \
        .select("*", count="exact", head=True) \
        .eq("restaurant_id", restaurant_id) \
        .in_("payment_status", ["paid", "pending"]) \
        .execute()
    total_orders = count_resp.count if hasattr(count_resp, 'count') else 0
    total_pages = (total_orders + page_size - 1) // page_size if total_orders > 0 else 1

    # ✅ CORRECT - Get both paid AND pending orders (NO .eq() line!)
    orders_resp = supabase.table("orders") \
        .select("id, order_number, created_at, total_amount, payment_status, payment_method, delivery_address, customer_phone, special_instructions, customer_email") \
        .eq("restaurant_id", restaurant_id) \
        .in_("payment_status", ["paid", "pending"]) \
        .order("created_at", desc=True) \
        .range(offset, offset + page_size - 1) \
        .execute()

    if not orders_resp.data:
        return Response({
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant_name,
            "orders": [],
            "total_orders": 0,
            "total_pages": 0,
            "current_page": page,
            "page_size": page_size,
            "statistics": {"paid": {"count": 0, "total": 0}, "pending": {"count": 0, "total": 0}},
            "today": {"count": 0, "total": 0}
        })

    # Batch fetch order items
    order_ids = [order["id"] for order in orders_resp.data]
    items_resp = supabase.table("order_items") \
        .select("*") \
        .in_("order_id", order_ids) \
        .execute()

    items_by_order = {}
    for item in items_resp.data:
        order_id = item["order_id"]
        if order_id not in items_by_order:
            items_by_order[order_id] = []
        items_by_order[order_id].append(item)

    # Batch fetch customers
    customer_emails = list(set([order["customer_email"] for order in orders_resp.data]))
    customers_resp = supabase.table("users") \
        .select("email, phone, name") \
        .in_("email", customer_emails) \
        .execute()
    customer_lookup = {c["email"]: c for c in customers_resp.data}

    # Build orders
    orders = []
    for order in orders_resp.data:
        customer_info = customer_lookup.get(order["customer_email"], {})
        order_items = items_by_order.get(order["id"], [])

        order_items_formatted = [{
            "id": item["id"],
            "menu_item_id": item["menu_item_id"],
            "name": item["item_name"],
            "quantity": item["quantity"],
            "price_at_time": float(item["price_at_time"]),
            "subtotal": float(item["price_at_time"]) * item["quantity"],
            "category": item.get("category", ""),
            "is_veg": item.get("is_veg", False)
        } for item in order_items]

        orders.append({
            "id": order["id"],
            "order_number": order["order_number"],
            "created_at": order["created_at"],
            "total_amount": float(order["total_amount"]),
            "payment_status": order["payment_status"],
            "payment_method": order["payment_method"],
            "delivery_address": order["delivery_address"],
            "customer_phone": order["customer_phone"],
            "special_instructions": order.get("special_instructions", ""),
            "customer": {
                "email": customer_info.get("email", ""),
                "phone": customer_info.get("phone", ""),
                "name": customer_info.get("name", "")
            },
            "items": order_items_formatted,
            "item_count": len(order_items_formatted)
        })

    # Get today's statistics (for response)
    today = datetime.now().strftime("%Y-%m-%d")
    today_start = f"{today}T00:00:00"
    today_end = f"{today}T23:59:59"

    today_resp = supabase.table("orders") \
        .select("*", count="exact") \
        .eq("restaurant_id", restaurant_id) \
        .in_("payment_status", ["paid", "pending"]) \
        .gte("created_at", today_start) \
        .lte("created_at", today_end) \
        .execute()

    today_count = today_resp.count if hasattr(today_resp, 'count') else 0
    today_total = sum(float(o["total_amount"]) for o in today_resp.data if o.get("payment_status") == "paid") if today_resp.data else 0

    # Get paid/pending totals
    paid_resp = supabase.table("orders") \
        .select("total_amount") \
        .eq("restaurant_id", restaurant_id) \
        .eq("payment_status", "paid") \
        .execute()

    pending_resp = supabase.table("orders") \
        .select("total_amount") \
        .eq("restaurant_id", restaurant_id) \
        .eq("payment_status", "pending") \
        .execute()

    paid_total = sum(float(o["total_amount"]) for o in paid_resp.data) if paid_resp.data else 0
    pending_total = sum(float(o["total_amount"]) for o in pending_resp.data) if pending_resp.data else 0
    paid_count = len(paid_resp.data) if paid_resp.data else 0
    pending_count = len(pending_resp.data) if pending_resp.data else 0

    success_message = "Orders retrieved successfully"
    if language == 'ta':
        success_message = translator.translate(success_message)

    return Response({
        "message": success_message,
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_name,
        "orders": orders,
        "total_orders": total_orders,
        "total_pages": total_pages,
        "current_page": page,
        "page_size": page_size,
        "statistics": {
            "paid": {"count": paid_count, "total": float(paid_total)},
            "pending": {"count": pending_count, "total": float(pending_total)}
        },
        "today": {"count": today_count, "total": float(today_total)}
    })
def calculate_auto_status(restaurant):
    """Calculate if restaurant should be open based on current IST time"""
    try:
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        current_time = now_ist.time()
        current_day = now_ist.strftime("%A")

        print(f"📅 Calculating auto status for {restaurant.get('name')}")
        print(f"   Current IST: {now_ist}")
        print(f"   Current day: {current_day}")

        if not restaurant.get("opening_time") or not restaurant.get("closing_time") or not restaurant.get("days_open"):
            print(f"   Missing time info, returning current is_open: {restaurant.get('is_open', False)}")
            return restaurant.get("is_open", False)

        # Parse times (handle potential seconds in time string)
        opening_str = restaurant["opening_time"]
        closing_str = restaurant["closing_time"]

        # Extract just HH:MM if it includes seconds
        if len(opening_str) > 5:
            opening_str = opening_str[:5]
        if len(closing_str) > 5:
            closing_str = closing_str[:5]

        opening = datetime.strptime(opening_str, "%H:%M").time()
        closing = datetime.strptime(closing_str, "%H:%M").time()

        # Parse working days
        days_list = [d.strip() for d in restaurant["days_open"].split(",")]
        is_working_day = current_day in days_list

        print(f"   Opening: {opening}, Closing: {closing}")
        print(f"   Working day: {is_working_day} (days: {days_list})")

        if not is_working_day:
            print(f"❌ Not a working day: {current_day}")
            return False

        # Handle overnight hours (e.g., 11:00 PM to 1:00 AM)
        if closing < opening:
            is_open = current_time >= opening or current_time <= closing
            print(f"🌙 Overnight hours: {'OPEN' if is_open else 'CLOSED'}")
            return is_open
        else:
            is_open = opening <= current_time <= closing
            print(f"🕐 Normal hours: {'OPEN' if is_open else 'CLOSED'}")
            return is_open

    except Exception as e:
        print(f"Error calculating auto status: {e}")
        return restaurant.get("is_open", False)
def get_final_open_status(restaurant):
    """
    Get final open status considering manual override with time range
    """
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)
    current_time = now_ist.time()

    manual_override = restaurant.get("manual_override", False)
    manual_expiry = restaurant.get("manual_override_expiry")
    manual_status = restaurant.get("manual_override_status", False)
    override_start = restaurant.get("manual_override_start_time")
    override_end = restaurant.get("manual_override_end_time")

    print(f"🔍 Checking override for restaurant {restaurant.get('id')}")
    print(f"   Current IST: {now_ist}")
    print(f"   Manual override: {manual_override}")
    print(f"   Manual expiry raw: {manual_expiry}")
    print(f"   Current is_open: {restaurant.get('is_open')}")

    # Check if manual override exists
    if manual_override and manual_expiry:
        try:
            # Parse expiry - handle both string and datetime objects
            if isinstance(manual_expiry, str):
                try:
                    expiry_dt = datetime.fromisoformat(manual_expiry)
                except:
                    expiry_dt = datetime.strptime(manual_expiry, "%Y-%m-%d %H:%M:%S")

                if expiry_dt.tzinfo is None:
                    expiry_ist = ist.localize(expiry_dt)
                else:
                    expiry_ist = expiry_dt.astimezone(ist)
            else:
                expiry_ist = manual_expiry
                if expiry_ist.tzinfo is None:
                    expiry_ist = ist.localize(expiry_ist)

            print(f"   Expiry IST (parsed): {expiry_ist}")
            print(f"   Is expired: {now_ist >= expiry_ist}")

            # Check if expired
            if now_ist >= expiry_ist:
                print(f"⏰ Override EXPIRED at {now_ist} (expiry: {expiry_ist})")

                # Clear the override and calculate auto status
                auto_status = calculate_auto_status(restaurant)

                # Update ALL fields at once
                supabase.table("restaurants").update({
                    "manual_override": False,
                    "manual_override_expiry": None,
                    "manual_override_status": None,
                    "manual_override_start_time": None,
                    "manual_override_end_time": None,
                    "is_open": auto_status  # CRITICAL: Update is_open to auto status
                }).eq("id", restaurant["id"]).execute()

                print(f"🔄 Override expired - Updated is_open to: {'OPEN' if auto_status else 'CLOSED'}")
                return auto_status, False
            else:
                print(f"   Not expired yet")
                # Not expired - check if within time range
                if override_start and override_end:
                    try:
                        start_time = datetime.strptime(override_start, "%H:%M").time()
                        end_time = datetime.strptime(override_end, "%H:%M").time()

                        print(f"   Time range: {start_time} to {end_time}")
                        print(f"   Current time: {current_time}")

                        # Check if current time is within the override time range
                        if end_time <= start_time:  # Overnight range
                            is_in_range = current_time >= start_time or current_time <= end_time
                        else:
                            is_in_range = start_time <= current_time <= end_time

                        print(f"   Is in range: {is_in_range}")

                        if is_in_range:
                            print(f"✅ Override ACTIVE: within time range {override_start}-{override_end}")
                            return manual_status, True
                        else:
                            # Outside time range - clear the override and update is_open
                            print(f"⏰ Override cleared - outside time range")
                            auto_status = calculate_auto_status(restaurant)

                            supabase.table("restaurants").update({
                                "manual_override": False,
                                "manual_override_expiry": None,
                                "manual_override_status": None,
                                "manual_override_start_time": None,
                                "manual_override_end_time": None,
                                "is_open": auto_status
                            }).eq("id", restaurant["id"]).execute()
                            is_open = auto_status

                            print(f"🔄 Override cleared - Updated is_open to: {'OPEN' if auto_status else 'CLOSED'}")
                            return auto_status, False
                    except Exception as e:
                        print(f"Error checking time range: {e}")
                        return manual_status, True
                else:
                    # No time range but expiry is still valid
                    return manual_status, True
        except Exception as e:
            print(f"Error checking override expiry: {e}")
            import traceback
            traceback.print_exc()
            # If error parsing expiry, clear it and update is_open
            auto_status = calculate_auto_status(restaurant)
            supabase.table("restaurants").update({
                "manual_override": False,
                "manual_override_expiry": None,
                "manual_override_status": None,
                "manual_override_start_time": None,
                "manual_override_end_time": None,
                "is_open": auto_status
            }).eq("id", restaurant["id"]).execute()
            return auto_status, False
    elif manual_override and not manual_expiry:
        # Invalid state - clear it and update is_open
        print(f"⚠️ Invalid override state - no expiry for restaurant {restaurant.get('id')}")
        auto_status = calculate_auto_status(restaurant)
        supabase.table("restaurants").update({
            "manual_override": False,
            "manual_override_expiry": None,
            "manual_override_status": None,
            "manual_override_start_time": None,
            "manual_override_end_time": None,
            "is_open": auto_status
        }).eq("id", restaurant["id"]).execute()
        return auto_status, False

    # No manual override, calculate auto status
    auto_status = calculate_auto_status(restaurant)
    print(f"   No manual override, auto status: {'OPEN' if auto_status else 'CLOSED'}")

    # Update is_open to match auto status if it's different
    current_is_open = restaurant.get("is_open", False)
    if current_is_open != auto_status:
        supabase.table("restaurants").update({
            "is_open": auto_status
        }).eq("id", restaurant["id"]).execute()
        print(f"🔄 Updated is_open from {'OPEN' if current_is_open else 'CLOSED'} to {'OPEN' if auto_status else 'CLOSED'}")

    return auto_status, False
# ====================================
# 📍 GET MERCHANT OVERRIDE STATUS (NEW endpoint)
# ====================================
@api_view(["GET"])
def get_merchant_override_status(request):
    """
    Get current override status for merchant's restaurant
    GET /api/merchant/override-status/
    """
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]

    restaurant_resp = supabase.table("restaurants") \
        .select("id, name, manual_override, manual_override_status, manual_override_start_time, manual_override_end_time, manual_override_expiry, is_open, opening_time, closing_time") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant = restaurant_resp.data[0]

    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)

    is_override_active = False
    time_remaining = None

    if restaurant.get("manual_override") and restaurant.get("manual_override_expiry"):
        try:
            expiry = datetime.fromisoformat(restaurant["manual_override_expiry"].replace('Z', '+00:00'))
            if now_ist < expiry:
                is_override_active = True
                remaining = expiry - now_ist
                hours = remaining.seconds // 3600
                minutes = (remaining.seconds % 3600) // 60
                time_remaining = f"{hours}h {minutes}m"
        except:
            pass

    return Response({
        "success": True,
        "restaurant_id": restaurant["id"],
        "restaurant_name": restaurant["name"],
        "current_status": "OPEN" if restaurant["is_open"] else "CLOSED",
        "auto_schedule": {
            "opening_time": format_time_12hr(restaurant.get("opening_time")),
            "closing_time": format_time_12hr(restaurant.get("closing_time"))
        },
        "manual_override": {
            "is_active": is_override_active,
            "status": "OPEN" if restaurant.get("manual_override_status") else "CLOSED" if is_override_active else None,
            "start_time": restaurant.get("manual_override_start_time"),
            "end_time": restaurant.get("manual_override_end_time"),
            "time_remaining": time_remaining
        }
    })
@api_view(["GET"])
def get_all_restaurants_full_details(request):
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    restaurants_resp = supabase.table("restaurants").select("*").execute()

    if not restaurants_resp.data:
        return Response({"message": "No restaurants found"}, status=200)

    result = []

    for restaurant in restaurants_resp.data:
        # ✅ Get final status (auto + manual override)
        is_open, is_overridden = get_final_open_status(restaurant)

        clean_expired_offers()

        menu = supabase.table("menu_items") \
            .select("*") \
            .eq("restaurant_id", restaurant["id"]) \
            .execute()

        reviews = supabase.table("reviews") \
            .select("user_email, rating, comment, created_at") \
            .eq("restaurant_id", restaurant["id"]) \
            .order("created_at", desc=True) \
            .execute()

        # If language is Tamil, translate fields
        if language == 'ta':
            print(f"\n  - Translating to Tamil for restaurant {restaurant['id']}...")

            # Translate restaurant fields
            try:
                translated_name = translator.translate(restaurant["name"])
                print(f"    - Name: '{restaurant['name']}' -> '{translated_name}'")
            except:
                translated_name = restaurant["name"]

            try:
                translated_cuisine = translator.translate(restaurant["cuisine"])
                print(f"    - Cuisine: '{restaurant['cuisine']}' -> '{translated_cuisine}'")
            except:
                translated_cuisine = restaurant["cuisine"]

            # Translate tags
            translated_tags = []
            for tag in restaurant["tags"]:
                try:
                    translated_tags.append(translator.translate(tag))
                except:
                    translated_tags.append(tag)

            # Translate days
            translated_days = restaurant.get("days_open")
            if translated_days:
                try:
                    days_list = [d.strip() for d in translated_days.split(",")]
                    translated_days_list = []
                    for day in days_list:
                        translated_days_list.append(translator.translate(day))
                    translated_days = ",".join(translated_days_list)
                except:
                    pass

            translated_restaurant = {
                "id": restaurant["id"],
                "name": translated_name,
                "cuisine": translated_cuisine,
                "image": restaurant["image"],
                "latitude": restaurant["latitude"],
                "longitude": restaurant["longitude"],
                "tags": translated_tags,
                "rating": restaurant["rating"],
                "reviews_count": restaurant["reviews_count"],
                "opening_time": restaurant.get("opening_time"),
                "closing_time": restaurant.get("closing_time"),
                "days_open": translated_days,
                "is_open": is_open,
                "is_manually_overridden": is_overridden
            }

            # Translate menu items
            translated_menu = []
            for item in menu.data:
                try:
                    translated_item = {
                        "id": item.get("id"),
                        "name": translator.translate(item.get("name", "")),
                        "price": item.get("price"),
                        "description": translator.translate(item.get("description", "")),
                        "image": item.get("image"),
                        "is_veg": item.get("is_veg"),
                        "category": translator.translate(item.get("category", "Uncategorized"))
                    }

                    # Add offer details if active
                    if item.get("has_offer"):
                        translated_item.update({
                            "has_offer": True,
                            "offer_percentage": item.get("offer_percentage"),
                            "offer_price": item.get("offer_price"),
                            "offer_expiry": item.get("offer_expiry")
                        })

                    translated_menu.append(translated_item)
                except:
                    translated_menu.append(dict(item))

            # Translate reviews
            translated_reviews = []
            for review in reviews.data:
                try:
                    translated_reviews.append({
                        "user_email": review.get("user_email"),
                        "rating": review.get("rating"),
                        "comment": translator.translate(review.get("comment", "")),
                        "created_at": review.get("created_at")
                    })
                except:
                    translated_reviews.append(dict(review))

            result.append({
                "restaurant": translated_restaurant,
                "menu": translated_menu,
                "reviews": translated_reviews
            })

        else:
            # Return English data
            processed_menu = []
            for item in menu.data:
                menu_item = dict(item)
                processed_menu.append(menu_item)

            result.append({
                "restaurant": {
                    "id": restaurant["id"],
                    "name": restaurant["name"],
                    "cuisine": restaurant["cuisine"],
                    "image": restaurant["image"],
                    "latitude": restaurant["latitude"],
                    "longitude": restaurant["longitude"],
                    "tags": restaurant["tags"],
                    "rating": restaurant["rating"],
                    "reviews_count": restaurant["reviews_count"],
                    "opening_time": restaurant.get("opening_time"),
                    "closing_time": restaurant.get("closing_time"),
                    "days_open": restaurant.get("days_open"),
                    "is_open": is_open,
                    "is_manually_overridden": is_overridden
                },
                "menu": processed_menu,
                "reviews": reviews.data
            })

    print(f"\n🔍 DEBUG - Returning {len(result)} restaurants with full details")
    print("="*50 + "\n")

    return Response(result)
@api_view(["PUT", "PATCH"])
def update_restaurant(request):
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    translation.activate(language)

    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": _("Unauthorized")}, status=401)

    email = user["email"]
    data = request.data

    res = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not res.data:
        return Response({"error": _("Restaurant not found")}, status=404)

    restaurant = res.data[0]
    restaurant_id = restaurant["id"]

    update_data = {}

    allowed_fields = ["cuisine", "tags", "opening_time", "closing_time", "days_open"]

    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    if "days_open" in data:
        valid_days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
        input_days = [d.strip() for d in data["days_open"].split(",")]

        for d in input_days:
            if d not in valid_days:
                return Response({"error": f"{_('Invalid day')}: {d}"}, status=400)

        update_data["days_open"] = data["days_open"]

    if not update_data:
        return Response({"error": _("No valid fields provided")}, status=400)

    supabase.table("restaurants") \
        .update(update_data) \
        .eq("id", restaurant_id) \
        .execute()


    return Response({
        "message": _("Restaurant updated successfully"),
        "updated_fields": list(update_data.keys())
    })

# ====================================
# 🗑️ 5. DELETE RESTAURANT
# ====================================
@api_view(["DELETE"])
def delete_restaurant(request):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    translation.activate(language)

    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": _("Unauthorized")}, status=401)

    email = user["email"]

    res = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not res.data:
        return Response({"error": _("Restaurant not found")}, status=404)

    restaurant = res.data[0]
    restaurant_id = restaurant["id"]

    # Delete menu items
    supabase.table("menu_items") \
        .delete() \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    # Delete reviews
    supabase.table("reviews") \
        .delete() \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    # Delete restaurant
    supabase.table("restaurants") \
        .delete() \
        .eq("id", restaurant_id) \
        .execute()

    return Response({"message": _("Restaurant deleted successfully")})
# ====================================
# ✏️ 7. UPDATE MENU ITEM (WITH OFFER)
# ====================================
@api_view(["PUT"])
def update_menu_item(request, item_id):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    translation.activate(language)

    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": _("Unauthorized")}, status=401)

    email = user["email"]
    data = request.data
    image_file = request.FILES.get("image")

    # Get restaurant
    restaurant = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant.data:
        return Response({"error": _("Restaurant not found")}, status=404)

    restaurant_id = restaurant.data[0]["id"]

    # Check ownership and get current item data
    item = supabase.table("menu_items") \
        .select("*") \
        .eq("id", item_id) \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not item.data:
        return Response({"error": _("Menu item not found")}, status=404)

    current_item = item.data[0]
    update_data = {}

    # Handle basic fields
    if "name" in data:
        update_data["name"] = data["name"]
    if "desc" in data:
        update_data["description"] = data["desc"]
    if "veg" in data:
        # Convert string to boolean if needed
        if isinstance(data["veg"], str):
            update_data["is_veg"] = data["veg"].lower() == 'true'
        else:
            update_data["is_veg"] = data["veg"]
    if "category" in data:
        update_data["category"] = data["category"]

    # ====================================
    # OFFER HANDLING FOR UPDATE
    # ====================================
    # Check if price is being updated
    if "price" in data:
        try:
            new_price = float(data["price"])
            update_data["price"] = new_price

            # If there's an active offer, recalculate offer price
            if current_item.get("has_offer") and current_item.get("offer_percentage"):
                discount = (new_price * current_item["offer_percentage"]) / 100
                update_data["offer_price"] = round(new_price - discount, 2)
        except (ValueError, TypeError):
            return Response({"error": _("Invalid price format")}, status=400)

    # Check if offer is being updated
    if "offer_percentage" in data or "offer_duration_hours" in data:
        # Get the current price (either updated or existing)
        try:
            current_price = float(data.get("price", current_item["price"]))
        except (ValueError, TypeError):
            current_price = float(current_item["price"])

        # Handle offer_percentage - CONVERT TO NUMBER
        offer_percentage = None
        if "offer_percentage" in data:
            offer_percentage_value = data["offer_percentage"]

            # Convert to number if it's a string
            if isinstance(offer_percentage_value, str):
                # Handle empty string
                if offer_percentage_value.strip() == '':
                    offer_percentage = None
                else:
                    try:
                        offer_percentage = float(offer_percentage_value)
                    except (ValueError, TypeError):
                        return Response({"error": _("Invalid offer percentage format")}, status=400)
            elif isinstance(offer_percentage_value, (int, float)):
                offer_percentage = float(offer_percentage_value)
            else:
                offer_percentage = None
        else:
            # Use existing offer percentage if not being updated
            offer_percentage = current_item.get("offer_percentage")

        # Handle offer_duration_hours - CONVERT TO NUMBER
        offer_duration_hours = data.get("offer_duration_hours")
        if offer_duration_hours is not None:
            if isinstance(offer_duration_hours, str):
                if offer_duration_hours.strip() == '':
                    offer_duration_hours = None
                else:
                    try:
                        offer_duration_hours = int(float(offer_duration_hours))
                    except (ValueError, TypeError):
                        return Response({"error": _("Invalid duration format")}, status=400)
            elif isinstance(offer_duration_hours, (int, float)):
                offer_duration_hours = int(offer_duration_hours)

        # Check if we're setting a new offer or removing it
        if "remove_offer" in data and data["remove_offer"] in [True, 'true', 'True']:
            # Remove offer
            update_data["has_offer"] = False
            update_data["offer_percentage"] = None
            update_data["offer_price"] = None
            update_data["offer_expiry"] = None
        elif offer_percentage is not None and offer_percentage > 0:
            try:
                # Validate offer percentage
                if offer_percentage <= 0 or offer_percentage > 90:
                    return Response({"error": _("Offer percentage must be between 1 and 90")}, status=400)

                # Calculate new offer price
                discount = (current_price * offer_percentage) / 100
                offer_price = round(current_price - discount, 2)

                update_data["has_offer"] = True
                update_data["offer_percentage"] = offer_percentage
                update_data["offer_price"] = offer_price

                # Update expiry if duration provided
                if offer_duration_hours:
                    try:
                        # Allow any positive integer duration
                        if offer_duration_hours <= 0:
                            return Response({"error": _("Duration must be positive")}, status=400)

                        offer_expiry = datetime.now() + timedelta(hours=offer_duration_hours)
                        update_data["offer_expiry"] = offer_expiry.isoformat()
                    except (ValueError, TypeError):
                        return Response({"error": _("Invalid duration value")}, status=400)
                elif "offer_expiry" in data:
                    # Manual expiry update
                    update_data["offer_expiry"] = data["offer_expiry"]

            except (ValueError, TypeError):
                return Response({"error": _("Invalid offer percentage")}, status=400)
        elif offer_percentage is not None and offer_percentage <= 0:
            # Remove offer if percentage is 0 or negative
            update_data["has_offer"] = False
            update_data["offer_percentage"] = None
            update_data["offer_price"] = None
            update_data["offer_expiry"] = None

    # Check if offer is being removed explicitly (backward compatibility)
    if data.get("remove_offer") in [True, 'true', 'True']:
        update_data["has_offer"] = False
        update_data["offer_percentage"] = None
        update_data["offer_price"] = None
        update_data["offer_expiry"] = None

    # Image upload (optional)
    if image_file:
        try:
            file_name = f"{uuid.uuid4()}.jpg"
            supabase.storage.from_("menu_bucket").upload(
                file_name,
                image_file.read(),
                {"content-type": image_file.content_type}
            )
            image_url = supabase.storage.from_("menu_bucket").get_public_url(file_name)
            update_data["image"] = image_url
        except Exception as e:
            return Response({"error": f"{_('Image upload failed')}: {str(e)}"}, status=400)

    if not update_data:
        return Response({"error": _("No data to update")}, status=400)

    # Update DB
    try:
        updated_item = supabase.table("menu_items") \
            .update(update_data) \
            .eq("id", item_id) \
            .execute()
    except Exception as e:
        return Response({"error": f"{_('Update failed')}: {str(e)}"}, status=400)

    # Prepare response
    response_data = {
        "message": _("Menu item updated successfully"),
        "updated_fields": list(update_data.keys())
    }

    # Add offer info to response if applicable
    if update_data.get("has_offer"):
        response_data["offer_details"] = {
            "has_offer": True,
            "offer_percentage": update_data.get("offer_percentage"),
            "offer_price": update_data.get("offer_price"),
            "offer_expiry": update_data.get("offer_expiry")
        }
    elif "has_offer" in update_data and not update_data["has_offer"]:
        response_data["offer_details"] = {
            "has_offer": False,
            "message": "Offer removed"
        }

    return Response(response_data)
# ====================================
# 🗑️ 8. DELETE MENU ITEM
# ====================================
@api_view(["DELETE"])
def delete_menu_item(request, item_id):
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    translation.activate(language)

    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": _("Unauthorized")}, status=401)

    email = user["email"]

    # Get restaurant
    restaurant = supabase.table("restaurants") \
        .select("*") \
        .eq("merchant_email", email) \
        .execute()

    if not restaurant.data:
        return Response({"error": _("Restaurant not found")}, status=404)

    restaurant_id = restaurant.data[0]["id"]

    # Check ownership and delete
    item = supabase.table("menu_items") \
        .delete() \
        .eq("id", item_id) \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not item.data:
        return Response({"error": _("Menu item not found")}, status=404)

    return Response({"message": _("Menu item deleted successfully")})
# ====================================
# 🔄 HELPER FUNCTION TO CLEAN EXPIRED OFFERS
# ====================================
def clean_expired_offers():
    """
    Delete expired offers from database
    This can be called periodically or before each GET request
    """
    try:
        now = datetime.now().isoformat()

        # Find and delete expired offers
        expired = supabase.table("menu_items") \
            .select("id") \
            .eq("has_offer", True) \
            .lt("offer_expiry", now) \
            .execute()

        if expired.data:
            expired_ids = [item["id"] for item in expired.data]

            # Update expired offers to remove offer data
            supabase.table("menu_items") \
                .update({
                    "has_offer": False,
                    "offer_percentage": None,
                    "offer_price": None,
                    "offer_expiry": None
                }) \
                .in_("id", expired_ids) \
                .execute()

            print(f"✅ Cleaned {len(expired_ids)} expired offers")
    except Exception as e:
        print(f"Error cleaning expired offers: {e}")
@api_view(["PUT"])
def update_restaurant_profile(request):
    # ✅ Verify merchant
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    email = user["email"]
    data = request.data
    image_file = request.FILES.get("cover_image")

    update_user_data = {}
    update_restaurant_data = {}

    # ✅ Update restaurant name
    if "restaurant_name" in data:
        update_user_data["restaurant_name"] = data["restaurant_name"]
        update_restaurant_data["name"] = data["restaurant_name"]

    # ✅ Update cover image
    if image_file:
        file_name = f"{uuid.uuid4()}.jpg"

        supabase.storage.from_("cover-images").upload(
            file_name,
            image_file.read(),
            {"content-type": image_file.content_type}
        )

        image_url = supabase.storage.from_("cover-images").get_public_url(file_name)

        update_user_data["cover_image_url"] = image_url
        update_restaurant_data["image"] = image_url

    if not update_user_data and not update_restaurant_data:
        return Response({"error": "No data to update"}, status=400)

    # ✅ Update USERS table
    if update_user_data:
        supabase.table("users") \
            .update(update_user_data) \
            .eq("email", email) \
            .execute()

    # ✅ Update RESTAURANTS table
    restaurant = supabase.table("restaurants") \
        .select("id") \
        .eq("merchant_email", email) \
        .execute()

    if restaurant.data and update_restaurant_data:
        supabase.table("restaurants") \
            .update(update_restaurant_data) \
            .eq("merchant_email", email) \
            .execute()

    return Response({"message": "Restaurant profile updated successfully"})
# ====================================
# 🔐 9. REFRESH TOKEN
# ====================================
@api_view(["POST"])
def refresh_token_view(request):
    refresh_token = request.data.get("refresh_token")

    if not refresh_token:
        return Response({"error": _("Refresh token required")}, status=400)

    try:
        # Decode refresh token
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=["HS256"])

        # Ensure it's a refresh token
        if payload.get("type") != "refresh":
            return Response({"error": _("Invalid token type")}, status=401)

        email = payload["email"]
        role = payload["role"]

        # Generate NEW access token
        new_access_payload = {
            "email": email,
            "role": role,
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=60)
        }

        new_access_token = jwt.encode(
            new_access_payload,
            settings.JWT_SECRET,
            algorithm="HS256"
        )

        return Response({
            "access_token": new_access_token
        })

    except jwt.ExpiredSignatureError:
        return Response({"error": _("Refresh token expired")}, status=401)

    except jwt.InvalidTokenError:
        return Response({"error": _("Invalid refresh token")}, status=401)
# ====================================
# 📱 SEND EXPO PUSH NOTIFICATION
# ====================================
def send_expo_notification_to_merchant(merchant_email, order_number, total_amount, order_id, order_type="cod"):
    """Send push notification to merchant's mobile device using Expo"""
    try:
        tokens_resp = supabase.table("merchant_expo_tokens") \
            .select("expo_token") \
            .eq("merchant_email", merchant_email) \
            .execute()

        if not tokens_resp.data:
            print(f"No Expo tokens found for merchant: {merchant_email}")
            return False

        # Different title based on order type
        if order_type == "upi":
            title = f"New PAID Order - {order_number}"
            body = f"₹{total_amount} - Payment completed via UPI"
        else:
            title = f"New COD Order - {order_number}"
            body = f"₹{total_amount} - Cash on Delivery"

        sent_count = 0
        for token_data in tokens_resp.data:
            try:
                payload = {
                    "to": token_data["expo_token"],
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "data": {
                        "type": "new_order",
                        "order_id": str(order_id),
                        "order_number": order_number,
                        "total_amount": str(total_amount),
                        "payment_method": order_type.upper()
                    }
                }
                response = requests.post(
                    "https://exp.host/--/api/v2/push/send",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code == 200:
                    print(f"✅ Expo notification sent for {order_type} order")
                    sent_count += 1
                else:
                    print(f"❌ Expo notification failed: {response.text}")

            except Exception as e:
                print(f"❌ Failed to send Expo notification: {e}")

        return sent_count > 0

    except Exception as e:
        print(f"❌ Error sending Expo notification: {e}")
        return False
# ====================================
# 📱 REGISTER EXPO PUSH TOKEN
# ====================================
@api_view(["POST"])
def register_expo_token(request):
    """Register merchant's Expo push token for notifications"""
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]
    data = request.data

    expo_token = data.get("expo_push_token")
    platform = data.get("platform", "android")

    if not expo_token:
        return Response({"error": "Expo push token required"}, status=400)

    # Check if token already exists
    existing = supabase.table("merchant_expo_tokens") \
        .select("*") \
        .eq("merchant_email", merchant_email) \
        .eq("expo_token", expo_token) \
        .execute()

    if existing.data:
        supabase.table("merchant_expo_tokens") \
            .update({"last_active": datetime.now().isoformat()}) \
            .eq("id", existing.data[0]["id"]) \
            .execute()
    else:
        supabase.table("merchant_expo_tokens").insert({
            "merchant_email": merchant_email,
            "expo_token": expo_token,
            "platform": platform,
            "last_active": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }).execute()

    return Response({"success": True, "message": "Expo token registered"})

def send_new_order_notification_to_merchant(merchant_email, order_number, total_amount, order_id,
                                             restaurant_name, customer_email, customer_phone,
                                             delivery_address):
    """Send email notification to merchant for new order"""
    subject = f"📦 New Order Received - {order_number}"
    message = f"""
You have received a new order!

Order Number: {order_number}
Amount: ₹{total_amount}
Restaurant: {restaurant_name}

Customer Details:
Email: {customer_email}
Phone: {customer_phone}

📍 Delivery Location: {delivery_address}

✨ This is a COD order. Please collect payment at delivery.

Please login to your dashboard to view:
https://basicsbox.vercel.app/merchant?tab=orders

---
Basics Box Team
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[merchant_email],
            fail_silently=True
        )
        print(f"✅ New order email sent to {merchant_email}")
    except Exception as e:
        print(f"Failed to send new order email: {e}")

import random
import string

# ====================================
# 🛒 1. CREATE ORDER (WITH PUSH NOTIFICATION)
# ====================================
@api_view(["POST"])
def create_order(request):
    """
    Create a new order without sending notification (wait for payment)
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    customer_email = user["email"]
    data = request.data

    required_fields = ["restaurant_id", "items", "latitude", "longitude", "customer_phone"]
    for field in required_fields:
        if field not in data:
            return Response({"error": f"{field} is required"}, status=400)

    restaurant_id = data["restaurant_id"]
    items_data = data["items"]
    latitude = data["latitude"]
    longitude = data["longitude"]
    customer_phone = data["customer_phone"]
    special_instructions = data.get("special_instructions", "")
    payment_method = data.get("payment_method", "cash")

    if not items_data:
        return Response({"error": "No items in order"}, status=400)

    try:
        lat = float(latitude)
        lng = float(longitude)
        delivery_address = f"https://www.google.com/maps?q={lat},{lng}"
    except (ValueError, TypeError):
        return Response({"error": "Invalid latitude or longitude"}, status=400)

    # Verify restaurant exists
    restaurant_resp = supabase.table("restaurants") \
        .select("merchant_email, name") \
        .eq("id", restaurant_id) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    merchant_email = restaurant_resp.data[0]["merchant_email"]
    restaurant_name = restaurant_resp.data[0]["name"]

    # Calculate total and validate items
    total_amount = 0
    order_items = []

    for item_data in items_data:
        menu_item_id = item_data["menu_item_id"]
        quantity = item_data["quantity"]

        item_resp = supabase.table("menu_items") \
            .select("*") \
            .eq("id", menu_item_id) \
            .eq("restaurant_id", restaurant_id) \
            .execute()

        if not item_resp.data:
            return Response({"error": f"Menu item {menu_item_id} not found"}, status=404)

        menu_item = item_resp.data[0]

        # Use offer price if available
        if menu_item.get("has_offer") and menu_item.get("offer_price"):
            price = menu_item["offer_price"]
        else:
            price = menu_item["price"]

        item_total = price * quantity
        total_amount += item_total

        order_items.append({
            "menu_item_id": menu_item_id,
            "quantity": quantity,
            "price_at_time": price,  # Store the actual price paid (offer or regular)
            "item_name": menu_item["name"],
            "category": menu_item.get("category"),
            "is_veg": menu_item.get("is_veg", False)
        })

    # Generate order number
    order_number = generate_order_number()

    # Create order in database - ALWAYS pending for UPI
    # For cash orders, mark as paid immediately since customer pays on delivery
    if payment_method == "cash":
        payment_status = "pending"  # Wait for merchant to mark as paid
        order_status = "pending"
        notification_sent = False
    else:
        payment_status = "pending"  # UPI - wait for payment confirmation
        order_status = "pending"
        notification_sent = False  # NO notification sent yet

    order_data = {
        "customer_email": customer_email,
        "restaurant_id": restaurant_id,
        "order_number": order_number,
        "total_amount": total_amount,
        "status": order_status,
        "payment_status": payment_status,
        "payment_method": payment_method,
        "delivery_address": delivery_address,
        "customer_phone": customer_phone,
        "special_instructions": special_instructions
    }

    order_resp = supabase.table("orders").insert(order_data).execute()
    order_id = order_resp.data[0]["id"]

    # Insert order items
    for item in order_items:
        item["order_id"] = order_id
        supabase.table("order_items").insert(item).execute()

    # For CASH orders only: send notification and mark as ready for CODs
    if payment_method == "cash":
        try:
            send_new_order_notification_to_merchant(
                merchant_email=merchant_email,
                order_number=order_number,
                total_amount=total_amount,
                order_id=order_id,
                restaurant_name=restaurant_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                delivery_address=delivery_address
            )
            print(f"✅ Cash order notification sent to merchant: {merchant_email}")
        except Exception as e:
            print(f"Cash order notification failed: {e}")

        # Also send push notification for cash orders
        try:
            send_expo_notification_to_merchant(
                merchant_email=merchant_email,
                order_number=order_number,
                total_amount=total_amount,
                order_id=order_id,
                order_type="cod"
            )
        except Exception as e:
            print(f"Expo notification for cash order failed: {e}")

    # For UPI orders - DO NOT send notification
    # Notification will be sent only after payment confirmation via webhook

    return Response({
        "message": "Order created successfully",
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total_amount,
        "restaurant_name": restaurant_name,
        "status": "pending",
        "payment_status": "pending",
        "payment_method": payment_method
    })
# Helper function to generate order number
def generate_order_number():
    """Generate a unique order number without database sequence"""
    import random
    from datetime import datetime

    # Get current date
    date_str = datetime.now().strftime("%Y%m%d")

    # Generate random 6-digit number
    random_num = random.randint(100000, 999999)

    # Use timestamp milliseconds for extra uniqueness
    timestamp = int(datetime.now().timestamp() * 1000) % 10000

    # Format: ORD-20250225-123456-7890
    order_number = f"ORD-{date_str}-{random_num}-{timestamp:04d}"

    return order_number
# ====================================
# 📋 2. GET CUSTOMER ORDERS
# ====================================
@api_view(["GET"])
def get_customer_orders(request):
    """
    Get all orders for the logged-in customer
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    customer_email = user["email"]

    # Get orders
    orders_resp = supabase.table("orders") \
        .select("*") \
        .eq("customer_email", customer_email) \
        .order("created_at", desc=True) \
        .execute()

    result = []
    for order in orders_resp.data:
        # Get order items
        items_resp = supabase.table("order_items") \
            .select("*") \
            .eq("order_id", order["id"]) \
            .execute()

        # Calculate subtotal for each item and overall total
        items_with_subtotal = []
        overall_total = 0

        for item in items_resp.data:
            item_subtotal = item["price_at_time"] * item["quantity"]
            overall_total += item_subtotal

            item_with_subtotal = dict(item)  # Convert to dict to add new field
            item_with_subtotal["subtotal"] = item_subtotal
            items_with_subtotal.append(item_with_subtotal)

        # Get restaurant details
        restaurant_resp = supabase.table("restaurants") \
            .select("name, image, merchant_email") \
            .eq("id", order["restaurant_id"]) \
            .execute()

        restaurant_name = restaurant_resp.data[0]["name"] if restaurant_resp.data else "Unknown"
        restaurant_image = restaurant_resp.data[0]["image"] if restaurant_resp.data else None
        merchant_email = restaurant_resp.data[0]["merchant_email"] if restaurant_resp.data else None

        # Get merchant's phone from users table
        restaurant_phone = None
        if merchant_email:
            merchant_resp = supabase.table("users") \
                .select("phone, business_number, google_maps_url") \
                .eq("email", merchant_email) \
                .eq("role", "merchant") \
                .execute()
            if merchant_resp.data:
                restaurant_phone = merchant_resp.data[0].get("phone") or merchant_resp.data[0].get("business_number")

        result.append({
            "id": order["id"],
            "order_number": order["order_number"],
            "restaurant_name": restaurant_name,
            "restaurant_image": restaurant_image,
            "restaurant_phone": restaurant_phone,
            "total_amount": order["total_amount"],
            "calculated_total": overall_total,  # Added calculated total
            "status": order["status"],
            "payment_status": order["payment_status"],
            "payment_method": order.get("payment_method", "cash"),
            "delivery_address": order["delivery_address"],
            "customer_phone": order["customer_phone"],
            "created_at": order["created_at"],
            "items": items_with_subtotal  # Now includes subtotal for each item
        })

    return Response(result)


# ====================================
# 🍽️ 3. GET SINGLE ORDER DETAILS
# ====================================
@api_view(["GET"])
def get_order_details(request, order_id):
    """
    Get details of a specific order
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    customer_email = user["email"]

    # Get order
    order_resp = supabase.table("orders") \
        .select("*") \
        .eq("id", order_id) \
        .eq("customer_email", customer_email) \
        .execute()

    if not order_resp.data:
        return Response({"error": "Order not found"}, status=404)

    order = order_resp.data[0]

    # Get order items with subtotals
    items_resp = supabase.table("order_items") \
        .select("*") \
        .eq("order_id", order_id) \
        .execute()

    items_with_subtotal = []
    overall_total = 0

    for item in items_resp.data:
        item_subtotal = item["price_at_time"] * item["quantity"]
        overall_total += item_subtotal

        item_with_subtotal = dict(item)
        item_with_subtotal["subtotal"] = item_subtotal
        items_with_subtotal.append(item_with_subtotal)

    # Get restaurant details
    restaurant_resp = supabase.table("restaurants") \
        .select("name, image, merchant_email") \
        .eq("id", order["restaurant_id"]) \
        .execute()

    restaurant_name = restaurant_resp.data[0]["name"] if restaurant_resp.data else "Unknown"
    restaurant_image = restaurant_resp.data[0]["image"] if restaurant_resp.data else None
    merchant_email = restaurant_resp.data[0]["merchant_email"] if restaurant_resp.data else None

    # Get merchant's phone and google_maps_url from users table
    restaurant_phone = None
    restaurant_address = None
    if merchant_email:
        merchant_resp = supabase.table("users") \
            .select("phone, business_number, google_maps_url") \
            .eq("email", merchant_email) \
            .eq("role", "merchant") \
            .execute()
        if merchant_resp.data:
            restaurant_phone = merchant_resp.data[0].get("phone") or merchant_resp.data[0].get("business_number")
            restaurant_address = merchant_resp.data[0].get("google_maps_url")

    return Response({
        "id": order["id"],
        "order_number": order["order_number"],
        "restaurant": {
            "id": order["restaurant_id"],
            "name": restaurant_name,
            "image": restaurant_image,
            "phone": restaurant_phone,
            "address": restaurant_address
        },
        "total_amount": order["total_amount"],
        "calculated_total": overall_total,  # Added calculated total
        "status": order["status"],
        "payment_status": order["payment_status"],
        "payment_method": order.get("payment_method", "cash"),
        "delivery_address": order["delivery_address"],
        "customer_phone": order["customer_phone"],
        "special_instructions": order.get("special_instructions", ""),
        "created_at": order["created_at"],
        "items": items_with_subtotal  # Now includes subtotal for each item
    })


# ====================================
# 🏪 4. GET RESTAURANT ORDERS (for merchant)
# ====================================
@api_view(["GET"])
def get_restaurant_orders(request):
    """
    Get all orders for the merchant's restaurant
    """
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]

    # Get merchant's restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id, name") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]
    restaurant_name = restaurant_resp.data[0]["name"]

    # Get orders
    orders_resp = supabase.table("orders") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .order("created_at", desc=True) \
        .execute()

    result = []
    for order in orders_resp.data:
        # Get order items with subtotals
        items_resp = supabase.table("order_items") \
            .select("*") \
            .eq("order_id", order["id"]) \
            .execute()

        items_with_subtotal = []
        overall_total = 0

        for item in items_resp.data:
            item_subtotal = item["price_at_time"] * item["quantity"]
            overall_total += item_subtotal

            item_with_subtotal = dict(item)
            item_with_subtotal["subtotal"] = item_subtotal
            items_with_subtotal.append(item_with_subtotal)

        result.append({
            "id": order["id"],
            "order_number": order["order_number"],
            "customer_email": order["customer_email"],
            "customer_phone": order["customer_phone"],
            "total_amount": order["total_amount"],
            "calculated_total": overall_total,  # Added calculated total
            "status": order["status"],
            "payment_status": order["payment_status"],
            "payment_method": order.get("payment_method", "cash"),
            "delivery_address": order["delivery_address"],
            "special_instructions": order.get("special_instructions", ""),
            "created_at": order["created_at"],
            "items": items_with_subtotal  # Now includes subtotal for each item
        })

    return Response({
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_name,
        "orders": result
    })
# ====================================
# 🔄 5. UPDATE ORDER STATUS (merchant only)
# ====================================
@api_view(["PUT"])
def update_order_status(request, order_id):
    """
    Update order status (merchant only)
    Status: pending, confirmed, preparing, ready, delivered, cancelled
    """
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]
    new_status = request.data.get("status")

    valid_statuses = ["confirmed", "preparing", "ready", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        return Response({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=400)

    # Get restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]

    # Update order
    order_resp = supabase.table("orders") \
        .update({
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        }) \
        .eq("id", order_id) \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not order_resp.data:
        return Response({"error": "Order not found or not authorized"}, status=404)

    # Send status update notification to customer (optional)
    send_status_update_notification(order_resp.data[0], new_status)

    return Response({
        "message": f"Order status updated to {new_status}",
        "order_id": order_id,
        "status": new_status
    })
@api_view(["PUT"])
def mark_order_paid(request, order_id):
    """
    Mark order as paid - updates payment status without deleting the order
    """
    # Verify merchant
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]

    # Get restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]

    # Get the order
    order_resp = supabase.table("orders") \
        .select("*") \
        .eq("id", order_id) \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not order_resp.data:
        return Response({"error": "Order not found or not authorized"}, status=404)

    order = order_resp.data[0]

    # Check if order is already paid
    if order.get("payment_status") == "paid":
        return Response({"error": "Order already marked as paid"}, status=400)

    # ✅ FIX: Only update payment status, don't delete
    supabase.table("orders") \
        .update({
            "payment_status": "paid",
            "status": "confirmed",  # Optionally update status to confirmed
            "updated_at": datetime.now().isoformat()
        }) \
        .eq("id", order_id) \
        .execute()

    # Send notification to customer (optional)
    try:
        send_mail(
            subject=f"✅ Payment Confirmed - Order {order['order_number']}",
            message=f"""
            Dear Customer,

            Your payment for order {order['order_number']} has been confirmed!

            Order Amount: ₹{order['total_amount']}

            Thank you for ordering with us!
            """,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[order['customer_email']],
            fail_silently=True
        )
    except Exception as e:
        print(f"Customer notification failed: {e}")

    return Response({
        "success": True,
        "message": f"Order {order['order_number']} marked as paid",
        "order_id": order_id,
        "order_number": order['order_number'],
        "payment_status": "paid"
    })
# ====================================
# 📋 10. VIEW ARCHIVED ORDERS (For merchants)
# ====================================
@api_view(["GET"])
def get_archived_orders(request):
    """
    Get all archived orders for the merchant's restaurant
    """
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]

    # Get restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id, name") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]
    restaurant_name = restaurant_resp.data[0]["name"]

    # Get archived orders
    archived_resp = supabase.table("order_archive") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .order("archived_at", desc=True) \
        .limit(50) \
        .execute()

    result = []
    for order in archived_resp.data:
        # Get archived items for this order
        items_resp = supabase.table("order_items_archive") \
            .select("*") \
            .eq("order_id", order["id"]) \
            .execute()

        result.append({
            "id": order["id"],
            "order_number": order["order_number"],
            "customer_email": order["customer_email"],
            "customer_phone": order["customer_phone"],
            "total_amount": order["total_amount"],
            "payment_method": order["payment_method"],
            "delivery_address": order["delivery_address"],
            "completed_at": order["completed_at"],
            "archived_at": order["archived_at"],
            "items": items_resp.data
        })

    return Response({
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_name,
        "archived_orders": result
    })
# ====================================
# 📋 11. VIEW CUSTOMER ARCHIVED ORDERS
# ====================================
@api_view(["GET"])
def get_customer_archived_orders(request):
    """
    Get all archived orders for the logged-in customer
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    customer_email = user["email"]

    # Get archived orders
    archived_resp = supabase.table("order_archive") \
        .select("*") \
        .eq("customer_email", customer_email) \
        .order("archived_at", desc=True) \
        .limit(50) \
        .execute()

    result = []
    for order in archived_resp.data:
        # Get restaurant details
        restaurant_resp = supabase.table("restaurants") \
            .select("name, image") \
            .eq("id", order["restaurant_id"]) \
            .execute()

        restaurant_name = restaurant_resp.data[0]["name"] if restaurant_resp.data else "Unknown"

        # Get archived items
        items_resp = supabase.table("order_items_archive") \
            .select("*") \
            .eq("order_id", order["id"]) \
            .execute()

        result.append({
            "id": order["id"],
            "order_number": order["order_number"],
            "restaurant_name": restaurant_name,
            "total_amount": order["total_amount"],
            "completed_at": order["completed_at"],
            "items": items_resp.data
        })

    return Response(result)

# ====================================
# ❌ 7. CANCEL ORDER (customer)
# ====================================
@api_view(["PUT"])
def cancel_order(request, order_id):
    """
    Customer can cancel their order if it's still pending
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    customer_email = user["email"]

    # Get order
    order_resp = supabase.table("orders") \
        .select("*") \
        .eq("id", order_id) \
        .eq("customer_email", customer_email) \
        .execute()

    if not order_resp.data:
        return Response({"error": "Order not found"}, status=404)

    order = order_resp.data[0]

    # Check if order can be cancelled (only pending orders)
    if order["status"] != "pending":
        return Response({"error": "Only pending orders can be cancelled"}, status=400)

    # Update order status
    supabase.table("orders") \
        .update({
            "status": "cancelled",
            "updated_at": datetime.now().isoformat()
        }) \
        .eq("id", order_id) \
        .execute()

    return Response({
        "message": "Order cancelled successfully",
        "order_id": order_id
    })

# ====================================
# 📧 8. HELPER FUNCTION FOR NOTIFICATIONS
# ====================================
def send_order_notification_to_merchant(merchant_email, order_number, amount, restaurant_name,
                                       customer_email, customer_phone, customer_location,
                                       merchant_location=None):
    """Send notification to merchant about new order with location links"""
    subject = f"New Order Received - {order_number}"
    message = f"""
    You have received a new order!

    Order Number: {order_number}
    Amount: ₹{amount}
    Restaurant: {restaurant_name}

    Customer Details:
    Email: {customer_email}
    Phone: {customer_phone}

    📍 Customer Location: {customer_location}

    Please login to your dashboard to view and confirm the order.
    """

    if merchant_location:
        message += f"\n📍 Your Restaurant Location: {merchant_location}"

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[merchant_email],
        fail_silently=True
    )
def send_status_update_notification(order, new_status):
    """Send status update notification to customer"""
    status_messages = {
        "confirmed": "Your order has been confirmed and will be prepared soon.",
        "preparing": "Your order is being prepared.",
        "ready": "Your order is ready for delivery/pickup.",
        "delivered": "Your order has been delivered. Enjoy your meal!",
        "cancelled": "Your order has been cancelled."
    }

    subject = f"Order Status Update - {order['order_number']}"
    message = f"""
    Dear Customer,

    {status_messages.get(new_status, f"Your order status has been updated to: {new_status}")}

    Order Number: {order['order_number']}

    Thank you for ordering with us!
    """
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[order['customer_email']],
        fail_silently=True
    )


# ====================================
# 📧 HELPER: Send payment notification to merchant
# ====================================
def send_payment_notification_to_merchant(merchant_email, order_number, amount, customer_email, transaction_id):
    """Send notification to merchant about successful payment"""
    from django.core.mail import send_mail
    from django.conf import settings

    subject = f"💰 Payment Received for Order {order_number}"
    message = f"""
    You have received a payment!

    Order Number: {order_number}
    Amount: ₹{amount}
    Customer: {customer_email}
    Transaction ID: {transaction_id}

    The order has been automatically confirmed. Please prepare it for delivery.
    """

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[merchant_email],
            fail_silently=True
        )
    except Exception as e:
        print(f"Payment notification email failed: {e}")


# ====================================
# 💳 15. GET CASHFREE CONFIG
# ====================================
@api_view(["GET"])
def get_cashfree_config(request):
    """Get Cashfree configuration for frontend"""
    config_resp = supabase.table("payment_gateway_config") \
        .select("app_id, mode") \
        .eq("is_active", True) \
        .limit(1) \
        .execute()

    if not config_resp.data:
        return Response({"error": "Payment gateway not configured"}, status=500)

    config = config_resp.data[0]
    return Response({
        "app_id": config["app_id"],
        "mode": config["mode"]
    })

# ====================================
# 💳 16. CREATE CASHFREE ORDER
# ====================================
# ====================================
# 💳 16. CREATE CASHFREE ORDER
# ====================================
@api_view(["POST"])
def create_cashfree_order(request):
    """
    Create a Cashfree order for payment
    POST /api/payment/cashfree/create/
    {
        "order_id": "uuid",  # Your internal order ID
        "customer_phone": "9999999999",
        "customer_email": "customer@example.com",
        "customer_name": "Customer Name",
        "return_url": "optional_custom_return_url"  # NEW: For mobile apps
    }
    """
    print("\n" + "="*50)
    print("🔍 DEBUG - create_cashfree_order called")
    print("="*50)

    # Verify customer
    user = verify_role(request, "customer")
    if not user:
        print("❌ ERROR - User not authorized")
        return Response({"error": "Unauthorized"}, status=401)

    print(f"✅ User authenticated: {user['email']}")

    data = request.data
    print(f"📦 Request data: {data}")

    order_id = data.get("order_id")
    customer_phone = data.get("customer_phone")
    customer_email = data.get("customer_email", user["email"])
    customer_name = data.get("customer_name", "Customer")
    # NEW: Get return_url from request, with default for web
    return_url = data.get("return_url", "https://basicsbox.vercel.app/payment-callback")

    if not order_id or not customer_phone:
        print("❌ ERROR - Missing order_id or customer_phone")
        return Response({"error": "Order ID and customer phone are required"}, status=400)

    # Get order details
    print(f"🔍 Fetching order details for ID: {order_id}")
    try:
        order_resp = supabase.table("orders") \
            .select("*, restaurants!inner(name)") \
            .eq("id", order_id) \
            .eq("customer_email", user["email"]) \
            .execute()

        print(f"📊 Order response: {order_resp.data}")
    except Exception as e:
        print(f"❌ Supabase order fetch error: {str(e)}")
        return Response({"error": f"Database error: {str(e)}"}, status=500)

    if not order_resp.data:
        print("❌ ERROR - Order not found")
        return Response({"error": "Order not found"}, status=404)

    order = order_resp.data[0]
    print(f"✅ Order found: {order['order_number']}, Amount: {order['total_amount']}")

    # Check if order is already paid
    if order.get("payment_status") == "paid":
        print("❌ ERROR - Order already paid")
        return Response({"error": "Order already paid"}, status=400)

    # Get Cashfree config
    print("🔍 Fetching Cashfree config...")
    try:
        config_resp = supabase.table("payment_gateway_config") \
            .select("*") \
            .eq("is_active", True) \
            .limit(1) \
            .execute()

        print(f"📊 Config response: {config_resp.data}")
    except Exception as e:
        print(f"❌ Supabase config fetch error: {str(e)}")
        return Response({"error": f"Database error: {str(e)}"}, status=500)

    if not config_resp.data:
        print("❌ ERROR - Payment gateway not configured")
        return Response({"error": "Payment gateway not configured"}, status=500)

    config = config_resp.data[0]
    app_id = config["app_id"]
    secret_key = config["secret_key"]
    print(f"✅ Config found - App ID: {app_id[:5]}...")

    # Generate unique Cashfree order ID
    import time
    cf_order_id = f"order_{int(time.time() * 1000)}"
    print(f"🆔 Generated Cashfree order ID: {cf_order_id}")

    # Prepare customer details
    customer_details = {
        "customer_id": user["email"].replace('@', '_').replace('.', '_'),
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "customer_name": customer_name
    }
    print(f"👤 Customer details: {customer_details}")

    # Prepare order data for Cashfree
    cf_order_data = {
        "order_id": cf_order_id,
        "order_amount": float(order["total_amount"]),
        "order_currency": "INR",
        "customer_details": customer_details,
        "order_meta": {
            "return_url": return_url  # ✅ CHANGED: Now uses dynamic return_url
        }
    }
    print(f"📦 Cashfree order data: {cf_order_data}")

    try:
        # Call Cashfree API to create order
        import requests
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2022-09-01",
            "Content-Type": "application/json"
        }

        # Use production API endpoint
        api_url = "https://api.cashfree.com/pg/orders"
        print(f"🌐 Calling Cashfree API: {api_url}")

        response = requests.post(api_url, json=cf_order_data, headers=headers)
        print(f"📊 Cashfree API response status: {response.status_code}")
        print(f"📊 Cashfree API response body: {response.text}")

        if response.status_code != 200:
            print(f"❌ Cashfree API error: {response.text}")
            try:
                response_data = response.json()
            except:
                response_data = {"error": response.text}

            return Response({
                "error": "Failed to create payment order",
                "details": response_data
            }, status=500)

        response_data = response.json()
        payment_session_id = response_data.get("payment_session_id")
        print(f"✅ Payment session ID: {payment_session_id}")

        # Save transaction in database
        import uuid
        from datetime import datetime
        import json

        tx_data = {
            "id": str(uuid.uuid4()),
            "order_id": order_id,
            "cf_order_id": cf_order_id,
            "payment_session_id": payment_session_id,
            "order_amount": order["total_amount"],
            "customer_details": json.dumps(customer_details),
            "payment_status": "PENDING",
            "cf_response": json.dumps(response_data),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        print(f"💾 Saving transaction to database: {tx_data}")

        try:
            supabase.table("cashfree_transactions").insert(tx_data).execute()
            print("✅ Transaction saved successfully")
        except Exception as e:
            print(f"❌ Error saving transaction: {str(e)}")
            # Continue even if save fails - we can still return the payment session

        return Response({
            "success": True,
            "payment_session_id": payment_session_id,
            "cf_order_id": cf_order_id,
            "order_id": order_id,
            "amount": order["total_amount"]
        })

    except requests.exceptions.RequestException as e:
        print(f"❌ Requests exception: {str(e)}")
        return Response({"error": f"Cashfree API request failed: {str(e)}"}, status=500)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Unexpected error: {str(e)}"}, status=500)
# In your cashfree_webhook function - add notification when payment succeeds

@api_view(["POST"])
@csrf_exempt
def cashfree_webhook(request):
    print("\n" + "="*60)
    print("🔔 CASHFREE WEBHOOK RECEIVED")
    print("="*60)

    try:
        data = json.loads(request.body)
        print(f"📦 Webhook data: {json.dumps(data, indent=2)}")

        webhook_data = data.get("data", {})
        order_info = webhook_data.get("order", {})
        payment_info = webhook_data.get("payment", {})
        customer_info = webhook_data.get("customer_details", {})

        cf_order_id = order_info.get("order_id")
        payment_status = payment_info.get("payment_status")
        payment_amount = payment_info.get("payment_amount")
        cf_payment_id = payment_info.get("cf_payment_id")
        payment_time = payment_info.get("payment_time")

        # Extract payment method
        payment_method_obj = payment_info.get("payment_method", {})
        payment_method = "UPI"
        if "upi" in payment_method_obj:
            payment_method = "UPI"
        elif "card" in payment_method_obj:
            payment_method = "CARD"
        elif "netbanking" in payment_method_obj:
            payment_method = "NETBANKING"

        print(f"🔍 Cashfree Order ID: {cf_order_id}")
        print(f"📊 Payment Status: {payment_status}")

        if not cf_order_id:
            print("❌ No Cashfree order ID found")
            return Response({"error": "Order ID missing"}, status=400)

        # Find transaction
        tx_resp = supabase.table("cashfree_transactions") \
            .select("*") \
            .eq("cf_order_id", cf_order_id) \
            .execute()

        if not tx_resp.data:
            print(f"❌ Transaction not found for {cf_order_id}")
            return Response({"error": "Transaction not found"}, status=404)

        transaction = tx_resp.data[0]
        order_id = transaction.get("order_id")

        print(f"✅ Found transaction: Order ID={order_id}")

        # Update transaction
        update_data = {
            "payment_method": payment_method,
            "cf_payment_id": str(cf_payment_id) if cf_payment_id else None,
            "payment_time": payment_time,
            "payment_status": payment_status,
            "cf_response": json.dumps(data),
            "updated_at": datetime.now().isoformat()
        }
        update_data = {k: v for k, v in update_data.items() if v is not None}

        supabase.table("cashfree_transactions") \
            .update(update_data) \
            .eq("id", transaction["id"]) \
            .execute()

        print("✅ Transaction updated")

        # ============================================
        # IF PAYMENT SUCCESSFUL - Update order AND send notification
        # ============================================
        if payment_status and payment_status.upper() in ["SUCCESS", "PAID"]:
            print(f"💰 Payment SUCCESS for order {order_id}")

            # Get order details first
            order_resp = supabase.table("orders") \
                .select("*, restaurants!inner(name, merchant_email)") \
                .eq("id", order_id) \
                .execute()

            if order_resp.data:
                order = order_resp.data[0]

                # Check if already paid
                if order.get("payment_status") == "paid":
                    print(f"⚠️ Order {order['order_number']} already marked as paid")
                else:
                    # Update order to PAID
                    order_update = {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "updated_at": datetime.now().isoformat()
                    }

                    supabase.table("orders") \
                        .update(order_update) \
                        .eq("id", order_id) \
                        .execute()

                    print(f"✅ Order {order['order_number']} updated to PAID")

                    # ============================================
                    # 🎯 SEND NOTIFICATION TO MERCHANT NOW!
                    # ============================================
                    merchant_email = order["restaurants"]["merchant_email"]
                    restaurant_name = order["restaurants"]["name"]
                    order_number = order["order_number"]
                    total_amount = order["total_amount"]
                    customer_email = order["customer_email"]
                    customer_phone = order["customer_phone"]
                    delivery_address = order["delivery_address"]

                    # Send email notification
                    try:
                        send_payment_success_notification_to_merchant(
                            merchant_email=merchant_email,
                            order_number=order_number,
                            total_amount=total_amount,
                            order_id=order_id,
                            restaurant_name=restaurant_name,
                            customer_email=customer_email,
                            customer_phone=customer_phone,
                            delivery_address=delivery_address,
                            payment_method=payment_method,
                            transaction_id=cf_payment_id
                        )
                        print(f"✅ Payment success notification EMAIL sent to merchant: {merchant_email}")
                    except Exception as e:
                        print(f"Email notification failed: {e}")

                    # Send push notification via Expo
                    try:
                        send_expo_notification_to_merchant(
                            merchant_email=merchant_email,
                            order_number=order_number,
                            total_amount=total_amount,
                            order_id=order_id,
                            order_type="upi"
                        )
                        print(f"✅ Push notification sent to merchant: {merchant_email}")
                    except Exception as e:
                        print(f"Push notification failed: {e}")

                    # Send confirmation email to customer
                    try:
                        send_mail(
                            subject=f"✅ Payment Confirmed - Order {order_number}",
                            message=f"""
Dear Customer,

Your payment of ₹{total_amount} has been successfully received!

Order Number: {order_number}
Restaurant: {restaurant_name}
Payment Method: {payment_method}
Transaction ID: {cf_payment_id}

Your order has been confirmed and will be prepared shortly.

Thank you for ordering with us!
""",
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[customer_email],
                            fail_silently=True
                        )
                        print(f"✅ Confirmation email sent to: {customer_email}")
                    except Exception as e:
                        print(f"Customer email failed: {e}")

            else:
                print(f"❌ Order {order_id} not found")

        return Response({
            "status": "ok",
            "message": "Webhook processed successfully",
            "order_id": order_id,
            "payment_status": payment_status
        })

    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {e}")
        return Response({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)
# ====================================
# 💳 18. VERIFY CASHFREE PAYMENT
# ====================================
@api_view(["POST"])
def verify_cashfree_payment(request):
    """
    Verify payment status after frontend callback
    POST /api/payment/cashfree/verify/
    {
        "order_id": "uuid",  # Your internal order ID
        "cf_order_id": "order_1234567890"
    }
    """
    user = verify_role(request, "customer")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    data = request.data
    order_id = data.get("order_id")
    cf_order_id = data.get("cf_order_id")

    if not order_id or not cf_order_id:
        return Response({"error": "Order ID and Cashfree Order ID required"}, status=400)

    # Get transaction
    tx_resp = supabase.table("cashfree_transactions") \
        .select("*") \
        .eq("order_id", order_id) \
        .eq("cf_order_id", cf_order_id) \
        .execute()

    if not tx_resp.data:
        return Response({"error": "Transaction not found"}, status=404)

    transaction = tx_resp.data[0]

    # Get order details
    order_resp = supabase.table("orders") \
        .select("*, restaurants(name)") \
        .eq("id", order_id) \
        .execute()

    return Response({
        "success": transaction["payment_status"] == "PAID",
        "payment_status": transaction["payment_status"],
        "order": {
            "order_id": order_id,
            "order_number": order_resp.data[0]["order_number"],
            "restaurant_name": order_resp.data[0]["restaurants"]["name"],
            "amount": transaction["order_amount"],
            "status": "confirmed" if transaction["payment_status"] == "PAID" else "pending",
            "payment_status": "paid" if transaction["payment_status"] == "PAID" else "pending"
        }
    })

# Add this helper function

def send_payment_success_notification_to_merchant(merchant_email, order_number, total_amount, order_id,
                                                   restaurant_name, customer_email, customer_phone,
                                                   delivery_address, payment_method, transaction_id):
    """Send notification to merchant when UPI payment is successful"""
    subject = f"💰 NEW PAID ORDER - {order_number}"
    message = f"""
You have received a NEW PAID ORDER!

Order Number: {order_number}
Amount: ₹{total_amount}
Restaurant: {restaurant_name}
Payment Method: {payment_method}
Transaction ID: {transaction_id}

Customer Details:
Email: {customer_email}
Phone: {customer_phone}

📍 Delivery Location: {delivery_address}

✨ This order is already PAID. Please confirm and prepare it for delivery.

Please login to your dashboard to view the order:
https://basicsbox.vercel.app/merchant?tab=orders

---
Basics Box Team
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[merchant_email],
            fail_silently=True
        )
        print(f"✅ Payment success email sent to {merchant_email}")
    except Exception as e:
        print(f"Failed to send payment success email: {e}")
# ====================================
# 💳 19. GET ALL TRANSACTIONS - FIXED
# ====================================
@api_view(["GET"])
def get_all_transactions(request):
    """
    Get all transactions for admin dashboard
    """
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # DON'T limit to 100 - get all transactions
    tx_resp = supabase.table("cashfree_transactions") \
        .select("*, orders!inner(order_number, restaurants(name))") \
        .order("created_at", desc=True) \
        .execute()  # Removed .limit(100)

    result = []
    for tx in tx_resp.data:
        # Parse customer_details
        customer_details = {}
        if tx.get("customer_details"):
            try:
                customer_details = json.loads(tx["customer_details"])
            except:
                customer_details = {}

        # Default values
        raw_status = "PENDING"
        transaction_id = tx.get("cf_order_id", "")
        payment_method = "UPI"

        # READ FROM WEBHOOK RESPONSE
        if tx.get("cf_response"):
            try:
                cf_response = json.loads(tx["cf_response"])

                # Handle nested webhook format
                if "data" in cf_response and "payment" in cf_response["data"]:
                    payment_data = cf_response["data"]["payment"]
                    if payment_data.get("payment_status"):
                        raw_status = payment_data["payment_status"]
                    if payment_data.get("cf_payment_id"):
                        transaction_id = str(payment_data["cf_payment_id"])

                    # ✅ FIX: Extract just the payment method name, not the whole object
                    if payment_data.get("payment_method"):
                        pm = payment_data["payment_method"]
                        if isinstance(pm, dict):
                            if "upi" in pm:
                                payment_method = "UPI"
                            elif "card" in pm:
                                payment_method = "CARD"
                            else:
                                payment_method = list(pm.keys())[0] if pm.keys() else "UPI"
                        else:
                            payment_method = str(pm)

                # Handle old format
                elif cf_response.get("order_status"):
                    raw_status = cf_response["order_status"]
                    if cf_response.get("cf_payment_id"):
                        transaction_id = str(cf_response["cf_payment_id"])
                    if cf_response.get("payment_method"):
                        payment_method = str(cf_response["payment_method"])

            except json.JSONDecodeError:
                print(f"Error parsing cf_response for {tx['id']}")

        # Ensure transaction_id is string
        if transaction_id is not None:
            transaction_id = str(transaction_id)
        else:
            transaction_id = ""

        result.append({
            "id": str(tx["id"]),
            "date_time": tx["created_at"],
            "transaction_id": transaction_id,
            "transaction_amount": float(tx["order_amount"]),
            "payment_method": payment_method,  # Now just "UPI" not the whole object
            "status": str(raw_status),
            "customer_phone": str(customer_details.get("customer_phone")) if customer_details.get("customer_phone") else None,
            "order_id": str(tx["orders"]["order_number"]) if tx.get("orders") else None,
            "order_amount": float(tx["order_amount"]),
            "customer_ref_id": str(customer_details.get("customer_id")) if customer_details.get("customer_id") else None,
            "restaurant_name": str(tx["orders"]["restaurants"]["name"]) if tx.get("orders") and tx["orders"].get("restaurants") else None
        })

    return Response({
        "success": True,
        "count": len(result),
        "transactions": result
    })
# Add this endpoint to test if webhook is reachable
@api_view(["GET", "POST"])
def test_webhook(request):
    """Test endpoint to verify webhook connectivity"""
    print("\n" + "="*60)
    print("🔔 TEST WEBHOOK CALLED")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Data: {request.data}")
    print("="*60)
    return Response({
        "status": "ok",
        "message": "Webhook test successful",
        "timestamp": datetime.now().isoformat()
    })
# ====================================
# 💳 20. FETCH TRANSACTIONS FROM CASHFREE API - FIXED
# ====================================
@api_view(["GET"])
def fetch_cashfree_transactions(request):
    """
    Fetch transactions directly from Cashfree API
    GET /api/admin/cashfree-transactions/?from_date=2026-03-01&to_date=2026-03-04
    """
    # Verify admin
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get date parameters (default to last 7 days)
    to_date = request.GET.get("to_date", datetime.now().strftime("%Y-%m-%d"))
    from_date = request.GET.get("from_date", (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"))

    # Get Cashfree config
    config_resp = supabase.table("payment_gateway_config") \
        .select("*") \
        .eq("is_active", True) \
        .limit(1) \
        .execute()

    if not config_resp.data:
        return Response({"error": "Payment gateway not configured"}, status=500)

    config = config_resp.data[0]
    app_id = config["app_id"]
    secret_key = config["secret_key"]

    # Determine environment
    is_sandbox = app_id.startswith("TEST")
    base_url = "https://sandbox.cashfree.com/pg" if is_sandbox else "https://api.cashfree.com/pg"

    try:
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2022-09-01",
            "Content-Type": "application/json"
        }

        transactions = []

        # METHOD 1: Try to get settlements first (has date filtering)
        settlements_url = f"{base_url}/settlements"
        settlements_params = {
            "from_date": from_date,
            "to_date": to_date,
            "limit": 50
        }

        print(f"🔍 Fetching settlements from: {settlements_url}")
        settlements_response = requests.get(settlements_url, headers=headers, params=settlements_params)

        if settlements_response.status_code == 200:
            settlements_data = settlements_response.json()

            if isinstance(settlements_data, list) and settlements_data:
                for settlement in settlements_data:
                    settlement_id = settlement.get("cf_settlement_id")

                    # Get orders in this settlement
                    orders_url = f"{base_url}/settlements/{settlement_id}/orders"
                    orders_response = requests.get(orders_url, headers=headers)

                    if orders_response.status_code == 200:
                        orders = orders_response.json()

                        for order in orders:
                            order_id = order.get("order_id")

                            # Get payments for this order
                            payments_url = f"{base_url}/orders/{order_id}/payments"
                            payments_response = requests.get(payments_url, headers=headers)

                            if payments_response.status_code == 200:
                                payments = payments_response.json()

                                for payment in payments:
                                    transactions.append({
                                        "date_time": payment.get("payment_time") or order.get("created_at"),
                                        "transaction_id": payment.get("cf_payment_id"),
                                        "transaction_amount": payment.get("payment_amount"),
                                        "payment_method": payment.get("payment_method", "UPI"),
                                        "status": payment.get("payment_status"),  # SUCCESS, FAILED, USER_DROPPED
                                        "customer_phone": order.get("customer_details", {}).get("customer_phone"),
                                        "order_id": order_id,
                                        "order_amount": order.get("order_amount"),
                                        "customer_ref_id": order.get("customer_details", {}).get("customer_id"),
                                        "restaurant_name": None
                                    })

        # METHOD 2: If no settlements, get recent orders from your database
        if not transactions:
            print("📦 No settlements found, fetching orders from database...")

            # Get recent orders from your database
            db_orders = supabase.table("orders") \
                .select("cf_order_id, order_number, created_at") \
                .not_.is_("cf_order_id", "null") \
                .order("created_at", desc=True) \
                .limit(20) \
                .execute()

            for db_order in db_orders.data:
                cf_order_id = db_order.get("cf_order_id")

                # Fetch order from Cashfree
                order_url = f"{base_url}/orders/{cf_order_id}"
                order_response = requests.get(order_url, headers=headers)

                if order_response.status_code == 200:
                    order = order_response.json()

                    # Fetch payments
                    payments_url = f"{base_url}/orders/{cf_order_id}/payments"
                    payments_response = requests.get(payments_url, headers=headers)

                    if payments_response.status_code == 200:
                        payments = payments_response.json()

                        for payment in payments:
                            transactions.append({
                                "date_time": payment.get("payment_time") or order.get("created_at"),
                                "transaction_id": payment.get("cf_payment_id"),
                                "transaction_amount": payment.get("payment_amount"),
                                "payment_method": payment.get("payment_method", "UPI"),
                                "status": payment.get("payment_status"),
                                "customer_phone": order.get("customer_details", {}).get("customer_phone"),
                                "order_id": cf_order_id,
                                "order_amount": order.get("order_amount"),
                                "customer_ref_id": order.get("customer_details", {}).get("customer_id"),
                                "restaurant_name": None
                            })

        return Response({
            "success": True,
            "count": len(transactions),
            "environment": "production" if not is_sandbox else "sandbox",
            "from_date": from_date,
            "to_date": to_date,
            "transactions": transactions
        })

    except requests.exceptions.RequestException as e:
        print(f"❌ Cashfree API error: {str(e)}")
        return Response({"error": f"Cashfree API error: {str(e)}"}, status=500)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return Response({"error": f"Unexpected error: {str(e)}"}, status=500)
# ====================================
# 💳 21. GET SINGLE ORDER FROM CASHFREE
# ====================================
@api_view(["GET"])
def fetch_cashfree_order(request, order_id):
    """
    Fetch a single order from Cashfree API by order_id
    GET /api/admin/cashfree-order/order_1772634799908/
    """
    # Verify admin
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get Cashfree config
    config_resp = supabase.table("payment_gateway_config") \
        .select("*") \
        .eq("is_active", True) \
        .limit(1) \
        .execute()

    if not config_resp.data:
        return Response({"error": "Payment gateway not configured"}, status=500)

    config = config_resp.data[0]
    app_id = config["app_id"]
    secret_key = config["secret_key"]

    is_sandbox = app_id.startswith("TEST")
    base_url = "https://sandbox.cashfree.com/pg" if is_sandbox else "https://api.cashfree.com/pg"

    try:
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2022-09-01",
            "Content-Type": "application/json"
        }

        # Fetch order details [citation:3][citation:7]
        order_url = f"{base_url}/orders/{order_id}"
        order_response = requests.get(order_url, headers=headers)

        if order_response.status_code != 200:
            return Response({
                "error": "Order not found in Cashfree",
                "details": order_response.text
            }, status=order_response.status_code)

        order_data = order_response.json()

        # Fetch payments for this order [citation:3]
        payments_url = f"{base_url}/orders/{order_id}/payments"
        payments_response = requests.get(payments_url, headers=headers)

        payments = []
        if payments_response.status_code == 200:
            payments = payments_response.json()

        return Response({
            "success": True,
            "order": order_data,
            "payments": payments
        })

    except requests.exceptions.RequestException as e:
        print(f"❌ Cashfree API error: {str(e)}")
        return Response({"error": f"Cashfree API error: {str(e)}"}, status=500)

# ====================================
# 💳 22. UPDATE CASHFREE TRANSACTION FROM API
# ====================================
@api_view(["POST"])
def update_cashfree_transaction(request, transaction_id):
    """
    Fetch latest data from Cashfree API and update transaction
    POST /api/admin/update-transaction/<transaction_id>/
    """
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get the transaction from database
    tx_resp = supabase.table("cashfree_transactions") \
        .select("*") \
        .eq("id", transaction_id) \
        .execute()

    if not tx_resp.data:
        return Response({"error": "Transaction not found"}, status=404)

    transaction = tx_resp.data[0]
    cf_order_id = transaction.get("cf_order_id")

    if not cf_order_id:
        return Response({"error": "No Cashfree order ID found"}, status=400)

    # Fetch fresh data from Cashfree
    result = fetch_cashfree_order_internal(cf_order_id)

    if "error" in result:
        return Response(result, status=500)

    # Update transaction with new data
    update_data = {
        "payment_method": result["payment_method"],
        "cf_payment_id": result["cf_payment_id"],
        "payment_time": result["payment_time"],
        "updated_at": datetime.now().isoformat()
    }

    supabase.table("cashfree_transactions") \
        .update(update_data) \
        .eq("id", transaction_id) \
        .execute()

    # Also update orders table if payment was successful
    if result.get("payment_status") in ["SUCCESS", "PAID"]:
        supabase.table("orders") \
            .update({
                "payment_status": "paid",
                "status": "confirmed",
                "updated_at": datetime.now().isoformat()
            }) \
            .eq("id", transaction["order_id"]) \
            .execute()

    return Response({
        "success": True,
        "message": "Transaction updated successfully",
        "updated_fields": update_data
    })
# ====================================
# 🔄 23. BATCH UPDATE ALL TRANSACTIONS
# ====================================
@api_view(["POST"])
def batch_update_transactions(request):
    """
    Update all transactions with missing data from Cashfree
    POST /api/admin/batch-update-transactions/
    """
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Find transactions with missing payment data
    tx_resp = supabase.table("cashfree_transactions") \
        .select("*") \
        .is_("cf_payment_id", "null") \
        .execute()

    updated = []
    failed = []

    for tx in tx_resp.data:
        try:
            result = fetch_cashfree_order_internal(tx["cf_order_id"])

            if "error" not in result:
                update_data = {
                    "payment_method": result["payment_method"],
                    "cf_payment_id": result["cf_payment_id"],
                    "payment_time": result["payment_time"],
                    "updated_at": datetime.now().isoformat()
                }

                supabase.table("cashfree_transactions") \
                    .update(update_data) \
                    .eq("id", tx["id"]) \
                    .execute()

                # Update orders table if payment was successful
                if result.get("payment_status") in ["SUCCESS", "PAID"]:
                    supabase.table("orders") \
                        .update({
                            "payment_status": "paid",
                            "status": "confirmed",
                            "updated_at": datetime.now().isoformat()
                        }) \
                        .eq("id", tx["order_id"]) \
                        .execute()

                updated.append({
                    "id": tx["id"],
                    "cf_order_id": tx["cf_order_id"]
                })
            else:
                failed.append({
                    "id": tx["id"],
                    "cf_order_id": tx["cf_order_id"],
                    "error": result["error"]
                })
        except Exception as e:
            failed.append({
                "id": tx["id"],
                "cf_order_id": tx["cf_order_id"],
                "error": str(e)
            })

    return Response({
        "success": True,
        "updated_count": len(updated),
        "failed_count": len(failed),
        "updated": updated,
        "failed": failed
    })


# ====================================
# 🔧 INTERNAL HELPER FUNCTION
# ====================================
def fetch_cashfree_order_internal(order_id):
    """Internal function to fetch order data without auth check"""
    try:
        config_resp = supabase.table("payment_gateway_config") \
            .select("*") \
            .eq("is_active", True) \
            .limit(1) \
            .execute()

        if not config_resp.data:
            return {"error": "Payment gateway not configured"}

        config = config_resp.data[0]
        app_id = config["app_id"]
        secret_key = config["secret_key"]

        is_sandbox = app_id.startswith("TEST")
        base_url = "https://sandbox.cashfree.com/pg" if is_sandbox else "https://api.cashfree.com/pg"

        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2022-09-01"
        }

        # Get payments for the order
        payments_url = f"{base_url}/orders/{order_id}/payments"
        payments_response = requests.get(payments_url, headers=headers, timeout=10)

        if payments_response.status_code == 200:
            payments = payments_response.json()
            if payments:
                payment = payments[0]  # Get first payment

                # Extract payment method
                payment_method = "UNKNOWN"
                if payment.get("payment_method"):
                    if "upi" in payment["payment_method"]:
                        payment_method = "UPI"
                    elif "card" in payment["payment_method"]:
                        payment_method = "CARD"
                    elif "netbanking" in payment["payment_method"]:
                        payment_method = "NETBANKING"

                return {
                    "payment_method": payment_method,
                    "cf_payment_id": str(payment.get("cf_payment_id")),
                    "payment_time": payment.get("payment_time"),
                    "payment_status": payment.get("payment_status")
                }

        return {"error": "No payment data found"}

    except Exception as e:
        return {"error": str(e)}


# ====================================
# 🔓 24. PUBLIC CASHFREE ORDER LOOKUP (NO AUTH)
# ====================================
@api_view(["GET"])
def public_cashfree_order(request, order_id):
    """
    Public endpoint to fetch order from Cashfree - NO AUTH REQUIRED
    GET /api/public/cashfree-order/order_1772634799908/
    """
    # Get Cashfree config (still need credentials)
    config_resp = supabase.table("payment_gateway_config") \
        .select("*") \
        .eq("is_active", True) \
        .limit(1) \
        .execute()

    if not config_resp.data:
        return Response({"error": "Payment gateway not configured"}, status=500)

    config = config_resp.data[0]
    app_id = config["app_id"]
    secret_key = config["secret_key"]

    is_sandbox = app_id.startswith("TEST")
    base_url = "https://sandbox.cashfree.com/pg" if is_sandbox else "https://api.cashfree.com/pg"

    try:
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2022-09-01"
        }

        # Fetch order
        order_url = f"{base_url}/orders/{order_id}"
        order_response = requests.get(order_url, headers=headers, timeout=10)

        if order_response.status_code != 200:
            return Response({
                "error": "Order not found in Cashfree",
                "details": order_response.text
            }, status=order_response.status_code)

        order_data = order_response.json()

        # Fetch payments
        payments_url = f"{base_url}/orders/{order_id}/payments"
        payments_response = requests.get(payments_url, headers=headers, timeout=10)

        payments = []
        if payments_response.status_code == 200:
            payments = payments_response.json()

        return Response({
            "success": True,
            "order": order_data,
            "payments": payments
        })

    except requests.exceptions.RequestException as e:
        return Response({"error": f"Cashfree API error: {str(e)}"}, status=500)

@api_view(["POST"])
def google_auth_customer(request):
    """
    Google authentication for customers using Firebase
    POST /api/auth/google/customer/
    {
        "id_token": "firebase-id-token"
    }
    """
    return google_auth_base(request, "customer")

@api_view(["POST"])
def google_auth_merchant(request):
    """
    Google authentication for merchants using Firebase
    POST /api/auth/google/merchant/
    {
        "id_token": "firebase-id-token"
    }
    """
    return google_auth_base(request, "merchant")
def google_auth_base(request, role):
    """Base function for Google authentication - Auto approve ALL users (no admin)"""
    try:
        data = request.data
        id_token = data.get("id_token")

        print(f"🔵 Google auth attempt for role: {role}")
        print(f"🔵 Token received: {'Yes' if id_token else 'No'}")

        if not id_token:
            print("❌ No ID token provided")
            return Response({"error": "ID token is required"}, status=400)

        # Verify Firebase token
        firebase_user = verify_firebase_token(id_token)

        if not firebase_user:
            print("❌ Token verification failed")
            return Response({"error": "Invalid or expired token"}, status=401)

        print(f"✅ Token verified for email: {firebase_user['email']}")

        email = firebase_user['email']
        name = firebase_user.get('name', email.split('@')[0])

        # Check if user already exists in users table
        user_resp = supabase.table("users") \
            .select("*") \
            .eq("email", email) \
            .eq("role", role) \
            .execute()

        if user_resp.data:
            # Existing user - login
            user = user_resp.data[0]
            access_token, refresh_token = generate_tokens(email, role)

            print(f"✅ Existing {role} logged in: {email}")
            return Response({
                "success": True,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "role": role,
                "email": user["email"],
                "name": user.get("name", name),
                "message": "Login successful"
            })

        # New user - auto approve and add directly to users table
        print(f"🆕 New {role} registration (auto-approved): {email}")

        # Clean up any pending entries if they exist
        if role == "customer":
            pending_table = "pending_customers"
        else:
            pending_table = "pending_merchants"

        pending_resp = supabase.table(pending_table) \
            .select("*") \
            .eq("email", email) \
            .execute()

        if pending_resp.data:
            # Remove from pending if exists
            supabase.table(pending_table).delete().eq("email", email).execute()
            print(f"🧹 Removed from {pending_table}")

        # Prepare user data based on role
        if role == "customer":
            user_data = {
                "name": name,
                "email": email,
                "phone": "",
                "role": "customer",
                "password_hash": None,
                "firebase_uid": firebase_user['uid'],
                "auth_provider": "google"
            }
        else:  # merchant
            user_data = {
                "name": name,
                "restaurant_name": name,
                "email": email,
                "business_number": "",
                "role": "merchant",
                "password_hash": None,
                "firebase_uid": firebase_user['uid'],
                "auth_provider": "google",
                "document_url": None,
                "cover_image_url": None,
                "latitude": None,
                "longitude": None,
                "google_maps_url": None
            }

        # Insert directly into users table (auto-approved)
        supabase.table("users").insert(user_data).execute()
        print(f"✅ Added to users table as {role}")

        # Generate tokens and login immediately
        access_token, refresh_token = generate_tokens(email, role)

        # Send welcome email (optional)
        try:
            if role == "customer":
                subject = "Welcome to Basics Box!"
                message = f"""
Dear {name},

Welcome to Basics Box! 🎉

Your customer account has been successfully created.

You can now start ordering your favorite food from our platform.

Happy ordering!

Best regards,
Basics Box Team
"""
            else:
                subject = "Welcome to Basics Box - Merchant Account"
                message = f"""
Dear {name},

Welcome to Basics Box as a Merchant! 🎉

Your merchant account has been successfully created.

You can now log in and start adding your restaurant and menu items.

Best regards,
Basics Box Team
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=True
            )
            print(f"📧 Welcome email sent to {email}")
        except Exception as e:
            print(f"Welcome email failed: {e}")

        return Response({
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "role": role,
            "email": email,
            "name": name,
            "message": f"Account created successfully"
        })

    except Exception as e:
        print(f"❌ Unexpected error in google_auth_base: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)


@api_view(["GET"])
def check_google_auth_status(request, email):
    """
    Check if a Google-authenticated user is approved
    GET /api/auth/google/status/<email>/?role=customer
    """
    role = request.GET.get("role")
    if not role or role not in ["customer", "merchant"]:
        return Response({"error": "Valid role required"}, status=400)

    # Check if user is approved
    user_resp = supabase.table("users") \
        .select("*") \
        .eq("email", email) \
        .eq("role", role) \
        .execute()

    if user_resp.data:
        user = user_resp.data[0]
        return Response({
            "approved": True,
            "user": {
                "email": user["email"],
                "name": user.get("name"),
                "role": role
            }
        })

    # Check if user is still pending
    pending_table = "pending_customers" if role == "customer" else "pending_merchants"
    pending_resp = supabase.table(pending_table) \
        .select("*") \
        .eq("email", email) \
        .execute()

    if pending_resp.data:
        return Response({
            "approved": False,
            "pending": True,
            "message": "Your account is still pending admin approval"
        })

    return Response({
        "approved": False,
        "pending": False,
        "message": "No registration found"
    }, status=404)
# ====================================
# 💰 MERCHANT MARK COD ORDER AS PAID
# ====================================
@api_view(["POST"])
def merchant_mark_cod_paid(request, order_id):
    """
    Merchant can manually mark a COD order as paid
    POST /api/merchant/orders/<order_id>/mark-cod-paid/
    """
    # Verify merchant
    user = verify_role(request, "merchant")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    merchant_email = user["email"]

    # Get merchant's restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]

    # Get the order
    order_resp = supabase.table("orders") \
        .select("*, restaurants!inner(name)") \
        .eq("id", order_id) \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    if not order_resp.data:
        return Response({"error": "Order not found or not authorized"}, status=404)

    order = order_resp.data[0]

    # Check if order is already paid
    if order.get("payment_status") == "paid":
        return Response({"error": "Order already marked as paid"}, status=400)

    # Check if payment method is COD
    payment_method = order.get("payment_method", "").lower()
    if payment_method not in ["cash", "cod", "cash on delivery"]:
        return Response({
            "error": f"This endpoint is only for COD orders. Current payment method: {order.get('payment_method')}"
        }, status=400)

    try:
        # ✅ FIX: Only update payment status - NO ARCHIVING/DELETING
        supabase.table("orders") \
            .update({
                "payment_status": "paid",
                "status": "confirmed",
                "updated_at": datetime.now().isoformat()
            }) \
            .eq("id", order_id) \
            .execute()

        # Send confirmation to customer
        try:
            send_mail(
                subject=f"✅ Payment Confirmed - Order {order['order_number']}",
                message=f"""
                Dear Customer,

                Your payment for order {order['order_number']} has been confirmed!

                Order Amount: ₹{order['total_amount']}
                Restaurant: {order['restaurants']['name']}
                Payment Method: COD

                Your order has been confirmed and will be prepared shortly.

                Thank you for ordering with us!
                """,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[order['customer_email']],
                fail_silently=True
            )
            print(f"✅ Confirmation email sent to: {order['customer_email']}")
        except Exception as e:
            print(f"Customer notification failed: {e}")

        return Response({
            "success": True,
            "message": f"COD order {order['order_number']} marked as paid",
            "order_id": order_id,
            "order_number": order['order_number'],
            "payment_status": "paid"
        })

    except Exception as e:
        return Response({
            "error": f"Failed to process COD order: {str(e)}"
        }, status=500)
# ====================================
# 🧹 FORCE DELETE OLD ORDERS (USING IST)
# ====================================
def delete_old_orders():
    """
    Force delete ONLY PENDING orders older than 24 hours based on IST timezone
    """
    try:
        import pytz

        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)

        # Calculate cutoff time (24 hours ago in IST)
        cutoff_time_ist = now_ist - timedelta(hours=24)

        # Convert cutoff to UTC for database query (since DB stores UTC)
        cutoff_time_utc = cutoff_time_ist.astimezone(pytz.UTC)
        cutoff_iso = cutoff_time_utc.isoformat()

        print(f"🧹 Deleting PENDING orders older than IST: {cutoff_time_ist.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   (UTC cutoff: {cutoff_iso})")

        # ONLY delete orders that are PENDING and older than 24 hours
        old_orders = supabase.table("orders") \
            .select("id, order_number, created_at, payment_status, payment_method") \
            .eq("payment_status", "pending") \
            .lt("created_at", cutoff_iso) \
            .execute()

        if not old_orders.data:
            print("✅ No pending old orders to delete")
            return {"deleted_count": 0}

        deleted_count = 0

        for order in old_orders.data:
            try:
                order_id = order["id"]
                order_number = order["order_number"]

                print(f"🗑️ Deleting old PENDING order: {order_number} (created: {order['created_at']})")

                # STEP 1: Delete cashfree_transactions reference first
                try:
                    supabase.table("cashfree_transactions") \
                        .delete() \
                        .eq("order_id", order_id) \
                        .execute()
                except Exception as e:
                    pass

                # STEP 2: Delete order items
                try:
                    supabase.table("order_items") \
                        .delete() \
                        .eq("order_id", order_id) \
                        .execute()
                except Exception as e:
                    pass

                # STEP 3: Delete the order
                supabase.table("orders") \
                    .delete() \
                    .eq("id", order_id) \
                    .execute()

                deleted_count += 1
                print(f"✅ DELETED pending order: {order_number}")

            except Exception as e:
                print(f"❌ Failed to delete order {order.get('order_number', 'unknown')}: {e}")

        print(f"🧹 Total pending orders force deleted: {deleted_count}")
        return {"deleted_count": deleted_count}

    except Exception as e:
        print(f"❌ Error in delete_old_orders: {e}")
        return {"error": str(e)}

# In your views.py - Add this endpoint for scheduled cleanup
@api_view(["POST"])
def cleanup_old_orders_daily(request):
    """
    Daily cleanup of orders older than 24 hours
    Call this at midnight IST via cron job
    """
    # Optional: Add a secret key for security
    secret_key = request.headers.get('X-Cleanup-Secret')
    expected_secret = getattr(settings, 'CLEANUP_SECRET', None)

    if expected_secret and secret_key != expected_secret:
        return Response({"error": "Unauthorized"}, status=401)

    result = delete_old_orders()

    return Response({
        "success": True,
        "message": "Daily cleanup completed",
        "deleted_count": result.get("deleted_count", 0),
        "timestamp": datetime.now().isoformat()
    })

# ====================================
# 📍 API ENDPOINT TO TRIGGER DELETE (for cron job)
# ====================================
@api_view(["POST"])
def trigger_delete_old_orders(request):
    """
    API endpoint to trigger deletion of PENDING orders older than 24 hours
    """
    # Optional: Add a secret key for security
    secret_key = request.headers.get('X-Delete-Secret')
    expected_secret = getattr(settings, 'DELETE_SECRET', None)

    if expected_secret and secret_key != expected_secret:
        return Response({"error": "Unauthorized"}, status=401)

    result = delete_old_orders()

    return Response({
        "success": True,
        "message": "Old pending orders deleted",
        "deleted_count": result.get("deleted_count", 0)
    })
# ====================================
# 📊 MERCHANT ANALYTICS ENDPOINT - ONLY PAID ORDERS
# ====================================
@api_view(["GET"])
def merchant_analytics(request):
    """
    Get daily analytics for merchant including:
    - Each day's orders count and revenue (ONLY PAID ORDERS for revenue)
    - Breakdown of paid vs pending
    - List of orders per day
    """
    # Get language from header
    language = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')

    # Verify merchant
    user = verify_role(request, "merchant")
    if not user:
        error_msg = "Unauthorized"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=401)

    merchant_email = user["email"]

    # Get merchant's restaurant
    restaurant_resp = supabase.table("restaurants") \
        .select("id, name") \
        .eq("merchant_email", merchant_email) \
        .execute()

    if not restaurant_resp.data:
        error_msg = "Restaurant not found"
        if language == 'ta':
            error_msg = translator.translate(error_msg)
        return Response({"error": error_msg}, status=404)

    restaurant_id = restaurant_resp.data[0]["id"]
    restaurant_name = restaurant_resp.data[0]["name"]

    # ====================================
    # 1. GET ALL ORDERS (Active + Archived) - ONLY PAID
    # ====================================

    # Get active PAID orders from orders table
    active_orders_resp = supabase.table("orders") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .eq("payment_status", "paid") \
        .execute()

    # Get archived orders from order_archive table (all are paid)
    archived_orders_resp = supabase.table("order_archive") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .execute()

    # Combine all orders
    all_orders = []

    # Add active paid orders
    for order in active_orders_resp.data:
        all_orders.append({
            "order_number": order["order_number"],
            "total_amount": float(order["total_amount"]),
            "payment_status": "paid",  # Force to paid
            "payment_method": order.get("payment_method", "cash"),
            "created_at": order["created_at"],
            "status": order.get("status", "active"),
            "source": "active"
        })

    # Add archived orders
    for order in archived_orders_resp.data:
        all_orders.append({
            "order_number": order["order_number"],
            "total_amount": float(order["total_amount"]),
            "payment_status": "paid",  # Force to paid
            "payment_method": order.get("payment_method", "cash"),
            "created_at": order.get("created_at", order.get("completed_at")),
            "status": "completed",
            "source": "archived"
        })

    # ====================================
    # 2. GROUP ORDERS BY DATE
    # ====================================

    daily_data = {}

    for order in all_orders:
        # Extract date from created_at
        try:
            if isinstance(order["created_at"], str):
                if 'T' in order["created_at"]:
                    date_str = order["created_at"].split('T')[0]
                else:
                    date_str = order["created_at"].split(' ')[0]
            else:
                date_str = order["created_at"].strftime("%Y-%m-%d")
        except:
            continue

        # Initialize date entry if not exists
        if date_str not in daily_data:
            daily_data[date_str] = {
                "date": date_str,
                "total_orders": 0,
                "total_revenue": 0,
                "paid_orders": 0,
                "paid_revenue": 0,
                "pending_orders": 0,
                "pending_revenue": 0,
                "orders": []
            }

        # Update counts (all orders are paid here)
        daily_data[date_str]["total_orders"] += 1
        daily_data[date_str]["total_revenue"] += order["total_amount"]
        daily_data[date_str]["paid_orders"] += 1
        daily_data[date_str]["paid_revenue"] += order["total_amount"]
        # pending_orders and pending_revenue remain 0

        # Add order details
        daily_data[date_str]["orders"].append({
            "order_number": order["order_number"],
            "total_amount": order["total_amount"],
            "payment_status": "paid",
            "payment_method": order["payment_method"],
            "source": order["source"]
        })

    # ====================================
    # 3. SORT BY DATE (Newest first)
    # ====================================

    sorted_dates = sorted(daily_data.keys(), reverse=True)
    daily_analytics = [daily_data[date] for date in sorted_dates]

    # ====================================
    # 4. CALCULATE TOTALS
    # ====================================

    total_orders_all = sum(day["total_orders"] for day in daily_analytics)
    total_revenue_all = sum(day["total_revenue"] for day in daily_analytics)
    total_paid_orders = sum(day["paid_orders"] for day in daily_analytics)
    total_paid_revenue = sum(day["paid_revenue"] for day in daily_analytics)
    total_pending_orders = 0  # No pending orders included
    total_pending_revenue = 0  # No pending orders included

    # ====================================
    # 5. GET TODAY'S PAID ORDERS (Last 24 hours)
    # ====================================

    cutoff_time = datetime.now() - timedelta(hours=24)
    cutoff_iso = cutoff_time.isoformat()

    today_active_orders = supabase.table("orders") \
        .select("*") \
        .eq("restaurant_id", restaurant_id) \
        .eq("payment_status", "paid") \
        .gte("created_at", cutoff_iso) \
        .execute()

    today_count = len(today_active_orders.data)
    today_revenue = sum(float(o["total_amount"]) for o in today_active_orders.data) if today_active_orders.data else 0

    # ====================================
    # 6. PREPARE RESPONSE (SAME FORMAT)
    # ====================================

    # Translate if needed
    if language == 'ta':
        restaurant_name = translator.translate(restaurant_name)

    return Response({
        "success": True,
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_name,
        "summary": {
            "total_orders_all_time": total_orders_all,
            "total_revenue_all_time": total_revenue_all,
            "total_paid_orders": total_paid_orders,
            "total_paid_revenue": total_paid_revenue,
            "total_pending_orders": total_pending_orders,
            "total_pending_revenue": total_pending_revenue,
            "today_orders_count": today_count,
            "today_revenue": today_revenue
        },
        "daily_breakdown": daily_analytics
    })

# ====================================
# 📅 WEEKLY TRANSACTIONS WITH FIXED START DATE (April 26, 2026 - SUNDAY)
# ====================================

# FIXED START DATE: April 26, 2026 (Sunday) as Week 1 start
WEEK_1_START_DATE = datetime(2026, 4, 26, 0, 0, 0)  # April 26, 2026 00:00:00 IST

def get_current_week_ist():
    """Get current week's start (Sunday 00:00 IST) and end (Saturday 23:59:59 IST)"""
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)

    # Get current day (Monday=0, Sunday=6 in Python)
    weekday = now_ist.weekday()
    days_to_sunday = weekday + 1
    if days_to_sunday == 7:
        days_to_sunday = 0

    # Calculate start of week (Sunday 00:00:00 IST)
    week_start_ist = (now_ist - timedelta(days=days_to_sunday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Calculate end of week (Saturday 23:59:59.999999 IST)
    week_end_ist = week_start_ist + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)

    return week_start_ist, week_end_ist

def get_week_range_ist(date_ist):
    """Get week start (Sunday) and end (Saturday) for any date (IST)"""
    ist = pytz.timezone('Asia/Kolkata')
    if isinstance(date_ist, str):
        date_ist = datetime.fromisoformat(date_ist.replace('Z', '+00:00')).astimezone(ist)
    elif date_ist.tzinfo is None:
        date_ist = ist.localize(date_ist)

    weekday = date_ist.weekday()
    days_to_sunday = weekday + 1
    if days_to_sunday == 7:
        days_to_sunday = 0

    week_start = (date_ist - timedelta(days=days_to_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)

    return week_start, week_end

def get_week_number_from_start_date(date_ist):
    """
    Calculate week number based on fixed start date (April 26, 2026)
    Week 1: April 26 - May 2, 2026
    Week 2: May 3 - May 9, 2026
    """
    ist = pytz.timezone('Asia/Kolkata')
    if isinstance(date_ist, str):
        date_ist = datetime.fromisoformat(date_ist.replace('Z', '+00:00')).astimezone(ist)
    elif date_ist.tzinfo is None:
        date_ist = ist.localize(date_ist)

    # Get the Sunday of the given date's week
    week_start, _ = get_week_range_ist(date_ist)

    # Localize the fixed start date
    start_date = ist.localize(WEEK_1_START_DATE)

    # Calculate week number (1-indexed)
    days_diff = (week_start - start_date).days
    week_num = (days_diff // 7) + 1

    return max(1, week_num)

def convert_utc_to_ist(utc_datetime):
    """Convert UTC datetime to IST"""
    ist = pytz.timezone('Asia/Kolkata')
    if utc_datetime.tzinfo is None:
        utc_datetime = pytz.UTC.localize(utc_datetime)
    return utc_datetime.astimezone(ist)

def parse_transaction_row(row):
    """Parse raw cashfree_transactions row to transaction dict"""
    customerPhone = None
    customerRefId = None
    try:
        cd = row.get("customer_details", {})
        if isinstance(cd, str):
            cd = json.loads(cd)
        customerPhone = cd.get("customer_phone", None)
        customerRefId = cd.get("customer_id", None)
    except:
        pass

    rawStatus = row.get("payment_status", "PENDING")
    transactionId = row.get("cf_order_id", "")
    paymentMethod = row.get("payment_method", "UPI")

    try:
        cf_response = row.get("cf_response")
        if cf_response:
            if isinstance(cf_response, str):
                cf_response = json.loads(cf_response)

            if cf_response and "data" in cf_response and "payment" in cf_response["data"]:
                pd = cf_response["data"]["payment"]
                if pd.get("payment_status"):
                    rawStatus = pd["payment_status"]
                if pd.get("cf_payment_id"):
                    transactionId = str(pd["cf_payment_id"])
                if pd.get("payment_method"):
                    pm = pd["payment_method"]
                    if isinstance(pm, dict):
                        if "upi" in pm:
                            paymentMethod = "UPI"
                        elif "card" in pm:
                            paymentMethod = "CARD"
                        elif "netbanking" in pm:
                            paymentMethod = "NETBANKING"
                        else:
                            paymentMethod = list(pm.keys())[0].upper() if pm.keys() else "UPI"
                    else:
                        paymentMethod = str(pm)
    except:
        pass

    # Get restaurant name from orders relation
    restaurant_name = ""
    if row.get("orders") and row["orders"].get("restaurants"):
        restaurant_name = row["orders"]["restaurants"].get("name", "")

    order_number = ""
    if row.get("orders"):
        order_number = row["orders"].get("order_number", "")

    return {
        "id": str(row["id"]),
        "date_time": row["created_at"],
        "transaction_id": transactionId,
        "transaction_amount": float(row.get("order_amount", 0)),
        "payment_method": paymentMethod,
        "status": str(rawStatus),
        "customer_phone": customerPhone or "N/A",
        "order_id": order_number,
        "order_amount": float(row.get("order_amount", 0)),
        "customer_ref_id": customerRefId or "",
        "restaurant_name": restaurant_name,
    }

@api_view(["GET"])
def get_weekly_transactions(request):
    """
    Get transactions grouped by week starting from April 26, 2026
    GET /api/admin/weekly-transactions/?week=1&filter_upi=true
    """
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    week_param = request.GET.get("week")
    filter_upi = request.GET.get("filter_upi", "false").lower() == "true"

    # Get current week in IST
    current_start, current_end = get_current_week_ist()
    current_week_num = get_week_number_from_start_date(datetime.now(pytz.timezone('Asia/Kolkata')))

    # Fetch all transactions from cashfree_transactions
    tx_resp = supabase.table("cashfree_transactions") \
        .select("*, orders!inner(order_number, restaurants(name))") \
        .order("created_at", desc=True) \
        .execute()

    all_transactions = []

    for tx in tx_resp.data:
        # Parse transaction
        parsed = parse_transaction_row(tx)

        # Apply UPI filter
        if filter_upi and parsed["payment_method"].upper() != "UPI":
            continue

        # Convert created_at to IST
        created_at_utc = datetime.fromisoformat(tx["created_at"].replace('Z', '+00:00'))
        created_at_ist = convert_utc_to_ist(created_at_utc)

        # Skip transactions before Week 1 start date
        start_date_localized = pytz.timezone('Asia/Kolkata').localize(WEEK_1_START_DATE)
        if created_at_ist < start_date_localized:
            continue

        # Get week info
        week_start, week_end = get_week_range_ist(created_at_ist)
        week_num = get_week_number_from_start_date(created_at_ist)

        all_transactions.append({
            **parsed,
            "ist_date_time": created_at_ist.isoformat(),
            "week_number": week_num,
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "is_current_week": (week_num == current_week_num)
        })

    # Group by week
    weeks = {}
    for tx in all_transactions:
        week_num = tx["week_number"]
        if week_num not in weeks:
            weeks[week_num] = {
                "week_number": week_num,
                "week_start": tx["week_start"],
                "week_end": tx["week_end"],
                "is_current_week": tx["is_current_week"],
                "transactions": []
            }
        weeks[week_num]["transactions"].append(tx)

    # Sort weeks by number descending
    sorted_weeks = sorted(weeks.items(), key=lambda x: x[1]["week_number"], reverse=True)

    # Return requested week or all weeks
    if week_param:
        week_num = int(week_param)
        if week_num in weeks:
            return Response({
                "success": True,
                "week": weeks[week_num],
                "current_week": {
                    "start": current_start.isoformat(),
                    "end": current_end.isoformat(),
                    "number": current_week_num
                }
            })
        else:
            # Try to get from archive
            archived = get_archived_week_data(week_num)
            if archived:
                return Response({
                    "success": True,
                    "week": archived,
                    "is_archived": True
                })
            return Response({"error": "Week not found"}, status=404)

    return Response({
        "success": True,
        "weeks": [week_data for _, week_data in sorted_weeks],
        "current_week": {
            "start": current_start.isoformat(),
            "end": current_end.isoformat(),
            "number": current_week_num
        }
    })

def archive_week_transactions_ist(week_num, week_data):
    """Archive transactions for a specific week to archived_weekly_transactions table"""
    try:
        # Calculate UPI total
        upi_total = sum(t["transaction_amount"] for t in week_data["transactions"]
                       if t["payment_method"].upper() == "UPI")

        archive_data = {
            "week_number": week_num,
            "week_start": week_data["week_start"],
            "week_end": week_data["week_end"],
            "transactions": json.dumps(week_data["transactions"]),
            "transaction_count": len(week_data["transactions"]),
            "upi_total": upi_total,
            "total_amount": sum(t["transaction_amount"] for t in week_data["transactions"]),
            "archived_at": datetime.now(pytz.timezone('Asia/Kolkata')).isoformat()
        }

        # Check if already archived
        existing = supabase.table("archived_weekly_transactions") \
            .select("*") \
            .eq("week_number", week_num) \
            .execute()

        if existing.data:
            supabase.table("archived_weekly_transactions") \
                .update(archive_data) \
                .eq("week_number", week_num) \
                .execute()
        else:
            supabase.table("archived_weekly_transactions").insert(archive_data).execute()

        print(f"✅ Archived week {week_num} with {len(week_data['transactions'])} transactions")
        return True

    except Exception as e:
        print(f"❌ Failed to archive week {week_num}: {e}")
        return False

def get_archived_week_data(week_num):
    """Retrieve archived week data"""
    archived_resp = supabase.table("archived_weekly_transactions") \
        .select("*") \
        .eq("week_number", week_num) \
        .execute()

    if archived_resp.data:
        archived = archived_resp.data[0]
        return {
            "week_number": archived["week_number"],
            "week_start": archived["week_start"],
            "week_end": archived["week_end"],
            "transactions": json.loads(archived["transactions"]),
            "is_current_week": False,
            "is_archived": True
        }
    return None

@api_view(["GET"])
def get_archived_weeks_list(request):
    """Get list of all archived weeks"""
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    archived_resp = supabase.table("archived_weekly_transactions") \
        .select("*") \
        .order("week_number", desc=True) \
        .execute()

    return Response({
        "success": True,
        "archived_weeks": [{
            "week_number": a["week_number"],
            "week_start": a["week_start"],
            "week_end": a["week_end"],
            "transaction_count": a["transaction_count"],
            "total_amount": a["total_amount"],
            "upi_total": a.get("upi_total", 0),
            "archived_at": a["archived_at"]
        } for a in archived_resp.data]
    })

@api_view(["GET"])
def export_week_transactions_csv(request, week_num):
    """
    Export a specific week's transactions as CSV (IST based)
    GET /api/admin/export-week/<week_num>/?filter_upi=true
    """
    user = verify_role(request, "admin")
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    filter_upi = request.GET.get("filter_upi", "false").lower() == "true"

    # First check if week is archived
    week_data = get_archived_week_data(week_num)

    if not week_data:
        # Get current weeks
        tx_resp = supabase.table("cashfree_transactions") \
            .select("*, orders!inner(order_number, restaurants(name))") \
            .execute()

        transactions = []
        for tx in tx_resp.data:
            parsed = parse_transaction_row(tx)
            created_at_ist = convert_utc_to_ist(datetime.fromisoformat(tx["created_at"].replace('Z', '+00:00')))
            tx_week_num = get_week_number_from_start_date(created_at_ist)

            if tx_week_num == week_num:
                if filter_upi and parsed["payment_method"].upper() != "UPI":
                    continue
                transactions.append(parsed)

        week_data = {"transactions": transactions}

    transactions = week_data["transactions"]

    # Generate CSV
    from django.http import HttpResponse
    import csv

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="week_{week_num}_transactions_{datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y%m%d_%H%M")}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Date & Time (IST)', 'Transaction ID', 'Order ID', 'Amount (₹)',
        'Order Amount (₹)', 'Payment Method', 'Status',
        'Customer Phone', 'Customer Ref ID', 'Restaurant'
    ])

    for tx in transactions:
        # Convert to IST for display
        date_ist = convert_utc_to_ist(datetime.fromisoformat(tx["date_time"].replace('Z', '+00:00')))
        formatted_date = date_ist.strftime("%d %b %Y, %I:%M %p")

        writer.writerow([
            formatted_date,
            tx.get('transaction_id', ''),
            tx.get('order_id', ''),
            tx.get('transaction_amount', 0),
            tx.get('order_amount', 0),
            tx.get('payment_method', ''),
            tx.get('status', ''),
            tx.get('customer_phone', 'N/A'),
            tx.get('customer_ref_id', ''),
            tx.get('restaurant_name', '')
        ])

    return response