# Branch model

Three long-lived-branch rules, the same in every IncaCook repo (server, app, admin).

| Branch | Meaning | Who moves it |
|---|---|---|
| `main` | **Production.** Only released, signed-off code. | A release PR from `staging` (never direct commits). |
| `staging` | **Integration / staging environment.** Everything that is being tested lands here first. | Feature and fix PRs. |
| `feature/*`, `fix/*`, `chore/*`, `docs/*`, `task/*` | Short-lived work branches, cut from `staging`. | Their author. |

## Day to day

1. Branch from `origin/staging`.
2. Open the PR **into `staging`**. CI runs on PRs to `staging` and `main`.
3. After merge, deploy to the staging environment from `staging`
   (server: the `Deploy` workflow with `ref: staging`; admin: the Vercel staging
   deployment; app: staging build from `staging`).
4. Run database migrations on staging explicitly (`prisma migrate deploy` with
   both `DATABASE_URL` and `DIRECT_URL` set to the staging database; the deploy
   workflow does not migrate).

## Releasing to production

1. Staging is verified (gates, QA, client sign-off).
2. Open a PR **`staging` → `main`** and merge it with a merge commit.
3. Deploy production from `main` using the production runbook. Production
   migrations are applied separately, only with explicit approval.

## Hotfixes

Branch from `main`, PR into `main`, release, then merge `main` back into
`staging` so the two do not drift.

## Notes

- This replaces the old `dev` branch, which was renamed to `staging` on 2026-11-03.
  Old PR links keep working (GitHub retargets them).
- On 2026-11-03 `main` and `staging` were identical in the server and admin repos.
  In the app repo `staging` was 89 commits ahead of `main` (unreleased work).
