import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchMyOrders, mapOrdersFromApi } from '../../services/orders.service';
import { getOrderStatusLabel } from '../../utils/orderHelpers';
import { formatInr, fmtOrderDateTime } from '../../utils/format';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { GuestAuthPrompt } from '../../components/auth/GuestAuthPrompt';
import { useAuthStore } from '../../store/authStore';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Order } from '../../types';

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const isGuest = !user?.token;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const tabBarInset = useTabBarInset();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchMyOrders();
      setOrders(mapOrdersFromApi(payload));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        loadOrders();
      } else {
        setLoading(false);
      }
    }, [isGuest, loadOrders]),
  );

  if (loading && !isGuest) return <LoadingView />;

  return (
    <Screen scroll={false}>
      <Header title="Orders" subtitle={isGuest ? 'Sign in to view your orders' : 'Your order history'} />
      {isGuest ? (
        <GuestAuthPrompt
          title="Login to view orders"
          message="Track deliveries, reorder medicines, and see your complete order history after signing in."
        />
      ) : (
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadOrders}
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        ListEmptyComponent={
          <EmptyState title="No orders yet" message="Your placed orders will appear here." />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate(Routes.OrderDetail, { orderId: item.id })}>
            <View style={styles.row}>
              <Text style={styles.id}>#{item.id}</Text>
              <Text style={styles.status}>{getOrderStatusLabel(item)}</Text>
            </View>
            <Text style={styles.date}>{fmtOrderDateTime(item.placedAt)}</Text>
            <Text style={styles.total}>{formatInr(item.total)}</Text>
          </Pressable>
        )}
      />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { color: colors.textBright, fontWeight: '800', fontSize: 16 },
  status: { color: colors.accent, fontWeight: '700' },
  date: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  total: { color: colors.textBright, marginTop: spacing.sm, fontWeight: '800', fontSize: 18 },
});
