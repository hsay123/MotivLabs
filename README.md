# MotivLabs (PhysicalData)

A two-app monorepo for physical-world (robotics/media) annotation:

- **`/` (root)** — the Next.js product: marketing pages, the Privy login flow, and the
  role workspaces (`buyer`, `contributor`, `reviewer`, `admin`). Product screens fetch
  through a token-bound client (`src/lib/api/platform.ts` / `live.ts`).
- **`/backend`** — the API-only Next.js app: Privy token verification, role guards,
  projects/assets/tasks/jobs, reviews, appeals, receipts, and accepted-only exports.
  It talks to Postgres/Storage with the service-role key.

Served over **HTTPS on `localhost:3000`** in development (external-wallet SIWE requires
it); the backend listens on `:3010`. Operational detail lives in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Getting started

Prerequisites: Node, and a filled-in `backend/.env.local` + root `.env.local`
(see the `.env.example` files). Migrations are applied to the Supabase project.

```bash
# terminal 1 — backend
cd backend && PORT=3010 npm run dev

# terminal 2 — frontend (generates a local cert on first run)
npm run dev            # https://localhost:3000
```

The first Privy login creates a `contributor`. Promote accounts with
`backend/scripts/set-role.ts` or the admin UI (`/workspace/admin`).

## Environment

Copy the examples — never commit `.env.local`:

- root `.env.example` → `.env.local` (public: `NEXT_PUBLIC_API_BASE_URL`,
  `PLATFORM_API_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`).
- `backend/.env.example` → `backend/.env.local` (Supabase service role, Privy app
  secret, CORS origin, tuning, optional settlement). `DEV_AUTH_BYPASS` must be
  `false` for any run that counts as evidence.

## Checks

```bash
# Backend
cd backend && npm run typecheck && npm run lint && npm test && npm run build
# Frontend
npx tsc --noEmit && npm run lint && npm test && npm run build
# E2E (real stack, Playwright)
npx playwright test e2e/s1-auth-roles.spec.ts e2e/s2-buyer-job.spec.ts \
  e2e/s3-contributor-claim.spec.ts e2e/s4-reviewer-lifecycle.spec.ts \
  e2e/s5-receipts-export.spec.ts e2e/s6-lifecycle-admin.spec.ts
```

## Security posture

- Browser only ever holds the Privy access token + the public Privy app id.
- API authorization is server-side (`requireRole`); `DEV_AUTH_BYPASS` is refused in
  production.
- Postgres RLS is enabled and `anon`/`authenticated` hold **no** table privileges;
  `service_role` is used server-side only. See `backend/supabase/migrations/006_security_hardening.sql`.
- Settlement is **mock** until the escrow contract is funded and verified; the UI
  labels it as such. See [`docs/BLOCKED.md`](docs/BLOCKED.md).
