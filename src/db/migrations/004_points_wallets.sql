do $$
begin
  create type wallet_transaction_type as enum ('topup', 'spend', 'refund', 'adjustment');
exception when duplicate_object then null;
end $$;

create table if not exists platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists employer_point_wallets (
  company_id uuid primary key references employer_companies(id) on delete cascade,
  balance_points integer not null default 0 check (balance_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists point_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references employer_companies(id) on delete cascade,
  transaction_type wallet_transaction_type not null,
  points integer not null check (points > 0),
  balance_after integer not null check (balance_after >= 0),
  amount_paid numeric(12, 2),
  currency char(3) not null default 'KES',
  payment_reference text,
  related_profile_id uuid references jobseeker_profiles(id) on delete set null,
  created_by_user_id uuid references app_users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

alter table candidate_contact_unlocks
  add column if not exists points_spent integer not null default 0,
  add column if not exists point_transaction_id uuid references point_transactions(id) on delete set null;

insert into platform_settings (key, value)
values
  ('point_value', '{"currency": "KES", "amount": 100}'),
  ('candidate_reveal_cost', '{"points": 1}')
on conflict (key) do nothing;

create index if not exists idx_point_transactions_company_created on point_transactions(company_id, created_at desc);
create index if not exists idx_candidate_contact_unlocks_transaction on candidate_contact_unlocks(point_transaction_id);
