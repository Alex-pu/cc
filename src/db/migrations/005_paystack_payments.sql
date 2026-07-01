create unique index if not exists idx_point_transactions_payment_reference_unique
  on point_transactions(payment_reference)
  where payment_reference is not null;
