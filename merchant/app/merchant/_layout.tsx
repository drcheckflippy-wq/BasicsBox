// app/merchant/_layout.tsx
import { Stack } from 'expo-router';

export default function MerchantLayout() {
  // Remove all auth checking logic - let the auth screen handle it
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}