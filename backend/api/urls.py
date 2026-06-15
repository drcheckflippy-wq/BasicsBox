from django.urls import path
from .views import (
    add_menu_item, add_restaurant, add_review, admin_register, admin_login, batch_update_transactions, cancel_order, cashfree_webhook, check_google_auth_status, create_cashfree_order, create_order,
    customer_register, customer_login, delete_menu_item, delete_restaurant, delete_review, fetch_cashfree_order, fetch_cashfree_transactions, forgot_password, get_all_food_item_names, get_all_restaurants_full_details, get_all_transactions, get_archived_orders, get_cashfree_config, get_customer_archived_orders, get_customer_orders, get_menu, get_merchant_orders, get_merchant_restaurant,  get_order_details, get_pending_customers, get_pending_merchants, get_restaurant_orders, get_restaurants, get_reviews, google_auth_customer, google_auth_merchant,  mark_order_paid,
    merchant_register, merchant_login,
    approve_customer, public_cashfree_order, refresh_token_view, reject_customer,
    approve_merchant, reject_merchant, reset_password, test_webhook, update_cashfree_transaction, update_menu_item, update_order_status, update_restaurant, update_restaurant, update_restaurant_profile, update_review, verify_cashfree_payment, merchant_mark_cod_paid, trigger_delete_old_orders, merchant_analytics, register_expo_token, get_weekly_transactions, get_archived_weeks_list, export_week_transactions_csv, merchant_override_status,
    merchant_cancel_override, get_merchant_override_status
)

urlpatterns = [
    path("auth/google/customer/", google_auth_customer, name="google_auth_customer"),
    path("auth/google/merchant/", google_auth_merchant, name="google_auth_merchant"),
    path("auth/google/status/<str:email>/", check_google_auth_status, name="google_auth_status"),
    # 🔐 Admin
    path("admin/register/", admin_register, name="admin_register"),
    path("admin/login/", admin_login, name="admin_login"),

    # 👤 Customer
    path("customer/register/", customer_register, name="customer_register"),
    path("customer/login/", customer_login, name="customer_login"),  # <-- added

    # 🏪 Merchant
    path("merchant/register/", merchant_register, name="merchant_register"),
    path("merchant/login/", merchant_login, name="merchant_login"),  # <-- added

    # ✅ Customer Approval by Admin
    path("customer/approve/", approve_customer, name="approve_customer"),
    path("customer/reject/", reject_customer, name="reject_customer"),

    # ✅ Merchant Approval by Admin
    path("merchant/approve/", approve_merchant, name="approve_merchant"),
    path("merchant/reject/", reject_merchant, name="reject_merchant"),

    # 🔑 Forgot / Reset Password
path("forgot-password/", forgot_password, name="forgot_password"),
path("reset-password/", reset_password, name="reset_password"),
# 📥 Fetch pending data (Admin only)
path("pending/customers/", get_pending_customers, name="get_pending_customers"),
path("pending/merchants/", get_pending_merchants, name="get_pending_merchants"),
path("restaurants/add/", add_restaurant),
path("restaurants/update/", update_restaurant),
path("restaurant/profile/update/", update_restaurant_profile),
path("restaurants/delete/", delete_restaurant),
path("restaurants/", get_restaurants),
 path('get-all-restaurants-full/', get_all_restaurants_full_details, name='get_all_restaurants_full_details'),
 path('get-food-item-names/', get_all_food_item_names, name='get_all_food_item_names'),
path("menu/add/", add_menu_item),
path("menu/update/<uuid:item_id>/", update_menu_item),
path("menu/delete/<uuid:item_id>/", delete_menu_item),
path("menu/<uuid:restaurant_id>/", get_menu),
path("reviews/add/", add_review),
path("reviews/update/", update_review),
path("reviews/delete/", delete_review),
path("reviews/<uuid:restaurant_id>/", get_reviews),
path("merchant/restaurant/", get_merchant_restaurant),  # For merchants to view their own restaurants
path("merchant/orders/", get_merchant_orders),  # For merchants to view orders for their restaurant(s)
    path('merchant/override-status/', merchant_override_status, name='merchant_override_status'),
    path('merchant/cancel-override/', merchant_cancel_override, name='merchant_cancel_override'),
    path('merchant/override-status/', get_merchant_override_status, name='get_merchant_override_status'),
    path("auth/refresh/", refresh_token_view),
    path('orders/create/', create_order, name='create_order'),
    path('orders/customer/', get_customer_orders, name='customer_orders'),
    path('orders/<uuid:order_id>/', get_order_details, name='order_details'),
    path('orders/restaurant/', get_restaurant_orders, name='restaurant_orders'),
    path('orders/<uuid:order_id>/status/', update_order_status, name='update_order_status'),
    path('orders/<uuid:order_id>/mark-paid/', mark_order_paid, name='mark_order_paid'),
    path('orders/<uuid:order_id>/cancel/', cancel_order, name='cancel_order'),
       # View archived orders for merchants
    path('orders/archived/merchant/', get_archived_orders, name='get_archived_orders'),

    # View archived orders for customers
    path('orders/archived/customer/', get_customer_archived_orders, name='get_customer_archived_orders'),

# Cashfree payment endpoints
path('payment/cashfree/config/', get_cashfree_config, name='get_cashfree_config'),
path('payment/cashfree/create/', create_cashfree_order, name='create_cashfree_order'),
path('payment/cashfree/verify/', verify_cashfree_payment, name='verify_cashfree_payment'),
path('payment/cashfree/webhook/', cashfree_webhook, name='cashfree_webhook'),
path('admin/transactions/', get_all_transactions, name='get_all_transactions'),
path('payment/cashfree/test-webhook/', test_webhook, name='test_webhook'),
path('admin/cashfree-transactions/', fetch_cashfree_transactions, name='cashfree_transactions'),
path('admin/cashfree-order/<str:order_id>/', fetch_cashfree_order, name='cashfree_order'),
path('admin/update-transaction/<str:transaction_id>/', update_cashfree_transaction, name='update_transaction'),
path('admin/batch-update-transactions/', batch_update_transactions, name='batch_update_transactions'),
path('public/cashfree-order/<str:order_id>/', public_cashfree_order, name='public_cashfree_order'),
path("merchant/orders/<uuid:order_id>/mark-cod-paid/", merchant_mark_cod_paid, name="merchant_mark_cod_paid"),
path("admin/delete-old-orders/", trigger_delete_old_orders, name="delete_old_orders"),
path("merchant/analytics/", merchant_analytics, name="merchant_analytics"),
path('merchant/register-expo-token/', register_expo_token, name='register_expo_token'),
 path('admin/weekly-transactions/', get_weekly_transactions, name='weekly_transactions'),
    path('admin/archived-weeks/', get_archived_weeks_list, name='archived_weeks_list'),
    path('admin/export-week/<int:week_num>/', export_week_transactions_csv, name='export_week_csv'),
]
