import { View, ActivityIndicator, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={['#3B82F6', '#06B6D4']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>Loading...</Text>
    </LinearGradient>
  );
}