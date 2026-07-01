do $$
begin
  create type employer_account_type as enum ('individual', 'business');
exception when duplicate_object then null;
end $$;

alter table employer_companies
  add column if not exists account_type employer_account_type not null default 'business',
  add column if not exists contact_name text,
  add column if not exists description text,
  add column if not exists hiring_context text;

comment on table employer_companies is 'Hiring account for either an individual employer or a business.';
comment on column employer_companies.name is 'Display name. For individuals this can be the person name; for businesses it can be the hotel, restaurant, or company name.';
comment on column employer_companies.account_type is 'individual for a person hiring directly, business for hotels, restaurants, offices, agencies, and other organizations.';
comment on column employer_companies.hiring_context is 'Short description of what this employer usually hires for or currently needs.';

create index if not exists idx_employer_companies_account_type on employer_companies(account_type);
create index if not exists idx_employer_companies_location on employer_companies(country, city, area);
