import { authFetch, fetchWithTimeout, parseJsonResponse, getErrorMessage } from './api/client';
import { API } from './api/config';
import { setAuthToken, setStoredAuthUser, clearAuthSession } from './api/tokenStorage';
import type { AuthUser, UserAddress } from '../types';

function decodeBase64(value: string): string {
  const atobFn = (globalThis as { atob?: (input: string) => string }).atob;
  if (typeof atobFn === 'function') {
    return atobFn(value);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const input = value.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < input.length; i += 4) {
    const enc1 = chars.indexOf(input.charAt(i));
    const enc2 = chars.indexOf(input.charAt(i + 1));
    const enc3 = chars.indexOf(input.charAt(i + 2));
    const enc4 = chars.indexOf(input.charAt(i + 3));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output;
}

function decodeJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(decodeBase64(token.split('.')[1] ?? ''));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function normalizeMobile(value?: string) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function normalizeStoredAddress(address: unknown): UserAddress | null {
  if (!address) return null;
  if (typeof address === 'string') {
    const trimmed = address.trim();
    return trimmed
      ? { line1: trimmed, line2: '', landmark: '', city: '', state: '', pincode: '' }
      : null;
  }
  const obj = address as Record<string, string>;
  return {
    line1: obj.line1?.trim() ?? obj.addressLine1?.trim() ?? '',
    line2: obj.line2?.trim() ?? obj.addressLine2?.trim() ?? '',
    landmark: obj.landmark?.trim() ?? '',
    city: obj.city?.trim() ?? '',
    state: obj.state?.trim() ?? '',
    pincode: obj.pincode?.trim() ?? obj.postalCode?.trim() ?? '',
  };
}

function isAddressComplete(address: UserAddress | null) {
  if (!address) return false;
  return Boolean(address.line1 && address.city && address.state && /^\d{6}$/.test(address.pincode));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isProfileComplete(user: AuthUser) {
  return Boolean(
    user.fullName?.trim() &&
      user.email?.trim() &&
      isValidEmail(user.email.trim()) &&
      user.mobile?.trim() &&
      /^[6-9]\d{9}$/.test(user.mobile.trim()) &&
      isAddressComplete(user.address),
  );
}

export async function requestLoginOtp(identifier: string) {
  const res = await fetchWithTimeout(`${API.userManagement}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, purpose: 'LOGIN' }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(getErrorMessage(data, res.status));
  return data;
}

export async function verifyLoginOtp(identifier: string, otp: string) {
  const res = await fetchWithTimeout(`${API.userManagement}/api/auth/verify-login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp, purpose: 'LOGIN' }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(getErrorMessage(data, res.status));
  return data;
}

export function resolveLoginEmail(identifier: string, token?: string) {
  const trimmed = identifier?.trim() ?? '';
  if (trimmed.includes('@')) return trimmed;
  return decodeJwtSub(token ?? '') ?? trimmed;
}

export async function saveAuthSession(apiResponse: Record<string, unknown>, identifier: string): Promise<AuthUser> {
  const d = (apiResponse?.data ?? apiResponse) as Record<string, unknown>;
  const token = String(d.token ?? apiResponse?.token ?? apiResponse?.accessToken ?? '');
  const loginEmail = resolveLoginEmail(identifier, token);
  const address =
    normalizeStoredAddress(d.address) ??
    ({
      line1: '',
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
    } as UserAddress);

  const user: AuthUser = {
    token,
    userId: d.userId as string | number | undefined,
    fullName: String(d.fullName ?? '').trim(),
    email: String(d.email ?? '').trim() || (loginEmail.includes('@') ? loginEmail : ''),
    mobile: normalizeMobile(String(d.mobile ?? (loginEmail.includes('@') ? '' : identifier))),
    countryCode: String(d.countryCode ?? '+91').trim() || '+91',
    address,
    role: String(d.role ?? 'USER'),
    hasAddress: isAddressComplete(address),
    primaryAddressId: (d.primaryAddressId as string | number | null) ?? null,
    profileComplete: false,
  };
  user.profileComplete = user.hasAddress || isProfileComplete(user);

  if (token) await setAuthToken(token);
  await setStoredAuthUser(user);
  return user;
}

export function needsProfileSetup(user: AuthUser | null) {
  if (!user?.token) return false;
  if (user.profileComplete || user.hasAddress || user.profileSkipped) return false;
  return !isProfileComplete(user);
}

export async function skipProfileSetup(user: AuthUser): Promise<AuthUser> {
  const updated = { ...user, profileSkipped: true };
  await setStoredAuthUser(updated);
  return updated;
}

export async function logout() {
  await clearAuthSession();
}

export function isCustomerRole(role?: string) {
  const normalized = String(role ?? '').toUpperCase();
  return !['ADMIN', 'OWNER', 'STORE_ADMIN', 'STORE_OWNER', 'SUPER_ADMIN'].includes(normalized);
}
