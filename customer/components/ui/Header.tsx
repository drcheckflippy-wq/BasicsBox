import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/icon.png';

const { width } = Dimensions.get('window');

interface HeaderProps {
  address: string;
  setAddress: (value: string) => void;
  handleLocate: () => void;
  handleSearch: () => void;
  locating: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

export default function Header({
  address,
  setAddress,
  handleLocate,
  handleSearch,
  locating,
  cartOpen,
  setCartOpen,
}: HeaderProps) {
  const { colors, theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const { isAuthenticated, userEmail, userRole, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrolled, setScrolled] = useState(false);
  
  // Animation for sidebar
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setScrolled(value > 20);
    });
    return () => scrollY.removeListener(listener);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: width,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '/(tabs)', icon: 'home' },
    { label: 'Contact Us', href: '#contact', icon: 'phone' },
  ];

  const handleNavigation = (href: string) => {
    if (href === '/(tabs)') {
      router.push('/(tabs)');
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    router.push('/(auth)/customer-auth');
  };

  return (
    <>
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
          },
        ]}
      >
        <View style={styles.headerContent}>
        {/* Logo */}
<TouchableOpacity
  onPress={() => router.push('/(tabs)')}
  style={styles.logoContainer}
>
  <Image
    source={logo}
    style={styles.logoIcon}
    resizeMode="contain"
  />
  <Text style={[styles.logoText, { color: colors.textPrimary }]}>
    Basics<Text style={{ color: colors.brandPrimary }}>Box</Text>
  </Text>
</TouchableOpacity>

          {/* Location Search */}
<View style={styles.locationSearchContainer}>
  <View style={[styles.locationInputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
    <TouchableOpacity onPress={handleLocate} style={styles.locationPin}>
      {locating ? (
        <ActivityIndicator size="small" color={colors.brandPrimary} />
      ) : (
        <Icon name="map-pin" size={16} color={colors.brandPrimary} />
      )}
    </TouchableOpacity>
    <TextInput
      style={[styles.locationInput, { color: colors.textPrimary }]}
      placeholder="Enter location..."
      placeholderTextColor={colors.textMuted}
      value={address}
      onChangeText={setAddress}
      onSubmitEditing={handleSearch}
    />
    <TouchableOpacity onPress={handleSearch} style={styles.searchIconButton}>
      <Icon name="search" size={16} color={colors.brandPrimary} />
    </TouchableOpacity>
  </View>
</View>

          {/* Right Controls */}
          <View style={styles.rightControls}>
            

          

            {/* Hamburger Menu Button */}
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(true)}
              style={styles.menuButton}
            >
              <Icon name="menu" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Sidebar Menu - Slide from Right to Left */}
      <Modal
        visible={mobileMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setMobileMenuOpen(false)}
          />
          <Animated.View
            style={[
              styles.sidebarMenu,
              {
                backgroundColor: colors.background,
                borderLeftColor: colors.border,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
             <Image
  source={logo}
  style={styles.sidebarLogoIcon}
  resizeMode="contain"
/>
              <Text style={[styles.sidebarLogoText, { color: colors.textPrimary }]}>
                Basics<Text style={{ color: colors.brandPrimary }}>Box</Text>
              </Text>
              <TouchableOpacity onPress={() => setMobileMenuOpen(false)} style={styles.sidebarCloseButton}>
                <Icon name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => handleNavigation(link.href)}
                  style={styles.sidebarNavItem}
                >
                  <Icon name={link.icon} size={20} color={colors.brandPrimary} />
                  <Text style={[styles.sidebarNavText, { color: colors.textPrimary }]}>{link.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={[styles.sidebarDivider, { backgroundColor: colors.border }]} />

              {/* Theme Toggle */}
              <TouchableOpacity onPress={toggleTheme} style={styles.sidebarNavItem}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} color={colors.brandPrimary} />
                <Text style={[styles.sidebarNavText, { color: colors.textPrimary }]}>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </TouchableOpacity>

              {isAuthenticated && (
                <>
                  <View style={[styles.sidebarDivider, { backgroundColor: colors.border }]} />
                  
                  {/* User Info */}
                  <View style={[styles.sidebarUserInfo, { backgroundColor: colors.cardHover }]}>
                    <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} style={styles.sidebarUserIcon}>
                      <Icon name="user" size={18} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={[styles.sidebarUserLabel, { color: colors.textMuted }]}>Signed in as</Text>
                      <Text style={[styles.sidebarUserEmail, { color: colors.textPrimary }]} numberOfLines={1}>
                        {userEmail}
                      </Text>
                    </View>
                  </View>

                  {/* Your Orders */}
                  <TouchableOpacity
                    onPress={() => {
                      router.push('./orders');
                      setMobileMenuOpen(false);
                    }}
                    style={styles.sidebarNavItem}
                  >
                    <Icon name="shopping-bag" size={20} color={colors.brandPrimary} />
                    <Text style={[styles.sidebarNavText, { color: colors.textPrimary }]}>Your Orders</Text>
                  </TouchableOpacity>

                  {/* Logout */}
                  <TouchableOpacity onPress={handleLogout} style={[styles.sidebarNavItem, styles.sidebarLogoutItem]}>
                    <Icon name="log-out" size={20} color={colors.error} />
                    <Text style={[styles.sidebarNavText, { color: colors.error }]}>Logout</Text>
                  </TouchableOpacity>
                </>
              )}

              {!isAuthenticated && (
                <TouchableOpacity
                  onPress={() => {
                    router.push('/(auth)/customer-auth');
                    setMobileMenuOpen(false);
                  }}
                  style={[styles.sidebarGetStarted, { backgroundColor: colors.brandPrimary }]}
                >
                  <Text style={styles.sidebarGetStartedText}>Get Started</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
  },
  locationSearchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginLeft: 12,
  marginRight: 12,
},
locationInputWrapper: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 8,
  height: 38,
},
locationPin: {
  paddingRight: 6,
},
locationInput: {
  fontSize: 12,
  flex: 1,
  paddingVertical: 6,
},
searchIconButton: {
  paddingHorizontal: 8,
  paddingVertical: 6,
},
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  menuButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdown: {
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dropdownEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  // Sidebar Styles
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarMenu: {
    width: width * 0.75,
    height: '100%',
    borderLeftWidth: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderBottomWidth: 1,
  },
  sidebarLogoIcon: {
    width: 40,
  height: 40,
  borderRadius: 12,
  },
  sidebarLogoText: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  sidebarCloseButton: {
    padding: 6,
  },
  sidebarContent: {
    padding: 20,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  sidebarNavText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sidebarDivider: {
    height: 1,
    marginVertical: 12,
  },
  sidebarUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  sidebarUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarUserLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sidebarUserEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  sidebarLogoutItem: {
    marginTop: 8,
  },
  sidebarGetStarted: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  sidebarGetStartedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});