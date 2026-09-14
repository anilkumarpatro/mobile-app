export type UserAddress = {
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

export type AuthUser = {
  token: string;
  userId?: string | number;
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  address: UserAddress;
  role?: string;
  hasAddress: boolean;
  primaryAddressId?: string | number | null;
  profileComplete: boolean;
  profileSkipped?: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  icon: string;
  accent: string;
  count: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  cat: string;
  catName: string;
  pack: string;
  desc: string;
  price: number;
  mrp: number;
  off: number;
  stock: number;
  rx: boolean;
  imageUrl?: string;
  looseQuantity?: boolean;
  looseSaleAllowed?: boolean;
  unitsPerPack?: number;
  packLabel?: string;
  unitLabel?: string;
};

export type CartItem = {
  id: string;
  cartItemId: string | null;
  name: string;
  genericName: string;
  price: number;
  mrp: number;
  qty: number;
  pack: string;
  rx: boolean;
  image?: string | null;
  unitsPerPack: number;
  packLabel?: string;
  unitLabel?: string;
  looseSaleAllowed?: boolean;
  looseQuantity?: boolean;
  fullPackQty?: number;
  looseUnitQty?: number;
  lineTotal?: number;
};

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  lines: string;
};

export type UserProfile = {
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  role: string;
  location: string;
  memberSince: string;
  addresses: SavedAddress[];
  recentOrders: Array<{
    id: string;
    date: string;
    amount: number;
    amountFmt: string;
    status: string;
  }>;
};

export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  image?: string | null;
};

export type Order = {
  id: string;
  placedAt: string;
  statusUpdatedAt: string;
  status: string;
  orderStatusDesc: string;
  paymentMethod: string;
  address: string;
  items: OrderItem[];
  total: number;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  rating: number;
  reviewCount: number;
  experienceYears?: string | number;
  location: string;
  fee: number;
  imageUrl: string;
  availability: string;
  availableToday: boolean;
  bio: string;
  languages: string[];
};

export type DoctorSlot = {
  id: string;
  time: string;
  available: boolean;
};

export type TrackingStep = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  active: boolean;
  failed: boolean;
  at: string | null;
};
