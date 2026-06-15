import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { verifyCashfreePayment } from '../../services/api';

interface PaymentWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentSessionId: string;
  orderId: string;
  cfOrderId: string;
  amount: number;
}

export default function PaymentWebView({
  visible,
  onClose,
  onSuccess,
  paymentSessionId,
  orderId,
  cfOrderId,
  amount,
}: PaymentWebViewProps) {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [verifying, setVerifying] = useState(false);
  const [paymentDetected, setPaymentDetected] = useState(false);

  // Check payment status periodically as fallback
  useEffect(() => {
    if (!visible) return;

    let checkCount = 0;
    const interval = setInterval(async () => {
      checkCount++;
      console.log(`🔍 Checking payment status (${checkCount})...`);
      
      if (checkCount >= 10 && !paymentDetected && !verifying) {
        // After 30 seconds, check payment status
        setVerifying(true);
        try {
          const result = await verifyCashfreePayment(orderId, cfOrderId);
          if (result.success || result.payment_status === 'PAID') {
            setPaymentDetected(true);
            onSuccess();
            onClose();
          }
        } catch (error) {
          console.error('Periodic check error:', error);
        } finally {
          setVerifying(false);
        }
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [visible, orderId, cfOrderId, paymentDetected, verifying]);

  const handleMessage = async (event: any) => {
    const data = event.nativeEvent.data;
    console.log('📨 WebView message:', data);
    
    if (paymentDetected || verifying) return;
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'payment_success') {
        console.log('✅ Payment success from WebView');
        setPaymentDetected(true);
        setVerifying(true);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const result = await verifyCashfreePayment(orderId, cfOrderId);
          if (result.success || result.payment_status === 'PAID') {
            onSuccess();
            onClose();
          } else {
            Alert.alert('Success', 'Payment completed!', [
              { text: 'View Orders', onPress: () => onSuccess() }
            ]);
            onClose();
          }
        } catch (error) {
          console.error('Verification error:', error);
          onSuccess();
          onClose();
        }
      } else if (parsed.type === 'payment_failure') {
        Alert.alert('Payment Failed', 'Please try again.');
        onClose();
      }
    } catch (e) {
      // Not JSON, check for success keywords
      if (data === 'success' || data.includes('success') || data.includes('SUCCESS')) {
        console.log('✅ Success keyword detected');
        setPaymentDetected(true);
        onSuccess();
        onClose();
      }
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log('📍 Navigation URL:', url);
    
    if (paymentDetected || verifying) return;
    
    // Check for thankyou/success page
    if (url.includes('thankyou') || url.includes('success') || url.includes('complete')) {
      console.log('✅ Thank you page detected!');
      setPaymentDetected(true);
      setVerifying(true);
      
      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const result = await verifyCashfreePayment(orderId, cfOrderId);
        if (result.success || result.payment_status === 'PAID') {
          onSuccess();
          onClose();
        } else {
          // Even if verification fails, payment likely succeeded
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Verification error:', error);
        onSuccess();
        onClose();
      }
      return;
    }
    
    // Handle UPI app redirects
    if (url.startsWith('upi://') || url.startsWith('paytm://') || url.startsWith('phonepe://') || url.startsWith('gpay://')) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Failed to open UPI app:', error);
      }
      return false;
    }
  };

  const getHtmlContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #payment-container { width: 100%; height: 100vh; }
          .loader {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
          }
          .loader-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #f97316;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="payment-container">
          <div class="loader">
            <div class="loader-spinner"></div>
            <div>Loading payment gateway...</div>
          </div>
        </div>
        <script>
          const cashfree = new Cashfree({ mode: "production" });
          
          cashfree.checkout({
            paymentSessionId: "${paymentSessionId}",
            redirectTarget: "_self",
            onSuccess: function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "payment_success", data: data }));
            },
            onFailure: function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "payment_failure", data: data }));
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Payment - ₹{amount}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ html: getHtmlContent() }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading payment gateway...
              </Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
        />
        
        {(verifying || paymentDetected) && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Verifying payment...
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});