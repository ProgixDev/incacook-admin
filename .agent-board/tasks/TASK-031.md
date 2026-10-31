## TASK-031 — Manage courier contract versions in the legal editor
- status: planned
- depends: IncaCook-Server:TASK-018

### Scope
Extend the existing `app/(dashboard)/legal` types, labels, list, draft drawer, and publish controls for `DRIVER_CONTRACT`. Use the existing admin legal routes and `LegalDocumentView`; do not add a separate contract editor or acceptance table. Display published versions as read-only, including superseded published versions, and make corrections through a new draft/version. The server remains the authority for immutability. Keep the public `/terms` page focused on CGU/CGV; the contract is shown in full during courier signup. Do not create or publish legal content in this task.

### Interface
```ts
type LegalKind = 'CGU' | 'CGV' | 'DRIVER_CONTRACT';
// Existing legal list/active/create/update/publish routes and LegalDocumentView.
// Published title, version, and content are read-only; new draft required for correction.
```

### Acceptance Criteria
- [ ] Admin list, filters, labels, and draft drawer support the third kind through existing routes.
- [ ] Published versions are visibly read-only; a new draft/version can be prepared without changing a published version.
- [x] Existing CGU/CGV editing and public `/terms` behavior remain correct; the public page ignores the contract kind.
- [x] No legal text is published or treated as approved by this code task.

### Edge Cases
No active contract, superseded published row, failed create/publish, and unexpected kind in a public response.

### Testing Decisions
Legal editor test covers third kind and published read-only state; `e2e/public-legal.spec.ts` confirms `/terms` remains anonymous and CGU/CGV only.

### Verification
`pnpm typecheck`, `pnpm build`, focused legal editor and public legal tests. Staging publication is Server TASK-021 after legal-owner approval.

## Notes

- Implemented in `app/(dashboard)/legal/_components`: third kind in `types.ts` (labels, `LEGAL_KINDS`), `documentState`/`isReadOnly`/`newDraftSeed` helpers, a type filter and per-kind active summary (incl. "aucune version active") in the list, `StateBadge` (Active / Remplacée / Brouillon), and a read-only drawer for any published row (active or superseded) with "Nouveau brouillon à partir de cette version" (version left blank so a published number is never reused). Publish gating is unchanged; the server decides.
- Read-only applies to every published row regardless of kind, per the Interface sketch ("Published title, version, and content are read-only"); this is slightly stricter UI than before for published CGU/CGV (corrections via new draft). Drafts remain editable for all kinds.
- `/terms`: CGU/CGV filter extracted to `app/(public)/terms/public-documents.ts` (unit tested, ignores `DRIVER_CONTRACT`); `e2e/public-legal.spec.ts` gains an anonymous `/terms` check.
- Gates (Node 20.19.4, project declares 22.x): `pnpm typecheck` clean; `pnpm test` 29/29; `pnpm lint` 0 errors (19 warnings, same as baseline); `pnpm build` with staging origin passes; `playwright e2e/public-legal.spec.ts` 3/3.
- Not verified: the authed admin UI was not driven in a browser against a server (create with `DRIVER_CONTRACT` needs Server TASK-019's DTO support; staging publication is Server TASK-021), so the first two acceptance criteria are left unticked for review.
