import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof darkColors;
}

const darkColors = {
  background: '#0A0F1E',
  backgroundSecondary: '#111827',
  card: '#1A1F2E',
  cardHover: '#1F2937',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  brandPrimary: '#F97316',
  brandSecondary: '#FBBF24',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.1)',
};

const lightColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.05)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  brandPrimary: '#F97316',
  brandSecondary: '#FBBF24',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  inputBg: 'rgba(0,0,0,0.02)',
  inputBorder: 'rgba(0,0,0,0.08)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme as Theme || 'dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}