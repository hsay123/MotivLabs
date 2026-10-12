# Staging deployment — PhysicalData / MotivLabs

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
| **Settlement** | `contracts/JobEscrow.sol` | Monad testnet (chain 10143), not yet deployed |

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
| `JOB_ESCROW_ADDRESS` | **not set yet** — set after the contract deploy |

Redeploy: `cd backend && vercel link --project zeno-api && vercel deploy --prod`.

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

### 4.2 Fund the deployer, then deploy the contract

Deployer / relayer wallet (key only in git-ignored `contracts/.env` and
`backend/.env.local`):

```
0x8084a4eD8849B7B12E57f9e443ECe05E89838767   (balance 0 MON)
```

1. Fund it at **https://faucet.monad.xyz**.
2. Deploy:

   ```bash
   cd contracts
   export DEPLOYER_PRIVATE_KEY=$(grep '^DEPLOYER_PRIVATE_KEY=' .env | cut -d= -f2-)
   forge script script/Deploy.s.sol:DeployJobEscrow --rpc-url monad_testnet --broadcast
   ```

3. Set `JOB_ESCROW_ADDRESS` on the `zeno-api` Vercel project and
   redeploy. Real settlement turns on only when `JOB_ESCROW_ADDRESS` +
   `MONAD_RPC_URL` + `SETTLEMENT_PRIVATE_KEY` are all present; otherwise
   receipts stay `is_mock = true`.
4. Fund the job being shown:

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
  migrations 001–006 + the `media` bucket (`backend/supabase/all_migrations.sql`).
- Vercel Authentication was disabled on both production deployments. `maxDuration = 30`
  is set on the settlement route so the receipt wait is not cut off at the 10 s default.
- Settlement is not transactional with the database: if the DB write fails after
  a successful on-chain payout, the contract's `AlreadySettled` guard prevents a
  silent re-pay, and the task needs manual reconciliation. A production build
  should write a pending receipt first.

## 8. Current commit hashes

| Component | Commit |
| --- | --- |
| Contract + tests | `f324f54ea` |
| Settlement integration | `21a1b1871` |
| Deploy configs + runbook | `194a64e62` |
| Vercel deploy refinements | `35c5617` |