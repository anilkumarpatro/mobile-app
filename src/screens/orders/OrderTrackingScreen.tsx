import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchMyOrders, mapOrdersFromApi } from '../../services/orders.service';
import { buildTrackingTimeline, getOrderStatusLabel } from '../../utils/orderHelpers';
import { fmtOrderDateTime } from '../../utils/format';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Order } from '../../types';

export function OrderTrackingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.OrderTracking>>();
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

  if (loading || !order) return <LoadingView />;

  const timeline = buildTrackingTimeline(order);

  return (
    <Screen>
      <Header title="Track order" subtitle={`#${order.id}`} onBack={() => navigation.goBack()} />
      <Text style={styles.status}>{getOrderStatusLabel(order)}</Text>

      {timeline.map((step, index) => (
        <View key={step.key} style={styles.step}>
          <View style={styles.stepLeft}>
            <View
              style={[
                styles.dot,
                step.done && !step.failed && styles.dotDone,
                step.failed && styles.dotFailed,
                step.active && styles.dotActive,
              ]}
            />
            {index < timeline.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
            {step.at ? <Text style={styles.stepTime}>{fmtOrderDateTime(step.at)}</Text> : null}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.accent, fontWeight: '800', fontSize: 18, marginBottom: spacing.lg },
  step: { flexDirection: 'row', marginBottom: spacing.md },
  stepLeft: { width: 24, alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.inputBorder,
    marginTop: 4,
  },
  dotDone: { backgroundColor: colors.accent },
  dotActive: { borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.pageBg },
  dotFailed: { backgroundColor: colors.danger },
  line: { flex: 1, width: 2, backgroundColor: colors.cardBorder, marginTop: 4 },
  stepBody: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg },
  stepLabel: { color: colors.textBright, fontWeight: '700', fontSize: 15 },
  stepDesc: { color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  stepTime: { color: colors.textDim, fontSize: 12, marginTop: spacing.xs },
});
