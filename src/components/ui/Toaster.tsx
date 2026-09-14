import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useUiStore } from '../../store/uiStore';

const TONE_STYLES = {
  success: { bg: colors.accentSoft, border: colors.accent, text: colors.textBright },
  error: { bg: colors.dangerSoft, border: colors.danger, text: colors.danger },
  info: { bg: colors.cardBg, border: colors.cardBorder, text: colors.textBright },
};

export function Toaster() {
  const insets = useSafeAreaInsets();
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, spacing.lg) + 72 }]}>
      {toasts.map((toast) => {
        const tone = TONE_STYLES[toast.tone];
        return (
          <Pressable
            key={toast.id}
            style={[styles.toast, { backgroundColor: tone.bg, borderColor: tone.border }]}
            onPress={() => dismissToast(toast.id)}>
            <Text style={[styles.message, { color: tone.text }]}>{toast.message}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 999,
  },
  toast: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
