# Runbook — PhysicalData (frontend + real backend)

## Ports
- Backend (API-only Next.js): **3001**
- Frontend (Next.js): **3000**
- `FRONTEND_ORIGIN=http://localhost:3000` (backend CORS allow-list)

## 1. Prerequisites (one-time)
1. **Apply the database migrations.** They are not applied yet (see `docs/BLOCKED.md`).
   One-shot bundle: `backend/supabase/all_migrations.sql`.
   - Supabase SQL editor: paste and run the whole file, **or**
   - `cd backend && psql "$DATABASE_URL" -f supabase/all_migrations.sql`.
2. **Create a private Storage bucket named `media`** (Supabase → Storage → New bucket, public off).
3. **Privy dashboard:** add `http://localhost:3000` to allowed origins; enable email login.
4. Seed optional sample rows: `cd backend && npm run seed`.

## 2. Environment (variable names only — never commit values)
`backend/.env.local`:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET        # default: media
FRONTEND_ORIGIN                # http://localhost:3000
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_PRIVY_APP_ID=      # same public app id as the backend
```

## 3. Start
```bash
# Terminal 1 — backend
cd backend && npm run dev -- -p 3001        # or: PORT=3001 npm run dev
curl -s http://localhost:3001/api/health

# Terminal 2 — frontend
cd .. && npm run dev                        # http://localhost:3000
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
cd .. && npx tsc --noEmit && npx eslint src && npm run build
```
Test harness scripts (repo root):
```bash
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
| Storage bucket | **Not created** — must be created |
| Settlement | **Mock** while `is_mock=true`; receipts must show "Mock settlement, no onchain transaction" |
| Frontend product screens | Still render the labelled **interface preview**; `src/lib/api/platform.ts` is the real contract but the screens are not yet switched over |
| AI reviewer | Mock reviewer unless an AI key is configured |
