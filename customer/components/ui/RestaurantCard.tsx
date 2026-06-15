import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { RestaurantData } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = 340;

interface RestaurantCardProps {
  restaurant: RestaurantData;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  viewMode?: 'all' | 'nearby';
  distance?: string;
   onReviewsPress?: () => void;
}

export default function RestaurantCard({
  restaurant,
  onPress,
  onFavoritePress,
  onReviewsPress, // Add this line
  isFavorite = false,
  viewMode = 'all',
  distance,
}: RestaurantCardProps) {
  const { colors } = useTheme();
  const { restaurant: r, menu } = restaurant;

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

  const hasOffer = menu?.some(m => m.has_offer);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        
        {/* Badges */}
        <View style={styles.badgeContainer}>
          {!r.is_open && (
            <View style={[styles.badge, styles.closedBadge]}>
              <Text style={styles.badgeText}>Closed</Text>
            </View>
          )}
          {hasOffer && (
            <View style={[styles.badge, styles.offerBadge]}>
              <Icon name="percent" size={10} color="#fff" />
              <Text style={styles.badgeText}>Offers</Text>
            </View>
          )}
        </View>

        {/* Favorite Button */}
        {onFavoritePress && (
          <TouchableOpacity onPress={onFavoritePress} style={styles.favoriteButton}>
            <Icon
              name="heart"
              size={16}
              color={isFavorite ? '#ef4444' : '#fff'}
              style={isFavorite ? styles.favoriteActive : {}}
            />
          </TouchableOpacity>
        )}

        {/* Open Status */}
        {r.is_open && (
        <View style={styles.openStatus}>
  <View style={[styles.openDot, { backgroundColor: r.is_open ? '#10b981' : '#ef4444' }]} />
  <Text style={[styles.openText, { color: r.is_open ? '#10b981' : '#ef4444' }]}>
    {r.is_open ? 'Open Now' : 'Closed'}
  </Text>
</View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
         <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
  {r.name}
</Text>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={10} color="#fff" />
            <Text style={styles.ratingText}>{r.rating}</Text>
          </View>
        </View>

        <Text style={[styles.cuisine, { color: colors.textMuted }]} numberOfLines={1}>
          {r.cuisine}
        </Text>

        <View style={styles.detailsRow}>
          {r.opening_time && r.closing_time && (
            <View style={styles.detailItem}>
              <Icon name="clock" size={10} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                {r.opening_time.slice(0, 5)}–{r.closing_time.slice(0, 5)}
              </Text>
            </View>
          )}
          {r.days_open && (
            <Text style={[styles.detailText, { color: colors.textMuted }]}>
              · {formatDays(r.days_open)}
            </Text>
          )}
          {viewMode === 'nearby' && distance && (
            <View style={styles.detailItem}>
              <Icon name="bike" size={10} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>{distance}</Text>
            </View>
          )}
        </View>

        <View style={styles.freeDelivery}>
          <Icon name="truck" size={10} color="#10b981" />
          <Text style={[styles.freeDeliveryText, { color: '#10b981' }]}>Free Delivery</Text>
        </View>

        <View style={styles.tagsContainer}>
          {r.tags?.slice(0, 2).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
            </View>
          ))}
         
        </View>

      <View style={styles.footerRow}>
  <TouchableOpacity 
    onPress={onReviewsPress} 
    style={styles.reviewsButton}
  >
    <Icon name="star" size={12} color="#f97316" />
    <Text style={[styles.reviewsText, { color: '#f97316' }]}>
      {r.reviews_count} reviews
    </Text>
  </TouchableOpacity>
  <View style={styles.menuLink}>
    <Text style={[styles.menuText, { color: '#f97316' }]}>Menu</Text>
    <Icon name="arrow-right" size={12} color="#f97316" />
  </View>
</View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT, 
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closedBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  offerBadge: {
    backgroundColor: '#f97316',
  },
  
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteActive: {
    color: '#ef4444',
  },
openStatus: {
  position: 'absolute',
  bottom: 8,
  left: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  backgroundColor: 'rgba(0,0,0,0.6)',
},

openDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  // Remove backgroundColor from here - will be set inline
},

openText: {
  fontSize: 9,
  fontWeight: 'bold',
  // Remove color from here - will be set inline
},
content: {
  padding: 12,
  flex: 1,
},
headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 4,
},
name: {
  fontSize: 14,
  fontWeight: 'bold',
  flex: 1,
  lineHeight: 18,
  marginRight: 8,
},
ratingBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 8,
  backgroundColor: '#16a34a',
},
ratingText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
},
cuisine: {
  fontSize: 12,
  color: '#666',
  marginBottom: 4,
},
reviewsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
},
ratingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
reviewCount: {
  fontSize: 11,
},
detailsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 4,
  marginBottom: 4,
},
detailItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
detailText: {
  fontSize: 10,
  color: '#666',
},
freeDelivery: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 6,
},
freeDeliveryText: {
  fontSize: 10,
  fontWeight: '600',
  color: '#10b981',
},
tagsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 6,
},
tag: {
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 12,
  backgroundColor: '#f0f0f0',
},
tagText: {
  fontSize: 9,
  fontWeight: '500',
  color: '#666',
},
itemsTag: {
  backgroundColor: '#fff3e6',
  borderWidth: 1,
  borderColor: '#f97316',
},
footerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
 paddingTop: 6, // Change from 10 to 6
  marginTop: 5, // Change from 'auto' to 0
},
reviewsButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
reviewsText: {
  fontSize: 11,
  color: '#f97316',
  fontWeight: '500',
},
menuLink: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
menuText: {
  fontSize: 11,
  fontWeight: 'bold',
  color: '#f97316',
},
});