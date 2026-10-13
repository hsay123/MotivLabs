# Staging deployment — Zeno

Status: **app layer deployed and verified on Vercel; real settlement pending a
funded Monad-testnet key.** Frontend and backend are independent Vercel
projects. No secret values are written here.

## 1. Topology (as built)

| Part | What it is | Host |
| --- | --- | --- |
| **Frontend** | repo root, Next.js app (`src/`) | Vercel — `zeno-web` |
| **Backend** | `backend/`, API-only Next.js app | Vercel — `zeno-api` |
| **Database + Storage** | Supabase project `sfebambrdcfqrdmetflw` | managed (shared with dev) |
| **Auth** | Privy app | managed |
| **Settlement** | `contracts/JobEscrow.sol` | Monad testnet (chain 10143). **Old contract live at `0x4A8E371E89cF9989682Ed0bD5cD1cCa457281fE8`; the corrected JobEscrow is NOT deployed yet.** See §4.2 |

URLs:

- Frontend: **https://zeno-web-app.vercel.app**
- Backend / API health: **https://zeno-api.vercel.app/api/health**

The browser talks only to the frontend origin. `next.config.ts` rewrites
`/platform/*` to the backend server-side, so there are no cross-origin browser
requests in normal use. The `/platform` rewrite target is `PLATFORM_API_URL`.

> `render.yaml` is kept as an alternative backend config, but the live backend
> is the Vercel project above.

## 2. Vercel configuration (as built)

Both projects are in the `yashlandge150-gmailcoms-projects` team and deploy from
the repo root / `backend` respectively.

### 2.1 Frontend — `zeno-web`

| Setting | Value |
| --- | --- |
| Root Directory | `.` (repo root) |
| Framework | Next.js |
| Install / Build | `npm ci` / `npm run build` |
| Alias | `zeno-web-app.vercel.app` |
| Ignore | `.vercelignore` excludes secrets, `node_modules`, and unrelated trees |

Environment variables (production):

| Var | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `/platform` |
| `PLATFORM_API_URL` | `https://zeno-api.vercel.app` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | the Privy app id (public) |

### 2.2 Backend — `zeno-api`

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Framework | Next.js |
| Health Check | `/api/health` |
| Alias | `zeno-api.vercel.app` |
| `maxDuration` | `30` seconds on `/api/settlement/accept` |

Environment variables (production; secrets are Vercel-encrypted):

| Var | Kind |
| --- | --- |
| `SUPABASE_URL` | value |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** |
| `SUPABASE_STORAGE_BUCKET` | `media` |
| `FRONTEND_ORIGIN` | `https://zeno-web-app.vercel.app` |
| `PRIVY_APP_ID` | value |
| `PRIVY_APP_SECRET` | **secret** |
| `DEV_AUTH_BYPASS` | `false` |
| `MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `LEASE_MINUTES` / thresholds | defaults |
| `SETTLEMENT_PRIVATE_KEY` | **secret** (set; inert until the escrow address is set) |
| `JOB_ESCROW_ADDRESS` | **point at the OLD contract only until the corrected JobEscrow is deployed** (§4.2). Leave unset to keep settlement honestly mock |
| `OWNER_ADDRESS` / `RELAYER_ADDRESS` (deploy inputs) | public addresses only; the keys live in `contracts/.env` (git-ignored), never in Vercel |

Redeploy: `cd backend && vercel link --project zeno-api && vercel deploy --prod`.

### 2.3 GitHub integration — Root Directory decides which app builds

The GitHub app deploys **both** projects on every push. Which app a project
builds is decided by its **Root Directory** setting, which lives only in the
Vercel project (never in the repo), so it can drift silently:

| Project | Root Directory | Builds |
| --- | --- | --- |
| `zeno-web` | `.` (repo root) | the frontend (`motivelabs@0.1.0`) |
| `zeno-api` | `backend` | the API (`backend@0.1.0`) |

Observed failure (main `38a2afc`): `zeno-api` had its Root Directory **empty**,
so the GitHub build ran the repo-root **frontend** inside the API project. That
project has no `NEXT_PUBLIC_PRIVY_APP_ID`, so static prerender of `/_not-found`
threw from `src/components/providers/Providers.tsx` and the deployment errored.
The app code was fine — the project was pointed at the wrong directory.

Symptom in a failing `zeno-api` build log:

```
Cloning github.com/hsay123/Zeno (Branch: main, Commit: <sha>)
> motivelabs@0.1.0 build                     <-- wrong root (frontend)
Error: NEXT_PUBLIC_PRIVY_APP_ID is not set   (src/components/providers/Providers.tsx)
```

Correct build for the same push:

```
Cloning github.com/hsay123/Zeno (Branch: main, Commit: <sha>)
> backend@0.1.0 build
```

Fix / check: in the `zeno-api` project **Settings → Build & Development**, set
**Root Directory = `backend`**. Then a git-triggered production deployment for
`main` must log `> backend@0.1.0 build` and serve `/api/health` with `200`.

> CLI note: deploy the backend with `cd backend && vercel deploy --prod`. A CLI
> deploy from the repo root fails with *"The specified Root Directory 'backend'
> does not exist"* because the root `.vercelignore` excludes `backend/` from
> the upload.

## 3. Verified so far

| Check | Result |
| --- | --- |
| Backend `GET /api/health` | `200 {"status":"ok",…}` |
| Frontend `/` | `200`, real title, 259 KB |
| Frontend `/platform/api/health` (proxy) | `200` (rewrite works) |
| Anonymous `GET /api/jobs` | `401 UNAUTHORIZED` |
| CORS from `https://zeno-web-app.vercel.app` | `access-control-allow-origin` = the web origin |
| Settlement endpoint `POST /api/settlement/accept` | `401` without auth (admin only) |
| SSO protection | **disabled** on both projects (public) |

## 4. Remaining to finish the demo

### 4.1 Privy allowed origin (required for browser login)

Add **`https://zeno-web-app.vercel.app`** to the Privy app's allowed origins
(and redirect URLs if email/OTP is on). Without it, SIWE/login from the staging
origin fails. This is a dashboard action.

### 4.2 Rotate keys, then deploy the corrected JobEscrow

**The old key is treated as compromised.** A settlement private key was exposed
in a screenshot, and the previously deployed contract used one address as both
owner and relayer (`0x8084a4eD8849B7B12E57f9e443ECe05E89838767`). Do not reuse
or re-fund it.

Required human action — generate **two fresh** testnet-only keys and share only
their public addresses:

1. **Owner key** — contract owner, retains funds authority and `closeJob`.
2. **Relayer key** — backend settlement signer (`SETTLEMENT_PRIVATE_KEY`).

Fund the **owner** address from the faucet (`https://faucet.monad.xyz`), then
deploy with the two public addresses (the corrected contract separates the
identities and derives the funder from `msg.sender`):

```bash
cd contracts
export OWNER_ADDRESS=0x…      # fresh owner public address
export RELAYER_ADDRESS=0x…    # fresh relayer public address (≠ owner)
# contracts/.env holds the owner key as DEPLOYER_PRIVATE_KEY (git-ignored)
forge script script/Deploy.s.sol:DeployJobEscrow --rpc-url monad_testnet --broadcast
```

The corrected contract is **not deployed yet**; until it is, leave
`JOB_ESCROW_ADDRESS` unset so receipts stay `is_mock = true`.

3. Set the new `JOB_ESCROW_ADDRESS` and the fresh `SETTLEMENT_PRIVATE_KEY` on the
   `zeno-api` Vercel project and redeploy. Real settlement turns on only when
   `JOB_ESCROW_ADDRESS` + `MONAD_RPC_URL` + `SETTLEMENT_PRIVATE_KEY` are all
   present; otherwise receipts stay `is_mock = true`.
4. Fund the job being shown (the broadcasting key is recorded as the funder):

   ```bash
   export JOB_ESCROW_ADDRESS=0x…
   export JOB_ID_HASH=$(cast keccak "$JOB_UUID")
   export JOB_FUND_WEI=100000000000000000   # 0.1 MON
   forge script script/FundJob.s.sol:FundJob --rpc-url monad_testnet --broadcast
   ```

## 5. Roles / accounts

Promote real Privy accounts to buyer/reviewer/admin after first login:

```bash
cd backend
npx tsx scripts/set-role.ts you+buyer@example.com buyer
npx tsx scripts/set-role.ts you+reviewer@example.com reviewer
npx tsx scripts/set-role.ts you+admin@example.com admin
```

## 6. Full workflow smoke test (after §4)

1. Buyer login → project → signed upload → asset → job + tasks → publish.
2. Contributor → claim → draft → submit; second claimant → **409**.
3. Reviewer → accept (or revise/reject/appeal); contributor decision → **403**.
4. Admin → `POST /api/settlement/accept`; when escrow is configured and the job
   funded, the contributor is paid on Monad testnet and the receipt shows
   `is_mock = false` with the real tx hash.
5. Export contains only accepted versions and no contributor identity;
   non-owner → **403**.

## 7. Known limitations

- Shared Supabase project: staging and dev share data. A separate project needs
  migrations 001–009 + the `media` bucket (`backend/supabase/all_migrations.sql`).
  (008 onboarding RPC and 009 settlements ledger are applied here.)
- Vercel Authentication was disabled on both production deployments. `maxDuration = 30`
  is set on the settlement route so the receipt wait is not cut off at the 10 s default.
- Settlement is crash-safe now: a `settlements` row (unique per task) is written
  **before** the chain call, the broadcast hash is stored as soon as it is known,
  and the receipt/task flip happen only after verification. A lost response is
  recovered by retrying `POST /api/settlement/accept` or by
  `POST /api/settlement/reconcile` (re-verifies on-chain; never re-pays). See
  `backend/supabase/migrations/009_settlements_ledger.sql` and
  `backend/lib/settlement/service.ts`.
- Real settlement is still off: the corrected `JobEscrow` is not deployed and no
  fresh owner/relayer keys are funded yet (§4.2). Receipts stay `is_mock = true`.
- CVAT is **not integrated**. The supported editor is the built-in workspace
  (image boxes; video timeline with seek, Set start/Set end and debounced
  autosave). The adapter design, mapping and the host/credentials a human must
  provide are in [`docs/CVAT-INTEGRATION.md`](CVAT-INTEGRATION.md). No surface
  claims CVAT support.

## 8. Commit history

This document tracks the running branch, so hashes go stale; read the live
history instead:

```bash
git log --oneline origin/main..HEAD    # work on fix/product-alignment-critical
```

The settlement key/indexing work referenced above lives in
`backend/lib/settlement/` and `contracts/src/JobEscrow.sol`.