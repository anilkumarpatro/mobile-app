import { authFetch } from './api/client';
import { extractApiList, pick } from '../utils/pick';
import type { Doctor, DoctorSlot } from '../types';

const BASE = '/api/v1/public/doctors';

export function mapDoctorFromApi(item: Record<string, unknown>): Doctor {
  return {
    id: String(pick(item, 'id', 'doctorId') ?? ''),
    name: String(pick(item, 'name', 'doctorName', 'fullName') ?? 'Doctor'),
    specialty: String(pick(item, 'specialty', 'specialization', 'specialtyName') ?? ''),
    qualifications: String(pick(item, 'qualifications', 'degree', 'credentials') ?? ''),
    rating: Number(pick(item, 'rating', 'averageRating')) || 0,
    reviewCount: Number(pick(item, 'reviewCount', 'totalReviews')) || 0,
    experienceYears: pick(item, 'experienceYears', 'experience') as string | number | undefined,
    location: String(pick(item, 'location', 'clinicName', 'address') ?? ''),
    fee: Number(pick(item, 'consultationFee', 'fee', 'price')) || 0,
    imageUrl: String(pick(item, 'imageUrl', 'photoUrl', 'profileImage') ?? ''),
    availability: String(pick(item, 'availability', 'availabilityStatus') ?? ''),
    availableToday: item.availableToday !== false && item.isAvailableToday !== false,
    bio: String(pick(item, 'bio', 'about', 'description') ?? ''),
    languages: Array.isArray(item.languages) ? (item.languages as string[]) : [],
  };
}

export function mapSlotFromApi(item: Record<string, unknown>): DoctorSlot {
  return {
    id: String(pick(item, 'id', 'slotId') ?? pick(item, 'time', 'startTime') ?? ''),
    time: String(pick(item, 'time', 'startTime', 'slotTime', 'label') ?? ''),
    available: item.available !== false && item.isAvailable !== false,
  };
}

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function fetchDoctors(params: Record<string, unknown> = {}) {
  const payload = await authFetch(`${BASE}${buildQuery(params)}`, {}, 'doctor');
  return extractApiList(payload, ['doctors'])
    .map((item) => mapDoctorFromApi(item as Record<string, unknown>))
    .filter((doctor) => doctor.id);
}

export async function fetchTopDoctorsNearYou(city?: string, limit = 50) {
  const payload = await authFetch(`${BASE}/top-near-you${buildQuery({ city, limit })}`, {}, 'doctor');
  return extractApiList(payload).map((item) => mapDoctorFromApi(item as Record<string, unknown>));
}

export async function fetchPopularDoctors(city?: string, limit = 3) {
  const payload = await authFetch(`${BASE}/popular${buildQuery({ city, limit })}`, {}, 'doctor');
  return extractApiList(payload).map((item) => mapDoctorFromApi(item as Record<string, unknown>));
}

export async function fetchDoctorById(id: string) {
  const payload = await authFetch(`${BASE}/${encodeURIComponent(id)}`, {}, 'doctor');
  const raw = (payload as { data?: unknown; doctor?: unknown }).data ?? (payload as { doctor?: unknown }).doctor ?? payload;
  return mapDoctorFromApi(raw as Record<string, unknown>);
}

export async function fetchDoctorAvailableSlots(id: string, consultationDate = 'today') {
  const payload = await authFetch(
    `${BASE}/${encodeURIComponent(id)}/available-slots${buildQuery({ consultationDate })}`,
    {},
    'doctor',
  );
  const list = extractApiList(payload);
  return list.map((item) => mapSlotFromApi(item as Record<string, unknown>)).filter((slot) => slot.time);
}
