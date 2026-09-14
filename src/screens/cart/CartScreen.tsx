import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingView } from '../../components/ui/LoadingView';
import { LooseQuantityModal } from '../../components/cart/LooseQuantityModal';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { GuestAuthPrompt } from '../../components/auth/GuestAuthPrompt';
import { useAuthStore } from '../../store/authStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useCartStore } from '../../store/cartStore';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { formatInr } from '../../utils/format';
import {
  formatLooseCartSummary,
  formatPackCartSummary,
  getCartLineSubtotal,
  isLooseCartLine,
} from '../../utils/looseQuantity';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { CartItem, Product } from '../../types';

function cartItemToProduct(item: CartItem): Product {
  return {
    id: item.id,
    name: item.name,
    brand: item.genericName,
    cat: '',
    catName: '',
    pack: item.pack,
    desc: '',
    price: item.price,
    mrp: item.mrp,
    off: 0,
    stock: 999,
    rx: item.rx,
    imageUrl: item.image ?? undefined,
    looseSaleAllowed: item.looseSaleAllowed,
    looseQuantity: item.looseQuantity,
    unitsPerPack: item.unitsPerPack,
    packLabel: item.packLabel,
    unitLabel: item.unitLabel,
  };
}

function CartLineCard({
  item,
  onEditLoose,
}: {
  item: CartItem;
  onEditLoose: (item: CartItem) => void;
}) {
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const loose = isLooseCartLine(item);
  const summary = loose ? formatLooseCartSummary(item) : formatPackCartSummary(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{item.name}</Text>
          {loose ? (
            <View style={styles.looseBadge}>
              <Text style={styles.looseBadgeText}>Loose quantity</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
          <Text style={styles.remove}>Delete</Text>
        </Pressable>
      </View>
      <Text style={styles.meta}>{summary?.detail ?? summary?.short ?? (item.pack || item.genericName)}</Text>
      <View style={styles.row}>
        {loose ? (
          <Pressable style={styles.editBtn} onPress={() => onEditLoose(item)}>
            <Text style={styles.editText}>{summary?.short ?? 'Edit quantity'}</Text>
          </Pressable>
        ) : (
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQty(item.id, item.qty - 1)}>
              <Text style={styles.qtyText}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{item.qty}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQty(item.id, item.qty + 1)}>
              <Text style={styles.qtyText}>+</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.lineTotal}>{formatInr(getCartLineSubtotal(item))}</Text>
      </View>
    </View>
  );
}

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const isGuest = !user?.token;
  const requireAuth = useRequireAuth();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.items.reduce((sum, item) => sum + getCartLineSubtotal(item), 0));
  const isLoading = useCartStore((s) => s.isLoading);
  const loadCart = useCartStore((s) => s.loadCart);
  const setLooseQty = useCartStore((s) => s.setLooseQty);
  const tabBarInset = useTabBarInset();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [savingLoose, setSavingLoose] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        loadCart();
      }
    }, [isGuest, loadCart]),
  );

  if (isGuest) {
    return (
      <Screen>
        <Header title="Cart" subtitle="Sign in to manage your cart" />
        <GuestAuthPrompt
          title="Login to use cart"
          message="Add medicines to your cart, review items, and checkout after you sign in."
        />
      </Screen>
    );
  }

  if (isLoading && !items.length) return <LoadingView />;

  if (!items.length) {
    return (
      <Screen>
        <Header title="Cart" subtitle="Your selected items" />
        <EmptyState
          title="Your cart is empty"
          message="Browse products and add items to your cart."
          actionLabel="Shop now"
          onAction={() => navigation.navigate(Routes.MainTabs, { screen: Routes.Home })}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title="Cart" subtitle={`${items.length} item(s)`} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId ?? item.id}
        renderItem={({ item }) => <CartLineCard item={item} onEditLoose={setEditingItem} />}
        contentContainerStyle={[styles.list, { paddingBottom: spacing.md }]}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.footer, { paddingBottom: tabBarInset }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatInr(subtotal)}</Text>
        </View>
        <Button
          label="Proceed to checkout"
          onPress={() =>
            requireAuth({
              message: 'Login to complete your order.',
              onAuthed: () => navigation.navigate(Routes.Checkout),
            })
          }
        />
      </View>

      {editingItem ? (
        <LooseQuantityModal
          visible
          product={cartItemToProduct(editingItem)}
          initialFullPackQty={editingItem.fullPackQty ?? 0}
          initialLooseUnitQty={editingItem.looseUnitQty ?? 0}
          saving={savingLoose}
          onClose={() => setEditingItem(null)}
          onConfirm={async (payload) => {
            setSavingLoose(true);
            try {
              if (payload.totalUnits <= 0) {
                await useCartStore.getState().removeItem(editingItem.id);
              } else {
                await setLooseQty(editingItem.id, payload);
              }
              setEditingItem(null);
            } finally {
              setSavingLoose(false);
            }
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textBright,
    fontWeight: '700',
    fontSize: 15,
  },
  looseBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  looseBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  remove: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  meta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  qty: {
    color: colors.textBright,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  editBtn: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  lineTotal: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 16,
  },
  totalValue: {
    color: colors.textBright,
    fontSize: 20,
    fontWeight: '900',
  },
});
