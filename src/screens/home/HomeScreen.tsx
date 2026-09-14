import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { AppMenu } from '../../components/layout/AppMenu';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { ProductCard } from '../../components/ui/ProductCard';
import { LoadingView } from '../../components/ui/LoadingView';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useCatalogStore } from '../../store/catalogStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { needsProfileSetup } from '../../services/auth.service';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Product } from '../../types';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const showInitialLoginPrompt = useAuthStore((s) => s.showInitialLoginPrompt);
  const openLoginModal = useAuthStore((s) => s.openLoginModal);
  const { categories, products, isLoading, loadHome } = useCatalogStore();
  const loadCart = useCartStore((s) => s.loadCart);
  const [menuOpen, setMenuOpen] = useState(false);
  const tabBarInset = useTabBarInset();

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      showInitialLoginPrompt();
      if (user?.token) {
        loadCart();
        if (needsProfileSetup(user)) {
          navigation.navigate(Routes.ProfileSetup);
        }
      }
    }, [loadCart, navigation, showInitialLoginPrompt, user]),
  );

  const openProduct = (productId: string) => navigation.navigate(Routes.ProductDetail, { productId });

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={() => openProduct(item.id)} />
  );

  if (isLoading && !products.length) {
    return <LoadingView />;
  }

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.headerPad}>
        <Header
          title="MEDIQ"
          subtitle={
            user?.fullName
              ? `Hello, ${user.fullName.split(' ')[0]}`
              : 'Your smart healthcare companion'
          }
          onMenu={() => setMenuOpen(true)}
          right={
            <View style={styles.headerActions}>
              {!user?.token ? (
                <Pressable onPress={() => openLoginModal()}>
                  <Text style={styles.link}>Sign in</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => navigation.navigate(Routes.Consultation)}>
                <Text style={styles.link}>Doctors</Text>
              </Pressable>
            </View>
          }
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarInset }]}
        ListHeaderComponent={
          <>
            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Shop by category</Text>
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.categoryChip, { borderColor: item.accent }]}
                    onPress={() =>
                      navigation.navigate(Routes.CategoryProducts, {
                        categoryId: item.id,
                        categoryName: item.name,
                      })
                    }>
                    <Text style={[styles.categoryIcon, { color: item.accent }]}>{item.icon}</Text>
                    <Text style={styles.categoryName}>{item.name}</Text>
                  </Pressable>
                )}
              />
              <Button
                label="Browse all categories"
                variant="secondary"
                onPress={() => navigation.navigate(Routes.CategoriesList)}
                style={styles.categoriesBtn}
              />
              <Text style={styles.sectionTitle}>Popular products</Text>
            </View>
          </>
        }
        renderItem={renderProduct}
        onRefresh={loadHome}
        refreshing={isLoading}
      />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  sectionPad: { paddingHorizontal: spacing.lg },
  list: { paddingBottom: spacing.xxl },
  row: { justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  sectionTitle: {
    color: colors.textBright,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 96,
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 22, fontWeight: '800' },
  categoryName: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
  categoriesBtn: { marginBottom: spacing.lg },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  link: { color: colors.accent, fontWeight: '700' },
});
