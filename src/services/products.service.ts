import { authFetch } from './api/client';
import { extractApiList, pick } from '../utils/pick';
import { resolveProductLooseMeta, resolveLooseSaleAllowed } from '../utils/looseQuantity';
import type { Category, Product } from '../types';

const CATEGORY_ACCENTS = ['#40deaa', '#ffd58f', '#6fc2ff', '#b287ff'];
export const PRODUCTS_PAGE_SIZE = 20;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mapCategoryFromApi(item: Record<string, unknown>, index = 0): Category {
  const categoryName = String(pick(item, 'categoryName', 'name') ?? 'Unnamed category');
  return {
    id: String(pick(item, 'categoryId', 'id') ?? slugify(categoryName)),
    slug: slugify(categoryName),
    name: categoryName,
    categoryName,
    icon: categoryName.charAt(0).toUpperCase(),
    accent: CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
    count: Number(pick(item, 'productCount', 'count', 'totalProducts')) || 0,
  };
}

export function mapProductToCustomerCatalog(item: Record<string, unknown>, categories: Category[] = []): Product {
  const categoryRaw = item.category ?? pick(item, 'categoryId', 'categoryName');
  let cat = 'uncategorized';
  let catName = String(pick(item, 'categoryName') ?? 'Uncategorized');

  if (categoryRaw != null) {
    const idStr = String(typeof categoryRaw === 'object' ? pick(categoryRaw as Record<string, unknown>, 'id', 'name') : categoryRaw);
    const byId = categories.find((c) => c.id === idStr);
    if (byId) {
      cat = byId.id;
      catName = byId.name;
    }
  }

  const packings = Array.isArray(item.packings) ? item.packings : [];
  const primary = (packings[0] ?? {}) as Record<string, unknown>;
  const looseMeta = resolveProductLooseMeta(item);
  const looseSaleAllowed = resolveLooseSaleAllowed(item, item);
  const mrp = Number(pick(item, 'mrp', 'originalPrice')) || 0;
  const sellingPrice = Number(pick(item, 'price', 'sellingPrice'));
  const price = sellingPrice > 0 ? sellingPrice : mrp;
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const qty = Number(primary.quantity);
  const unit = String(primary.unit ?? 'units').toUpperCase();
  const pack =
    Number.isFinite(qty) && qty > 0
      ? unit === 'TAB'
        ? qty === 15
          ? 'Strip of 15'
          : `${qty} tabs`
        : `${qty} ${unit.toLowerCase()}`
      : '—';

  return {
    id: String(pick(item, 'id', 'productId') ?? ''),
    name: String(pick(item, 'name', 'productName') ?? 'Untitled product'),
    brand: String(pick(item, 'genericName', 'brand') ?? 'MEDIQ'),
    cat,
    catName,
    pack,
    desc: String(pick(item, 'description', 'desc') ?? ''),
    price,
    mrp,
    off,
    stock: Number(pick(item, 'stock', 'stockQuantity', 'stockQuantityPerPack') ?? primary.quantity) || 0,
    rx: Boolean(pick(item, 'rx', 'requiresPrescription', 'prescriptionRequired')),
    imageUrl: String(pick(item, 'imageUrl', 'image', 'photoUrl') ?? ''),
    looseQuantity: looseSaleAllowed,
    looseSaleAllowed,
    unitsPerPack: looseMeta.unitsPerPack,
    packLabel: looseMeta.packLabel,
    unitLabel: looseMeta.unitLabel,
  };
}

export function parseCustomerProductsPage(payload: unknown, categories: Category[] = []) {
  const data = (payload as { data?: Record<string, unknown> })?.data ?? payload;
  const content = extractApiList(payload, ['products']);
  const pageData = data as Record<string, number>;

  return {
    products: content.map((item) => mapProductToCustomerCatalog(item as Record<string, unknown>, categories)),
    totalElements: Number(pageData?.totalElements ?? pageData?.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(pageData?.totalPages) || 1),
    page: Number(pageData?.number ?? pageData?.page ?? 0) || 0,
    size: Number(pageData?.size ?? content.length) || 0,
  };
}

export async function fetchCategories() {
  const payload = await authFetch('/api/categories', {}, 'product');
  return extractApiList(payload, ['categories']).map((item, index) =>
    mapCategoryFromApi(item as Record<string, unknown>, index),
  );
}

export async function fetchCustomerProductsPage(
  categories: Category[],
  { page = 0, size = PRODUCTS_PAGE_SIZE } = {},
) {
  const payload = await authFetch(`/api/products?page=${page}&size=${size}`, {}, 'product');
  return parseCustomerProductsPage(payload, categories);
}

export async function fetchCustomerProductsByCategoryPage(
  categoryId: string,
  categories: Category[],
  { page = 0, size = PRODUCTS_PAGE_SIZE } = {},
) {
  const payload = await authFetch(
    `/api/products/by-category/${encodeURIComponent(categoryId)}?page=${page}&size=${size}`,
    {},
    'product',
  );
  return parseCustomerProductsPage(payload, categories);
}

export async function fetchProductsSearchPage(
  query: string,
  categories: Category[],
  { page = 0, size = PRODUCTS_PAGE_SIZE } = {},
) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { products: [], totalElements: 0, totalPages: 1, page: 0, size: 0 };
  }
  const payload = await authFetch(
    `/api/products/search?query=${encodeURIComponent(trimmed)}&page=${page}&size=${size}`,
    {},
    'product',
  );
  return parseCustomerProductsPage(payload, categories);
}

export async function fetchProductById(productId: string) {
  return authFetch(`/api/products/${encodeURIComponent(productId)}`, {}, 'product');
}

export function mapProductDetail(payload: unknown, categories: Category[] = []): Product {
  const d = ((payload as { data?: unknown })?.data ?? payload) as Record<string, unknown>;
  return mapProductToCustomerCatalog(d, categories);
}
