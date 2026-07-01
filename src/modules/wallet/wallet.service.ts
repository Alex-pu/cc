import { AppError } from '../../shared/http/app-error.js';
import {
  addWalletPoints,
  getOrCreateWallet,
  getPointSettings,
  getWalletTransactions,
  updatePointSettings,
} from './wallet.repository.js';
import type { TopUpWalletInput, UpdatePointSettingsInput } from './wallet.schemas.js';

const toWallet = (wallet: Awaited<ReturnType<typeof getOrCreateWallet>>) => ({
  companyId: wallet?.company_id,
  balancePoints: wallet?.balance_points ?? 0,
  createdAt: wallet?.created_at,
  updatedAt: wallet?.updated_at,
});

export const getCompanyWallet = async (companyId: string) => {
  const [wallet, transactions, settings] = await Promise.all([
    getOrCreateWallet(companyId),
    getWalletTransactions(companyId),
    getPointSettings(),
  ]);

  return {
    wallet: toWallet(wallet),
    settings,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      companyId: transaction.company_id,
      type: transaction.transaction_type,
      points: transaction.points,
      balanceAfter: transaction.balance_after,
      amountPaid: transaction.amount_paid === null ? null : Number(transaction.amount_paid),
      currency: transaction.currency,
      paymentReference: transaction.payment_reference,
      relatedProfileId: transaction.related_profile_id,
      createdByUserId: transaction.created_by_user_id,
      note: transaction.note,
      createdAt: transaction.created_at,
    })),
  };
};

export const topUpCompanyWallet = async (input: TopUpWalletInput) => {
  const result = await addWalletPoints({
    companyId: input.companyId,
    points: input.points,
    currency: input.currency,
    ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid } : {}),
    ...(input.paymentReference ? { paymentReference: input.paymentReference } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.note ? { note: input.note } : {}),
  });

  if (!result.wallet || !result.transaction) {
    throw new AppError('Failed to top up wallet', 500, 'WALLET_TOPUP_FAILED');
  }

  return {
    wallet: toWallet(result.wallet),
    transaction: {
      id: result.transaction.id,
      type: result.transaction.transaction_type,
      points: result.transaction.points,
      balanceAfter: result.transaction.balance_after,
      amountPaid: result.transaction.amount_paid === null ? null : Number(result.transaction.amount_paid),
      currency: result.transaction.currency,
      paymentReference: result.transaction.payment_reference,
      createdAt: result.transaction.created_at,
    },
  };
};

export const getWalletSettings = async () => getPointSettings();

export const setWalletSettings = async (input: UpdatePointSettingsInput) => {
  const current = await getPointSettings();

  return updatePointSettings({
    pointValue: {
      amount: input.pointValueAmount ?? current.pointValue.amount,
      currency: input.pointValueCurrency ?? current.pointValue.currency,
    },
    candidateRevealCost: {
      points: input.candidateRevealCostPoints ?? current.candidateRevealCost.points,
    },
  });
};
