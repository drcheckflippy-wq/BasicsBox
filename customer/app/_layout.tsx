import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { ThemeProvider } from '../context/ThemeContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <CartProvider>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </CartProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}