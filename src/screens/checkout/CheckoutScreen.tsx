import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/ui/LoadingView';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchUserProfile } from '../../services/user.service';
import { createCodPayment } from '../../services/payments.service';
import { useCartStore } from '../../store/cartStore';
import { formatInr } from '../../utils/format';
import { formatLooseCartSummary, getCartLineSubtotal } from '../../utils/looseQuantity';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { SavedAddress } from '../../types';

type PaymentMethod = 'cod' | 'upi';

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: string;
  badge?: string;
}> = [
  {
    id: 'cod',
    label: 'Cash on delivery',
    hint: 'Pay the rider when your order arrives',
    icon: '🛵',
  },
  {
    id: 'upi',
    label: 'Online payment',
    hint: 'UPI / Card — Generate QR',
    icon: '📱',
    badge: 'Instant payment',
  },
];

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.items.reduce((sum, item) => sum + getCartLineSubtotal(item), 0));
  const loadCart = useCartStore((s) => s.loadCart);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadCart();
        const profile = await fetchUserProfile();
        setAddresses(profile.addresses);
        const defaultAddress = profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0];
        setSelectedAddressId(defaultAddress?.id ?? null);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load checkout');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCart]);

  const placeOrder = async () => {
    if (!items.length) {
      Alert.alert('Cart empty', 'Add items to your cart before checkout.');
      return;
    }

    if (!selectedAddressId) {
      Alert.alert('Address required', 'Please add a delivery address first.', [
        { text: 'Add address', onPress: () => navigation.navigate(Routes.Addresses) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (paymentMethod === 'upi') {
      Alert.alert(
        'Online payment coming soon',
        'Online payment is not available yet. Please select Cash on Delivery to place your order.',
      );
      return;
    }

    setPlacing(true);
    try {
      const amount = Number(subtotal.toFixed(2));
      const result = await createCodPayment({
        amount,
        transactionNote: 'MEDIQ mobile COD order',
        transactionRefId: `MOB-${Date.now()}`,
        deliveryAddressId: selectedAddressId,
      });
      await loadCart();
      navigation.replace(Routes.OrderSuccess, { orderId: result.orderId });
    } catch (error) {
      Alert.alert('Checkout failed', error instanceof Error ? error.message : 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <LoadingView />;

  if (!items.length) {
    return (
      <Screen>
        <Header title="Checkout" subtitle="Confirm address and payment" onBack={() => navigation.goBack()} />
        <EmptyState
          title="Your cart is empty"
          message="Add products to your cart before checkout."
          actionLabel="Browse products"
          onAction={() => navigation.navigate(Routes.MainTabs, { screen: Routes.Search })}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Checkout" subtitle="Confirm address and payment" onBack={() => navigation.goBack()} />

      <Text style={styles.section}>Order summary</Text>
      <View style={styles.summaryCard}>
        {items.map((item) => {
          const looseSummary = item.looseQuantity ? formatLooseCartSummary(item) : null;
          return (
            <View key={item.cartItemId ?? item.id} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={2}>
                {item.name}
                {looseSummary ? ` — ${looseSummary.short}` : ` × ${item.qty}`}
              </Text>
              <Text style={styles.summaryPrice}>{formatInr(getCartLineSubtotal(item))}</Text>
            </View>
          );
        })}
        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Subtotal</Text>
          <Text style={styles.summaryTotalValue}>{formatInr(subtotal)}</Text>
        </View>
      </View>

      <Text style={styles.section}>Delivery address</Text>
      {addresses.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No saved addresses</Text>
          <Button label="Add address" variant="secondary" onPress={() => navigation.navigate(Routes.Addresses)} />
        </View>
      ) : (
        addresses.map((address) => (
          <Pressable
            key={address.id}
            style={[styles.addressCard, selectedAddressId === address.id && styles.addressSelected]}
            onPress={() => setSelectedAddressId(address.id)}>
            <Text style={styles.addressLabel}>{address.label}</Text>
            <Text style={styles.addressLines}>{address.lines || `${address.line1}, ${address.city}`}</Text>
          </Pressable>
        ))
      )}

      <Text style={styles.section}>Payment</Text>
      {PAYMENT_OPTIONS.map((option) => {
        const selected = paymentMethod === option.id;
        return (
          <Pressable
            key={option.id}
            style={[styles.paymentCard, selected && styles.paymentSelected]}
            onPress={() => setPaymentMethod(option.id)}>
            <View style={styles.paymentTop}>
              <Text style={styles.paymentIcon}>{option.icon}</Text>
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentTitle}>{option.label}</Text>
                <Text style={styles.paymentDesc}>{option.hint}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]} />
            </View>
            {option.badge ? (
              <Text style={styles.paymentBadge}>{option.badge}</Text>
            ) : null}
            {option.id === 'upi' ? (
              <Text style={styles.paymentNote}>Coming soon — COD is available now</Text>
            ) : null}
          </Pressable>
        );
      })}

      <Text style={styles.paymentHelp}>
        {paymentMethod === 'cod'
          ? 'Pay the delivery partner in cash or by scanning the QR code on arrival.'
          : 'Online payment will be enabled in a future update.'}
      </Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>To pay</Text>
        <Text style={styles.totalValue}>{formatInr(subtotal)}</Text>
      </View>

      <Button
        label={paymentMethod === 'cod' ? 'Place order' : 'Proceed to payment'}
        onPress={placeOrder}
        loading={placing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.textBright,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryName: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  summaryPrice: {
    color: colors.textBright,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  summaryTotalLabel: {
    color: colors.textBright,
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
  },
  emptyBox: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: { color: colors.textMuted, marginBottom: spacing.md },
  addressCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  addressSelected: { borderColor: colors.accent },
  addressLabel: { color: colors.accent, fontWeight: '700' },
  addressLines: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  paymentCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
  },
  paymentSelected: { borderColor: colors.accent },
  paymentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paymentIcon: { fontSize: 24 },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: colors.textBright, fontWeight: '800', fontSize: 15 },
  paymentDesc: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 12 },
  paymentBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  paymentNote: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textDim,
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  paymentHelp: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  totalLabel: { color: colors.textMuted, fontSize: 16 },
  totalValue: { color: colors.textBright, fontSize: 22, fontWeight: '900' },
});
