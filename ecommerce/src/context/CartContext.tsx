import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type MenuItem = {
  id: number; name: string; price: number; description: string;
  image: string; is_veg: boolean; category: string;
  has_offer?: boolean; offer_percentage?: number; offer_price?: number; offer_expiry?: string;
};
export type Review = { user_email: string; rating: number; comment: string; created_at: string; };
export type Restaurant = {
  id: number; name: string; cuisine: string; image: string;
  latitude: number; longitude: number; google_maps_url?: string;
  tags: string[]; rating: number; reviews_count: number;
  opening_time: string | null; closing_time: string | null;
  days_open: string | null; is_open: boolean;
   is_manually_overridden?: boolean; 
};
export type RestaurantData = { restaurant: Restaurant; menu: MenuItem[]; reviews: Review[]; };
export type CartItem = MenuItem & { qty: number; restaurantId: number };

type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  currentRestaurant: RestaurantData | null;
  setCurrentRestaurant: (r: RestaurantData | null) => void;
  addToCart: (item: MenuItem, restaurantId: number, rdata: RestaurantData) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantData | null>(null);

  const cartTotal = useMemo(() =>
    cart.reduce((s, c) => s + (c.has_offer && c.offer_price ? c.offer_price : c.price) * c.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  const addToCart = (item: MenuItem, restaurantId: number, rdata: RestaurantData) => {
    setCurrentRestaurant(rdata);
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, restaurantId }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === itemId);
      if (ex && ex.qty > 1) return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => c.id !== itemId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setCurrentRestaurant(null);
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, cartTotal, currentRestaurant, setCurrentRestaurant, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}