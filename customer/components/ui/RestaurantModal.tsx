import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { RestaurantData, MenuItem } from '../../context/CartContext';
import { Linking } from 'react-native';
import { Alert } from 'react-native';

const { height } = Dimensions.get('window');

interface RestaurantModalProps {
  visible: boolean;
  restaurant: RestaurantData | null;
  onClose: () => void;
  onOpenCart: () => void;
  filterVeg: boolean;
}

export default function RestaurantModal({
  visible,
  restaurant,
  onClose,
  onOpenCart,
  filterVeg,
}: RestaurantModalProps) {
  const { colors } = useTheme();
  const { addToCart, removeFromCart, cart, cartCount, cartTotal } = useCart();
  const [menuCategory, setMenuCategory] = useState('all');
  const categoryScrollRef = useRef<FlatList>(null);

  if (!restaurant) return null;

  const { restaurant: r, menu } = restaurant;

  const cartQty = (id: number) => cart.find(c => c.id === id)?.qty || 0;

  const menuCategories = ['all', ...Array.from(new Set(menu.map(i => i.category).filter(Boolean)))];

  const filteredMenu = menu
    .filter(i => !filterVeg || i.is_veg)
    .filter(i => menuCategory === 'all' || i.category === menuCategory);

  const getGoogleMapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

  const formatDays = (daysString: string | null): string => {
    if (!daysString) return 'Not specified';
    const days = daysString.split(',').map(d => d.trim());
    if (days.length === 7) return 'Daily';
    const dayMap: { [k: string]: string } = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
      Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
    };
    return days.map(d => dayMap[d] || d).join(', ');
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const qty = cartQty(item.id);
    const price = item.has_offer && item.offer_price ? item.offer_price : item.price;

    return (
      <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemHeader}>
            <View style={styles.menuItemTitleRow}>
              {item.is_veg ? (
                <View style={styles.vegBadge}>
                  <View style={styles.vegDot} />
                </View>
              ) : (
                <View style={styles.nonVegBadge}>
                  <View style={styles.nonVegDot} />
                </View>
              )}
              <Text style={[styles.menuItemName, { color: colors.textPrimary }]}>{item.name}</Text>
              {item.has_offer && (
                <View style={styles.offerBadge}>
                  <Text style={styles.offerText}>{item.offer_percentage}% OFF</Text>
                </View>
              )}
            </View>
            <Text style={[styles.menuItemDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.priceRow}>
              {item.has_offer && item.offer_price ? (
                <>
                  <Text style={[styles.offerPrice, { color: colors.brandPrimary }]}>₹{item.offer_price}</Text>
                  <Text style={[styles.originalPrice, { color: colors.textMuted }]}>₹{item.price}</Text>
                </>
              ) : (
                <Text style={[styles.regularPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
              )}
            </View>
          </View>

          <View style={styles.menuItemImage}>
            <Image
              source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' }}
              style={styles.itemImage}
            />
            {qty > 0 ? (
              <View style={[styles.qtyControl, { backgroundColor: colors.brandPrimary }]}>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyButton}>
                  <Icon name="minus" size={12} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity onPress={() => addToCart(item, r.id, restaurant)} style={styles.qtyButton}>
                  <Icon name="plus" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => addToCart(item, r.id, restaurant)}
                style={[styles.addButton, { backgroundColor: colors.brandPrimary }]}
              >
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setMenuCategory(item)}
      style={[
        styles.categoryChip,
        menuCategory === item && { backgroundColor: colors.brandPrimary },
        menuCategory !== item && { backgroundColor: colors.inputBg, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.categoryText,
          menuCategory === item && { color: '#fff' },
          menuCategory !== item && { color: colors.textSecondary },
        ]}
      >
        {item === 'all' ? 'All Items' : item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' }}
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.heroGradient}
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Restaurant Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{r.name}</Text>
            <Text style={[styles.cuisine, { color: colors.textSecondary }]}>{r.cuisine}</Text>

            <View style={styles.metaRow}>
              <View style={[styles.ratingBadge, { backgroundColor: '#16a34a' }]}>
                <Icon name="star" size={10} color="#fff" />
                <Text style={styles.ratingText}>{r.rating}</Text>
              </View>
              <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({r.reviews_count} reviews)</Text>
              {r.opening_time && r.closing_time && (
                <>
                  <Icon name="clock" size={12} color={colors.textMuted} />
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {r.opening_time.slice(0, 5)}–{r.closing_time.slice(0, 5)}
                  </Text>
                </>
              )}
            <TouchableOpacity
  onPress={async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open maps');
    }
  }}
>
  <Text style={[styles.mapLink, { color: colors.brandPrimary }]}>View on Maps</Text>
</TouchableOpacity>
            </View>

            {r.days_open && (
              <Text style={[styles.daysText, { color: colors.textMuted }]}>
                Open: {formatDays(r.days_open)}
              </Text>
            )}
          </View>

        {/* Categories */}
{menuCategories.length > 1 && (
  <View style={styles.categoriesWrapper}>
    <FlatList
      ref={categoryScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={menuCategories}
      keyExtractor={(item) => item}
      renderItem={renderCategory}
      contentContainerStyle={styles.categoriesList}
      style={styles.categoriesFlatList}
    />
  </View>
)}

          {/* Menu Items */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.menuCount, { color: colors.textMuted }]}>
              {filteredMenu.length} items
            </Text>
            <FlatList
              data={filteredMenu}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMenuItem}
              scrollEnabled={false}
              contentContainerStyle={styles.menuItemsContainer}
            />
          </ScrollView>

          {/* Cart Footer */}
          {cartCount > 0 && (
            <TouchableOpacity
              onPress={() => {
                onOpenCart();
                onClose();
              }}
              style={[styles.cartFooter, { backgroundColor: colors.brandPrimary }]}
            >
              <View style={styles.cartFooterLeft}>
                <Icon name="shopping-cart" size={18} color="#fff" />
                <Text style={styles.cartFooterText}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.cartFooterRight}>
                <Text style={styles.cartFooterText}>View Cart · ₹{cartTotal}</Text>
                <Icon name="arrow-right" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
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
  modal: {
   borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: height * 0.95, // Increase from 0.9
  height: height * 0.95, // Add fixed height
  },
  heroContainer: {
    position: 'relative',
    height: 180,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 13,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reviewCount: {
    fontSize: 11,
  },
  timeText: {
    fontSize: 11,
  },
  mapLink: {
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  daysText: {
    fontSize: 11,
  },
 categoriesWrapper: {
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.1)',
  marginBottom: 8,
},
categoriesFlatList: {
  maxHeight: 56,
},
categoriesList: {
  paddingHorizontal: 16,
  paddingVertical: 0,
  gap: 8,
},
categoryChip: {
  paddingHorizontal: 16,
  paddingVertical: 16,
  borderRadius: 20,
  marginRight: 8,
  borderWidth: 1,
  minWidth: 70, // Add min width for better appearance
},
categoryText: {
  fontSize: 12,
  fontWeight: '500',
  textAlign: 'center', // Center text
},
menuList: {
  flex: 1,
  maxHeight: height * 0.8, // Add max height
},
  menuCount: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  menuItemHeader: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#10b981',
  },
  nonVegBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  offerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  offerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  menuItemDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  regularPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  qtyControl: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  qtyButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    margin: 16,
    borderRadius: 30,
  },
  cartFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartFooterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});