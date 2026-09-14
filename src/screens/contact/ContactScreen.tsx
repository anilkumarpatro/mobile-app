import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { createUserCallbackRequest } from '../../services/user.service';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../app/navigation/routes';

export function ContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message.');
      return;
    }
    setLoading(true);
    try {
      await createUserCallbackRequest({
        customerName: user?.fullName || 'Customer',
        mobileNumber: user?.mobile || '',
        description: `${subject ? `${subject.trim()}\n` : ''}${message.trim()}`,
        countryCode: user?.countryCode,
      });
      Alert.alert('Sent', 'We received your message and will contact you soon.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Contact us" onBack={() => navigation.goBack()} />
      <Text style={styles.note}>Send us a message and our support team will get back to you.</Text>
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} style={styles.message} />
      <Button label="Send message" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  message: { minHeight: 120, textAlignVertical: 'top' },
});
