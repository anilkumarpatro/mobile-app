import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
};

export function GuestAuthPrompt({ title, message, actionLabel = 'Login / Sign up' }: Props) {
  const openLoginModal = useAuthStore((s) => s.openLoginModal);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button label={actionLabel} onPress={() => openLoginModal({ message })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.textBright,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
});
