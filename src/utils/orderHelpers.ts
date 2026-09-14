import { titleCase, fmtOrderDateTime } from './format';
import type { Order, TrackingStep } from '../types';

export { fmtOrderDateTime };

const NORMAL_TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', description: 'Your order has been placed successfully.' },
  { key: 'packed', label: 'Packed', description: 'Your order has been packed and is ready to ship.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is out for delivery.' },
  { key: 'delivered', label: 'Delivered', description: 'Your order has been delivered successfully.' },
];

export function isOrderCancelled(order: Order) {
  if (order.status === 'cancelled') return true;
  return String(order.orderStatusDesc ?? '').toLowerCase().includes('cancel');
}

export function isOrderRejected(order: Order) {
  if (order.status === 'rejected') return true;
  return String(order.orderStatusDesc ?? '').toLowerCase().includes('reject');
}

export function isOrderTerminalFailure(order: Order) {
  return isOrderRejected(order) || isOrderCancelled(order);
}

export function getOrderStatusLabel(order: Order) {
  return order.orderStatusDesc?.trim() || titleCase(order.status);
}

export function canCancelOrder(order: Order, windowMinutes = 15) {
  if (isOrderTerminalFailure(order)) return false;
  const placed = new Date(order.placedAt).getTime();
  return Date.now() - placed <= windowMinutes * 60 * 1000;
}

function getNormalFlowStep(order: Order) {
  if (order.status === 'delivered') return 3;
  if (order.status === 'out_for_delivery') return 2;
  if (order.status === 'confirmed' || order.status === 'packed') return 1;
  return 0;
}

export function buildTrackingTimeline(order: Order): TrackingStep[] {
  if (isOrderRejected(order) || isOrderCancelled(order)) {
    return [
      {
        key: 'placed',
        label: 'Order Placed',
        description: 'Your order has been placed successfully.',
        done: true,
        active: false,
        failed: false,
        at: order.placedAt,
      },
      {
        key: isOrderRejected(order) ? 'rejected' : 'cancelled',
        label: getOrderStatusLabel(order),
        description: isOrderRejected(order)
          ? 'Your order was rejected by the store.'
          : 'Your order was cancelled.',
        done: true,
        active: true,
        failed: true,
        at: order.statusUpdatedAt ?? order.placedAt,
      },
    ];
  }

  const currentStep = getNormalFlowStep(order);
  const placedAt = new Date(order.placedAt).getTime();
  const updatedAt = new Date(order.statusUpdatedAt ?? order.placedAt).getTime();
  const span = Math.max(updatedAt - placedAt, 1);

  return NORMAL_TRACKING_STEPS.map((step, index) => {
    const done = currentStep >= index;
    const ratio = index / Math.max(NORMAL_TRACKING_STEPS.length - 1, 1);
    return {
      ...step,
      done,
      active: currentStep === index,
      failed: false,
      at: done ? new Date(placedAt + span * ratio).toISOString() : null,
    };
  });
}
