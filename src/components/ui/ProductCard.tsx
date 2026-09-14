import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CartAddControl } from '../cart/CartAddControl';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { formatInr } from '../../utils/format';
import { productAllowsLoose } from '../../utils/looseQuantity';
import type { Product } from '../../types';

type Props = {
  product: Product;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: Props) {
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageText}>{product.name.charAt(0)}</Text>
        <View style={styles.badgeRow}>
          {off > 0 ? <Text style={styles.discountBadge}>{off}% OFF</Text> : null}
          {productAllowsLoose(product) ? <Text style={styles.looseBadge}>Loose available</Text> : null}
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.pack}>{product.pack}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatInr(product.price)}</Text>
        {product.mrp > product.price ? (
          <Text style={styles.mrp}>{formatInr(product.mrp)}</Text>
        ) : null}
      </View>
      <View onStartShouldSetResponder={() => true}>
        <CartAddControl product={product} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  imageText: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '800',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
  },
  discountBadge: {
    backgroundColor: colors.warn,
    color: colors.accentText,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  looseBadge: {
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  name: {
    color: colors.textBright,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  pack: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  price: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  mrp: {
    color: colors.textDim,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
});
