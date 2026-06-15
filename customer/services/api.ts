import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://basicsbox.pythonanywhere.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        });

        if (response.data.access_token) {
          await AsyncStorage.setItem('access_token', response.data.access_token);
          processQueue(null, response.data.access_token);
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'email', 'role', 'name']);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const fetchRestaurants = async () => {
  const response = await api.get('/get-all-restaurants-full/');
  return response.data;
};

export const fetchNearbyRestaurants = async (lat: number, lng: number) => {
  const response = await api.get(`/restaurants/?lat=${lat}&lng=${lng}`);
  return response.data;
};

export const fetchFoodItems = async () => {
  const response = await api.get('/get-food-item-names/');
  return response.data;
};

export const fetchReviews = async (restaurantId: number) => {
  const response = await api.get(`/reviews/${restaurantId}/`);
  return response.data;
};

export const addReview = async (restaurantId: number, rating: number, comment: string) => {
  const response = await api.post('/reviews/add/', {
    restaurant_id: restaurantId,
    rating,
    comment,
  });
  return response.data;
};

export const updateReview = async (restaurantId: number, rating: number, comment: string) => {
  const response = await api.put('/reviews/update/', {
    restaurant_id: restaurantId,
    rating,
    comment,
  });
  return response.data;
};

export const deleteReview = async (restaurantId: number) => {
  const response = await api.delete('/reviews/delete/', {
    data: { restaurant_id: restaurantId },
  });
  return response.data;
};

export const createOrder = async (orderData: any) => {
  const response = await api.post('/orders/create/', orderData);
  return response.data;
};

export const fetchCustomerOrders = async (retryCount = 0): Promise<any> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await api.get('/orders/customer/', {
      signal: controller.signal,
      timeout: 60000,
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error: any) {
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.name === 'AbortError') {
      console.error('Request timeout for /orders/customer/');
      
      if (retryCount < 2) {
        console.log(`Retrying... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchCustomerOrders(retryCount + 1);
      }
      throw new Error('Server is taking too long to respond. Please try again.');
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check your internet connection');
      throw new Error('Network error. Please check your internet connection.');
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error('Unauthorized - token expired');
      throw new Error('Session expired. Please login again.');
    }
    
    // Handle other errors
    console.error('Error fetching orders:', error.response?.status, error.message);
    throw error;
  }
};

export const createCashfreeOrder = async (orderData: {
  order_id: string;
  customer_phone: string;
  customer_email: string;
  customer_name: string;
  return_url?: string; 
}) => {
  const response = await api.post('/payment/cashfree/create/', orderData);
  return response.data;
};

export const verifyCashfreePayment = async (orderId: string, cfOrderId: string) => {
  try {
    const response = await api.post('/payment/cashfree/verify/', {
      order_id: orderId,
      cf_order_id: cfOrderId,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error);
    throw error;
  }
};

export default api;