import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyCashfreePayment } from '../services/api';

export default function PaymentCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Get params from the URL that opened this screen
        const url = await Linking.getInitialURL();
        const params = new URLSearchParams(url?.split('?')[1]);
        const order_id = params.get('order_id');
        const cf_order_id = params.get('cf_order_id');
        
        if (order_id && cf_order_id) {
          // ✅ FIXED: Pass as two separate parameters, not an object
          const result = await verifyCashfreePayment(order_id, cf_order_id);
          
          if (result.success) {
            Alert.alert('Success', 'Payment successful!', [
              { text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }
            ]);
          } else {
            Alert.alert('Error', 'Payment failed');
          }
        } else {
          router.replace('/(tabs)/orders');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        router.replace('/(tabs)/orders');
      }
    };
    
    checkPayment();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1E' }}>
      <ActivityIndicator size="large" color="#F97316" />
      <Text style={{ color: 'white', marginTop: 16 }}>Verifying payment...</Text>
    </View>
  );
}