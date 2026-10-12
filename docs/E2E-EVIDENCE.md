# E2E Evidence — PhysicalData (real backend, no mocks)

Branch: `wire-backend` · Frontend: <http://localhost:3000> · Backend: <http://localhost:3010>
`DEV_AUTH_BYPASS=false` · Supabase project: `sfebambrdcfqrdmetflw.supabase.co`

Every row below is a command that was actually run and the output that came back. Nothing here is
fabricated. A slice is only marked **GREEN** when a real session drives it end to end.

---

## Pre-flight (Phase 0)

| Check | Command | Result | Status |
| --- | --- | --- | --- |
| Backend health | `curl :3010/api/health` | `{"data":{"status":"ok",…}}` HTTP 200 | ✅ |
| Frontend boots | `curl :3000/login` | HTTP 200, page renders (Privy referenced) | ✅ |
| Auth bypass off | `grep DEV_AUTH_BYPASS backend/.env.local` | `false` | ✅ |
| Privy app credentials | `PrivyClient.getAppSettings()` | app `cmv2vvueq01hu0gjju69ht0wf` ("Metropolis"), emailAuth on, verification key present | ✅ |
| Privy browser wiring | `node scripts/verify-login.mjs` | `/login` loads; Sign-in opens Privy modal iframe `https://auth.privy.io`; 0 console/page errors | ✅ |
| Privy **test credentials** | `PrivyClient.getTestAccessToken()` | `Test credentials not enabled for this app` | ⚠️ browser login required |
| Storage bucket `media` | `GET /storage/v1/bucket` | exists, `public:false` | ✅ |
| DB schema | `GET /rest/v1/users?select=id&limit=1` | **404 `PGRST205`** — table not in schema cache | ❌ BLOCKED |

`scripts/infra-check.mjs` output:

```
FAIL tables        missing: users, projects, assets, jobs, tasks, submissions, reviews, appeals, receipts
PASS bucket        'media' exists (private)
WARN auth users    none (log in via Privy to create the first user)
INFRA NOT READY (1 blocker(s))
```

**Conclusion:** the schema is not visible in `sfebambrdcfqrdmetflw.supabase.co` (nor in the repo's previous
`ntrtlxnbvrjfpegnstsd.supabase.co`). Until `public` exposes the 14 tables, `/api/me` cannot create the first
user row and no slice can run.

---

## S1 — Auth & roles

Status: **BLOCKED on the DB schema.** Privy token verification itself is ready (credentials verified above;
`lib/auth/verifyToken.ts` fetches the app's SPKI verification key via the SDK, so no
`PRIVY_VERIFICATION_KEY` is required). Once the schema is present, the first real login creates the first
`users` row (role `contributor`), after which roles are set with `backend/scripts/set-role.ts`.

## S2 — Buyer project + upload + tasks + publish

Status: NOT STARTED.

## S3 — Contributor claim / label / submit

Status: NOT STARTED.

## S4 — Review + appeal

Status: NOT STARTED.

## S5 — Receipt + export

Status: NOT STARTED. Settlement will be labelled **Mock settlement** unless the chain tier is completed.

## S6 — Lifecycle + admin

Status: NOT STARTED.
