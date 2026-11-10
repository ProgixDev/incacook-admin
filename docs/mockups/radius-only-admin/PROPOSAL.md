# Radius-only dispatch: admin UI proposal

**Status: approved for implementation (2026-11-10).** This is a static proposal only. It makes no production changes and does not call the staging API.

Open [`index.html`](./index.html) in a browser for the desktop and narrow-width frames. The page contains the proposed Settings editor in the default state, inline validation state, driver list and drawer before/after, and the direct `/zones` outcome.

## Proposed changes

| File | Proposed treatment | Exact copy / behavior |
| --- | --- | --- |
| `components/dashboard/sidebar.tsx` | Remove the “Zones de livraison” item. | No replacement navigation item. |
| `app/(dashboard)/zones/page.tsx` and `app/(dashboard)/zones/**` | Remove the page and its components. | A direct `/zones` visit displays the standard 404 page (“Cette page est introuvable.” / “Retour à l’accueil”). |
| `app/(dashboard)/drivers/page.tsx` | Remove the zones reference from the subtitle. | “Supervision des livreurs : véhicule, KYC, activité” |
| `app/(dashboard)/drivers/_components/drivers-client.tsx` | Remove the “Zones” table column. | Keep all other driver facts and columns. |
| `app/(dashboard)/drivers/_components/driver-drawer.tsx` | Remove “Zones d’opération” card. | Keep vehicle, deliveries, rating, Stripe Connect, activity and registration date. |
| `app/(dashboard)/settings/_components/dispatch-radius-card.tsx` | Keep the existing Admin-only editor and wire contract; use the staged values shown in the frame as the proposed initial schedule. | “Rayon de répartition”; “Élargissement progressif du rayon de recherche des livreurs.”; “Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.” |

The driver model should ignore unknown JSON fields, so an older response that still contains `zones` renders like a newer response without that field. No zones CRUD request should remain reachable.

## Schedule contract and example

The existing contract stays `GET /v1/admin/settings/dispatch-radius` and `PATCH /v1/admin/settings/dispatch-radius` with `{ steps: DispatchRadiusStep[] }`. Each `afterSeconds` value is seconds; each non-null `radiusMeters` value is metres. Displayed fields use `mm:ss` and kilometres.

| Display | Wire value |
| --- | --- |
| 0:00 · 5 km | `{ afterSeconds: 0, radiusMeters: 5000 }` |
| 3:00 · 10 km | `{ afterSeconds: 180, radiusMeters: 10000 }` |
| 6:00 · 20 km | `{ afterSeconds: 360, radiusMeters: 20000 }` |
| 9:00 · Illimité | `{ afterSeconds: 540, radiusMeters: null }` |

The current parser also checks that the last delay precedes `noDriverTimeoutSeconds`; the four-row example assumes that configured timeout is greater than 540 seconds. The default frame preserves the current open state and message. The validation frame uses the existing parser message for non-increasing radii. The save/read-back interaction continues using the existing mutation and refetch; the disable action keeps its confirmation and writes the existing single unlimited step.

## Review and approval

The human approved this proposal and allowed TASK-039 to start. The approved scope is the sidebar and `/zones` removal, removing zone labels from driver views, and retaining the Admin-only radius schedule editor with the four staged rows and states described above. The Role Router decision record records the same approval.

**Human decision:** approved, 2026-11-10. No revisions requested.

