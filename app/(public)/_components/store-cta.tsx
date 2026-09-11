import { cn } from "@/lib/utils";
import { STORE_LINKS } from "../_lib/store-links";

/**
 * One store badge. Renders as a real link when its URL is set, or as an
 * inert "coming soon" pill when it's empty — the app isn't accepted on
 * either store yet, so there is nothing to link to (see `_lib/store-links.ts`).
 * A badge must never point at a placeholder anchor that goes nowhere.
 */
function StoreBadge({ store, href, compact }: { store: "ios" | "android"; href: string; compact?: boolean }) {
  const label = store === "ios" ? "App Store" : "Google Play";
  const base = compact
    ? "rounded-md border px-3 py-2 text-xs font-medium"
    : "rounded-md border px-2.5 py-1.5 text-xs font-mono";

  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Bientôt disponible"
        className={cn(base, "cursor-default border-outline-variant text-on-surface-variant/60")}
      >
        {label} — bientôt
      </span>
    );
  }

  return (
    <a href={href} className={cn(base, "border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface")}>
      {label}
    </a>
  );
}

/**
 * The landing page's one primary CTA — "Télécharger l'app". Neither store
 * listing is live yet (app not yet accepted), so this renders an honest
 * "bientôt disponible" state rather than a working install button or a link
 * to nowhere. UA-sniffed platform preference and a real deep link are
 * TASK-028's job, once at least one listing goes live.
 */
export function StoreCta({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "compact";
  className?: string;
}) {
  const bothPending = !STORE_LINKS.ios && !STORE_LINKS.android;

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <StoreBadge store="ios" href={STORE_LINKS.ios} compact />
        <StoreBadge store="android" href={STORE_LINKS.android} compact />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        aria-disabled="true"
        className="inline-flex w-fit cursor-default items-center gap-2 rounded-[14px] bg-outline-variant px-6 py-3 text-base font-semibold text-on-surface-variant"
      >
        Bientôt disponible
      </div>
      {bothPending ? (
        <p className="text-xs text-on-surface-variant">
          L&apos;application est en cours de validation sur l&apos;App Store et Google Play.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <StoreBadge store="ios" href={STORE_LINKS.ios} />
          <StoreBadge store="android" href={STORE_LINKS.android} />
        </div>
      )}
    </div>
  );
}
