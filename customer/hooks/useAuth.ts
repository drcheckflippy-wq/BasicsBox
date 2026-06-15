import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import api from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    userRole: null,
    isLoading: true,
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const email = await AsyncStorage.getItem('email');
      const role = await AsyncStorage.getItem('role');

      setAuthState({
        isAuthenticated: !!token,
        userEmail: email,
        userRole: role,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        isAuthenticated: false,
        userEmail: null,
        userRole: null,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'email', 'role', 'name', 'auth_provider']);
    setAuthState({
      isAuthenticated: false,
      userEmail: null,
      userRole: null,
      isLoading: false,
    });
    router.replace('/(auth)/customer-auth');
  };

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  useEffect(() => {
    if (authState.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!authState.isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/customer-auth');
    } else if (authState.isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [authState.isAuthenticated, authState.isLoading, segments]);

  return {
    ...authState,
    logout,
    getToken,
    checkAuth,
  };
}