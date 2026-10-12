# Runbook — PhysicalData (frontend + real backend)

## Ports
- Backend (API-only Next.js): **3010** (the unrelated `trapnet-dashboard` container owns :3001)
- Frontend (Next.js): **3000**
- Development is served over **HTTPS** on `localhost`. Sign-In with Ethereum's `domain` field is
  scheme-less and ERC-4361 defaults a missing scheme to `https`; Brave Wallet enforces that, so an
  `http://localhost` origin makes external-wallet login fail with a domain-mismatch warning.
- `FRONTEND_ORIGIN=https://localhost:3000` (backend CORS allow-list)
- The browser reaches the API same-origin at `/platform`; `next.config.ts` proxies that to
  `PLATFORM_API_URL` (`http://localhost:3010`). This keeps a single HTTPS origin (no mixed content).

## 1. Prerequisites (one-time)
1. **Apply the database migrations.** They are not applied yet (see `docs/BLOCKED.md`).
   One-shot bundle: `backend/supabase/all_migrations.sql`.
   - Supabase SQL editor: paste and run the whole file, **or**
   - `cd backend && psql "$DATABASE_URL" -f supabase/all_migrations.sql`.
2. **Create a private Storage bucket named `media`** (Supabase → Storage → New bucket, public off).
3. **Privy dashboard:** add `https://localhost:3000` to allowed origins; enable email login.
5. **Trust the dev certificate (optional, removes the browser warning):** the `dev` script generates
   `certificates/localhost*.pem` (gitignored). Run `mkcert -install` once with sudo to trust the local
   CA; otherwise accept the self-signed certificate warning once in the browser.
4. Seed optional sample rows: `cd backend && npm run seed`.

## 2. Environment (variable names only — never commit values)
`backend/.env.local`:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET        # default: media
FRONTEND_ORIGIN                # https://localhost:3000
PRIVY_APP_ID
PRIVY_APP_SECRET
PRIVY_VERIFICATION_KEY         # optional; SPKI PEM from the Privy dashboard (local verification)
DEV_AUTH_BYPASS                # must be false for any run that counts as evidence
LEASE_MINUTES
AI_CONFIDENCE_THRESHOLD
GOLD_IOU_THRESHOLD
GOLD_SEGMENT_MS_TOLERANCE
FAST_SUBMIT_THRESHOLD_SECONDS
JOB_ESCROW_ADDRESS             # optional (real settlement)
MONAD_RPC_URL                  # optional
```
Root `.env.local` (frontend, public only — see `.env.example`):
```
NEXT_PUBLIC_API_BASE_URL=/platform       # same-origin proxy path (see next.config.ts)
PLATFORM_API_URL=http://localhost:3010   # server-side target of the /platform rewrite (not public)
NEXT_PUBLIC_PRIVY_APP_ID=                # same public app id as the backend
```

## 3. Start
```bash
# Terminal 1 — backend
cd backend && PORT=3010 npm run dev
curl -s http://localhost:3010/api/health

# Terminal 2 — frontend
cd .. && npm run dev                        # https://localhost:3000 (generates a local cert on first run)
```

## 4. Roles
- First Privy login creates a **contributor**.
- Promote each real account after its first login:
  ```bash
  cd backend
  npx tsx scripts/set-role.ts you+buyer@example.com buyer
  npx tsx scripts/set-role.ts you+reviewer@example.com reviewer
  npx tsx scripts/set-role.ts you+admin@example.com admin
  ```
- Or via API (as an admin): `PATCH /api/admin/users/{id}/role` `{ "role": "buyer" }`.
- Seeded (fixture) users already include one of each role.

## 5. Reset test data
- Re-run the idempotent seed: `cd backend && npm run seed`.
- Full reset: re-run `backend/supabase/all_migrations.sql` against a fresh database
  (the migrations create tables/enums from scratch), then `npm run seed`.

## 6. Tests / checks
```bash
# Backend
cd backend && npm run typecheck && npm run lint && npm test && npm run build
# Frontend
cd .. && npx tsc --noEmit && npx eslint src && npm test && npm run build
```
Test harness scripts (repo root):
```bash
node scripts/infra-check.mjs                # tables / bucket / auth-users readiness
node scripts/verify-login.mjs               # HTTPS origin + secure context + Privy modal opens
node scripts/verify-wallet-siwe.mjs         # SIWE domain/URI consistent with the origin
node scripts/db-assert.mjs counts           # per-table row counts (service role)
node scripts/db-assert.mjs user <email>
node scripts/capture-sessions.mjs buyer     # headed; saves playwright/.auth/buyer.json
```
E2E (Playwright) and the S1–S7 slices are **not yet wired** — see the report.

## 7. What is mock vs real
| Thing | State |
|---|---|
| Privy token verification | **Real** (ES256, issuer/audience/expiry) — unit-tested locally |
| Projects / assets / tasks / job lifecycle / roles / admin | **Real** code, DB-backed |
| Database schema | **Not applied** — must be applied by a human (see BLOCKED) |
| Storage bucket | **Created** — private `media` bucket on `sfebambrdcfqrdmetflw` |
| Settlement | **Mock** while `is_mock=true`; receipts must show "Mock settlement, no onchain transaction" |
| Frontend product screens | Still render the labelled **interface preview**; `src/lib/api/platform.ts` is the real contract but the screens are not yet switched over |
| AI reviewer | Mock reviewer unless an AI key is configured |
