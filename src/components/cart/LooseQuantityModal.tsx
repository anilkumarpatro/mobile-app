import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { formatInr } from '../../utils/format';
import {
  calcLooseLineAmounts,
  formatLoosePackLine,
  formatLooseUnitLine,
} from '../../utils/looseQuantity';
import type { Product } from '../../types';

type Props = {
  visible: boolean;
  product: Product;
  initialFullPackQty?: number;
  initialLooseUnitQty?: number;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (payload: { fullPackQty: number; looseUnitQty: number; totalUnits: number }) => void;
};

function QuantityRow({
  title,
  subtitle,
  value,
  onDecrease,
  onIncrease,
  disabled,
}: {
  title: string;
  subtitle: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.qtyRow}>
      <View style={styles.qtyCopy}>
        <Text style={styles.qtyTitle}>{title}</Text>
        <Text style={styles.qtySubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={onDecrease} disabled={disabled || value <= 0}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={onIncrease} disabled={disabled}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LooseQuantityModal({
  visible,
  product,
  initialFullPackQty = 0,
  initialLooseUnitQty = 0,
  saving = false,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [fullPackQty, setFullPackQty] = useState(initialFullPackQty);
  const [looseUnitQty, setLooseUnitQty] = useState(initialLooseUnitQty);

  useEffect(() => {
    if (visible) {
      setFullPackQty(initialFullPackQty);
      setLooseUnitQty(initialLooseUnitQty);
    }
  }, [visible, initialFullPackQty, initialLooseUnitQty, product.id]);

  const amounts = useMemo(
    () => calcLooseLineAmounts(product, fullPackQty, looseUnitQty),
    [product, fullPackQty, looseUnitQty],
  );

  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const unitPlural =
    amounts.totalUnits === 1
      ? (product.unitLabel ?? 'Unit').toLowerCase()
      : `${(product.unitLabel ?? 'Unit').toLowerCase()}s`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Add to cart</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.productCard}>
              <View style={styles.thumb}>
                <Text style={styles.thumbText}>{product.name.charAt(0)}</Text>
              </View>
              <View style={styles.productCopy}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPack}>{product.pack}</Text>
                <View style={styles.looseBadge}>
                  <Text style={styles.looseBadgeText}>Loose quantity available</Text>
                </View>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>{formatInr(product.price)}</Text>
                {off > 0 ? <Text style={styles.mrp}>{formatInr(product.mrp)}</Text> : null}
              </View>
            </View>

            <Text style={styles.sectionLabel}>Select quantity</Text>
            <QuantityRow
              title="Full Pack"
              subtitle={formatLoosePackLine(product)}
              value={fullPackQty}
              onDecrease={() => setFullPackQty((value) => Math.max(0, value - 1))}
              onIncrease={() => setFullPackQty((value) => value + 1)}
              disabled={saving}
            />
            <QuantityRow
              title="Loose Quantity"
              subtitle={formatLooseUnitLine(product)}
              value={looseUnitQty}
              onDecrease={() => setLooseUnitQty((value) => Math.max(0, value - 1))}
              onIncrease={() => setLooseUnitQty((value) => value + 1)}
              disabled={saving}
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total ({amounts.totalUnits} {unitPlural})</Text>
              <Text style={styles.totalValue}>{formatInr(amounts.subtotal)}</Text>
            </View>

            <Button
              label="Add to Cart"
              onPress={() =>
                onConfirm({
                  fullPackQty,
                  looseUnitQty,
                  totalUnits: amounts.totalUnits,
                })
              }
              loading={saving}
              disabled={amounts.totalUnits <= 0}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 10, 8, 0.72)',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.textDim,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textBright,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textBright,
    fontSize: 22,
    lineHeight: 22,
  },
  productCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  productCopy: {
    flex: 1,
  },
  productName: {
    color: colors.textBright,
    fontSize: 15,
    fontWeight: '800',
  },
  productPack: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  looseBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  looseBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.textBright,
    fontSize: 16,
    fontWeight: '800',
  },
  mrp: {
    color: colors.textDim,
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  qtyCopy: {
    flex: 1,
  },
  qtyTitle: {
    color: colors.textBright,
    fontSize: 13,
    fontWeight: '700',
  },
  qtySubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  stepValue: {
    color: colors.textBright,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    color: colors.textBright,
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.textBright,
    fontSize: 20,
    fontWeight: '900',
  },
});
