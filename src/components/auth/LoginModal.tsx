import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';

export function LoginModal() {
  const insets = useSafeAreaInsets();
  const {
    loginModalVisible,
    loginPrompt,
    closeLoginModal,
    sendOtp,
    verifyOtp,
    isLoading,
    error,
  } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!loginModalVisible) {
      setIdentifier('');
      setOtp('');
      setOtpSent(false);
    }
  }, [loginModalVisible]);

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
    <Modal visible={loginModalVisible} transparent animationType="slide" onRequestClose={closeLoginModal}>
      <Pressable style={styles.backdrop} onPress={closeLoginModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.brand}>MEDIQ</Text>
              <Text style={styles.title}>Login to continue</Text>
              <Text style={styles.subtitle}>
                {loginPrompt ?? 'Order medicines, track orders, and manage delivery from one place.'}
              </Text>

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

              <Button label="Browse without login" variant="secondary" onPress={closeLoginModal} style={styles.skipBtn} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 10, 8, 0.72)',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.textDim,
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.textBright,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  skipBtn: {
    marginTop: spacing.sm,
  },
});
