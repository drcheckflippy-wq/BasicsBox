import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://basicsbox.pythonanywhere.com/api';

export const authService = {
  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/customer/login/`, {
      email,
      password
    });
    
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      await AsyncStorage.setItem('email', response.data.email);
      await AsyncStorage.setItem('role', response.data.role || 'customer');
      if (response.data.name) {
        await AsyncStorage.setItem('name', response.data.name);
      }
    }
    
    return response.data;
  },
  
  async register(name: string, email: string, phone: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/customer/register/`, {
      name,
      email,
      phone,
      password
    });
    
    // ✅ NEW: Store tokens if registration returns them (direct approval)
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      await AsyncStorage.setItem('email', response.data.email);
      await AsyncStorage.setItem('role', response.data.role || 'customer');
      if (response.data.name) {
        await AsyncStorage.setItem('name', response.data.name);
      }
    }
    
    return response.data;
  },
  
  async forgotPassword(email: string) {
    const response = await axios.post(`${API_BASE_URL}/forgot-password/`, {
      email,
      role: 'customer'
    });
    return response.data;
  },
  
  async resetPassword(token: string, newPassword: string) {
    const response = await axios.post(`${API_BASE_URL}/reset-password/`, {
      token,
      new_password: newPassword
    });
    return response.data;
  },
  
  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'email', 'role', 'name']);
  },
  
  // ✅ NEW: Helper to check if user is logged in
  async isLoggedIn() {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
  
  // ✅ NEW: Get current user data
  async getCurrentUser() {
    const email = await AsyncStorage.getItem('email');
    const role = await AsyncStorage.getItem('role');
    const name = await AsyncStorage.getItem('name');
    return { email, role, name };
  }
};