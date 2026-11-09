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

# Retire admin zones and present radius-only dispatch

## Problem
The admin sidebar and `/zones` still offer zone CRUD, and driver views display zones, while server dispatch is radius-only and zone tables will be dropped. Settings already contains a radius schedule editor, so the admin change is a removal and presentation review.

## Solution
First produce a reviewable mockup of the navigation, driver views and Settings radius editor and seek human approval. Only after approval, remove `/zones` and all zone UI/types and adjust the existing radius editor according to the approved mockup. Keep the existing Admin-only GET/PATCH contract.

## Out of scope
Server migration, radius algorithm, Flutter signup, production rollout, changing Admin role policy, or implementing the mockup before approval.

## Grounding
`components/dashboard/sidebar.tsx` links `/zones`; its page and components call zone CRUD through `lib/api`. `app/(dashboard)/drivers` models and renders zone strings from the server list. `app/(dashboard)/settings/page.tsx` already mounts `DispatchRadiusCard`, which uses `useAdminQuery`/`useAdminMutation` for `/admin/settings/dispatch-radius`; `dispatch-radius.ts` validates minutes:seconds and decimal km before the server PATCH. Full Admin role gates the editor. Existing parser tests and Playwright smoke are seams. The server owns `DispatchRadiusSetting`; this repo owns presentation only. The prior TASK-033 plan added the editor and informational zone UI, which this decision supersedes.

## Usage
```tsx
// Full Admin opens Settings, reads schedule and changes one row.
<DispatchRadiusCard /> // GET -> editable rows -> PATCH {steps} -> GET read-back
// Sidebar has no /zones link. Direct /zones navigation has no page.
// Driver list and drawer show KYC, vehicle, online and delivery facts without zones.
```

## Interface sketch
```ts
// Existing wire contract, unchanged.
type DispatchRadiusStep = { afterSeconds: number; radiusMeters: number | null };
type DispatchRadiusSetting = {
  steps: DispatchRadiusStep[]; isDefault: boolean; noDriverTimeoutSeconds: number;
  updatedAt: string | null; updatedById: string | null;
};
// GET /v1/admin/settings/dispatch-radius -> DispatchRadiusSetting
// PATCH <- { steps: DispatchRadiusStep[] } -> DispatchRadiusSetting
// null radius is unlimited and only legal in final step. Parser enforces server
// constraints before PATCH; server read-back owns displayed persisted state.
```
Module map: Settings card owns editing and rendering; the pure parser owns units/rules; `lib/api` owns auth/transport. Sidebar owns navigation. Driver views consume server fields other than zones. No new data module or duplicate schedule state is introduced.

## Design decision
Chosen: remove the zone route/views and retain the current Settings editor, refining its presentation after human mockup approval. Strongest alternative: move the editor to a new Dispatch page. It loses because it duplicates navigation and state for the existing Admin-only Settings contract. Saving twice replaces one setting with the same schedule; a failed or interrupted PATCH is reconciled by GET. Concurrent admins remain last-write-wins with read-back metadata.

## Scope and acceptance criteria
Proposal first, human approval, then build. The proposal task has no dependency on server or Flutter. The build depends on the approved proposal, with `human_needed` as the approval gate. The server task owns removal of zone fields from its admin-driver response.

## Edge cases
Direct `/zones` bookmark, stale server that still emits zone fields, newer server that omits them, non-Admin Settings access, a 403 after page load, default unlimited schedule, concurrent Admin edits.

## Testing decisions
Review mockup at desktop and narrow widths. Existing parser tests cover units and validation; component/Playwright smoke covers Admin visibility, removal of zone navigation, direct route and driver views. No mobile simulator or device work is required.

## Verification
Mockup screenshot and annotated proposal before approval. After approval: `pnpm typecheck`, `pnpm lint`, `pnpm test`, existing Playwright smoke; staging GET/PATCH read-back belongs to IncaCook-Server:TASK-036.

## TASK-038 — Propose admin zone removal and radius editor mockup
- status: planned
- depends:

### Scope
Create a reviewable, non-production mockup in this repo's planning/design artifacts showing: sidebar without Zones; `/zones` removed; driver table and drawer without zone labels; Settings with the existing Admin-only radius schedule editor, four staged rows (0:00 5 km, 3:00 10 km, 6:00 20 km, 9:00 unlimited), default/open state, inline validation/error, save/read-back and disable action. Include desktop and narrow-width screenshots or static frames, plus a short annotation naming changed files and exact copy. Use existing visual language. Do not edit production app code or call staging PATCH. Present the proposal to the human and mark this task `human_needed` until explicit approval; approval then completes the gate for TASK-039.

### Interface
```text
Proposal artifact: docs/mockups/radius-only-admin/PROPOSAL.md
Frames: desktop Settings, narrow Settings, sidebar/drivers before-after,
        default/error state and direct /zones outcome.
Approval record: human decision and approved changes in PROPOSAL.md.
No wire contract or production code changes.
```

### Acceptance Criteria
- [x] Proposal shows all affected views, exact copy and interaction states, including Admin-only access and direct `/zones` outcome.
- [x] Proposal uses the existing schedule wire shape and stage example, with seconds/metres distinguished from display minutes/km.
- [ ] Human explicitly approves or requests revisions. Until approval, task is `human_needed` and TASK-039 does not start.

### Edge Cases
Narrow viewport, empty/default schedule, invalid row, server 400/403, stale driver response with a zone field.

### Testing Decisions
Human visual review of frames and copy. No app build or staging write.

### Verification
Open proposal and frames, record approval in `PROPOSAL.md` and Role Router; no production source change.

## TASK-039 — Build approved radius-only admin UI
- status: planned
- depends: TASK-038

### Scope
Start only after TASK-038's recorded human approval; otherwise set `human_needed` and stop. Implement the approved mockup. Remove sidebar `/zones`, route and zone components/types, and zone column/chips/copy from driver list and drawer; make driver model tolerant of both older server responses with extra `zones` and new responses without it. Keep Settings' existing `DispatchRadiusCard`, parser, Admin-only GET/PATCH, validation, disable confirmation, refetch and audit display; apply only approved presentation changes. Update active admin docs that promise zone management. No server contract or schedule algorithm changes.

### Interface
```ts
// Existing contract preserved:
GET/PATCH /v1/admin/settings/dispatch-radius;
PATCH body: { steps: DispatchRadiusStep[] };
// AdminDriver omits zones; extra JSON keys from an older response are ignored.
// No /zones page, link or CRUD request remains.
```

### Acceptance Criteria
- [ ] No reachable `/zones` UI, sidebar link, zone CRUD request, or zone field in driver views; direct bookmarked route is 404 or redirects to Settings exactly as approved.
- [ ] Radius editor remains Admin-only and saves/reads back the same server schedule; invalid inputs and server errors remain visible.
- [ ] Older and newer admin-driver payloads render without zone UI; unrelated driver facts remain.
- [ ] Active docs describe radius-only dispatch; typecheck, lint, parser tests and Playwright smoke pass.
- [ ] Approved mockup and implemented screenshots match at desktop and narrow widths.

### Edge Cases
Direct bookmark, default unlimited setting, 403, concurrent Admin edits and response with/without `zones`.

### Testing Decisions
Existing parser suite plus mocked card/driver-view tests and Playwright smoke for navigation/role visibility; compare screenshots to approved proposal.

### Verification
`pnpm typecheck`; `pnpm lint`; `pnpm test`; existing Playwright smoke and approved-frame comparison. Do not PATCH staging as part of this build.
