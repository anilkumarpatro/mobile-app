import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Routes, type MainTabParamList } from './routes';
import { HomeStack } from './HomeStack';
import { SearchScreen } from '../../screens/search/SearchScreen';
import { CartScreen } from '../../screens/cart/CartScreen';
import { OrdersScreen } from '../../screens/orders/OrdersScreen';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Search: '🔍',
    Cart: '🛒',
    Orders: '📦',
    Profile: '👤',
  };
  return <Text style={{ fontSize: focused ? 18 : 16, opacity: focused ? 1 : 0.7 }}>{icons[label] ?? '•'}</Text>;
}

export function MainTabs() {
  const lineCount = useCartStore((s) => s.items.length);
  const user = useAuthStore((s) => s.user);
  const loadCart = useCartStore((s) => s.loadCart);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.token) {
      loadCart();
    }
  }, [loadCart, user?.token]);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? spacing.sm : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: spacing.sm,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}>
      <Tab.Screen name={Routes.Home} component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name={Routes.Search} component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen
        name={Routes.Cart}
        component={CartScreen}
        options={{ title: lineCount > 0 ? `Cart (${lineCount})` : 'Cart' }}
      />
      <Tab.Screen name={Routes.Orders} component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name={Routes.Profile} component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
