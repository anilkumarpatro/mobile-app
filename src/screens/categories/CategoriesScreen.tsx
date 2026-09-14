import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useCatalogStore } from '../../store/catalogStore';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';

export function CategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { categories, isLoading, loadHome } = useCatalogStore();
  const tabBarInset = useTabBarInset();

  useEffect(() => {
    if (!categories.length) loadHome();
  }, [categories.length, loadHome]);

  if (isLoading && !categories.length) return <LoadingView />;

  return (
    <Screen scroll={false}>
      <Header title="Categories" subtitle="Browse by category" onBack={() => navigation.goBack()} />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { borderColor: item.accent }]}
            onPress={() =>
              navigation.navigate(Routes.CategoryProducts, {
                categoryId: item.id,
                categoryName: item.name,
              })
            }>
            <Text style={[styles.icon, { color: item.accent }]}>{item.icon}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.count}>{item.count} products</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  icon: { fontSize: 28, fontWeight: '900' },
  name: { color: colors.textBright, fontSize: 18, fontWeight: '800', marginTop: spacing.sm },
  count: { color: colors.textMuted, marginTop: spacing.xs },
});
