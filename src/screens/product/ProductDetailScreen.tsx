import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/ui/LoadingView';
import { CartAddControl } from '../../components/cart/CartAddControl';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchProductById, mapProductDetail } from '../../services/products.service';
import { useCatalogStore } from '../../store/catalogStore';
import { formatInr } from '../../utils/format';
import { productAllowsLoose } from '../../utils/looseQuantity';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Product } from '../../types';

export function ProductDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.ProductDetail>>();
  const categories = useCatalogStore((s) => s.categories);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const payload = await fetchProductById(route.params.productId);
        setProduct(mapProductDetail(payload, categories));
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load product');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [categories, navigation, route.params.productId]);

  if (loading || !product) return <LoadingView />;

  return (
    <Screen>
      <Header title={product.name} onBack={() => navigation.goBack()} />
      <View style={styles.hero}>
        <Text style={styles.initial}>{product.name.charAt(0)}</Text>
      </View>
      <Text style={styles.brand}>{product.brand}</Text>
      <Text style={styles.pack}>{product.pack}</Text>
      {product.rx ? <Text style={styles.rx}>Prescription required</Text> : null}
      {productAllowsLoose(product) ? (
        <View style={styles.looseBadge}>
          <Text style={styles.looseBadgeText}>Loose available</Text>
        </View>
      ) : null}
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatInr(product.price)}</Text>
        {product.mrp > product.price ? <Text style={styles.mrp}>{formatInr(product.mrp)}</Text> : null}
      </View>
      {product.desc ? <Text style={styles.desc}>{product.desc}</Text> : null}
      <View style={styles.addControl}>
        <CartAddControl product={product} />
      </View>
      <Button
        label="Go to cart"
        variant="secondary"
        onPress={() => navigation.navigate(Routes.MainTabs, { screen: Routes.Cart })}
        style={styles.btn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  initial: { color: colors.accent, fontSize: 64, fontWeight: '900' },
  brand: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  pack: { color: colors.textBright, fontSize: 16, marginTop: spacing.xs },
  rx: { color: colors.warn, marginTop: spacing.sm, fontWeight: '700' },
  looseBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  looseBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.lg },
  price: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  mrp: { color: colors.textDim, textDecorationLine: 'line-through', fontSize: 16 },
  desc: { color: colors.textMuted, marginTop: spacing.lg, lineHeight: 22 },
  addControl: { marginTop: spacing.xl },
  btn: { marginTop: spacing.lg },
});
