# Backend Architecture

## Product Model

This backend is designed around three primary actors:

- Jobseeker: creates and manages a marketable worker profile.
- Employer: an individual hirer or business that searches candidates and pays for access/contact features.
- Admin: moderates users, profiles, companies, payments, and reports.

## Module Boundaries

- `auth`: Neon Auth integration and request identity.
- `users`: local user metadata that extends Neon Auth users.
- `jobseekers`: worker profile, experience, skills, documents, availability.
- `employers`: simplified hiring profiles for individuals and businesses, team members, candidate viewing, and hiring workflow.
- `search`: candidate discovery and filters.
- `subscriptions`: optional plans and future bundled access.
- `wallet`: employer point balances, top-ups, reveal pricing, and point spending.
- `admin`: moderation, verification, account controls, audit views.
- `files`: signed Cloudinary upload parameters and stored file metadata.
- `notifications`: email, SMS, WhatsApp, and in-app notifications later.
- `audit`: security and product event logging.

## API Versioning

All API routes live under `/api/v1`. This keeps the first backend flexible when mobile
apps, public APIs, or partner integrations arrive later.

## Auth Direction

Neon Auth remains the source of authentication. The backend should trust only verified
tokens from Neon Auth, then map the authenticated subject to local app records:

- role
- profile completion state
- employer company membership
- subscription permissions
- admin privileges

## Database Direction

Use PostgreSQL as the source of truth. Start with normal relational tables, then add
search indexes and materialized views only when real search traffic requires it.

Images should live in Cloudinary only. PostgreSQL stores the resulting URL and optional
storage key in tables such as `profile_photos`; the backend should not persist uploaded
image files on local disk.

Recommended future tooling:

- SQL migrations in `src/db/migrations`
- `pg` for direct queries or a typed query layer
- Postgres full-text search first
- Meilisearch/OpenSearch later if candidate discovery becomes complex

## Monetization Direction

The primary MVP monetization is points:

- a point has a configurable value, defaulting to 100 KES
- revealing a candidate contact spends a configurable number of points, defaulting to 1
- top-ups can be recorded after payment links, M-Pesa, cards, bank transfer, or manual admin confirmation
- subscriptions can still exist later as bundles that grant recurring points or premium features
