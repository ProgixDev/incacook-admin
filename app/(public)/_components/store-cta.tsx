import { cn } from "@/lib/utils";
import { STORE_LINKS } from "../_lib/store-links";

/**
 * One store badge. Renders as a real link when its URL is set, or as an
 * inert "coming soon" pill when it's empty (see `_lib/store-links.ts`).
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
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Télécharger IncaCook sur ${label}`} className={cn(base, "border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface")}>
      {label}
    </a>
  );
}

/**
 * The landing page's one primary CTA — "Télécharger l'app". Links straight to
 * the App Store and Google Play listings. When a listing URL is empty (see
 * `_lib/store-links.ts`) that store falls back to the inert "bientôt" pill,
 * and if both are empty the whole CTA is an honest "bientôt disponible".
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

  if (bothPending) {
    return (
      <div id="telecharger" className={cn("flex flex-col gap-3", className)}>
        <div
          aria-disabled="true"
          className="inline-flex w-fit cursor-default items-center gap-2 rounded-[14px] bg-outline-variant px-6 py-3 text-base font-semibold text-on-surface-variant"
        >
          Bientôt disponible
        </div>
        <p className="text-xs text-on-surface-variant">
          L&apos;application est en cours de validation sur l&apos;App Store et Google Play.
        </p>
      </div>
    );
  }

  return (
    <div id="telecharger" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {STORE_LINKS.ios ? <StoreButton store="ios" href={STORE_LINKS.ios} /> : null}
        {STORE_LINKS.android ? <StoreButton store="android" href={STORE_LINKS.android} /> : null}
      </div>
      {!STORE_LINKS.ios || !STORE_LINKS.android ? (
        <p className="text-xs text-on-surface-variant">
          {STORE_LINKS.ios ? "Google Play" : "L'App Store"} : bientôt disponible.
        </p>
      ) : null}
    </div>
  );
}

function StoreButton({ store, href }: { store: "ios" | "android"; href: string }) {
  const label = store === "ios" ? "Télécharger sur l'App Store" : "Disponible sur Google Play";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center rounded-[14px] bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {label}
    </a>
  );
}
