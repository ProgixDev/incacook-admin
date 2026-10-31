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
- [ ] Existing CGU/CGV editing and public `/terms` behavior remain correct; the public page ignores the contract kind.
- [ ] No legal text is published or treated as approved by this code task.

### Edge Cases
No active contract, superseded published row, failed create/publish, and unexpected kind in a public response.

### Testing Decisions
Legal editor test covers third kind and published read-only state; `e2e/public-legal.spec.ts` confirms `/terms` remains anonymous and CGU/CGV only.

### Verification
`pnpm typecheck`, `pnpm build`, focused legal editor and public legal tests. Staging publication is Server TASK-021 after legal-owner approval.
