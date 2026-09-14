import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProductSearchSuggestions } from '../../hooks/useProductSearchSuggestions';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Product } from '../../types';

function buildSubtitle(product: Product) {
  const parts = [product.brand, product.pack].filter(Boolean);
  return parts.join(' · ') || product.desc || 'View product details';
}

function SearchResultRow({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable style={styles.resultRow} onPress={onPress}>
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>💊</Text>
      </View>
      <View style={styles.resultCopy}>
        <Text style={styles.resultName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.resultMeta} numberOfLines={1}>
          {buildSubtitle(product)}
        </Text>
      </View>
    </Pressable>
  );
}

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const { suggestions, loading, hasQuery } = useProductSearchSuggestions(debouncedQuery);
  const isPending = hasQuery && debouncedQuery !== query.trim();
  const tabBarInset = useTabBarInset();

  const openProduct = (productId: string) => {
    navigation.navigate(Routes.ProductDetail, { productId });
  };

  const showLoading = hasQuery && (loading || isPending);
  const showResults = hasQuery && !showLoading;
  const showEmpty = showResults && suggestions.length === 0;

  return (
    <Screen scroll={false}>
      <Header title="Search" subtitle="Find medicines & health products" />

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search medicines, salt composition…"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.searchInput}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {showLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : null}

      {showEmpty ? (
        <EmptyState
          title="No products found"
          message={`No products matched "${debouncedQuery}". Try another keyword.`}
        />
      ) : null}

      {!hasQuery ? (
        <EmptyState
          title="Search medicines"
          message="Start typing a product name — results appear automatically."
        />
      ) : null}

      {showResults && suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: tabBarInset }}
          renderItem={({ item }) => (
            <SearchResultRow product={item} onPress={() => openProduct(item.id)} />
          )}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textBright,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginLeft: spacing.sm,
    opacity: 0.8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  loadingText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 20,
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    color: colors.textBright,
    fontSize: 14,
    fontWeight: '800',
  },
  resultMeta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
});
