import { env } from '../../config/env.js';
import { AppError } from '../../shared/http/app-error.js';

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type PaystackInitializeResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata:
    | string
    | {
        companyId?: string;
        points?: number;
        userId?: string;
        purpose?: string;
      };
};

const paystackRequest = async <T>(path: string, init: RequestInit = {}) => {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new AppError('Paystack is not configured. Add PAYSTACK_SECRET_KEY.', 503, 'PAYSTACK_NOT_CONFIGURED');
  }

  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = (await response.json()) as PaystackResponse<T>;

  if (!response.ok || !body.status) {
    throw new AppError(body.message || 'Paystack request failed', 502, 'PAYSTACK_REQUEST_FAILED');
  }

  return body.data;
};

export const initializePaystackTransaction = async (input: {
  email: string;
  amountSubunit: number;
  currency: string;
  reference: string;
  metadata: Record<string, unknown>;
}) =>
  paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountSubunit,
      currency: input.currency,
      reference: input.reference,
      metadata: input.metadata,
      ...(env.PAYSTACK_CALLBACK_URL ? { callback_url: env.PAYSTACK_CALLBACK_URL } : {}),
    }),
  });

export const verifyPaystackTransaction = async (reference: string) =>
  paystackRequest<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
