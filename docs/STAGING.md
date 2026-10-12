# Staging plan — PhysicalData

Status: **plan only, nothing deployed.** This records the exact requirements to
stand up a private preview/staging environment plus the credentials still
needed. No secret values are written here.

## 1. Topology

Three moving parts:

| Part | What it is | Sizing |
| --- | --- | --- |
| **Frontend** | repo root, Next.js app (`npm run build` / `npm start`) | 1 web service |
| **Backend** | `backend/`, API-only Next.js app (`npm run build` / `npm start`) | 1 web service, `PORT` env |
| **Supabase** | existing project `sfebambrdcfqrdmetflw` — Postgres + Storage | managed |
| **Privy** | existing app id | managed |

A private preview can run both services on one host (two processes/ports) or
two hosts. Staging should use the **same Supabase project** until a separate
staging project exists, which means staging data is shared with development —
acceptable for a preview, called out in §6.

## 2. Hosting requirements

- Node 20+ (matches the local toolchain), each app `npm ci && npm run build`.
- Both services must be reachable over **HTTPS** (wallet SIWE + secure context).
- The backend needs `typecheck`/`lint`/`test` in CI, not at boot.
- No serverless-specific assumptions; the backend is a single Next server.
- Persistent/reactive features are not used (no Realtime, no queues).

Recommended (Vercel): two projects in the same repo (`/` and `/backend`), each
with the env below; or one container running both. Either is fine.

## 3. Backend environment (names only)

| Var | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **secret**, server-only |
| `SUPABASE_STORAGE_BUCKET` | ✅ | default `media` |
| `FRONTEND_ORIGIN` | ✅ | exact staging frontend origin, e.g. `https://app-staging…` |
| `PRIVY_APP_ID` | ✅ | from Privy dashboard |
| `PRIVY_APP_SECRET` | ✅ | **secret**, server-only |
| `PRIVY_VERIFICATION_KEY` | ➕ | SPKI PEM; when set, tokens verify offline (fewer Privy API calls) |
| `DEV_AUTH_BYPASS` | ✅ | **must be `false`**; production refuses `true` at startup |
| `LEASE_MINUTES`, `AI_CONFIDENCE_THRESHOLD`, `GOLD_IOU_THRESHOLD`, `GOLD_SEGMENT_MS_TOLERANCE`, `FAST_SUBMIT_THRESHOLD_SECONDS` | ➕ | defaults are fine |
| `JOB_ESCROW_ADDRESS`, `MONAD_RPC_URL` | ➕ | leave **unset** to keep mock settlement explicit |

## 4. Frontend environment (names only)

| Var | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | ✅ | same app id as backend; public |
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | `/platform` (same-origin proxy) *or* the backend origin |
| `PLATFORM_API_URL` | ✅ when proxying | server-side rewrite target; default `http://localhost:3010` |

Pattern A (**recommended, no browser CORS**): host the frontend at
`https://app-staging…`, set `NEXT_PUBLIC_API_BASE_URL=/platform` and
`PLATFORM_API_URL=https://api-staging…`. The browser only talks to the frontend
origin; `next.config.ts` proxies `/platform/*` to the backend server-side.

Pattern B: `NEXT_PUBLIC_API_BASE_URL=https://api-staging…`; the browser then
calls the backend directly, so the backend's `FRONTEND_ORIGIN` must equal the
frontend origin and CORS is exercised.

## 5. Domain-specific Privy + CORS

1. **Privy dashboard → allowed origins**: add the staging frontend origin.
   The SIWE `domain`/`uri` derive from the browser origin, so it must match.
2. **Backend `FRONTEND_ORIGIN`**: the staging frontend origin (CORS allow-list).
   Pattern A: this is still set, but the proxy means the browser rarely sends it.
3. **Redirect URLs** (if email/OTP is enabled): add the staging origin.
4. Keep Privy's production app id separate if you want isolated sessions.

## 6. Access / credentials still needed

- [ ] **Hosting account** with permission to create 2 services + set env vars
      (Vercel team, Fly/Render workspace, or a VM). Not yet provided.
- [ ] **Staging domain(s)** if not using the host's default URL.
- [ ] **Privy dashboard access** to add the staging origin and (optionally)
      copy the verification key.
- [x] Supabase project + service-role key (already local in `.gitignored` files).
- [ ] Decision: **shared Supabase project** (fast preview) vs a **separate
      staging project**. A separate project needs migrations 001–006 + a `media`
      bucket; `backend/supabase/all_migrations.sql` is the one-shot bundle.

## 7. Pre-deploy checklist

1. Confirm migration 006 is applied (or run `all_migrations.sql`) on the target DB.
2. Confirm the `media` bucket exists, private, with the 006 limits; run the
   security advisors and expect only `rls_enabled_no_policy` (INFO).
3. Set the env tables above; never reuse dev secrets in the browser.
4. Deploy both services behind HTTPS, **access-controlled** (host deployment
   protection / basic auth) until §8 passes.
5. Do not add a funded key or mainnet config yet.

## 8. Smoke test (real role accounts)

Run, in order, and assert the error edges:

1. Anonymous `GET /api/jobs` → **401**; `/receipts/<id>` public route → 200.
2. Buyer login → create project → signed upload → asset → job with tasks →
   publish (real Supabase rows).
3. Contributor → available tasks → claim → save draft → submit.
   Second contributor claiming the same task → **409**.
4. Reviewer → `accept` (or `revise` → resubmit v2 → reject → appeal → upheld).
   Contributor attempting a review decision → **403**.
5. Receipt is public and labelled mock (`is_mock = true`); export only accepted
   versions and contains no contributor identity. Buyer-only export; a
   non-owner contributor → **403**.
6. Admin: pause/resume/close lifecycle; illegal transition → **409**;
   role PATCH persists; self-demotion → **400**.
7. Confirm the staged DB matches the expected writes (read-only SQL).

## 9. Explicitly out of scope for this change

- No smart-contract work.
- No production cutover; nothing merged automatically.
- No funded testnet key requested.
