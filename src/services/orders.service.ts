import { authFetch } from './api/client';
import { pick } from '../utils/pick';
import type { Order, OrderItem } from '../types';

function normalizeOrderStatus(status: unknown) {
  const raw = String(status ?? 'placed').trim();
  if (raw.length === 1) {
    const codeMap: Record<string, string> = {
      I: 'placed',
      A: 'confirmed',
      P: 'packed',
      O: 'out_for_delivery',
      D: 'delivered',
      C: 'cancelled',
      R: 'rejected',
    };
    return codeMap[raw.toUpperCase()] ?? raw.toLowerCase();
  }
  return raw.toLowerCase().replace(/[\s-]+/g, '_');
}

function formatOrderAddress(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  const obj = value as Record<string, string>;
  return [obj.label, obj.line1 ?? obj.addressLine1, obj.line2, obj.city, obj.state, obj.pincode ?? obj.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

function extractOrders(payload: unknown) {
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray((data as { orders?: unknown[] })?.orders)) return (data as { orders: unknown[] }).orders;
  if (Array.isArray((data as { content?: unknown[] })?.content)) return (data as { content: unknown[] }).content;
  if (Array.isArray(data)) return data;
  return [];
}

function mapOrderItemFromApi(line: Record<string, unknown>, index: number): OrderItem {
  const product = (line.product ?? line.productDetails ?? {}) as Record<string, unknown>;
  return {
    id: String(pick(line, 'productId', 'id', 'orderItemId') ?? pick(product, 'productId', 'id') ?? index),
    name: String(pick(line, 'productName', 'name') ?? pick(product, 'productName', 'name') ?? 'Product'),
    qty: Number(pick(line, 'quantity', 'qty')) || 1,
    price: Number(pick(line, 'price', 'unitPrice') ?? pick(product, 'price')) || 0,
    image: String(pick(line, 'imageUrl', 'image') ?? pick(product, 'imageUrl') ?? '') || null,
  };
}

export function mapOrderFromApi(order: Record<string, unknown>, index = 0): Order {
  const itemsRaw = order.items ?? order.orderItems ?? order.lineItems ?? [];
  const items = (Array.isArray(itemsRaw) ? itemsRaw : []).map((line, i) =>
    mapOrderItemFromApi(line as Record<string, unknown>, i),
  );
  const total =
    Number(pick(order, 'totalAmount', 'total', 'amount', 'grandTotal')) ||
    items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return {
    id: String(pick(order, 'orderId', 'id', 'orderNumber') ?? `ORD-${index + 1}`),
    placedAt: String(
      pick(order, 'placedAt', 'createdAt', 'orderDate', 'orderedAt') ?? new Date().toISOString(),
    ),
    statusUpdatedAt: String(
      pick(order, 'statusUpdatedAt', 'statusUpdatedAT') ??
        pick(order, 'placedAt', 'createdAt') ??
        new Date().toISOString(),
    ),
    status: normalizeOrderStatus(pick(order, 'status', 'orderStatus')),
    orderStatusDesc: String(pick(order, 'orderStatusDesc', 'statusDesc') ?? ''),
    paymentMethod: String(pick(order, 'paymentMethod', 'paymentMode') ?? 'cod').toLowerCase(),
    address: formatOrderAddress(pick(order, 'deliveryAddress', 'shippingAddress', 'address') ?? order.addressDetails),
    items,
    total,
  };
}

export function mapOrdersFromApi(payload: unknown) {
  return extractOrders(payload).map((order, index) => mapOrderFromApi(order as Record<string, unknown>, index));
}

export async function fetchMyOrders() {
  return authFetch('/api/orders/me', {}, 'cart');
}

export async function cancelCustomerOrder(orderId: string, reason?: string) {
  const normalized = encodeURIComponent(String(orderId).trim().replace(/^#/, ''));
  return authFetch(
    `/api/orders/${normalized}/cancel`,
    { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
    'cart',
  );
}
