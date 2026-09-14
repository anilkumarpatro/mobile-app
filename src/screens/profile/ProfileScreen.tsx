import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { GuestAuthPrompt } from '../../components/auth/GuestAuthPrompt';
import { fetchUserProfile } from '../../services/user.service';
import { createUserCallbackRequest } from '../../services/user.service';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { UserProfile } from '../../types';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuthStore();
  const isGuest = !user?.token;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const tabBarInset = useTabBarInset();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await fetchUserProfile());
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        loadProfile();
      } else {
        setLoading(false);
      }
    }, [isGuest, loadProfile]),
  );

  const requestCallback = () => {
    Alert.prompt
      ? Alert.prompt('Request callback', 'Tell us how we can help', async (description) => {
          if (!description?.trim() || !user) return;
          try {
            await createUserCallbackRequest({
              customerName: user.fullName || 'Customer',
              mobileNumber: user.mobile,
              description,
              countryCode: user.countryCode,
            });
            Alert.alert('Requested', 'We will call you back shortly.');
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to request callback');
          }
        })
      : Alert.alert('Callback', 'Use Contact screen to request a callback.');
  };

  if (loading && !isGuest) return <LoadingView />;

  return (
    <Screen style={{ paddingBottom: tabBarInset }}>
      <Header title="Profile" subtitle={isGuest ? 'Sign in to manage your account' : profile?.email || user?.email} />
      {isGuest ? (
        <GuestAuthPrompt
          title="Login to your account"
          message="Access orders, saved addresses, profile details, and callback requests after you sign in."
        />
      ) : (
        <>
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.fullName || user?.fullName || 'Customer'}</Text>
        <Text style={styles.meta}>{profile?.mobile || user?.mobile}</Text>
        <Text style={styles.meta}>{profile?.location}</Text>
      </View>

      <MenuItem label="My addresses" onPress={() => navigation.navigate(Routes.Addresses)} />
      <MenuItem label="Doctor consultation" onPress={() => navigation.navigate(Routes.Consultation)} />
      <MenuItem label="Contact us" onPress={() => navigation.navigate(Routes.Contact)} />
      <MenuItem label="About MEDIQ" onPress={() => navigation.navigate(Routes.About)} />
      <MenuItem label="Request callback" onPress={requestCallback} />
      <MenuItem label="Edit profile" onPress={() => navigation.navigate(Routes.ProfileSetup)} />

      <Button label="Sign out" variant="danger" onPress={signOut} style={styles.signOut} />
        </>
      )}
    </Screen>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  name: { color: colors.textBright, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, marginTop: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuLabel: { color: colors.textBright, fontWeight: '600', fontSize: 15 },
  menuArrow: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  signOut: { marginTop: spacing.xl },
});
