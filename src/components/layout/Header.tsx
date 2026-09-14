import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  right?: React.ReactNode;
};

export function Header({ title, subtitle, onBack, onMenu, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {onMenu ? (
          <Pressable onPress={onMenu} style={styles.backBtn} accessibilityLabel="Open menu">
            <Text style={styles.menuText}>☰</Text>
          </Pressable>
        ) : null}
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  backText: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  menuText: {
    color: colors.textBright,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  titles: {
    flex: 1,
  },
  title: {
    color: colors.textBright,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
