// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';

const API_BASE_URL = 'https://basicsbox.pythonanywhere.com/api';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { email: string; role: string; name: string } | null;
  signIn: (data: { access_token: string; refresh_token: string; email: string; role: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('\n🔍 ===== AUTH CHECK START =====');
      
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const email = await AsyncStorage.getItem('email');
      const role = await AsyncStorage.getItem('role');
      const name = await AsyncStorage.getItem('name');

      console.log('📊 Stored values:');
      console.log('  - access_token:', accessToken ? `${accessToken.substring(0, 30)}...` : '❌ NOT FOUND');
      console.log('  - refresh_token:', refreshToken ? `${refreshToken.substring(0, 30)}...` : '❌ NOT FOUND');
      console.log('  - email:', email || '❌ NOT FOUND');
      console.log('  - role:', role || '❌ NOT FOUND');
      console.log('  - name:', name || '❌ NOT FOUND');

      if (accessToken && refreshToken && email) {
        console.log('✅ All credentials found! Setting authenticated = TRUE');
        setIsAuthenticated(true);
        setUser({ email, role: role || 'customer', name: name || '' });
      } else {
        console.log('❌ Missing credentials, setting authenticated = FALSE');
        setIsAuthenticated(false);
        setUser(null);
      }
      console.log('🔍 ===== AUTH CHECK END =====\n');
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    console.log('🧹 Clearing all auth data...');
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'email', 'role', 'name']);
    setIsAuthenticated(false);
    setUser(null);
    console.log('✅ Auth data cleared');
  };

  const signIn = async (data: { access_token: string; refresh_token: string; email: string; role: string; name?: string }) => {
    try {
      console.log('\n🔐 ===== SIGN IN START =====');
      console.log('📦 Data to save:', {
        email: data.email,
        role: data.role,
        name: data.name,
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token
      });

      // Save each item individually with await
      await AsyncStorage.setItem('access_token', data.access_token);
      console.log('✅ Saved access_token');
      
      await AsyncStorage.setItem('refresh_token', data.refresh_token);
      console.log('✅ Saved refresh_token');
      
      await AsyncStorage.setItem('email', data.email);
      console.log('✅ Saved email');
      
      await AsyncStorage.setItem('role', data.role);
      console.log('✅ Saved role');
      
      if (data.name) {
        await AsyncStorage.setItem('name', data.name);
        console.log('✅ Saved name');
      }

      // Verify data was saved
      console.log('\n🔍 Verifying saved data...');
      const verifyAccess = await AsyncStorage.getItem('access_token');
      const verifyEmail = await AsyncStorage.getItem('email');
      
      console.log('Verification:', {
        accessTokenSaved: !!verifyAccess,
        emailSaved: verifyEmail
      });

      if (!verifyAccess || !verifyEmail) {
        throw new Error('Failed to verify saved data');
      }

      setIsAuthenticated(true);
      setUser({ email: data.email, role: data.role, name: data.name || '' });
      
      console.log('✅ Sign in completed successfully');
      console.log('🔐 ===== SIGN IN END =====\n');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🔓 Signing out...');
    await clearAuthData();
    
    // Also sign out from Google if using Google Sign-In
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
      console.log('✅ Signed out from Google');
    } catch (error) {
      console.log('Google sign out error:', error);
    }
    
    router.replace('/(auth)/customer-auth');
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      console.log('🔄 Attempting to refresh token...');
      const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh_token: refreshToken,
      });

      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        console.log('✅ Token refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        signIn,
        signOut,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}