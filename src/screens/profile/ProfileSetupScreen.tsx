import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { saveUserDetails, fetchAddressByPincode } from '../../services/user.service';
import { skipProfileSetup } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { setStoredAuthUser } from '../../services/api/tokenStorage';
import type { RootStackParamList } from '../../app/navigation/routes';
import type { UserAddress } from '../../types';

export function ProfileSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [address, setAddress] = useState<UserAddress>(
    user?.address ?? { line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' },
  );
  const [loading, setLoading] = useState(false);

  const updateAddress = (key: keyof UserAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (key === 'pincode' && /^\d{6}$/.test(value)) {
      fetchAddressByPincode(value)
        .then((result) => setAddress((prev) => ({ ...prev, city: result.city || prev.city, state: result.state || prev.state })))
        .catch(() => undefined);
    }
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveUserDetails({ fullName, email, mobile, address });
      const updated = {
        ...user,
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        address,
        hasAddress: Boolean(address.line1 && address.city && address.state && /^\d{6}$/.test(address.pincode)),
        profileComplete: true,
      };
      await setStoredAuthUser(updated);
      setUser(updated);
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    if (!user || loading) return;
    const updated = await skipProfileSetup(user);
    setUser(updated);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Header title="Complete profile" subtitle="Required for checkout" onBack={() => navigation.goBack()} />
          <Text style={styles.note}>Add your details to place orders and manage delivery.</Text>
          <Input label="Full name" value={fullName} onChangeText={setFullName} />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
          <Input label="Address line 1" value={address.line1} onChangeText={(v) => updateAddress('line1', v)} />
          <Input label="Address line 2" value={address.line2} onChangeText={(v) => updateAddress('line2', v)} />
          <Input label="Pincode" value={address.pincode} onChangeText={(v) => updateAddress('pincode', v)} keyboardType="number-pad" maxLength={6} />
          <Input label="City" value={address.city} onChangeText={(v) => updateAddress('city', v)} />
          <Input label="State" value={address.state} onChangeText={(v) => updateAddress('state', v)} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.actions}>
            <Button
              label="Skip for now"
              variant="secondary"
              onPress={skip}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              label="Save profile"
              onPress={save}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  note: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: colors.pageBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.lg,
  },
});
