create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type app_role as enum ('jobseeker', 'employer', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type profile_status as enum ('draft', 'pending_review', 'active', 'paused', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected', 'expired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type work_type as enum ('full_time', 'part_time', 'contract', 'casual', 'temporary', 'internship', 'live_in');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type availability_status as enum ('immediate', 'one_week', 'two_weeks', 'date_specific', 'not_available');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type contact_unlock_source as enum ('subscription', 'credit', 'admin_grant');
exception when duplicate_object then null;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  email citext unique,
  display_name text,
  phone text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id uuid not null references app_users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists employer_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  website text,
  phone text,
  email citext,
  country text,
  city text,
  area text,
  verification_status verification_status not null default 'unverified',
  is_active boolean not null default true,
  created_by_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employer_members (
  company_id uuid not null references employer_companies(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists role_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists languages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists jobseeker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(id) on delete cascade,
  public_slug text not null unique,
  headline text,
  bio text,
  status profile_status not null default 'draft',
  verification_status verification_status not null default 'unverified',
  country text,
  city text,
  area text,
  preferred_locations text[] not null default '{}',
  years_experience numeric(4, 1) not null default 0,
  expected_pay_min numeric(12, 2),
  expected_pay_max numeric(12, 2),
  expected_pay_currency char(3) not null default 'KES',
  availability_status availability_status not null default 'immediate',
  available_from date,
  work_types work_type[] not null default '{}',
  show_phone boolean not null default false,
  show_email boolean not null default false,
  last_active_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  url text not null,
  storage_key text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists jobseeker_roles (
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  role_category_id uuid not null references role_categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, role_category_id)
);

create table if not exists jobseeker_skills (
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete restrict,
  years_experience numeric(4, 1),
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create table if not exists jobseeker_languages (
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  language_id uuid not null references languages(id) on delete restrict,
  proficiency text,
  created_at timestamptz not null default now(),
  primary key (profile_id, language_id)
);

create table if not exists work_experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  title text not null,
  employer_name text,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  name text not null,
  issuer text,
  issued_at date,
  expires_at date,
  file_url text,
  verification_status verification_status not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  price_amount numeric(12, 2) not null default 0,
  price_currency char(3) not null default 'KES',
  billing_interval text not null default 'month',
  contact_unlock_limit integer not null default 0,
  team_member_limit integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists employer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references employer_companies(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id) on delete restrict,
  status subscription_status not null default 'trialing',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_candidates (
  company_id uuid not null references employer_companies(id) on delete cascade,
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  saved_by_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

create table if not exists candidate_contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references employer_companies(id) on delete cascade,
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  unlocked_by_user_id uuid references app_users(id) on delete set null,
  source contact_unlock_source not null default 'subscription',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, profile_id)
);

create table if not exists candidate_views (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references employer_companies(id) on delete set null,
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  viewed_by_user_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists interview_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references employer_companies(id) on delete cascade,
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  invited_by_user_id uuid references app_users(id) on delete set null,
  message text,
  proposed_time timestamptz,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employer_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references employer_companies(id) on delete cascade,
  profile_id uuid not null references jobseeker_profiles(id) on delete cascade,
  author_user_id uuid references app_users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_checks (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  check_type text not null,
  status verification_status not null default 'pending',
  reviewed_by_user_id uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references app_users(id) on delete set null,
  subject_type text not null,
  subject_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references app_users(id) on delete set null,
  subject_type text not null,
  subject_id uuid not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id) on delete set null,
  actor_company_id uuid references employer_companies(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_auth_user_id on app_users(auth_user_id);
create index if not exists idx_jobseeker_profiles_status on jobseeker_profiles(status);
create index if not exists idx_jobseeker_profiles_location on jobseeker_profiles(country, city, area);
create index if not exists idx_jobseeker_profiles_availability on jobseeker_profiles(availability_status);
create index if not exists idx_jobseeker_profiles_last_active on jobseeker_profiles(last_active_at desc);
create index if not exists idx_jobseeker_roles_role on jobseeker_roles(role_category_id);
create index if not exists idx_jobseeker_skills_skill on jobseeker_skills(skill_id);
create index if not exists idx_candidate_views_profile_created on candidate_views(profile_id, created_at desc);
create index if not exists idx_audit_events_created on audit_events(created_at desc);

create index if not exists idx_jobseeker_profiles_search on jobseeker_profiles
using gin (to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(bio, '') || ' ' || coalesce(city, '') || ' ' || coalesce(area, '')));

insert into role_categories (name, slug)
values
  ('Waiter', 'waiter'),
  ('Waitress', 'waitress'),
  ('Front Office', 'front-office'),
  ('Receptionist', 'receptionist'),
  ('Secretary', 'secretary'),
  ('Janitor', 'janitor'),
  ('Housekeeper', 'housekeeper'),
  ('Cleaner', 'cleaner'),
  ('Cook', 'cook'),
  ('Chef', 'chef'),
  ('Kitchen Assistant', 'kitchen-assistant'),
  ('Bartender', 'bartender'),
  ('Barista', 'barista'),
  ('Security Guard', 'security-guard'),
  ('Driver', 'driver'),
  ('Event Staff', 'event-staff')
on conflict (slug) do nothing;

insert into subscription_plans (name, slug, price_amount, price_currency, contact_unlock_limit, team_member_limit)
values
  ('Starter', 'starter', 0, 'KES', 0, 1),
  ('Business', 'business', 2999, 'KES', 50, 3),
  ('Agency', 'agency', 9999, 'KES', 250, 10)
on conflict (slug) do nothing;
