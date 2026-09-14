import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import {
  deleteUserAddress,
  fetchAddressByPincode,
  fetchUserProfile,
  saveUserAddress,
  updateUserAddress,
} from '../../services/user.service';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../app/navigation/routes';
import type { SavedAddress, UserAddress } from '../../types';

const emptyAddress: UserAddress = {
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

export function AddressesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserAddress>(emptyAddress);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchUserProfile();
      setAddresses(profile.addresses);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const updateField = (key: keyof UserAddress, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const lookupPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) return;
    try {
      const result = await fetchAddressByPincode(pincode);
      setForm((prev) => ({ ...prev, city: result.city || prev.city, state: result.state || prev.state }));
    } catch {
      /* optional lookup */
    }
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyAddress);
    setShowForm(true);
  };

  const startEdit = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profile = {
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        address: form,
      };
      if (editingId) {
        await updateUserAddress(editingId, profile);
      } else {
        await saveUserAddress(profile);
      }
      setShowForm(false);
      await load();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const remove = (addressId: string) => {
    Alert.alert('Delete address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserAddress(addressId);
            await load();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Header title="Addresses" onBack={() => navigation.goBack()} />
      {!showForm ? (
        <>
          {addresses.map((address) => (
            <View key={address.id} style={styles.card}>
              <Text style={styles.label}>{address.label}</Text>
              <Text style={styles.lines}>{address.lines}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => startEdit(address)}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => remove(address.id)}>
                  <Text style={styles.danger}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Button label="Add new address" onPress={startAdd} />
        </>
      ) : (
        <>
          <Input label="Address line 1" value={form.line1} onChangeText={(v) => updateField('line1', v)} />
          <Input label="Address line 2" value={form.line2} onChangeText={(v) => updateField('line2', v)} />
          <Input label="Landmark" value={form.landmark} onChangeText={(v) => updateField('landmark', v)} />
          <Input
            label="Pincode"
            value={form.pincode}
            onChangeText={(v) => {
              updateField('pincode', v);
              lookupPincode(v);
            }}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Input label="City" value={form.city} onChangeText={(v) => updateField('city', v)} />
          <Input label="State" value={form.state} onChangeText={(v) => updateField('state', v)} />
          <Button label={editingId ? 'Update address' : 'Save address'} onPress={save} loading={saving} />
          <Button label="Cancel" variant="ghost" onPress={() => setShowForm(false)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { color: colors.accent, fontWeight: '700' },
  lines: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  link: { color: colors.accent, fontWeight: '700' },
  danger: { color: colors.danger, fontWeight: '700' },
});
