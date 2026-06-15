import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { createOrder, createCashfreeOrder } from '../../services/api';
import PaymentWebView from './PaymentWebView';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  address: string;
  onLocate: () => void;
  locating: boolean;
}

export default function CheckoutModal({
  visible,
  onClose,
  address,
  onLocate,
  locating,
}: CheckoutModalProps) {
  const { colors } = useTheme();
  const { cart, cartTotal, currentRestaurant, clearCart } = useCart();
  const router = useRouter();

  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [currentCfOrderId, setCurrentCfOrderId] = useState('');

  if (!currentRestaurant) return null;

  // ── mirrors web: close checkout modal FIRST, then open payment sheet ─────────
  const clearAndClose = () => {
    clearCart();
    setCustomerPhone('');
    setSpecialInstructions('');
    setPaymentMethod('cash');
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (address?.includes(',')) {
      const [a, b] = address.split(',');
      latitude = parseFloat(a.trim());
      longitude = parseFloat(b.trim());
    }

    if (!latitude || !longitude) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch {
        Alert.alert('Error', 'Location required for delivery');
        return;
      }
    }

    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please enable location to place order');
      return;
    }

    setPlacingOrder(true);

    try {
      const orderData = {
        restaurant_id: currentRestaurant.restaurant.id,
        items: cart.map(item => ({ menu_item_id: item.id, quantity: item.qty })),
        latitude,
        longitude,
        customer_phone: customerPhone,
        special_instructions: specialInstructions || '',
        payment_method: paymentMethod,
      };

      const response = await createOrder(orderData);

      if (response.order_id) {
        if (paymentMethod === 'cash') {
          Alert.alert(
            'Order Placed!',
            `Order placed! Order #${response.order_number}`,
            [
              {
                text: 'View Orders',
                onPress: () => {
                  clearCart();
                  onClose();
                  router.push('/(tabs)/orders');
                },
              },
              {
                text: 'Continue Shopping',
                onPress: () => {
                  clearCart();
                  onClose();
                },
                style: 'cancel',
              },
            ]
          );
        } else if (paymentMethod === 'upi') {
          const email = await AsyncStorage.getItem('email');

          try {
            const paymentResponse = await createCashfreeOrder({
              order_id: response.order_id,
              customer_phone: customerPhone,
              customer_email: email || '',
              customer_name: 'Customer',
              return_url: 'basicsbox://payment-callback',
            });

            if (paymentResponse.success && paymentResponse.payment_session_id) {
              // ── KEY CHANGE: mirrors web flow ──────────────────────────────
              // 1. Store payment details in state
              setPaymentSessionId(paymentResponse.payment_session_id);
              setCurrentOrderId(response.order_id);
              setCurrentCfOrderId(paymentResponse.cf_order_id);

              // 2. Close checkout modal first (same as web: onClose() before payment)
              onClose();

              // 3. Open payment sheet after modal has closed
              setTimeout(() => setPaymentVisible(true), 300);
            } else {
              Alert.alert('Error', paymentResponse.message || 'Failed to initiate payment');
            }
          } catch (error: any) {
            console.error('Payment initiation error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to initiate payment');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Close payment modal first (mirrors web clearAndClose after success alert)
    setPaymentVisible(false);

    Alert.alert(
      'Payment Successful!',
      'Your order has been confirmed successfully.',
      [
        {
          text: 'View Orders',
          onPress: () => {
            clearAndClose();
            router.push('/(tabs)/orders');
          },
        },
      ]
    );
  };

  const isDisabled = placingOrder || !customerPhone || !address;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={[styles.modal, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Confirm Order</Text>
                <Text style={[styles.restaurantName, { color: colors.textMuted }]}>
                  {currentRestaurant.restaurant.name}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Order Summary */}
              <View style={[styles.summaryCard, { backgroundColor: colors.cardHover, borderColor: colors.border }]}>
                <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Order Summary</Text>
                {cart.map((item) => {
                  const price = item.has_offer && item.offer_price ? item.offer_price : item.price;
                  const itemTotal = price * item.qty;
                  return (
                    <View key={item.id} style={styles.summaryItem}>
                      <View style={styles.summaryItemLeft}>
                        <Text style={[styles.summaryItemQty, { color: colors.brandPrimary }]}>{item.qty}x</Text>
                        <Text style={[styles.summaryItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={[styles.summaryItemPrice, { color: colors.textPrimary }]}>₹{itemTotal}</Text>
                    </View>
                  );
                })}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: colors.brandPrimary }]}>₹{cartTotal}</Text>
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.paymentSection}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Payment Method</Text>
                <View style={styles.paymentOptions}>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cash')}
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'cash'
                        ? { borderColor: colors.brandPrimary, backgroundColor: `${colors.brandPrimary}10` }
                        : { borderColor: colors.border, backgroundColor: colors.inputBg },
                    ]}
                  >
                  <MaterialCommunityIcons 
  name="cash" 
  size={20} 
  color={paymentMethod === 'cash' ? colors.brandPrimary : colors.textMuted} 
/>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>Cash on Delivery</Text>
                      <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Pay at door</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPaymentMethod('upi')}
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'upi'
                        ? { borderColor: colors.brandPrimary, backgroundColor: `${colors.brandPrimary}10` }
                        : { borderColor: colors.border, backgroundColor: colors.inputBg },
                    ]}
                  >
                    <Icon name="smartphone" size={20} color={paymentMethod === 'upi' ? colors.brandPrimary : colors.textMuted} />
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>UPI</Text>
                      <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Via Cashfree</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="+91 00000 00000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>

              {/* Special Instructions */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Instructions (optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. extra chilli, no onions..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                />
              </View>

              {/* Delivery Location */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Delivery Location <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.locationRow}>
                  <View style={[styles.locationInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Icon name="map-pin" size={16} color={colors.brandPrimary} style={styles.locationIcon} />
                    <Text style={[styles.locationText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {address || 'Click pin to get location'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onLocate}
                    disabled={locating}
                    style={[styles.locateButton, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  >
                    {locating ? (
                      <ActivityIndicator size="small" color={colors.brandPrimary} />
                    ) : (
                      <Icon name="navigation" size={18} color={colors.brandPrimary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlaceOrder}
                disabled={isDisabled}
                style={[styles.placeButton, isDisabled && styles.disabledButton]}
              >
                <LinearGradient
                  colors={[colors.brandPrimary, colors.brandSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.placeGradient}
                >
                  {placingOrder ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.placeText}>Place Order · ₹{cartTotal}</Text>
                      <Icon name="arrow-right" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment WebView — rendered outside checkout modal so it survives onClose() */}
      <PaymentWebView
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
        onSuccess={handlePaymentSuccess}
        paymentSessionId={paymentSessionId}
        orderId={currentOrderId}
        cfOrderId={currentCfOrderId}
        amount={cartTotal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  summaryItemQty: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryItemName: {
    fontSize: 12,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  paymentOptions: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  paymentSub: {
    fontSize: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  locationInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  locateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  placeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  placeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});