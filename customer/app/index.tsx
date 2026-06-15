// app/index.tsx
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './(auth)/loading';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // If authenticated, go to tabs, otherwise go to auth
  return isAuthenticated 
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/(auth)/customer-auth" />;
}