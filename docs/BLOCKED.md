# BLOCKED — things only a human can provide

This file lists the exact things that stop work, with the command or value needed to unblock.

---

## B1 (HARD BLOCKER) — Database schema is not applied

**Symptom (verified by calling Supabase REST with the service-role key, 2026-10-12):**

```
GET {SUPABASE_URL}/rest/v1/users?select=id&limit=1
→ 404  {"code":"PGRST205","message":"Could not find the table 'public.users' in the schema cache"}
```

Checked on **both** projects:

| Project | `GET /rest/v1/` (OpenAPI) | `users` | Verdict |
| --- | --- | --- | --- |
| `sfebambrdcfqrdmetflw` (current `backend/.env.local`, `media` bucket lives here) | only `/rpc/rls_auto_enable` | 404 `PGRST205` | no tables |
| `ntrtlxnbvrjfpegnstsd` (previous default) | only `/rpc/rls_auto_enable` | 404 `PGRST205` | no tables |

The migrations in `backend/supabase/migrations/` (001–005, bundled as `all_migrations.sql`, 14 `CREATE TABLE`s)
have never been run against either project. Nothing that touches the database (`/api/me`, `/api/jobs`,
seeding, every E2E slice) can work until they are.

**Why I cannot do it:** there is no `DATABASE_URL` in `backend/.env.local`, and the service-role JWT cannot
run DDL over PostgREST (`/pg/query` → 404). Migrations are plain SQL and need a real Postgres connection.

**Unblock — pick ONE:**

Option A — give the agent a connection string (add to `backend/.env.local`, gitignored):
```
DATABASE_URL=postgresql://postgres:<DB-PASSWORD>@db.<project-ref>.supabase.co:5432/postgres
```
(Or the Supavisor pooler string from Supabase → Project Settings → Database → Connection string.)
Then run: `cd backend && psql "$DATABASE_URL" -f supabase/all_migrations.sql`

Option B — apply it yourself in the Supabase SQL editor:
1. Open Supabase → SQL Editor → New query.
2. Paste the entire contents of `backend/supabase/all_migrations.sql` and click **Run**.
   (This file is migrations 001–005 concatenated in order.)
3. Confirm with: `select count(*) from users;` — should succeed (0 rows).

After either option, also run the seed: `cd backend && npm run seed`.

---

## B2 — Storage bucket `media` — ✅ RESOLVED

Created via the Storage API on `sfebambrdcfqrdmetflw`: `POST /storage/v1/bucket {"id":"media","name":"media","public":false}`
→ HTTP 200. Verified private by `scripts/infra-check.mjs`.

---

## B3 (BLOCKER for automated E2E) — Privy login cannot be automated

**Update 2026-10-12:** the Privy app credentials are verified working (`getAppSettings()` OK), but **test
credentials are not enabled** for this app (`getTestAccessToken()` → *Test credentials not enabled*), so the
server cannot mint tokens. A human browser login is required — the user will sign in with four real Privy
accounts and sessions are then captured for automated runs.

There is no `TEST_ACCOUNTS` and no saved `playwright/.auth/*.json`, and Privy email login needs an OTP that a
human must receive. Without one of the following, Phase 4 (S1–S7) cannot authenticate and must be reported as
blocked rather than faked.

**Unblock — pick ONE:**

Option A (best) — Privy dashboard **test accounts**:
- Enable test accounts in the Privy dashboard.
- Create four accounts and add to `backend/.env.test.local` (gitignored):
  ```
  TEST_ACCOUNTS={"buyer":"you+buyer@…","contributor":"you+contrib@…","reviewer":"you+reviewer@…","admin":"you+admin@…"}
  PRIVY_TEST_OTP=<static code shown in the dashboard>
  ```

Option B — capture sessions once, headed:
- Start backend (3001) and frontend (3000).
- `node scripts/capture-sessions.mjs` → log in once per role in the opened browser.
- Saves `playwright/.auth/<role>.json` (gitignored).

## B4 — Privy dashboard allowed origin

`http://localhost:3000` must be listed under the Privy app's allowed origins, or the browser SDK login is
rejected. (Dashboard setting — cannot be changed from here.) The frontend now runs on :3000, matching the
documented origin.

---

## B5 (OPTIONAL / Tier 2) — no funded testnet key

`backend/.env.local` has `JOB_ESCROW_ADDRESS` and `MONAD_RPC_URL` names but no
`DEPLOYER_PRIVATE_KEY` / `SETTLEMENT_SIGNER_PRIVATE_KEY`. Real on-chain settlement cannot be demonstrated
until a testnet-only key is funded with testnet MON. Foundry is installed, so contracts + local anvil tests
are possible without it; the actual Monad deploy is left as exact commands in `docs/CHAIN-TODO.md` if reached.

---

## B6 — frontend env — ✅ RESOLVED

Frontend `.env.local` now holds the public app id and the API base URL:
```
NEXT_PUBLIC_PRIVY_APP_ID=cmv2vvueq01hu0gjju69ht0wf   (public identifier)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3010
```
`@privy-io/react-auth` is installed and `PrivyProvider` wraps the app (email + wallet, embedded wallet for
users without one, Monad testnet default chain). Backend `FRONTEND_ORIGIN` is `http://localhost:3000`.

Port note: an unrelated container owns :3001, so the backend runs on :3010 and the frontend on :3000.
