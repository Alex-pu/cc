import { pool } from '../../db/pool.js';
import { query } from '../../db/query.js';

export type WalletRow = {
  company_id: string;
  balance_points: number;
  created_at: Date;
  updated_at: Date;
};

export type PointTransactionRow = {
  id: string;
  company_id: string;
  transaction_type: 'topup' | 'spend' | 'refund' | 'adjustment';
  points: number;
  balance_after: number;
  amount_paid: string | null;
  currency: string;
  payment_reference: string | null;
  related_profile_id: string | null;
  created_by_user_id: string | null;
  note: string | null;
  created_at: Date;
};

export type PointSettings = {
  pointValue: {
    amount: number;
    currency: string;
  };
  candidateRevealCost: {
    points: number;
  };
};

export const getOrCreateWallet = async (companyId: string) => {
  const result = await query<WalletRow>(
    `
      insert into employer_point_wallets (company_id)
      values ($1)
      on conflict (company_id) do update set updated_at = employer_point_wallets.updated_at
      returning *
    `,
    [companyId],
  );

  return result.rows[0];
};

export const getWalletTransactions = async (companyId: string) => {
  const result = await query<PointTransactionRow>(
    `
      select *
      from point_transactions
      where company_id = $1
      order by created_at desc
      limit 100
    `,
    [companyId],
  );

  return result.rows;
};

export const getPointTransactionByPaymentReference = async (paymentReference: string) => {
  const result = await query<PointTransactionRow>(
    'select * from point_transactions where payment_reference = $1',
    [paymentReference],
  );

  return result.rows[0] ?? null;
};

export const getPointSettings = async () => {
  const result = await query<{ key: string; value: unknown }>(
    `
      select key, value
      from platform_settings
      where key in ('point_value', 'candidate_reveal_cost')
    `,
  );

  const settings = Object.fromEntries(result.rows.map((row) => [row.key, row.value])) as {
    point_value?: { amount?: number; currency?: string };
    candidate_reveal_cost?: { points?: number };
  };

  return {
    pointValue: {
      amount: settings.point_value?.amount ?? 100,
      currency: settings.point_value?.currency ?? 'KES',
    },
    candidateRevealCost: {
      points: settings.candidate_reveal_cost?.points ?? 1,
    },
  };
};

export const updatePointSettings = async (settings: Partial<PointSettings>) => {
  if (settings.pointValue) {
    await query(
      `
        insert into platform_settings (key, value, updated_at)
        values ('point_value', $1::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `,
      [JSON.stringify(settings.pointValue)],
    );
  }

  if (settings.candidateRevealCost) {
    await query(
      `
        insert into platform_settings (key, value, updated_at)
        values ('candidate_reveal_cost', $1::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `,
      [JSON.stringify(settings.candidateRevealCost)],
    );
  }

  return getPointSettings();
};

export const addWalletPoints = async (input: {
  companyId: string;
  points: number;
  amountPaid?: number;
  currency: string;
  paymentReference?: string;
  userId?: string;
  note?: string;
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const wallet = await client.query<WalletRow>(
      `
        insert into employer_point_wallets (company_id, balance_points, updated_at)
        values ($1, $2, now())
        on conflict (company_id) do update set
          balance_points = employer_point_wallets.balance_points + excluded.balance_points,
          updated_at = now()
        returning *
      `,
      [input.companyId, input.points],
    );

    const transaction = await client.query<PointTransactionRow>(
      `
        insert into point_transactions (
          company_id,
          transaction_type,
          points,
          balance_after,
          amount_paid,
          currency,
          payment_reference,
          created_by_user_id,
          note
        )
        values ($1, 'topup', $2, $3, $4, $5, $6, $7, $8)
        returning *
      `,
      [
        input.companyId,
        input.points,
        wallet.rows[0]?.balance_points ?? input.points,
        input.amountPaid ?? null,
        input.currency.toUpperCase(),
        input.paymentReference ?? null,
        input.userId ?? null,
        input.note ?? null,
      ],
    );

    await client.query('commit');

    return {
      wallet: wallet.rows[0],
      transaction: transaction.rows[0],
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const spendWalletPoints = async (input: {
  companyId: string;
  points: number;
  profileId: string;
  userId?: string;
  note?: string;
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const wallet = await client.query<WalletRow>(
      `
        select *
        from employer_point_wallets
        where company_id = $1
        for update
      `,
      [input.companyId],
    );

    const currentBalance = wallet.rows[0]?.balance_points ?? 0;

    if (currentBalance < input.points) {
      await client.query('rollback');
      return null;
    }

    const updatedWallet = await client.query<WalletRow>(
      `
        update employer_point_wallets
        set balance_points = balance_points - $2, updated_at = now()
        where company_id = $1
        returning *
      `,
      [input.companyId, input.points],
    );

    const transaction = await client.query<PointTransactionRow>(
      `
        insert into point_transactions (
          company_id,
          transaction_type,
          points,
          balance_after,
          related_profile_id,
          created_by_user_id,
          note
        )
        values ($1, 'spend', $2, $3, $4, $5, $6)
        returning *
      `,
      [
        input.companyId,
        input.points,
        updatedWallet.rows[0]?.balance_points ?? 0,
        input.profileId,
        input.userId ?? null,
        input.note ?? null,
      ],
    );

    await client.query('commit');

    return {
      wallet: updatedWallet.rows[0],
      transaction: transaction.rows[0],
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
