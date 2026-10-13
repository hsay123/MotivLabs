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

## B3 — Privy login can now be automated — ✅ FULLY RESOLVED

Privy's email-OTP test credentials stay disabled, so the server cannot mint tokens. But the
external-**wallet** path is fully automatable: `scripts/capture-session-auto.mjs <role>` announces a mock
EIP-6963 wallet whose signatures are produced by a real local secp256k1 key (`viem`) — genuine
signatures, real Privy session, no human in the loop. It saves `playwright/.auth/<role>.json`
(gitignored) and verifies `/api/me` resolves before declaring success.

Each role gets its own wallet (`playwright/.auth/wallet-<role>.key`, gitignored, generated on first
use), so buyer / contributor / reviewer / admin are four distinct real users. Promote each to its role
the first time with `backend/scripts/set-role.ts` (now accepts email, wallet address, or Privy DID):

```
node scripts/capture-session-auto.mjs buyer   # prints the wallet address
(cd backend && npx tsx scripts/set-role.ts 0x… buyer)
```

Re-run the capture for a role right before a browser run; the captured session is a real access token
with a ~1h lifetime and Privy rotates refresh tokens, so a stale file lands on `/login`.

The headed manual flow (`node scripts/capture-sessions.mjs <role>`) still works for a human's own
account if needed. 2026-10-12: all four roles captured automatically; S1 green (5/5), S2 green (2/2).

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

---

## B8 — key custody + contract redeploy (NOT DONE; needs a human)

A settlement private key was exposed in a screenshot and must be treated as **compromised**. The old
contract also used a single address as both owner and relayer
(`0x8084a4eD8849B7B12E57f9e443ECe05E89838767`). Consequences:

- The corrected `JobEscrow` (owner/relayer split, `msg.sender` funder, `closeJob` gate, reentrancy guard)
  is **not deployed**. The old, unmodified contract is still live at
  `0x4A8E371E89cF9989682Ed0bD5cD1cCa457281fE8` (chain 10143).
- Real settlement cannot be demonstrated until **two fresh testnet-only keys** exist and the **owner**
  address is funded.

Exact action needed from a human:

1. Generate a fresh **owner** key and a fresh **relayer** key (testnet only). Share only the public
   addresses — never the keys.
2. Fund the owner address at `https://faucet.monad.xyz`; fund the **relayer** too (it pays gas to
   broadcast `settle`, and the funder of the test job needs testnet MON as well).
3. Deploy with the two public addresses (see `docs/STAGING.md` §4.2).
4. Set the new `JOB_ESCROW_ADDRESS` and the fresh relayer `SETTLEMENT_PRIVATE_KEY` on `zeno-api`, and put
   the old compromised address in `SETTLEMENT_FORBIDDEN_ADDRESS` so the preflight keeps refusing it.

Before enabling anything, run the backend fail-closed preflight (`cd backend && npm run
settlement:preflight`). It passes only when the RPC reports chain 10143, the escrow has code, the
configured signer is an allow-listed relayer that is **not** the owner, and no configured address is on
the forbidden list. Any failing check keeps `MockSettlementService` and `is_mock = true`.

Until then, `JOB_ESCROW_ADDRESS` stays unset and receipts stay `is_mock = true`.

## B9 — Privy allowed origins for the live domains

`https://zeno-web-app.vercel.app` must be added under the Privy app's **Allowed Origins** (and redirect
URLs if email/OTP is enabled) or browser login on staging is rejected. Dashboard-only action; not done
from here. `https://localhost:3000` (B4) is also still required for local development.
