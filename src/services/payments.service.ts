import { authFetch } from './api/client';
import { pick } from '../utils/pick';

export function mapCodPaymentFromApi(payload: unknown) {
  const d = ((payload as { data?: unknown })?.data ?? payload) as Record<string, unknown>;
  return {
    message: String(pick(d, 'message') ?? 'Order placed'),
    orderId: String(pick(d, 'orderId', 'order_id', 'id') ?? ''),
    paymentStatus: String(pick(d, 'paymentStatus', 'payment_status') ?? 'COD'),
    amount: Number(pick(d, 'amount')) || 0,
  };
}

export async function createCodPayment(payload: {
  amount: number;
  transactionNote?: string;
  transactionRefId?: string;
  deliveryAddressId: string;
}) {
  const response = await authFetch(
    '/api/payments/cod',
    {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(payload.amount),
        transactionNote: payload.transactionNote,
        transactionRefId: payload.transactionRefId,
        deliveryAddressId: String(payload.deliveryAddressId),
      }),
    },
    'payment',
  );
  return mapCodPaymentFromApi(response);
}
