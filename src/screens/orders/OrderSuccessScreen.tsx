import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';

export function OrderSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.OrderSuccess>>();

  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Order placed!</Text>
        <Text style={styles.message}>Your order #{route.params.orderId} has been placed successfully.</Text>
        <Button
          label="Track order"
          onPress={() => navigation.replace(Routes.OrderTracking, { orderId: route.params.orderId })}
          style={styles.btn}
        />
        <Button label="Continue shopping" variant="secondary" onPress={() => navigation.navigate(Routes.MainTabs, { screen: Routes.Home })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  icon: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.textBright, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 22 },
  btn: { marginTop: spacing.xl, marginBottom: spacing.sm },
});
