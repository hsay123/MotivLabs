# Staging deployment — PhysicalData / MotivLabs

Status: **config prepared, not yet deployed.** The frontend (Vercel), the
backend (Render) and the Monad-testnet contract are all ready to ship; each is
blocked on one credential/secret that must be supplied outside git. No secret
values are written here.

## 1. Topology

| Part | What it is | Host |
| --- | --- | --- |
| **Frontend** | repo root, Next.js app (`src/`) | Vercel, project root = repo root |
| **Backend** | `backend/`, API-only Next.js app | Render web service (Node), `render.yaml` |
| **Database + Storage** | Supabase project `sfebambrdcfqrdmetflw` | managed (shared with dev) |
| **Auth** | Privy app | managed |
| **Settlement** | `contracts/JobEscrow.sol` | Monad testnet (chain 10143) |

The browser talks only to the frontend origin. `next.config.ts` proxies
`/platform/*` to the backend server-side (Pattern A), so there are no
cross-origin browser requests in normal use.

## 2. As-built hosting config

### 2.1 Vercel — frontend (`vercel.json`)

| Setting | Value |
| --- | --- |
| Root Directory | `.` (repo root) |
| Framework | Next.js (auto) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output | Next.js default (`.next`) |
| Node | 22.x |

Environment variables (build-time + runtime):

| Var | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `/platform` |
| `PLATFORM_API_URL` | `https://motivelabs-api.onrender.com` (the Render URL) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | the Privy app id (public) |

Deploy: `vercel link` (once) then `vercel deploy --prod`.

### 2.2 Render — backend (`render.yaml`)

| Setting | Value |
| --- | --- |
| Type / Runtime | Web service / Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/api/health` |
| Region / Plan | `singapore` / `free` (spins down when idle) |
| Auto Deploy | on push to `main` |

Environment variables are declared in `render.yaml`; secrets use
`sync: false` and are entered in the Render dashboard:

| Var | Kind |
| --- | --- |
| `SUPABASE_URL` | value |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** |
| `SUPABASE_STORAGE_BUCKET` | `media` |
| `FRONTEND_ORIGIN` | the Vercel origin (set after the frontend deploys) |
| `PRIVY_APP_ID` | value |
| `PRIVY_APP_SECRET` | **secret** |
| `PRIVY_VERIFICATION_KEY` | SPKI PEM, optional |
| `DEV_AUTH_BYPASS` | `false` |
| `MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `JOB_ESCROW_ADDRESS` | set after the contract deploy |
| `SETTLEMENT_PRIVATE_KEY` | **secret** (the relayer key) |

Deploy paths: Render Dashboard → New → Blueprint (uses `render.yaml`), or the
Render CLI, or the Render MCP `create_web_service` tool.

## 3. Settlements on Monad testnet

Contract: `contracts/JobEscrow.sol` (native MON, relayer-gated, budget-capped,
one payout per task). See `contracts/README.md`.

Deployer / relayer wallet generated locally (key in git-ignored
`contracts/.env` and `backend/.env.local` only):

```
0x8084a4eD8849B7B12E57f9e443ECe05E89838767
```

**Blocker:** this address has no testnet MON. Fund it from the Monad faucet
(https://faucet.monad.xyz — paste the address), then:

```bash
cd contracts
export DEPLOYER_PRIVATE_KEY=$(grep '^DEPLOYER_PRIVATE_KEY=' .env | cut -d= -f2-)
forge script script/Deploy.s.sol:DeployJobEscrow --rpc-url monad_testnet --broadcast
```

Record the printed `JobEscrow: 0x…` address and set it as
`JOB_ESCROW_ADDRESS` on Render (and in `backend/.env.local` for a local real
run). Set `SETTLEMENT_PRIVATE_KEY` to the relayer key on Render.

Real settlement turns on only when `JOB_ESCROW_ADDRESS` + `MONAD_RPC_URL` +
`SETTLEMENT_PRIVATE_KEY` are all set; otherwise the API keeps the mock and
receipts stay `is_mock = true`.

Before the demo, fund the job being shown:

```bash
export JOB_ESCROW_ADDRESS=0x…
export JOB_ID_HASH=$(cast keccak "$JOB_UUID")
export JOB_FUND_WEI=100000000000000000   # 0.1 MON
forge script script/FundJob.s.sol:FundJob --rpc-url monad_testnet --broadcast
```

## 4. Privy + CORS for the staging origin

1. Privy dashboard → allowed origins: add the Vercel origin
   (`https://<project>.vercel.app`). SIWE `domain`/`uri` derive from the
   browser origin, so it must match exactly.
2. Backend `FRONTEND_ORIGIN` → the same Vercel origin (CORS allow-list).
3. If email/OTP is enabled, add the origin to allowed redirect URLs.

## 5. Pre-deploy checklist

1. Migrations 001–006 applied on Supabase (they are); advisors show only
   `rls_enabled_no_policy` (INFO).
2. `media` bucket exists, private, with the 006 limits.
3. Set all env vars above; never put a server secret in a `NEXT_PUBLIC_*` var.
4. Deploy backend, then frontend, then set `FRONTEND_ORIGIN` to the frontend
   origin and redeploy the backend.
5. Do not use a mainnet key anywhere.

## 6. Smoke test (real role accounts)

1. `GET https://<api>.onrender.com/api/health` → `200 {status:"ok"}`.
2. Anonymous API read → **401**; a public receipt route → 200.
3. Buyer login → project → signed upload → asset → job + tasks → publish.
4. Contributor → claim → draft → submit; second claimant → **409**.
5. Reviewer → accept (or revise/reject/appeal); contributor decision → **403**.
6. Settlement: when the escrow is configured and the job funded, accepting a
   task pays the contributor on Monad testnet and the receipt shows
   `is_mock = false` with the real tx hash; otherwise it is labelled mock.
7. Export contains only accepted versions and no contributor identity;
   non-owner → **403**.

## 7. Known limitations

- Shared Supabase project: staging and dev share data. A separate project needs
  migrations 001–006 + the `media` bucket (`backend/supabase/all_migrations.sql`).
- Settlement is not transactional with the database: if the DB write fails
  after a successful on-chain payout, the contract's `AlreadySettled` guard
  prevents a silent re-pay, and the task needs manual reconciliation. Fine for
  a testnet demo; a production build should write a pending receipt first.
- Render free-plan services spin down when idle, so the first request after a
  pause is slow.
