# BLOCKED — things only a human can provide

This file lists the exact things that stop work, with the command or value needed to unblock.

---

## B1 — Database schema — ✅ RESOLVED (2026-10-12, via the Supabase MCP server)

The 14-table schema was applied to `sfebambrdcfqrdmetflw.supabase.co` from the repo migrations
(`backend/supabase/migrations/001…005`, same content as `backend/supabase/all_migrations.sql`) through the
authenticated Supabase MCP server — `apply_migration` per file, in order — then `notify pgrst, 'reload schema';`.

Verification (all green):

| Check | Result |
| --- | --- |
| `list_migrations` | `001_initial_schema` … `005_appeals_indexes` recorded |
| `information_schema` | 14 public tables, 8 enum types, 14/14 tables RLS-enabled |
| `schema_versions` | seeded, 2 rows (`image-boxes-v1`, `action-segments-v1`) |
| `scripts/infra-check.mjs` | **INFRA READY** |

**No GRANTs were added.** The Data API (anon/authenticated) still sees nothing — RLS is enabled with no
policies on every table, per the service-role-only design. The backend talks to the database with the
service-role key (bypasses RLS), so the app needs no extra grants.

To re-apply on another project later: Supabase SQL editor → paste `backend/supabase/all_migrations.sql`
→ Run, then `cd backend && npm run seed`.

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

`https://localhost:3000` must be listed under the Privy app's allowed origins, or the browser SDK login is
rejected. (Dashboard setting — cannot be changed from here.) The frontend runs on :3000 over **HTTPS**
(Sign-In with Ethereum requires it — see B7), matching the origin to allow-list.

---

## B5 (OPTIONAL / Tier 2) — no funded testnet key

`backend/.env.local` has `JOB_ESCROW_ADDRESS` and `MONAD_RPC_URL` names but no
`DEPLOYER_PRIVATE_KEY` / `SETTLEMENT_SIGNER_PRIVATE_KEY`. Real on-chain settlement cannot be demonstrated
until a testnet-only key is funded with testnet MON. Foundry is installed, so contracts + local anvil tests
are possible without it; the actual Monad deploy is left as exact commands in `docs/CHAIN-TODO.md` if reached.

---

## B6 — frontend env — ✅ RESOLVED

Frontend `.env.local` now holds the public app id and the same-origin API path:
```
NEXT_PUBLIC_API_BASE_URL=/platform        # browser → same-origin HTTPS proxy (next.config.ts)
PLATFORM_API_URL=http://localhost:3010    # server-side rewrite target (not public)
NEXT_PUBLIC_PRIVY_APP_ID=cmv2vvueq01hu0gjju69ht0wf   (public identifier)
```
`@privy-io/react-auth` is installed and `PrivyProvider` wraps the app (email + wallet, embedded wallet for
users without one, Monad testnet default chain). Backend `FRONTEND_ORIGIN` is `https://localhost:3000`.

Port note: an unrelated container owns :3001, so the backend runs on :3010 and the frontend on :3000.

## B7 — wallet origin vs. `http://localhost` — ✅ FIXED

Brave Wallet rejected wallet login on `http://localhost:3000` because Privy's SIWE `domain` is scheme-less
and ERC-4361 defaults it to `https`, so the origin appeared to differ. Fixed by serving dev over HTTPS:
`npm run dev` now uses `next dev --experimental-https` with a cert generated into `certificates/`
(gitignored) by `scripts/ensure-dev-cert.mjs`; the API is proxied same-origin under `/platform`.
Verified by `scripts/verify-wallet-siwe.mjs`. Re-run `sudo mkcert -install` once to remove the browser's
self-signed-certificate warning.
