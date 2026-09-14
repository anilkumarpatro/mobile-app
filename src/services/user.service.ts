import { authFetch } from './api/client';
import { pick } from '../utils/pick';
import type { SavedAddress, UserAddress, UserProfile } from '../types';

function formatAddressLines(address: Record<string, unknown>) {
  return [
    address.addressLine1 ?? address.line1,
    address.addressLine2 ?? address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode ?? address.pincode,
  ]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

export function mapUserProfileFromApi(payload: unknown): UserProfile {
  const d = ((payload as { data?: unknown })?.data ?? payload) as Record<string, unknown>;
  const addressesRaw = Array.isArray(d.addresses) ? d.addresses : [];
  const primaryId = d.primaryAddressId;

  const addresses: SavedAddress[] = addressesRaw.map((item, index) => {
    const row = item as Record<string, unknown>;
    const id = String(pick(row, 'addressId', 'id') ?? index);
    const isDefault =
      row.isDefault === true ||
      row.default === true ||
      (primaryId != null &&
        (row.addressId === primaryId || row.id === primaryId || String(row.addressId) === String(primaryId)));

    return {
      id,
      label: String(pick(row, 'label', 'addressType', 'type') ?? (index === 0 ? 'Home' : `Address ${index + 1}`)),
      name: String(pick(row, 'recipientName', 'name', 'fullName') ?? pick(d, 'fullName') ?? ''),
      phone: String(pick(row, 'contactMobile', 'mobile', 'phone') ?? pick(d, 'mobile') ?? ''),
      line1: String(pick(row, 'addressLine1', 'line1') ?? ''),
      line2: String(pick(row, 'addressLine2', 'line2') ?? ''),
      landmark: String(pick(row, 'landmark') ?? ''),
      city: String(pick(row, 'city') ?? ''),
      state: String(pick(row, 'state') ?? ''),
      pincode: String(pick(row, 'postalCode', 'pincode') ?? ''),
      isDefault,
      lines: formatAddressLines(row),
    };
  });

  const primaryAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return {
    fullName: String(pick(d, 'fullName', 'name') ?? ''),
    email: String(pick(d, 'email') ?? ''),
    mobile: String(pick(d, 'mobile', 'phone') ?? ''),
    countryCode: String(pick(d, 'countryCode') ?? '+91'),
    role: String(pick(d, 'role') ?? 'USER'),
    location: String(pick(d, 'storeLocation', 'location') ?? primaryAddress?.lines ?? '—'),
    memberSince: String(pick(d, 'memberSince', 'joinedAt', 'createdAt') ?? '—'),
    addresses,
    recentOrders: [],
  };
}

export async function fetchUserProfile() {
  const payload = await authFetch('/api/user/profile');
  return mapUserProfileFromApi(payload);
}

export async function fetchAddressByPincode(pincode: string) {
  const data = await authFetch(`/api/user/addresses/getaddress/${encodeURIComponent(pincode)}`);
  const locations = Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data : [];
  const location = (locations[0] ?? {}) as Record<string, string>;
  return {
    city: (location.division ?? '').trim(),
    state: (location.state ?? '').trim(),
  };
}

function buildAddressPayload(profile: {
  fullName: string;
  email: string;
  mobile: string;
  address: UserAddress;
}) {
  const addr = profile.address;
  return {
    recipientName: profile.fullName.trim(),
    contactMobile: profile.mobile.trim(),
    email: profile.email.trim(),
    addressLine1: addr.line1.trim(),
    addressLine2: addr.line2.trim(),
    city: addr.city.trim(),
    state: addr.state.trim(),
    postalCode: addr.pincode.trim(),
    country: 'India',
    landmark: addr.landmark.trim(),
  };
}

export async function saveUserDetails(profile: {
  fullName: string;
  email: string;
  mobile: string;
  address: UserAddress;
}) {
  const address = profile.address;
  return authFetch('/api/user/details', {
    method: 'POST',
    body: JSON.stringify({
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      mobile: profile.mobile.trim(),
      addressLine1: address.line1.trim(),
      addressLine2: address.line2.trim(),
      landmark: address.landmark.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.pincode.trim(),
      country: 'India',
    }),
  });
}

export async function saveUserAddress(profile: {
  fullName: string;
  email: string;
  mobile: string;
  address: UserAddress;
}) {
  return authFetch('/api/user/addresses', {
    method: 'POST',
    body: JSON.stringify(buildAddressPayload(profile)),
  });
}

export async function updateUserAddress(
  addressId: string,
  profile: { fullName: string; email: string; mobile: string; address: UserAddress },
) {
  return authFetch(`/api/user/addresses/${encodeURIComponent(addressId)}`, {
    method: 'PUT',
    body: JSON.stringify(buildAddressPayload(profile)),
  });
}

export async function deleteUserAddress(addressId: string) {
  return authFetch(`/api/user/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' });
}

export async function createUserCallbackRequest(payload: {
  customerName: string;
  mobileNumber: string;
  description: string;
  countryCode?: string;
}) {
  const digits = payload.mobileNumber.replace(/\D/g, '');
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2');
  const countryCode = payload.countryCode ?? '+91';

  return authFetch('/api/user/callback-request', {
    method: 'POST',
    body: JSON.stringify({
      customerName: payload.customerName.trim(),
      mobileNumber: `${countryCode} ${spaced}`.trim(),
      description: payload.description.trim(),
    }),
  });
}

export async function fetchStoreContact() {
  return authFetch('/api/public/store-contact', { skipAuth: true });
}
