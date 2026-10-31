# Deployment

How to deploy the IncaCook admin panel. It's a Next.js 16 app that runs
**entirely client-side against the IncaCook backend** — most pages build
static (`○ (Static)`) and fetch data in the browser from the configured API.
Hosting serves a Next build; the API origin is embedded at build time.

> **Why manual/CLI deploy?** The GitHub repo (`Feint517/incacook-admin`) isn't
> owned by the deployer, so Vercel's *git integration* (auto-deploy on push)
> can't be enabled yet. A **CLI deploy uploads the local folder** and builds it
> on the host — it never touches GitHub, so repo ownership is irrelevant. Once
> repo access is sorted (collaborator invite, or fork), switch to git
> auto-deploy — see the last section.

## The one thing that matters: the API base URL

The app reads a single build-time variable:

```
NEXT_PUBLIC_API_BASE_URL=https://api.incacook.com
```

`NEXT_PUBLIC_*` is **inlined into the build**, not read at runtime. So it must
be set **before the build**, and **changing it requires a redeploy** (not just
an env edit). The app appends `/v1` itself — set the host origin only, no
trailing slash. CORS on the backend reflects any origin, so any deploy domain
works with no backend change.

## Prerequisites

- Node 22.x, pnpm 10 (pinned in `package.json` → `engines` + `packageManager`).
- A clean build locally: `pnpm install && pnpm typecheck && pnpm build`.

---

## Option A — Vercel CLI (current setup)

The project is already linked (`.vercel/project.json` → project `incacook-admin`,
team `inca-cook`). `.vercel/` and `.env.local` are git-ignored — never commit
them (they hold the link + the OIDC token).

**First-time only:**

```bash
npm i -g vercel        # or: pnpm add -g vercel
vercel login           # interactive — your Vercel account
vercel link            # links this folder to the incacook-admin project (already done)
```

**Set the env var** (once per environment; skip if already set in the dashboard).
The build fails fast when it is missing, so every environment that builds
(including PR previews) needs it. Previews target staging, production targets
the production API:

```bash
echo "https://api-staging.incacook.com" \
  | vercel env add NEXT_PUBLIC_API_BASE_URL preview
echo "https://api.incacook.com" \
  | vercel env add NEXT_PUBLIC_API_BASE_URL production
```

**Deploy:**

```bash
vercel            # deploy a preview build → prints a preview URL
vercel --prod     # promote/deploy to production
```

Vercel builds remotely (uploads source, runs `pnpm build`), then serves the
static output from its global CDN. To build locally and upload the prebuilt
output instead: `vercel build --prod && vercel deploy --prebuilt --prod`.

---

## Option B — Railway CLI (alternative; same platform as the backend)

No GitHub needed either; Nixpacks auto-detects Next.js (no Dockerfile). Runs
`next start` on a small server rather than a CDN — fine for an admin panel.

```bash
cd incacook-admin
railway login                     # if not already: `railway whoami` to check
railway add                       # create an "incacook-admin" service in the project
railway variables set NEXT_PUBLIC_API_BASE_URL=https://api.incacook.com
railway up                        # build (pnpm install → pnpm build) + start (next start, binds $PORT)
railway domain                    # generate a public URL
```

---

## Verify a deploy

1. Open the deploy URL → it redirects to `/login` (the auth gate).
2. Log in with an **Admin/Moderator** account (the role gate rejects others).
3. Confirm a data page loads (e.g. **Utilisateurs**) — real rows from the API
   means the env var + CORS are correct.

Optional automated check (drives the live app in a browser):

```bash
# creds live in .env.local (E2E_*); the suite covers login + all 15 pages
pnpm e2e
```

## Build for staging

Build a separate artifact against the staging API origin. Do not include
`/v1`; the client adds it:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api-staging.incacook.com pnpm build
```

For authenticated Playwright verification, set `E2E_API_BASE_URL` to that same
origin (`https://api-staging.incacook.com`) and use the dedicated staging-only
admin test login. Its email and password live only in the `incacook-staging`
Secret Manager (`incacook-staging-admin-test-email` /
`incacook-staging-admin-test-password`); never use a production identity, and
never paste the password in chat, files, or logs:

```bash
S() { gcloud secrets versions access latest --secret "incacook-staging-$1" --project incacook-staging | tr -d '\r\n'; }
E2E_API_BASE_URL=https://api-staging.incacook.com \
NEXT_PUBLIC_API_BASE_URL=https://api-staging.incacook.com \
E2E_ADMIN_EMAIL=$(S admin-test-email) E2E_ADMIN_PASSWORD=$(S admin-test-password) pnpm e2e
```

The staging API's `ALLOWED_ORIGINS` does not list the Playwright dev origin, so
`e2e/fixtures.ts` forwards browser calls to the live API from Node (no mocking).
The deployed admin origin must be added to the API's `ALLOWED_ORIGINS` before
real browsers can use it. The build command clears the previous `.next` output,
rejects non-HTTPS and localhost origins or path components, and verifies the
selected API origin is present in the client bundle with no Railway hostname
present.

## Rollback

- **Vercel:** dashboard → project → Deployments → pick a previous build →
  *Promote to Production* (instant), or `vercel rollback <url>`.
- **Railway:** service → Deployments → redeploy a previous one.

## Later: switch to git auto-deploy

Once the deployer has repo access (added as a collaborator on
`Feint517/incacook-admin`, or the app is forked to an account you control):

1. Vercel dashboard → the `incacook-admin` project → **Settings → Git** →
   connect the repository.
2. Set the **Production Branch** to `main` (it tracks the finished app; `dev`
   is the integration branch).
3. Keep `NEXT_PUBLIC_API_BASE_URL` set for Production + Preview.

After that, every push to `main` auto-deploys and every PR gets a preview URL —
no more manual `vercel --prod`.
