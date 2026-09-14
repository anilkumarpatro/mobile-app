import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { LoadingView } from '../../components/ui/LoadingView';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchDoctors, fetchPopularDoctors } from '../../services/doctors.service';
import { formatInr } from '../../utils/format';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Doctor } from '../../types';

export function ConsultationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const popular = await fetchPopularDoctors(undefined, 10);
        setDoctors(popular);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const search = async () => {
    setLoading(true);
    try {
      const results = await fetchDoctors({ searchKeyword: query.trim(), size: 20 });
      setDoctors(results);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctors.length) return <LoadingView />;

  return (
    <Screen scroll={false}>
      <Header title="Doctor consultation" onBack={() => navigation.goBack()} subtitle="Book with verified doctors" />
      <Input placeholder="Search doctors or specialty" value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No doctors found" message="Try another search." />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate(Routes.DoctorDetail, { doctorId: item.id })}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.specialty}>{item.specialty}</Text>
              <Text style={styles.meta}>
                {item.rating > 0 ? `★ ${item.rating}` : 'New'} · {formatInr(item.fee)} consultation
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  body: { flex: 1 },
  name: { color: colors.textBright, fontWeight: '800', fontSize: 16 },
  specialty: { color: colors.textMuted, marginTop: 2 },
  meta: { color: colors.accent, marginTop: spacing.sm, fontWeight: '600', fontSize: 13 },
});
