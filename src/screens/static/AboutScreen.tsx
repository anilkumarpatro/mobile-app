import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../app/navigation/routes';

export function AboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <Header title="About MEDIQ" onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Your trusted medicine delivery partner</Text>
      <Text style={styles.body}>
        MEDIQ helps customers order medicines and health products with fast delivery, verified catalog,
        order tracking, and doctor consultation support.
      </Text>
      <Text style={styles.body}>
        This mobile app connects to the same customer portal backend used on the web — browse products,
        manage your cart, checkout with cash on delivery, and track orders from your phone.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textBright, fontSize: 20, fontWeight: '800', marginBottom: spacing.md },
  body: { color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
});
