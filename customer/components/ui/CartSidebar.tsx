import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const { height } = Dimensions.get('window');

interface CartSidebarProps {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartSidebar({ visible, onClose, onCheckout }: CartSidebarProps) {
  const { colors } = useTheme();
  const { cart, cartCount, cartTotal, currentRestaurant, addToCart, removeFromCart } = useCart();

  if (!currentRestaurant) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.drawer, { backgroundColor: colors.background, borderLeftColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Icon name="shopping-cart" size={20} color={colors.brandPrimary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your Cart</Text>
              <View style={[styles.cartBadge, { backgroundColor: `${colors.brandPrimary}20` }]}>
                <Text style={[styles.cartBadgeText, { color: colors.brandPrimary }]}>{cartCount}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Restaurant Info */}
          <View style={[styles.restaurantInfo, { backgroundColor: colors.cardHover, borderBottomColor: colors.border }]}>
            <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>
              {currentRestaurant.restaurant.name}
            </Text>
            <Text style={[styles.restaurantCuisine, { color: colors.textMuted }]}>
              {currentRestaurant.restaurant.cuisine}
            </Text>
          </View>

          {/* Cart Items */}
          <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
            {cart.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="shopping-cart" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Add items from a restaurant to get started
                </Text>
              </View>
            ) : (
              cart.map((item) => {
                const price = item.has_offer && item.offer_price ? item.offer_price : item.price;
                const itemTotal = price * item.qty;
                
                return (
                  <View key={item.id} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                    <Image
                      source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=70' }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemPrice, { color: colors.brandPrimary }]}>
                        ₹{itemTotal}
                      </Text>
                    </View>
                    <View style={[styles.quantityControl, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyButton}>
                        <Icon name="minus" size={12} color={colors.brandPrimary} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.qty}</Text>
                      <TouchableOpacity
                        onPress={() => addToCart(item, currentRestaurant.restaurant.id, currentRestaurant)}
                        style={styles.qtyButton}
                      >
                        <Icon name="plus" size={12} color={colors.brandPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          {cart.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Item total</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{cartTotal}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Delivery fee</Text>
                  <Text style={[styles.priceValue, { color: colors.success }]}>FREE</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Platform fee</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹0</Text>
                </View>
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>To Pay</Text>
                  <Text style={[styles.totalValue, { color: colors.brandPrimary }]}>₹{cartTotal}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onCheckout} style={styles.checkoutButton}>
                <LinearGradient
                  colors={[colors.brandPrimary, colors.brandSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkoutGradient}
                >
                  <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                  <Icon name="arrow-right" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.termsText, { color: colors.textMuted }]}>
                By ordering, you agree to our Terms
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
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
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  restaurantInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  restaurantCuisine: {
    fontSize: 11,
    marginTop: 2,
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 28,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  priceBreakdown: {
    gap: 10,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 10,
    textAlign: 'center',
  },
});