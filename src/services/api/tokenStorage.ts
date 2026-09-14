import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './config';
import type { AuthUser } from '../../types';

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getStoredAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function setStoredAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function clearStoredAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([clearAuthToken(), clearStoredAuthUser()]);
}
