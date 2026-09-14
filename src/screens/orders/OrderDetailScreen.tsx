import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { cancelCustomerOrder, fetchMyOrders, mapOrdersFromApi } from '../../services/orders.service';
import { canCancelOrder, getOrderStatusLabel } from '../../utils/orderHelpers';
import { formatInr, fmtOrderDateTime } from '../../utils/format';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Order } from '../../types';

export function OrderDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.OrderDetail>>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const payload = await fetchMyOrders();
        const orders = mapOrdersFromApi(payload);
        setOrder(orders.find((o) => o.id === route.params.orderId) ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params.orderId]);

  const handleCancel = () => {
    if (!order) return;
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelCustomerOrder(order.id);
            Alert.alert('Cancelled', 'Your order has been cancelled.');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not cancel order');
          }
        },
      },
    ]);
  };

  if (loading || !order) return <LoadingView />;

  return (
    <Screen>
      <Header title={`Order #${order.id}`} onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{getOrderStatusLabel(order)}</Text>
        <Text style={styles.label}>Placed on</Text>
        <Text style={styles.value}>{fmtOrderDateTime(order.placedAt)}</Text>
        <Text style={styles.label}>Payment</Text>
        <Text style={styles.value}>{order.paymentMethod.toUpperCase()}</Text>
        {order.address ? (
          <>
            <Text style={styles.label}>Delivery address</Text>
            <Text style={styles.value}>{order.address}</Text>
          </>
        ) : null}
      </View>

      <Text style={styles.section}>Items</Text>
      {order.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>Qty {item.qty}</Text>
          </View>
          <Text style={styles.itemPrice}>{formatInr(item.price * item.qty)}</Text>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatInr(order.total)}</Text>
      </View>

      <Button label="Track order" variant="secondary" onPress={() => navigation.navigate(Routes.OrderTracking, { orderId: order.id })} />
      {canCancelOrder(order) ? (
        <Button label="Cancel order" variant="danger" onPress={handleCancel} style={styles.cancelBtn} />
      ) : null}
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
    marginBottom: spacing.lg,
  },
  label: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  value: { color: colors.textBright, fontWeight: '600', marginTop: 2 },
  section: { color: colors.textBright, fontWeight: '800', fontSize: 16, marginBottom: spacing.md },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  itemName: { color: colors.textBright, fontWeight: '600' },
  itemMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemPrice: { color: colors.accent, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  totalLabel: { color: colors.textMuted, fontSize: 16 },
  totalValue: { color: colors.textBright, fontSize: 22, fontWeight: '900' },
  cancelBtn: { marginTop: spacing.sm },
});
