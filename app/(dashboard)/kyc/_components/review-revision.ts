/**
 * The revision to send with an approve/reject, or null when the file on screen is not the one
 * being decided. A decision names the revision the reviewer looked at; if the drawer was moved
 * to another document and still holds the previous one's detail (or none yet), nothing may be
 * sent: that revision belongs to a different file.
 */
export function revisionToSend(
  detail: { id: string; revision: number } | null | undefined,
  documentId: string | null,
): number | null {
  if (!detail || !documentId || detail.id !== documentId) return null;
  return detail.revision;
}
