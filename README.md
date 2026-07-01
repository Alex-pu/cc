# Hospitality Talent Backend

Backend for a hospitality and service-worker talent marketplace.

The first product shape is a searchable candidate marketplace:

- Jobseekers create profiles with roles, skills, photos, experience, availability, and location.
- Employers top up points to search, shortlist, unlock contact details, and invite candidates.
- Admins moderate profiles, employers, verification, and abuse reports.

## Stack

- Node.js 20+
- TypeScript
- Fastify
- PostgreSQL on Neon
- Neon Auth

## Local Setup

1. Copy `.env.example` to `.env`.
2. Add your real `DATABASE_URL` and `NEON_AUTH_URL` values to `.env`.
3. Install dependencies with `npm install`.
4. Run the dev server with `npm run dev`.

## Neon Auth Setup

The backend expects frontend requests to send a Neon Auth access token as:

```text
Authorization: Bearer <token>
```

Before deployment, add these auth values to the backend environment:

- `NEON_AUTH_URL`
- `NEON_AUTH_JWKS_URL`
- optional `NEON_AUTH_JWT_ISSUER`
- optional `NEON_AUTH_JWT_AUDIENCE`

Add these hosted auth links to the frontend environment:

- `VITE_NEON_AUTH_SIGN_IN_URL`
- `VITE_NEON_AUTH_SIGN_UP_URL`
- optional `VITE_NEON_AUTH_SIGN_OUT_URL`

After a user signs in, call `POST /api/v1/users/sync` with the bearer token and a role
array such as `["employer"]` or `["jobseeker"]`. The API takes the Neon Auth user id
and email from the verified token, then creates or updates the local marketplace user.

## Project Layout

```text
src/
  app.ts                 Fastify app factory and global plugins
  server.ts              Runtime entrypoint
  config/                Environment and app configuration
  db/                    PostgreSQL connection and future migrations
  modules/               Feature modules and route registration
  plugins/               Fastify plugins
  shared/                Common errors, responses, schemas, and utilities
```

## Next Step

Design the database model before implementing real API behavior. Start with users,
jobseeker profiles, employer companies, roles, skills, subscriptions, saved candidates,
contact unlocks, verification, and audit logs.

## First API Endpoints

These are early foundation endpoints. They will use verified Neon Auth identity later.

- `POST /api/v1/users/sync`: create/update a local app user from a Neon Auth user id.
- `POST /api/v1/employers/hiring-profiles`: create a simplified hiring profile for an individual or business.
- `GET /api/v1/employers/hiring-profiles?userId=...`: list hiring profiles attached to a user.
- `GET /api/v1/jobseekers/lookups`: list roles, skills, and languages for forms.
- `GET /api/v1/jobseekers/me?userId=...`: fetch a user's jobseeker profile.
- `PUT /api/v1/jobseekers/me`: create/update a user's jobseeker profile.
- `PATCH /api/v1/jobseekers/:id/status`: move a profile between draft, review, active, and paused.
- `GET /api/v1/jobseekers/:id`: fetch a full jobseeker profile.
- `GET /api/v1/search/candidates`: search active candidates by text, role, skill, location, availability, work type, and verification.
- `GET /api/v1/subscriptions/plans`: list employer subscription plans.
- `POST /api/v1/subscriptions/grant-trial`: manually grant a trial subscription for development/admin use.
- `GET /api/v1/wallet/settings`: get point pricing and reveal cost.
- `PATCH /api/v1/wallet/settings`: update point pricing and reveal cost.
- `GET /api/v1/wallet/companies/:companyId`: get a hiring profile wallet and transactions.
- `POST /api/v1/wallet/topups`: manually record a point top-up after payment.
- `POST /api/v1/payments/paystack/topups/initialize`: initialize a Paystack wallet top-up.
- `POST /api/v1/payments/paystack/topups/:reference/verify`: verify a Paystack payment and credit points.
- `POST /api/v1/payments/paystack/webhook`: receive Paystack `charge.success` events and credit points automatically.
- `GET /api/v1/employers/hiring-profiles/:companyId/saved-candidates`: list saved candidates.
- `PUT /api/v1/employers/hiring-profiles/:companyId/saved-candidates/:profileId`: save a candidate.
- `DELETE /api/v1/employers/hiring-profiles/:companyId/saved-candidates/:profileId`: remove a saved candidate.
- `GET /api/v1/employers/hiring-profiles/:companyId/candidates/:profileId`: view a candidate as an employer and record the view.
- `POST /api/v1/employers/hiring-profiles/:companyId/candidates/:profileId/unlock-contact`: spend points to unlock candidate contact details.

## Points Model

Candidate contact reveal uses points. The default settings are:

- `1 point = 100 KES`
- `1 candidate reveal = 1 point`

Employers can top up through whatever payment method you choose, then the backend records
the top-up and spends points when a candidate contact is revealed.

## Paystack Payments

Paystack wallet top-ups use this flow:

1. Authenticated employer calls `POST /api/v1/payments/paystack/topups/initialize`
   with `companyId` and `points`.
2. Backend calculates the amount from wallet settings, initializes the Paystack
   transaction, and returns `authorizationUrl`.
3. Employer pays on Paystack.
4. Paystack sends `charge.success` to `/api/v1/payments/paystack/webhook`.
5. Backend verifies the webhook signature and credits wallet points once per Paystack reference.

Set these environment values before enabling live payments:

- `PAYMENTS_ENABLED=true`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CURRENCY=KES`
- `PAYSTACK_CALLBACK_URL`

Add this webhook URL in the Paystack dashboard:

```text
https://YOUR_API_DOMAIN/api/v1/payments/paystack/webhook
```

The employer profile intentionally supports both:

- an individual looking for help, such as a secretary or housekeeper
- a small business, such as a hotel or restaurant hiring service staff
