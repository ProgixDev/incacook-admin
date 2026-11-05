# Expanding dispatch radius — admin issue #18

## Problem
Admins need to inspect, tune and disable the server's expanding delivery radius without a deploy. The Zones page currently implies that zones govern dispatch, although they are informational. The repo's `.agent-board/tasks/TASK-032.md` already belongs to platform earnings, so this feature uses TASK-033.

## Solution
Add a dispatch-radius settings card backed by the server's Admin-only GET/PATCH contract, with local schedule validation, a one-click confirmed return to the single unlimited step, and server read-back after save. Clarify the purpose of zones on the Zones page.

## Out of Scope
Changing server policy, editing zones, deployment, or changing any remote database. PR targets `staging`; the human performs staging rollout after merge. This file is the requested reviewable plan artifact; existing `.agent-board` tasks and statuses stay untouched.

## Grounding
`app/(dashboard)/settings/page.tsx` mounts `DeliveryFeeCard`, which calls the central `lib/api` client through `useAdminQuery` and `useAdminMutation`, renders `DataTableError`, and refetches after save. `app/(dashboard)/zones/page.tsx` owns the page subtitle; `zone-form-dialog.tsx` owns lat/lng help text. The shared dashboard role gate admits more than full Admin; the platform-earnings page already has a full-Admin visibility pattern. Server issue #72 owns validation, audit metadata and Admin-only permission; the admin app owns presentation and client-side preflight. No glossary or ADR exists in this repo; the approved issue fixes the domain wording.

## Usage
```ts
const current = useAdminQuery<DispatchRadiusSetting>({ path: '/admin/settings/dispatch-radius' });
await save.mutate({ steps: parsedRows }); // PATCH, then refetch server state
await disable.mutate({ steps: [{ afterSeconds: 0, radiusMeters: null }] });
```

## Interface sketch and design decision
```ts
type DispatchRadiusStep = { afterSeconds: number; radiusMeters: number | null };
type DispatchRadiusSetting = {
  steps: DispatchRadiusStep[]; isDefault: boolean; noDriverTimeoutSeconds: number;
  updatedAt: string | null; updatedById: string | null;
};
// GET /v1/admin/settings/dispatch-radius -> DispatchRadiusSetting
// PATCH <- { steps: DispatchRadiusStep[] } -> DispatchRadiusSetting; invalid -> 400
// UI minutes:seconds and decimal km are converted to integer seconds/metres.
```
`DispatchRadiusCard` owns editing and rendering, while a pure parser/validator owns units and rules; `lib/api` keeps auth and transport. A form that persists display strings would leak units into the server contract, so it is rejected. The server is authoritative after every save; repeated disable calls are idempotent and concurrent edits are last-write-wins, shown by refreshed editor metadata.

## TASK-033 — Edit dispatch radius and clarify zones
- status: planned
- depends: IncaCook-Server:TASK-027
- issue: https://github.com/ProgixDev/incacook-admin/issues/18

### Scope
Mount `DispatchRadiusCard` on Settings using the delivery-fee card's query/mutation/error patterns. Show editable rows for delay (minutes:seconds) and radius (decimal km), with “Illimité” only in the last row and add/remove controls for 1–8 rows. Validate first delay 0, strictly increasing integer seconds and radii, finite radius <=200 km, unlimited only in the final row, and final delay strictly below `noDriverTimeoutSeconds`; convert km to integer metres before PATCH. Show a server 400 inline. On `isDefault`, show “Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.” Add a confirmed “Désactiver le rayon (répartition ouverte)” action that PATCHes the one unlimited step. Refetch after save/disable; display last update time and editor. Hide the card from non-Admins with the existing full-Admin pattern. On Zones page show “Les zones sont indicatives : elles ne limitent pas les commandes visibles par les livreurs.” Add lat/lng help “Centre de la zone, réservé à un usage futur”.

### Interface
`GET/PATCH /v1/admin/settings/dispatch-radius` use `DispatchRadiusSetting` and `{steps}` above. `afterSeconds` and `radiusMeters` are integers, `null` radius means unlimited. `isDefault` means the row is absent; an explicit unlimited PATCH returns the server's updated setting. `noDriverTimeoutSeconds` is the limit shown in validation help. Keep HTTP errors in `DataTableError` or inline mutation error as appropriate.

### Acceptance Criteria
- [x] GET populates rows; default state shows one unlimited row and the exact open-dispatch banner.
- [x] Valid save persists and re-renders from server read-back; invalid input blocks save with a clear rule-specific message; a server 400 appears inline.
- [x] Disable asks for confirmation and PATCHes `[{afterSeconds:0,radiusMeters:null}]`, then shows the refreshed open schedule.
- [x] Non-Admin sessions cannot reach the card or issue its GET/PATCH; unreachable server and 403 render existing error treatment.
- [x] Zones page displays the informational note and lat/lng help.
- [x] Typecheck, lint, existing Playwright smoke and a pure validator test pass.

### Edge Cases
Two admins edit concurrently (last write wins and refreshed “modifié par”); minutes:seconds parsing; decimal km conversion to integer metres; a 403 after the page loaded; absent/default setting.

### Testing Decisions
Pure parser/validator tests at boundary values and a mocked card test for GET, PATCH, 400 and disable; reuse the existing Playwright smoke for role visibility. Do not require live staging access for local checks.

### Verification
`pnpm typecheck`, `pnpm lint`, `pnpm test`, existing Playwright smoke. After human staging rollout of server TASK-027, a human can read back default/configured states and capture screenshots. PR to `staging`; no deployment.
