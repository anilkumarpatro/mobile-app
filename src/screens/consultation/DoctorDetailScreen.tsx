import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { LoadingView } from '../../components/ui/LoadingView';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { fetchDoctorAvailableSlots, fetchDoctorById } from '../../services/doctors.service';
import { formatInr } from '../../utils/format';
import { Routes, type RootStackParamList } from '../../app/navigation/routes';
import type { Doctor, DoctorSlot } from '../../types';

export function DoctorDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.DoctorDetail>>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const detail = await fetchDoctorById(route.params.doctorId);
        const availableSlots = await fetchDoctorAvailableSlots(route.params.doctorId);
        setDoctor(detail);
        setSlots(availableSlots.filter((slot) => slot.available));
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load doctor');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, route.params.doctorId]);

  const bookSlot = (slot: DoctorSlot) => {
    Alert.alert('Booking requested', `Requested consultation at ${slot.time}. Our team will confirm shortly.`);
  };

  if (loading || !doctor) return <LoadingView />;

  return (
    <Screen>
      <Header title={doctor.name} onBack={() => navigation.goBack()} />
      <View style={styles.hero}>
        <Text style={styles.initial}>{doctor.name.charAt(0)}</Text>
      </View>
      <Text style={styles.specialty}>{doctor.specialty}</Text>
      {doctor.qualifications ? <Text style={styles.qual}>{doctor.qualifications}</Text> : null}
      <Text style={styles.fee}>Consultation fee: {formatInr(doctor.fee)}</Text>
      {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}

      <Text style={styles.section}>Available slots (today)</Text>
      {slots.length === 0 ? (
        <Text style={styles.empty}>No slots available today.</Text>
      ) : (
        <View style={styles.slots}>
          {slots.map((slot) => (
            <Pressable key={slot.id} style={styles.slot} onPress={() => bookSlot(slot)}>
              <Text style={styles.slotText}>{slot.time}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  initial: { color: colors.accent, fontSize: 48, fontWeight: '900' },
  specialty: { color: colors.textBright, fontSize: 18, fontWeight: '800' },
  qual: { color: colors.textMuted, marginTop: spacing.xs },
  fee: { color: colors.accent, fontWeight: '700', marginTop: spacing.md },
  bio: { color: colors.textMuted, marginTop: spacing.md, lineHeight: 22 },
  section: { color: colors.textBright, fontWeight: '800', fontSize: 16, marginTop: spacing.xl, marginBottom: spacing.md },
  empty: { color: colors.textMuted },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  slotText: { color: colors.textBright, fontWeight: '600' },
});
