/**
 * Public chrome — shared by `/`, `/privacy`, `/terms`, `/data-deletion`.
 *
 * Deliberately NOT wrapped in `AuthGuard`: these routes must be reachable by
 * anonymous visitors (and store/App Review crawlers) with no session.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-on-surface">{children}</div>;
}
