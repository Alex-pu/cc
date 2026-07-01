import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/http/app-error.js';
import { getPointTransactionByPaymentReference } from '../wallet/wallet.repository.js';
import { getWalletSettings, topUpCompanyWallet } from '../wallet/wallet.service.js';
import type { AuthenticatedUser } from '../auth/neon-auth.middleware.js';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  type PaystackTransaction,
} from './paystack.client.js';
import type { InitializePaystackTopupInput } from './payments.schemas.js';

const PAYSTACK_SUBUNIT_MULTIPLIER = 100;

const getMetadata = (transaction: PaystackTransaction) => {
  if (typeof transaction.metadata === 'string') {
    try {
      return JSON.parse(transaction.metadata) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return transaction.metadata;
};

export const initializePaystackTopup = async (
  input: InitializePaystackTopupInput,
  authUser?: AuthenticatedUser,
) => {
  const email = input.email ?? authUser?.email;

  if (!email) {
    throw new AppError('An email address is required to initialize payment', 400, 'PAYMENT_EMAIL_REQUIRED');
  }

  const settings = await getWalletSettings();
  const currency = env.PAYSTACK_CURRENCY.toUpperCase();
  const amountMajor = input.points * settings.pointValue.amount;
  const amountSubunit = Math.round(amountMajor * PAYSTACK_SUBUNIT_MULTIPLIER);
  const reference = `sm-${crypto.randomUUID()}`;
  const metadata = {
    purpose: 'wallet_topup',
    companyId: input.companyId,
    points: input.points,
    userId: authUser?.id,
  };

  const transaction = await initializePaystackTransaction({
    email,
    amountSubunit,
    currency,
    reference,
    metadata,
  });

  return {
    provider: 'paystack',
    reference: transaction.reference,
    authorizationUrl: transaction.authorization_url,
    accessCode: transaction.access_code,
    points: input.points,
    amount: amountMajor,
    currency,
  };
};

export const creditPaystackTopup = async (transaction: PaystackTransaction) => {
  if (transaction.status !== 'success') {
    return { credited: false, reason: 'transaction_not_successful' };
  }

  const existing = await getPointTransactionByPaymentReference(transaction.reference);

  if (existing) {
    return {
      credited: false,
      reason: 'already_credited',
      transactionId: existing.id,
    };
  }

  const metadata = getMetadata(transaction);

  if (metadata.purpose !== 'wallet_topup' || typeof metadata.companyId !== 'string') {
    throw new AppError('Paystack transaction metadata is not a wallet top-up', 400, 'PAYSTACK_INVALID_METADATA');
  }

  const points = Number(metadata.points);

  if (!Number.isInteger(points) || points <= 0) {
    throw new AppError('Paystack transaction metadata has invalid points', 400, 'PAYSTACK_INVALID_POINTS');
  }

  const amountPaid = transaction.amount / PAYSTACK_SUBUNIT_MULTIPLIER;
  const result = await topUpCompanyWallet({
    companyId: metadata.companyId,
    points,
    amountPaid,
    currency: transaction.currency,
    paymentReference: transaction.reference,
    ...(typeof metadata.userId === 'string' ? { userId: metadata.userId } : {}),
    note: 'Paystack wallet top-up',
  });

  return {
    credited: true,
    wallet: result.wallet,
    transaction: result.transaction,
  };
};

export const verifyAndCreditPaystackTopup = async (reference: string) => {
  const transaction = await verifyPaystackTransaction(reference);
  return creditPaystackTopup(transaction);
};

export const assertPaystackWebhookSignature = (payload: unknown, signature?: string | string[]) => {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new AppError('Paystack is not configured. Add PAYSTACK_SECRET_KEY.', 503, 'PAYSTACK_NOT_CONFIGURED');
  }

  const receivedSignature = Array.isArray(signature) ? signature[0] : signature;

  if (!receivedSignature) {
    throw new AppError('Missing Paystack webhook signature', 401, 'PAYSTACK_SIGNATURE_MISSING');
  }

  const expectedSignature = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');

  const received = Buffer.from(receivedSignature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new AppError('Invalid Paystack webhook signature', 401, 'PAYSTACK_SIGNATURE_INVALID');
  }
};
