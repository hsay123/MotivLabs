# BLOCKED — things only a human can provide

This file lists the exact things that stop work, with the command or value needed to unblock.

---

## B1 (HARD BLOCKER) — Database schema is not applied

**Symptom (verified by calling Supabase REST with the service-role key):**

```
GET {SUPABASE_URL}/rest/v1/users?select=id&limit=1
→ 404  {"code":"PGRST205","message":"Could not find the table 'public.users' in the schema cache"}
```

The migrations in `backend/supabase/migrations/` (001–005) have never been run against this project. Nothing
that touches the database (`/api/me`, `/api/jobs`, seeding, every E2E slice) can work until they are.

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

## B2 (HARD BLOCKER) — Storage bucket `media` does not exist

**Symptom:** `GET {SUPABASE_URL}/storage/v1/bucket/media` → 400 `{"code":"NoSuchBucket"}`.

The backend signs 5-minute media URLs against a private bucket named `media`
(`SUPABASE_STORAGE_BUCKET`, default `media`). Signed-URL and upload flows fail until it exists.

**Unblock:** create a **private** bucket named `media` (Supabase → Storage → New bucket → name `media`,
public = off). Or provide a service-role request that the agent can run — bucket creation is a Storage API
call, not DDL, so once migration B1 is done the agent can also run:

```
POST {SUPABASE_URL}/storage/v1/bucket   {"id":"media","name":"media","public":false}
```

---

## B3 (BLOCKER for automated E2E) — Privy login cannot be automated

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
rejected. (Dashboard setting — cannot be changed from here.)

---

## B5 (OPTIONAL / Tier 2) — no funded testnet key

`backend/.env.local` has `JOB_ESCROW_ADDRESS` and `MONAD_RPC_URL` names but no
`DEPLOYER_PRIVATE_KEY` / `SETTLEMENT_SIGNER_PRIVATE_KEY`. Real on-chain settlement cannot be demonstrated
until a testnet-only key is funded with testnet MON. Foundry is installed, so contracts + local anvil tests
are possible without it; the actual Monad deploy is left as exact commands in `docs/CHAIN-TODO.md` if reached.

---

## B6 — missing frontend env

There is no frontend `.env.local`. The frontend needs (public, non-secret):
```
NEXT_PUBLIC_PRIVY_APP_ID=<same app id as the backend>
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```
The agent can write the backend's `PRIVY_APP_ID` value into the frontend env (it is a public identifier), but
will not print or commit it. `NEXT_PUBLIC_API_BASE_URL` and a backend port of 3001 are set by the agent.
