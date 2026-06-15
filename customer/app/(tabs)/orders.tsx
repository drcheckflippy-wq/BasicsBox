import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { fetchCustomerOrders } from '../../services/api';
import Header from '../../components/ui/Header';
import { Image, Dimensions } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeIn,
  Layout,
  SlideInDown 
} from 'react-native-reanimated';

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  item_name: string;
  category: string;
  is_veg: boolean;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  restaurant_name: string;
  restaurant_image: string | null;
  restaurant_phone: string | null;
  total_amount: number;
  calculated_total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  delivery_address: string;
  customer_phone: string;
  created_at: string;
  items: OrderItem[];
  special_instructions: string | null;
}

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: '#eab308', icon: 'clock', label: 'Pending' },
  confirmed: { color: '#3b82f6', icon: 'check-square', label: 'Confirmed' },
  preparing: { color: '#a855f7', icon: 'package', label: 'Preparing' },
  ready: { color: '#10b981', icon: 'truck', label: 'Ready' },
  delivered: { color: '#22c55e', icon: 'check-circle', label: 'Delivered' },
  cancelled: { color: '#ef4444', icon: 'x-circle', label: 'Cancelled' },
};

export default function OrdersScreen() {
  const { colors, theme } = useTheme();
  const { isAuthenticated, } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchCustomerOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'No date';

    // Normalize space → T, then force UTC if no timezone info is present
    let normalized = dateString.replace(' ', 'T');
    if (!normalized.includes('+') && !normalized.endsWith('Z')) {
      normalized += 'Z'; // treat backend timestamp as UTC, same as web version
    }

    const date = new Date(normalized);
    if (isNaN(date.getTime())) return 'Invalid date';

    // Manually shift to IST (UTC +5:30 = 330 minutes)
    // Use UTC getters on the shifted date — avoids Hermes toLocaleString timezone issues
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);

    const day = istDate.getUTCDate();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monthNames[istDate.getUTCMonth()];
    const year = istDate.getUTCFullYear();

    let hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
};

  const pendingOrders = orders.filter(
    order => order.status === 'pending' && order.payment_status === 'pending'
  );
  const confirmedOrders = orders.filter(
    order => order.status === 'confirmed' && order.payment_status === 'paid'
  );

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openGoogleMaps = (url: string) => {
    Linking.openURL(url);
  };

  const makePhoneCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
  address=""
  setAddress={() => {}}
  handleLocate={() => {}}
  handleSearch={() => {}}
  locating={false}
  cartOpen={false}
  setCartOpen={() => {}}
/>
        <View style={styles.centered}>
          <Icon name="lock" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Please Login</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Login to view your orders
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
  address=""
  setAddress={() => {}}
  handleLocate={() => {}}
  handleSearch={() => {}}
  locating={false}
  cartOpen={false}
  setCartOpen={() => {}}
/>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
     <Header
  address=""
  setAddress={() => {}}
  handleLocate={() => {}}
  handleSearch={() => {}}
  locating={false}
  cartOpen={false}
  setCartOpen={() => {}}
/>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Your Orders</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Total {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </Text>
        </View>

     <View style={styles.tabsContainer}>
  <TouchableOpacity
    onPress={() => setActiveTab('pending')}
    style={styles.tab}>
    {activeTab === 'pending' && (
      <Animated.View 
        layout={Layout.springify()}
        style={[styles.activeTabIndicator, { backgroundColor: colors.brandPrimary + '20' }]} 
      />
    )}
    <Icon name="clock" size={16} color={activeTab === 'pending' ? colors.brandPrimary : colors.textMuted} />
    <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.brandPrimary : colors.textMuted }]}>
      Pending Orders
    </Text>
    {pendingOrders.length > 0 && (
      <View style={[styles.tabBadge, { backgroundColor: colors.brandPrimary }]}>
        <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
      </View>
    )}
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setActiveTab('confirmed')}
    style={styles.tab}>
    {activeTab === 'confirmed' && (
      <Animated.View 
        layout={Layout.springify()}
        style={[styles.activeTabIndicator, { backgroundColor: '#10b98120' }]} 
      />
    )}
    <Icon name="check-square" size={16} color={activeTab === 'confirmed' ? colors.brandPrimary : colors.textMuted} />
    <Text style={[styles.tabText, { color: activeTab === 'confirmed' ? colors.brandPrimary : colors.textMuted }]}>
      Confirmed Orders
    </Text>
    {confirmedOrders.length > 0 && (
      <View style={[styles.tabBadge, { backgroundColor: '#10b981' }]}>
        <Text style={styles.tabBadgeText}>{confirmedOrders.length}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>

        {/* Orders List */}
        {(activeTab === 'pending' ? pendingOrders : confirmedOrders).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shopping-bag" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No {activeTab} orders
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {activeTab === 'pending'
                ? "You don't have any orders waiting for confirmation"
                : "Your confirmed orders will appear here"}
            </Text>
          </View>
        ) : (
          (activeTab === 'pending' ? pendingOrders : confirmedOrders).map((order, index) => {
            const status = statusConfig[order.status];
            const StatusIcon = status?.icon || 'clock';
            const isExpanded = expandedOrder === order.id;

            return (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(order.id)}>
              <View style={styles.orderHeader}>
  {/* Top row: order number + amount */}
  <View style={styles.orderTopRow}>
    <Text style={[styles.orderNumber, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
      {order.order_number}
    </Text>
    <Text style={[styles.orderTotal, { color: colors.brandPrimary }]}>
      ₹{order.total_amount}
    </Text>
  </View>

  {/* Second row: restaurant name + status badge */}
  <View style={styles.orderSecondRow}>
    <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>
      {order.restaurant_name}
    </Text>
    <View style={[styles.statusBadge, { backgroundColor: `${status.color}20`, borderColor: `${status.color}40` }]}>
      <Icon name={status.icon} size={10} color={status.color} />
      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
    </View>
  </View>

  {/* Third row: date + chevron */}
  <View style={styles.orderBottomRow}>
    <Text style={[styles.orderDate, { color: colors.textMuted }]}>
      {formatDate(order.created_at)}
    </Text>
    <Icon
      name={isExpanded ? 'chevron-up' : 'chevron-down'}
      size={16}
      color={colors.textMuted}
    />
  </View>
</View>

                  {!isExpanded && (
                    <View style={styles.previewItems}>
                      {order.items.slice(0, 3).map((item) => (
                        <View key={item.id} style={styles.previewItem}>
                          <Text style={[styles.previewItemText, { color: colors.textSecondary }]}>
                            {item.quantity}x {item.item_name}
                          </Text>
                        </View>
                      ))}
                      {order.items.length > 3 && (
                        <Text style={[styles.moreItems, { color: colors.textMuted }]}>
                          +{order.items.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                    {/* Items */}
                    <View style={styles.itemsSection}>
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Order Items</Text>
                      {order.items.map((item) => (
                        <View key={item.id} style={styles.orderItem}>
                          <View style={styles.orderItemLeft}>
                            <Text style={[styles.itemQty, { color: colors.brandPrimary }]}>{item.quantity}x</Text>
                            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
                            {item.is_veg ? (
                              <View style={styles.vegBadge}>
                                <View style={styles.vegDot} />
                              </View>
                            ) : (
                              <View style={styles.nonVegBadge}>
                                <View style={styles.nonVegDot} />
                              </View>
                            )}
                          </View>
                          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹{item.subtotal}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Restaurant Info Card */}
<View style={[styles.restaurantCard, { backgroundColor: colors.inputBg }]}>
  {order.restaurant_image ? (
    <Image source={{ uri: order.restaurant_image }} style={styles.restaurantImage} />
  ) : (
    <View style={[styles.restaurantImagePlaceholder, { backgroundColor: colors.brandPrimary + '20' }]}>
      <Icon name="home" size={24} color={colors.brandPrimary} />
    </View>
  )}
  <View style={styles.restaurantInfo}>
    <Text style={[styles.restaurantNameExpanded, { color: colors.textPrimary }]}>
      {order.restaurant_name}
    </Text>
    {order.restaurant_phone && (
      <TouchableOpacity onPress={() => makePhoneCall(order.restaurant_phone!)}>
        <Text style={[styles.restaurantPhone, { color: colors.brandPrimary }]}>
          {order.restaurant_phone}
        </Text>
      </TouchableOpacity>
    )}
  </View>
</View>

                    {/* Delivery & Contact */}
                    <View style={styles.infoGrid}>
                      <TouchableOpacity
                        onPress={() => openGoogleMaps(order.delivery_address)}
                        style={[styles.infoCard, { backgroundColor: colors.inputBg }]}
                      >
                        <Icon name="map-pin" size={16} color={colors.brandPrimary} />
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Delivery Address</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={2}>
                          {order.delivery_address}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => makePhoneCall(order.customer_phone)}
                        style={[styles.infoCard, { backgroundColor: colors.inputBg }]}
                      >
                        <Icon name="phone" size={16} color={colors.brandPrimary} />
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Contact</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{order.customer_phone}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Payment Info */}
                    <View style={styles.paymentInfo}>
                      <View style={styles.paymentRow}>
                        <Text style={[styles.paymentLabel, { color: colors.textMuted }]}>Payment Method</Text>
                        <Text style={[styles.paymentValue, { color: colors.textPrimary }]}>
                          {order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method}
                        </Text>
                      </View>
                      <View style={styles.paymentRow}>
                        <Text style={[styles.paymentLabel, { color: colors.textMuted }]}>Payment Status</Text>
                        <Text
                          style={[
                            styles.paymentValue,
                            order.payment_status === 'paid' && { color: '#10b981' },
                            order.payment_status === 'pending' && { color: '#eab308' },
                            order.payment_status === 'failed' && { color: '#ef4444' },
                          ]}
                        >
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                      <View style={[styles.instructionsCard, { backgroundColor: colors.inputBg }]}>
                        <Text style={[styles.instructionsLabel, { color: colors.textMuted }]}>Special Instructions</Text>
                        <Text style={[styles.instructionsText, { color: colors.textPrimary }]}>
                          {order.special_instructions}
                        </Text>
                      </View>
                    )}

                    {/* Timeline */}
                    <View style={[styles.timeline, { backgroundColor: colors.inputBg }]}>
                     <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
  {formatDate(order.created_at)}
</Text>
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
                        <View>
                          <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Order Placed</Text>
                          <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(order.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: status.color }]} />
                        <View>
                          <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>{status.label}</Text>
                          <Text style={[styles.timelineDate, { color: colors.textMuted }]}>Current Status</Text>
                        </View>
                      </View>
                    </View>
                    {/* Total Amount */}
<View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
  <Text style={[styles.totalAmount, { color: colors.brandPrimary }]}>
    ₹{order.total_amount}
  </Text>
</View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 110,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  browseButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 12,
  borderWidth: 1,
  alignSelf: 'flex-start',
  marginTop: 12,
},
browseButtonText: {
  fontSize: 14,
  fontWeight: '600',
},
activeTabIndicator: {
  position: 'absolute',
  inset: 0,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'transparent',
},
restaurantCard: {
  flexDirection: 'row',
  padding: 12,
  borderRadius: 12,
  gap: 12,
},
restaurantImage: {
  width: 48,
  height: 48,
  borderRadius: 8,
},
restaurantImagePlaceholder: {
  width: 48,
  height: 48,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
restaurantInfo: {
  flex: 1,
  gap: 4,
},
restaurantNameExpanded: {
  fontSize: 14,
  fontWeight: '600',
},
restaurantPhone: {
  fontSize: 12,
},
browseButtonLarge: {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
  marginTop: 16,
},
browseButtonLargeText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},
totalContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 12,
  marginTop: 4,
  borderTopWidth: 1,
},
totalLabel: {
  fontSize: 14,
  fontWeight: '500',
},
totalAmount: {
  fontSize: 18,
  fontWeight: 'bold',
},
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
orderHeader: {
  padding: 16,
  gap: 8,              // ← ADD THIS — breathing room between left and right
},
orderTopRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
},
orderSecondRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
orderBottomRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 2,
},
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
 orderNumber: {
  fontSize: 13,          // slightly smaller to fit
  fontWeight: 'bold',
  flex: 1,               // takes remaining space after amount
},
orderTotal: {
  fontSize: 16,
  fontWeight: 'bold',
  flexShrink: 0,         // never gets squeezed
},
orderDate: {
  fontSize: 11,
  flex: 1,               // takes full width — no more clipping
},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 12,
  },
orderRight: {
  alignItems: 'flex-end',
  gap: 4,
  minWidth: 90,        // ← ADD THIS — reserves space for the date
  flexShrink: 0,       // ← ADD THIS — prevents it from being squeezed
},

  previewItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  previewItemText: {
    fontSize: 11,
  },
  moreItems: {
    fontSize: 11,
  },
  expandedContent: {
    borderTopWidth: 1,
    padding: 16,
    gap: 16,
  },
  itemsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 12,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '500',
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
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
  },
  paymentInfo: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: 11,
  },
  paymentValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  instructionsCard: {
    padding: 12,
    borderRadius: 12,
  },
  instructionsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
  },
  timeline: {
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  timelineDate: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});