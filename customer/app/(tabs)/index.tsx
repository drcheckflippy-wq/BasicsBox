import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Modal,
  Platform,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Feather';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/ui/Header';
import RestaurantCard from '../../components/ui/RestaurantCard';
import CartSidebar from '../../components/ui/CartSidebar';
import RestaurantModal from '../../components/ui/RestaurantModal';
import CheckoutModal from '../../components/ui/CheckoutModal';
import ReviewsModal from '../../components/ui/ReviewsModal';
import {
  fetchRestaurants,
  fetchNearbyRestaurants,
  fetchFoodItems,
  fetchReviews,
} from '../../services/api';
import { RestaurantData } from '../../context/CartContext';
import { motion } from "framer-motion";

const { width, height } = Dimensions.get('window');

interface FoodItem {
  id: number;
  name: string;
  image: string;
}

export default function HomeScreen() {
  const { colors, theme } = useTheme();
  const { cartCount, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();

  // State
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingFood, setLoadingFood] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'nearby'>('all');
  const [filterVeg, setFilterVeg] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [selectedRestaurantForReview, setSelectedRestaurantForReview] = useState<number | null>(null);
  const [reviews, setReviews] = useState<{ [key: number]: any[] }>({});
  const [loadingReviews, setLoadingReviews] = useState<{ [key: number]: boolean }>({});
  const [userHasReviewed, setUserHasReviewed] = useState<{ [key: number]: boolean }>({});

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const floatAnimations = useRef(foodItems.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadInitialData();
    startFloatingAnimations();
  }, []);

  // ── REAL-TIME STATUS POLLING ─────────────────────────────────────────────────
  // Mirrors Home.tsx: checks BOTH is_open AND is_manually_overridden every 5s
  useEffect(() => {
    if (restaurants.length === 0) return;

    let isMounted = true;

    const fetchRealStatus = async () => {
      try {
        let url = 'https://basicsbox.pythonanywhere.com/api/get-all-restaurants-full/';
        if (viewMode === 'nearby' && address && address.includes(',')) {
          const [lat, lng] = address.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            url = `https://basicsbox.pythonanywhere.com/api/restaurants/?lat=${lat}&lng=${lng}`;
          }
        }

        const response = await fetch(url);
        const freshData = await response.json();

        if (isMounted && Array.isArray(freshData)) {
          setRestaurants(prevRestaurants => {
            let hasChanges = false;

            const freshMap = new Map();
            freshData.forEach((item: any) => {
              if (item.restaurant?.id) freshMap.set(item.restaurant.id, item);
            });

            const updatedRestaurants = prevRestaurants.map(prev => {
              const fresh = freshMap.get(prev.restaurant.id);
              if (fresh) {
                const oldIsOpen     = prev.restaurant.is_open;
                const newIsOpen     = fresh.restaurant.is_open;
                const oldOverride   = prev.restaurant.is_manually_overridden;
                const newOverride   = fresh.restaurant.is_manually_overridden;

                // ← mirrors Home.tsx: check BOTH fields, not just is_open
                if (oldIsOpen !== newIsOpen || oldOverride !== newOverride) {
                  hasChanges = true;
                  console.log(`🔄 POLLING UPDATE: ${prev.restaurant.name}`, {
                    is_open: `${oldIsOpen} → ${newIsOpen}`,
                    is_manually_overridden: `${oldOverride} → ${newOverride}`,
                  });
                  return fresh;
                }
              }
              return prev;
            });

            return hasChanges ? updatedRestaurants : prevRestaurants;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll every 5 seconds (matches Home.tsx)
    const interval = setInterval(fetchRealStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [restaurants.length, viewMode, address]);

  // ── Debug log whenever restaurants state updates (mirrors Home.tsx) ──────────
  useEffect(() => {
    console.log(
      `📊 Restaurant count: ${restaurants.length}, ` +
      `Open: ${restaurants.filter(r => r.restaurant.is_open).length}, ` +
      `Closed: ${restaurants.filter(r => !r.restaurant.is_open).length}`
    );
  }, [restaurants]);

  const startFloatingAnimations = () => {
    floatAnimations.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 3000 + i * 500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 3000 + i * 500, useNativeDriver: true }),
        ])
      ).start();
    });
  };

  const loadInitialData = async () => {
    await Promise.all([loadFoodItems(), loadAllRestaurants()]);
  };

  const loadFoodItems = async () => {
    setLoadingFood(true);
    try {
      const data = await fetchFoodItems();
      if (Array.isArray(data)) setFoodItems(data);
    } catch (e) { console.error('Error loading food items:', e); }
    finally { setLoadingFood(false); }
  };

  const loadAllRestaurants = async () => {
    setLoadingRestaurants(true);
    setViewMode('all');
    try {
      const data = await fetchRestaurants();
      if (Array.isArray(data)) setRestaurants(data);
    } catch (e) { console.error('Error loading restaurants:', e); }
    finally { setLoadingRestaurants(false); }
  };

  const loadNearbyRestaurants = async (lat: number, lng: number) => {
    setLoadingRestaurants(true);
    setViewMode('nearby');
    try {
      const data = await fetchNearbyRestaurants(lat, lng);
      if (Array.isArray(data)) setRestaurants(data);
    } catch (e) { console.error('Error loading nearby restaurants:', e); }
    finally { setLoadingRestaurants(false); }
  };

  // ── Manual refresh — mirrors Home.tsx handleManualRefresh ────────────────────
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    if (viewMode === 'nearby' && address && address.includes(',')) {
      const [lat, lng] = address.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        await loadNearbyRestaurants(lat, lng);
        return;
      }
    }
    await loadAllRestaurants();
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { alert('Location permission denied'); return; }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      await loadNearbyRestaurants(latitude, longitude);
    } catch (e) { console.error('Location error:', e); alert('Could not get location'); }
    finally { setLocating(false); }
  };

  const handleSearch = () => { loadAllRestaurants(); };

  const handleRestaurantPress = (restaurant: RestaurantData) => {
    setSelectedRestaurant(restaurant);
  };

  const openReviewsModal = async (restaurantId: number) => {
    setSelectedRestaurantForReview(restaurantId);
    setReviewsModalOpen(true);
    setLoadingReviews(prev => ({ ...prev, [restaurantId]: true }));
    try {
      const data = await fetchReviews(restaurantId);
      setReviews(prev => ({ ...prev, [restaurantId]: data }));
    } catch (e) { console.error('Error loading reviews:', e); }
    finally { setLoadingReviews(prev => ({ ...prev, [restaurantId]: false })); }
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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

  const renderFoodItem = ({ item, index }: { item: FoodItem; index: number }) => {
    const translateY = floatAnimations[index]?.interpolate({
      inputRange: [0, 1], outputRange: [0, -12],
    }) || 0;
    return (
      <Animated.View style={[styles.foodItem, { transform: [{ translateY }], backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.foodItemInner}>
          <Image
            source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' }}
            style={styles.foodImage}
          />
          <Text style={[styles.foodName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        </View>
      </Animated.View>
    );
  };

  const renderRestaurant = ({ item }: { item: RestaurantData }) => {
    // ← mirrors Home.tsx: closed if is_open is false (covers both schedule + manual override)
    const isClosed = !item.restaurant.is_open;
    // ← mirrors Home.tsx: show the detailed "temporarily closed" overlay only when force-closed
    const isForceClosedOverride = isClosed && item.restaurant.is_manually_overridden;

    return (
      <TouchableOpacity
        activeOpacity={isClosed ? 1 : 0.7}
        onPress={() => !isClosed && handleRestaurantPress(item)}
        style={[
          styles.restaurantCard,
          {
            // ← mirrors Home.tsx opacity: 0.55 when closed
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: isClosed ? 0.55 : 1,
          },
        ]}
      >
        {/* Image Section */}
        <View style={styles.restaurantImageContainer}>
          <Image
            source={{ uri: item.restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' }}
            style={[
              styles.restaurantImage,
              // ← mirrors Home.tsx filter: blur(1px) when closed
              isClosed && { opacity: 0.6 },
            ]}
          />

          {/* Generic closed badge (schedule-based close) */}
          {isClosed && !isForceClosedOverride && (
            <View style={styles.closedBadgeTop}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}

          {/* ← NEW: Detailed overlay only when force-closed via manual override
               mirrors Home.tsx: Clock icon + "Sorry, we cannot take your orders" */}
          {isForceClosedOverride && (
            <View style={styles.forceClosedOverlay}>
              <Icon name="clock" size={28} color="#f87171" />
              <Text style={styles.forceClosedTitle}>
                Sorry, we cannot take your orders at the moment
              </Text>
              <Text style={styles.forceClosedSub}>Restaurant is temporarily closed</Text>
            </View>
          )}

          {/* Open Now badge */}
          {!isClosed && (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now</Text>
            </View>
          )}

          {/* Favorite button */}
          <TouchableOpacity
            onPress={() => toggleFavorite(item.restaurant.id)}
            style={styles.favoriteButton}
          >
            <Icon
              name="heart"
              size={16}
              color={favorites.includes(item.restaurant.id) ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.restaurant.name}
          </Text>
          <Text style={[styles.restaurantCuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.restaurant.cuisine}
          </Text>
          <View style={styles.restaurantDetails}>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={10} color="#fbbf24" />
              <Text style={styles.ratingText}>{item.restaurant.rating}</Text>
            </View>
            <Text style={[styles.detailText, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.detailText, { color: colors.textMuted }]}>
              {item.restaurant.opening_time?.slice(0, 5)}–{item.restaurant.closing_time?.slice(0, 5)}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <TouchableOpacity onPress={() => openReviewsModal(item.restaurant.id)} style={styles.reviewButton}>
              <Icon name="message-circle" size={10} color={colors.textMuted} />
              <Text style={[styles.reviewText, { color: colors.textMuted }]}>
                {item.restaurant.reviews_count || 0} reviews
              </Text>
            </TouchableOpacity>
            <Text style={[styles.deliveryText, { color: '#4ade80' }]}>Free Delivery</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredRestaurants = filterVeg
    ? restaurants.filter(r => r.menu?.some(m => m.is_veg))
    : restaurants;

  const promoBanners = [
    { title: 'FOOD DELIVERY',  sub: 'FROM RESTAURANTS',     badge: 'UPTO 60% OFF',  bgColor: '#FF5A1F', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=85' },
    { title: 'FREE DELIVERY',  sub: 'ON ORDERS ABOVE ₹299', badge: 'LIMITED TIME',   bgColor: '#0EA5E9', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=85' },
    { title: 'NEW ARRIVALS',   sub: 'FRESH RESTAURANTS',    badge: 'EXPLORE NOW',    bgColor: '#A855F7', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=85' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExpoStatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <Header
        address={address}
        setAddress={setAddress}
        handleLocate={handleLocate}
        handleSearch={handleSearch}
        locating={locating}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} style={{ flex: 1 }}>

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1800&q=85' }}
            style={styles.heroBackground}
            imageStyle={{ opacity: theme === 'dark' ? 0.3 : 0.08 }}
          >
            <LinearGradient
              colors={theme === 'dark'
                ? ['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.6)']
                : ['rgba(255,247,237,0.98)', 'rgba(255,245,235,0.95)']}
              style={styles.heroGradient}
            >
              {/* Floating Icons */}
              <View style={styles.floatingIconsContainer}>
                {[
                  { emoji: '☕', left: 15, top: 100 },
                  { emoji: '🍰', left: width - 70, top: 180 },
                  { emoji: '🐟', left: 40, top: 280 },
                  { emoji: '🥗', left: width - 90, top: 350 },
                  { emoji: '🍕', left: 20, top: 480 },
                  { emoji: '🍦', left: width - 60, top: 520 },
                ].map((item, i) => {
                  const ty = new Animated.Value(0);
                  Animated.loop(
                    Animated.sequence([
                      Animated.timing(ty, { toValue: -12, duration: 3000 + i * 500, useNativeDriver: true }),
                      Animated.timing(ty, { toValue: 0,   duration: 3000 + i * 500, useNativeDriver: true }),
                    ])
                  ).start();
                  return (
                    <Animated.View key={i} style={[styles.floatingIcon, { left: item.left, top: item.top, transform: [{ translateY: ty }], opacity: theme === 'dark' ? 0.45 : 0.25 }]}>
                      <Text style={styles.emoji}>{item.emoji}</Text>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Hero Text */}
              <View style={styles.heroTextSection}>
                <View style={[styles.badge, { backgroundColor: `${colors.brandPrimary}20`, borderColor: `${colors.brandPrimary}40` }]}>
                  <Icon name="zap" size={12} color={colors.brandPrimary} />
                  <Text style={[styles.badgeText, { color: colors.brandPrimary }]}>Fastest delivery in town</Text>
                </View>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Order food &{'\n'}groceries</Text>
                <Text style={[styles.heroTitleGradient, { color: colors.brandPrimary }]}>delivered to you</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  From your favourite restaurants to fresh groceries — get everything delivered fast.
                </Text>
                <View style={styles.statsRow}>
                  {[
                    { icon: 'zap',   val: '25 min', label: 'Avg delivery' },
                    { icon: 'truck', val: 'Free',   label: 'Delivery' },
                    { icon: 'tag',   val: '500+',   label: 'Restaurants' },
                  ].map(({ icon, val, label }, i) => (
                    <View key={i} style={styles.statItem}>
                      <View style={[styles.statIcon, { backgroundColor: `${colors.brandPrimary}20`, borderColor: `${colors.brandPrimary}40` }]}>
                        <Icon name={icon} size={18} color={colors.brandPrimary} />
                      </View>
                      <View>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{val}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Promo Banners */}
              <View style={styles.promoStack}>
                {promoBanners.map((b, i) => (
                  <View key={i} style={[styles.promoCardVertical, { backgroundColor: b.bgColor }]}>
                    <LinearGradient colors={['rgba(0,0,0,0.15)', 'transparent']} style={styles.promoGradientVertical}>
                      <View style={styles.promoContentVertical}>
                        <Text style={styles.promoTitle}>{b.title}</Text>
                        <Text style={styles.promoSub}>{b.sub}</Text>
                        <View style={[styles.promoBadge, { backgroundColor: `${b.bgColor}20`, borderColor: `${b.bgColor}40` }]}>
                          <Text style={[styles.promoBadgeText, { color: b.bgColor }]}>{b.badge}</Text>
                        </View>
                      </View>
                      <Image source={{ uri: b.img }} style={styles.promoImageVertical} />
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

       {/* Food Categories */}
{/* <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>What's on your mind?</Text>
  </View>
  {loadingFood ? (
    <FlatList horizontal showsHorizontalScrollIndicator={false}
      data={[1,2,3,4,5,6]} keyExtractor={i => i.toString()}
      renderItem={() => (
        <View style={styles.foodItemSkeleton}>
          <View style={[styles.skeletonCircle, { backgroundColor: colors.inputBg }]} />
          <View style={[styles.skeletonText, { backgroundColor: colors.inputBg }]} />
        </View>
      )}
      contentContainerStyle={styles.foodList}
    />
  ) : (
    <FlatList horizontal showsHorizontalScrollIndicator={false}
      data={foodItems} keyExtractor={i => i.id.toString()}
      renderItem={renderFoodItem} contentContainerStyle={styles.foodList}
    />
  )}
</View> */}

        {/* Restaurants */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.restaurantsHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {viewMode === 'nearby' ? 'Restaurants near you' : 'All Restaurants'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                {loadingRestaurants ? 'Loading...' : `${filteredRestaurants.length} restaurants available`}
              </Text>
            </View>
            <View style={styles.headerControls}>
              {/* All / Nearby toggle */}
              <View style={styles.viewModeButtons}>
                <TouchableOpacity
                  onPress={() => { setViewMode('all'); loadAllRestaurants(); }}
                  style={[styles.viewModeButton, viewMode === 'all' && { backgroundColor: colors.brandPrimary }]}
                >
                  <Text style={[styles.viewModeText, viewMode === 'all' && { color: '#fff' }]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!address) { alert('Click the location pin first'); return; }
                    const parts = address.split(',');
                    if (parts.length === 2) {
                      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
                      if (!isNaN(lat) && !isNaN(lng)) loadNearbyRestaurants(lat, lng);
                      else alert('Click the location pin first');
                    }
                  }}
                  style={[styles.viewModeButton, viewMode === 'nearby' && { backgroundColor: colors.brandPrimary }]}
                >
                  <Text style={[styles.viewModeText, viewMode === 'nearby' && { color: '#fff' }]}>Nearby</Text>
                </TouchableOpacity>
              </View>

              {/* ← NEW: Refresh button — mirrors Home.tsx */}
              <TouchableOpacity
                onPress={handleManualRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              >
                <Icon name="refresh-cw" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {loadingRestaurants ? (
            <View style={styles.loadingGrid}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={[styles.restaurantSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.skeletonImage, { backgroundColor: colors.inputBg }]} />
                  <View style={styles.skeletonContent}>
                    {['70%','50%','90%'].map((w, j) => (
                      <View key={j} style={[styles.skeletonLine, { backgroundColor: colors.inputBg, width: w as any }]} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={filteredRestaurants}
              keyExtractor={item => item.restaurant.id.toString()}
              renderItem={renderRestaurant}
              numColumns={2}
              columnWrapperStyle={styles.restaurantGrid}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="coffee" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No restaurants found</Text>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>Try enabling location or searching nearby</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cartCount > 0 && !cartOpen && !selectedRestaurant && (
        <Animated.View style={[styles.floatingCart, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0,200], outputRange: [0,100], extrapolate: 'clamp' }) }] }]}>
          <TouchableOpacity onPress={() => setCartOpen(true)} style={[styles.cartButton, { backgroundColor: colors.brandPrimary }]}>
            <Icon name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.cartButtonText}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
            <View style={styles.cartDivider} />
            <Text style={styles.cartButtonText}>₹{cartTotal}</Text>
            <Icon name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modals */}
      <CartSidebar visible={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal visible={checkoutOpen} onClose={() => setCheckoutOpen(false)} address={address} onLocate={handleLocate} locating={locating} />
      <RestaurantModal visible={!!selectedRestaurant} restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} onOpenCart={() => setCartOpen(true)} filterVeg={filterVeg} />
      <ReviewsModal
        visible={reviewsModalOpen}
        restaurantId={selectedRestaurantForReview}
        reviews={reviews}
        loadingReviews={loadingReviews}
        userHasReviewed={userHasReviewed}
        onClose={() => { setReviewsModalOpen(false); setSelectedRestaurantForReview(null); }}
        onReviewAdded={(rid) => { if (rid) { openReviewsModal(rid); loadAllRestaurants(); } }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 83, paddingBottom: 40 },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroContainer: { width: '100%', marginBottom: 20 },
  heroBackground: { width: '100%', minHeight: 550 },
  heroGradient: { flex: 1, paddingVertical: 10 },
  floatingIconsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 },
  floatingIcon: { position: 'absolute', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  emoji: { fontSize: 42, textAlign: 'center' },
  heroTextSection: { paddingHorizontal: 20, paddingTop: 10, zIndex: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 20 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  heroTitle: { fontSize: 32, fontWeight: 'bold', lineHeight: 40, marginBottom: 4 },
  heroTitleGradient: { fontSize: 32, fontWeight: 'bold', lineHeight: 40, marginBottom: 16 },
  heroSubtitle: { fontSize: 14, marginBottom: 28, lineHeight: 20, width: '90%' },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  statLabel: { fontSize: 10 },

  // ── Promo ───────────────────────────────────────────────────────────────────
  promoStack: { paddingHorizontal: 20, gap: 12, marginTop: 16, marginBottom: 20, zIndex: 2 },
  promoCardVertical: { width: '100%', height: 95, borderRadius: 16, overflow: 'hidden' },
  promoGradientVertical: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  promoContentVertical: { flex: 1 },
  promoTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  promoSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 4 },
  promoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 },
  promoBadgeText: { fontSize: 8, fontWeight: 'bold' },
  promoImageVertical: { width: 70, height: 70, borderRadius: 12 },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { paddingVertical: 32, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 11, marginTop: 4 },

  // ── Food list ───────────────────────────────────────────────────────────────
  foodList: { paddingVertical: 8 },
  foodItem: { width: 90, marginRight: 12, borderRadius: 12, overflow: 'hidden' },
  foodItemInner: { alignItems: 'center', padding: 8 },
  foodImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  foodName: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  foodItemSkeleton: { width: 90, alignItems: 'center', marginRight: 12 },
  skeletonCircle: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  skeletonText: { width: 60, height: 12, borderRadius: 6 },

  // ── Restaurants header ──────────────────────────────────────────────────────
  restaurantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewModeButtons: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 2 },
  viewModeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  viewModeText: { fontSize: 12, fontWeight: '600', color: '#666' },
  // ← NEW: refresh button style
  refreshButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Restaurant cards ────────────────────────────────────────────────────────
  restaurantGrid: { justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  restaurantCard: { width: (width - 48) / 2, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  restaurantImageContainer: { position: 'relative', height: 140, width: '100%' },
  restaurantImage: { width: '100%', height: '100%' },

  // Generic closed badge (schedule-based)
  closedBadgeTop: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
  },
  closedBadgeText: { color: '#f87171', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  // ← NEW: Force-closed overlay (manual override) — mirrors Home.tsx centred overlay
  forceClosedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 8,
  },
  forceClosedTitle: {
    color: '#ffffff', fontWeight: 'bold', fontSize: 10,
    textAlign: 'center', marginTop: 6,
  },
  forceClosedSub: {
    color: '#f87171', fontSize: 9, marginTop: 2, textAlign: 'center',
  },

  openBadge: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  openText: { color: '#4ade80', fontSize: 9, fontWeight: 'bold' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
  restaurantInfo: { padding: 10 },
  restaurantName: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  restaurantCuisine: { fontSize: 11, marginBottom: 6 },
  restaurantDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  detailText: { fontSize: 10 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  reviewButton: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewText: { fontSize: 9 },
  deliveryText: { fontSize: 9, fontWeight: 'bold' },

  // ── Skeletons ───────────────────────────────────────────────────────────────
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  restaurantSkeleton: { width: (width - 48) / 2, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  skeletonImage: { height: 140 },
  skeletonContent: { padding: 12, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },

  // ── Empty ───────────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { fontSize: 12, textAlign: 'center' },

  // ── Floating cart ───────────────────────────────────────────────────────────
  floatingCart: { position: 'absolute', bottom: 24, left: 16, right: 16, alignItems: 'center' },
  cartButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  cartButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  cartDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' },
});