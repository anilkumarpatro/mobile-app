import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { ProductCard } from '../../components/ui/ProductCard';
import { LoadingView } from '../../components/ui/LoadingView';
import { useCatalogStore } from '../../store/catalogStore';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Product } from '../../types';

export function CategoryProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.CategoryProducts>>();
  const loadCategoryProducts = useCatalogStore((s) => s.loadCategoryProducts);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const tabBarInset = useTabBarInset();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await loadCategoryProducts(route.params.categoryId);
      setProducts(result.products);
      setLoading(false);
    })();
  }, [loadCategoryProducts, route.params.categoryId]);

  if (loading) return <LoadingView />;

  return (
    <Screen scroll={false}>
      <Header
        title={route.params.categoryName}
        subtitle="Category products"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate(Routes.ProductDetail, { productId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: 'space-between' },
});
