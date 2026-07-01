# Database Roadmap

We will design the database before implementing API behavior. The goal is to keep
the MVP focused while leaving room for scale.

## Phase 1: Identity And Accounts

- `app_users`: local profile for Neon Auth users.
- `user_roles`: jobseeker, employer, admin.
- `employer_companies`: hiring account for an individual or business.
- `employer_members`: users attached to employer companies.

The employer profile should stay lightweight. A hirer may be one person looking for
a secretary, or a small hotel looking for waiters and housekeepers.

## Phase 2: Candidate Marketplace

- `jobseeker_profiles`: public worker profile.
- `profile_photos`: candidate images.
- `work_experiences`: past roles and employers.
- `skills`: reusable skill catalog.
- `jobseeker_skills`: candidate-to-skill join table.
- `role_categories`: waiter, receptionist, housekeeper, janitor, secretary, etc.
- `jobseeker_roles`: candidate-to-role join table.
- `languages`: reusable language catalog.
- `jobseeker_languages`: candidate-to-language join table.
- `certifications`: documents, training certificates, and licenses.
- `availability`: immediate, date-based, shift preferences, work type.

## Phase 3: Employer Hiring Workflow

- `saved_candidates`: employer shortlists.
- `candidate_contact_unlocks`: tracks paid/allowed contact access.
- `candidate_views`: profile view audit and analytics.
- `interview_invites`: employer interview requests.
- `employer_notes`: private employer notes on candidates.

## Phase 4: Subscription And Access Control

- `subscription_plans`: plan catalog.
- `employer_subscriptions`: current subscription status.
- `subscription_entitlements`: limits like contact unlocks and team seats.
- `usage_counters`: monthly usage tracking.
- `billing_events`: payment provider webhooks/events later.

## Phase 5: Trust, Safety, And Admin

- `verification_checks`: phone, email, ID, certificate, reference checks.
- `reports`: user/profile abuse reports.
- `moderation_actions`: admin actions.
- `audit_events`: security and business-critical events.

## Search Strategy

Start with PostgreSQL:

- indexed role/category filters
- indexed location fields
- indexed availability/status fields
- full-text search on names, bio, skills, and experience
- materialized candidate search view later if needed

Only add a dedicated search engine after real search behavior proves PostgreSQL is not enough.
