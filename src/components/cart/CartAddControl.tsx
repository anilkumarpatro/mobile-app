import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useCartStore } from '../../store/cartStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { formatLooseCartSummary, productAllowsLoose } from '../../utils/looseQuantity';
import { LooseQuantityModal } from './LooseQuantityModal';
import type { Product } from '../../types';

type Props = {
  product: Product;
};

export function CartAddControl({ product }: Props) {
  const requireAuth = useRequireAuth();
  const addItem = useCartStore((s) => s.addItem);
  const setQty = useCartStore((s) => s.setQty);
  const cartItem = useCartStore((s) => s.findCartItem(String(product.id)));
  const cartQty = cartItem?.qty ?? 0;
  const allowsLoose = productAllowsLoose(product);
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const runAuthed = (action: () => Promise<void>) => {
    requireAuth({
      message: 'Login to add items to your cart.',
      onAuthed: async () => {
        if (pending) return;
        setPending(true);
        try {
          await action();
        } finally {
          setPending(false);
        }
      },
    });
  };

  const handleAdd = () => {
    if (allowsLoose) {
      requireAuth({
        message: 'Login to add items to your cart.',
        onAuthed: () => setModalOpen(true),
      });
      return;
    }
    runAuthed(() => addItem(product, 1));
  };

  const handleLooseConfirm = async (payload: {
    fullPackQty: number;
    looseUnitQty: number;
    totalUnits: number;
  }) => {
    if (pending) return;
    setPending(true);
    try {
      await addItem(product, { loose: true, ...payload });
      setModalOpen(false);
    } finally {
      setPending(false);
    }
  };

  const decrease = () => {
    runAuthed(() => setQty(String(product.id), cartQty - 1));
  };

  const increase = () => {
    runAuthed(() => setQty(String(product.id), cartQty + 1));
  };

  const looseSummary = cartItem?.looseQuantity ? formatLooseCartSummary(cartItem) : null;

  if (cartQty === 0) {
    return (
      <>
        <Pressable style={styles.addBtn} onPress={handleAdd} disabled={pending || product.stock <= 0}>
          <Text style={styles.addText}>ADD</Text>
        </Pressable>
        <LooseQuantityModal
          visible={modalOpen}
          product={product}
          initialFullPackQty={cartItem?.fullPackQty ?? 0}
          initialLooseUnitQty={cartItem?.looseUnitQty ?? 0}
          saving={pending}
          onClose={() => setModalOpen(false)}
          onConfirm={handleLooseConfirm}
        />
      </>
    );
  }

  if (allowsLoose) {
    return (
      <>
        <Pressable
          style={styles.editBtn}
          onPress={() =>
            requireAuth({
              message: 'Login to update items in your cart.',
              onAuthed: () => setModalOpen(true),
            })
          }>
          <Text style={styles.editText}>{looseSummary?.short ?? 'In cart'} · Edit</Text>
        </Pressable>
        <LooseQuantityModal
          visible={modalOpen}
          product={product}
          initialFullPackQty={cartItem?.fullPackQty ?? 0}
          initialLooseUnitQty={cartItem?.looseUnitQty ?? 0}
          saving={pending}
          onClose={() => setModalOpen(false)}
          onConfirm={handleLooseConfirm}
        />
      </>
    );
  }

  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={decrease} disabled={pending}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{cartQty}</Text>
      <Pressable style={styles.stepBtn} onPress={increase} disabled={pending || cartQty >= (product.stock || 999)}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  addText: {
    color: colors.accentText,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  editBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
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
    fontSize: 10,
  },
  stepper: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  stepValue: {
    color: colors.textBright,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
});
