import React, { createContext, useContext, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  is_veg: boolean;
  category: string;
  has_offer?: boolean;
  offer_percentage?: number;
  offer_price?: number;
  offer_expiry?: string;
};

export type Restaurant = {
  is_manually_overridden: any;
  id: number;
  name: string;
  cuisine: string;
  image: string;
  latitude: number;
  longitude: number;
  tags: string[];
  rating: number;
  reviews_count: number;
  opening_time: string | null;
  closing_time: string | null;
  days_open: string | null;
  is_open: boolean;
};

export type RestaurantData = {
  restaurant: Restaurant;
  menu: MenuItem[];
  reviews: any[];
};

export type CartItem = MenuItem & {
  qty: number;
  restaurantId: number;
};

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  currentRestaurant: RestaurantData | null;
  setCurrentRestaurant: (restaurant: RestaurantData | null) => void;
  addToCart: (item: MenuItem, restaurantId: number, restaurantData: RestaurantData) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantData | null>(null);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.has_offer && item.offer_price ? item.offer_price : item.price;
      return sum + price * item.qty;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const addToCart = (item: MenuItem, restaurantId: number, restaurantData: RestaurantData) => {
    setCurrentRestaurant(restaurantData);
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, restaurantId }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setCurrentRestaurant(null);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartTotal,
      currentRestaurant,
      setCurrentRestaurant,
      addToCart,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}