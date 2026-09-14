import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';

export function AuthScreen() {
  const { sendOtp, verifyOtp, isLoading, error } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Enter your email or mobile number');
      return;
    }
    try {
      await sendOtp(identifier);
      setOtpSent(true);
    } catch {
      /* store handles error */
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Required', 'Enter the OTP');
      return;
    }
    try {
      await verifyOtp(identifier, otp);
    } catch {
      /* store handles error */
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>MEDIQ</Text>
        <Text style={styles.tagline}>Medicine delivery for customers</Text>
      </View>

      <Input
        label="Email or mobile"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!otpSent}
      />

      {otpSent ? (
        <Input
          label="OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!otpSent ? (
        <Button label="Send OTP" onPress={handleSendOtp} loading={isLoading} />
      ) : (
        <>
          <Button label="Verify & Login" onPress={handleVerify} loading={isLoading} />
          <Button
            label="Change number/email"
            variant="ghost"
            onPress={() => {
              setOtpSent(false);
              setOtp('');
            }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  brand: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});
