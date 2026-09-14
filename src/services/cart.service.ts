import { authFetch } from './api/client';
import { pick } from '../utils/pick';
import { resolveProductLooseMeta, resolveLooseSaleAllowed } from '../utils/looseQuantity';
import type { CartItem } from '../types';

const LINE_ITEM_ID_KEYS = ['itemId', 'cartItemId', 'lineItemId', 'cartLineItemId', 'lineId'];
const PRODUCT_ID_KEYS = ['productId', 'product_id', 'productID'];
const QTY_KEYS = ['quantity', 'qty', 'totalQuantity', 'totalQty'];

function extractCartItems(payload: unknown): Record<string, unknown>[] {
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray((data as { items?: unknown[] })?.items)) {
    return (data as { items: Record<string, unknown>[] }).items;
  }
  if (Array.isArray((data as { cartItems?: unknown[] })?.cartItems)) {
    return (data as { cartItems: Record<string, unknown>[] }).cartItems;
  }
  if (Array.isArray(data)) return data as Record<string, unknown>[];

  const item = (payload as { item?: unknown; cartItem?: unknown })?.item
    ?? (payload as { cartItem?: unknown })?.cartItem;
  if (item && typeof item === 'object') return [item as Record<string, unknown>];

  return [];
}

export function findCartLineItem(payload: unknown, productId: string) {
  const target = String(productId);
  return (
    extractCartItems(payload).find(
      (item) => String(pick(item, ...PRODUCT_ID_KEYS) ?? '') === target,
    ) ?? null
  );
}

export function mapCartItemFromApi(payload: unknown, productId?: string) {
  const line =
    productId != null ? findCartLineItem(payload, productId) : extractCartItems(payload)[0];

  const item = line ?? (payload as { data?: unknown })?.data ?? (payload as { item?: unknown })?.item ?? payload ?? {};

  return {
    cartItemId: String(pick(item as Record<string, unknown>, ...LINE_ITEM_ID_KEYS) ?? ''),
    quantity: Number(pick(item as Record<string, unknown>, ...QTY_KEYS)) || undefined,
  };
}

export function mapCartLineToStoreItem(line: Record<string, unknown>): CartItem {
  const product = (line.product ?? line.productDetails ?? line.productInfo ?? {}) as Record<string, unknown>;
  const productId = pick(line, ...PRODUCT_ID_KEYS) ?? pick(product, 'productId', 'id');
  const cartItemId = pick(line, ...LINE_ITEM_ID_KEYS);
  const packings = product.packings ?? line.packings;
  const looseMeta = resolveProductLooseMeta({ ...product, packings });
  const looseSaleAllowed = resolveLooseSaleAllowed(line, product);

  const price = Number(pick(line, 'price', 'unitPrice', 'sellingPrice') ?? pick(product, 'price')) || 0;
  const mrp = Number(pick(line, 'mrp', 'originalPrice') ?? pick(product, 'mrp')) || price;
  const fullPackQtyRaw = pick(line, 'packQuantity', 'packQty', 'fullPackQuantity', 'fullPackQty');
  const looseUnitQtyRaw = pick(line, 'looseQty', 'looseUnitQuantity', 'looseQuantity');
  const fullPackQty = fullPackQtyRaw != null && fullPackQtyRaw !== '' ? Number(fullPackQtyRaw) : NaN;
  const looseUnitQty =
    looseSaleAllowed && looseUnitQtyRaw != null && looseUnitQtyRaw !== ''
      ? Number(looseUnitQtyRaw)
      : NaN;
  const unitsPerPack =
    Number(pick(line, 'stockQuantityPerPack', 'unitsPerPack') ?? looseMeta.unitsPerPack) || 1;

  let qty = Number(pick(line, ...QTY_KEYS)) || 0;
  const hasPackFields = Number.isFinite(fullPackQty) || Number.isFinite(looseUnitQty);
  if (!qty && hasPackFields) {
    qty = looseSaleAllowed
      ? (Number.isFinite(fullPackQty) ? fullPackQty : 0) * unitsPerPack +
        (Number.isFinite(looseUnitQty) ? looseUnitQty : 0)
      : Number.isFinite(fullPackQty)
        ? fullPackQty
        : 0;
  }

  const base: CartItem = {
    id: String(productId ?? cartItemId ?? ''),
    cartItemId: cartItemId ? String(cartItemId) : null,
    name: String(pick(line, 'productName', 'name') ?? pick(product, 'productName', 'name') ?? 'Product'),
    genericName: String(pick(line, 'genericName', 'brand') ?? pick(product, 'genericName', 'brand') ?? ''),
    price,
    mrp,
    qty,
    pack: String(pick(line, 'pack', 'packLabel') ?? pick(product, 'pack') ?? ''),
    rx: Boolean(pick(line, 'rx', 'requiresPrescription') ?? pick(product, 'requiresPrescription')),
    image: String(pick(line, 'imageUrl', 'image') ?? pick(product, 'imageUrl', 'image') ?? '') || null,
    unitsPerPack,
    packLabel: looseMeta.packLabel,
    unitLabel: looseMeta.unitLabel,
    looseSaleAllowed,
    packBased: hasPackFields,
  };

  const lineTotal = Number(pick(line, 'lineTotal', 'totalPrice', 'itemTotal', 'subtotal', 'total'));
  if (Number.isFinite(lineTotal)) base.lineTotal = lineTotal;

  if (looseSaleAllowed && hasPackFields) {
    const fp = Number.isFinite(fullPackQty) ? fullPackQty : 0;
    const lu = Number.isFinite(looseUnitQty) ? looseUnitQty : 0;
    return { ...base, looseQuantity: true, fullPackQty: fp, looseUnitQty: lu, qty: fp * unitsPerPack + lu };
  }

  if (Number.isFinite(fullPackQty) && fullPackQty > 0) {
    return { ...base, fullPackQty, qty: fullPackQty };
  }

  return base;
}

export function parseCartPayload(payload: unknown) {
  const root = ((payload as { data?: unknown })?.data ?? payload) as Record<string, unknown>;
  const cartTotal = Number(pick(root, 'cartTotal', 'totalAmount', 'grandTotal'));
  const subtotal = Number(pick(root, 'subtotal', 'subTotal', 'itemsTotal', 'itemTotal'));

  return {
    items: extractCartItems(payload)
      .map(mapCartLineToStoreItem)
      .filter(
        (item) =>
          item.id &&
          (item.qty > 0 ||
            (Number(item.fullPackQty) || 0) > 0 ||
            (Number(item.looseUnitQty) || 0) > 0),
      ),
    cartTotal: Number.isFinite(cartTotal) ? cartTotal : null,
    subtotal: Number.isFinite(subtotal) ? subtotal : null,
  };
}

export async function fetchMyCart() {
  return authFetch('/api/carts/me', {}, 'cart');
}

export async function resolveCartItemId(productId: string, postResponse?: unknown) {
  const fromPost = mapCartItemFromApi(postResponse, productId);
  if (fromPost.cartItemId) return fromPost;

  const cart = await fetchMyCart();
  return mapCartItemFromApi(cart, productId);
}

export async function addCartItem(payload: {
  productId: string;
  quantity?: number;
  price: number;
  packQuantity?: number;
  looseQuantity?: number;
}) {
  const body: Record<string, number> = {
    productId: Number(payload.productId),
    price: Number(payload.price),
  };

  if (payload.packQuantity != null || payload.looseQuantity != null) {
    body.packQuantity = Number(payload.packQuantity ?? 0);
    body.looseQuantity = Number(payload.looseQuantity ?? 0);
  } else {
    body.quantity = Number(payload.quantity ?? 1);
  }

  return authFetch('/api/carts/me/items', { method: 'POST', body: JSON.stringify(body) }, 'cart');
}

export async function updateCartItem(
  itemId: string,
  payload: { quantity?: number; packQuantity?: number; looseQuantity?: number },
) {
  const body =
    payload.packQuantity != null || payload.looseQuantity != null
      ? { packQuantity: Number(payload.packQuantity ?? 0), looseQuantity: Number(payload.looseQuantity ?? 0) }
      : { quantity: Number(payload.quantity ?? 1) };

  return authFetch(`/api/carts/me/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, 'cart');
}

export async function deleteCartItem(itemId: string) {
  return authFetch(`/api/carts/me/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' }, 'cart');
}
