import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import { useCatalogStore } from '../../store/catalogStore';
import type { Category } from '../../types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type MenuItem =
  | { label: string; type: 'category'; slug: string }
  | { label: string; type: 'route'; route: keyof RootStackParamList | typeof Routes.CategoriesList | typeof Routes.CategoryProducts }
  | { label: string; type: 'categories' };

const MENU_ITEMS: MenuItem[] = [
  { label: 'Medicines', type: 'category', slug: 'medicines' },
  { label: 'Lab Tests', type: 'category', slug: 'lab-tests' },
  { label: 'Doctor Consultation', type: 'route', route: Routes.Consultation },
  { label: 'Devices', type: 'category', slug: 'devices' },
  { label: 'All categories', type: 'categories' },
  { label: 'Contact us', type: 'route', route: Routes.Contact },
  { label: 'About MEDIQ', type: 'route', route: Routes.About },
];

function findCategory(categories: Category[], slug: string) {
  const normalized = slug.toLowerCase();
  return (
    categories.find((item) => item.slug === normalized) ??
    categories.find((item) => item.name.toLowerCase().includes(normalized.replace('-', ' '))) ??
    null
  );
}

export function AppMenu({ visible, onClose }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const categories = useCatalogStore((s) => s.categories);

  const openCategory = (slug: string) => {
    const category = findCategory(categories, slug);
    onClose();
    if (category) {
      navigation.navigate(Routes.CategoryProducts, {
        categoryId: category.id,
        categoryName: category.name,
      });
      return;
    }
    navigation.navigate(Routes.CategoriesList);
  };

  const handlePress = (item: MenuItem) => {
    onClose();
    if (item.type === 'category') {
      openCategory(item.slug);
      return;
    }
    if (item.type === 'categories') {
      navigation.navigate(Routes.CategoriesList);
      return;
    }
    navigation.navigate(item.route as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Browse MEDIQ</Text>
          <Text style={styles.subtitle}>Quick links</Text>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => (
              <Pressable key={item.label} style={styles.item} onPress={() => handlePress(item)}>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 10, 8, 0.72)',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  panel: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  title: {
    color: colors.textBright,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  itemLabel: {
    color: colors.textBright,
    fontSize: 14,
    fontWeight: '600',
  },
});
