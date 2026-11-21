import { cn } from "@/lib/utils";
import { STORE_LINKS } from "../_lib/store-links";

/**
 * One store badge. Renders as a real link when its URL is set, or as an
 * inert "coming soon" pill when it's empty (see `_lib/store-links.ts`).
 * A badge must never point at a placeholder anchor that goes nowhere.
 */
function StoreBadge({ store, href, primary }: { store: "ios" | "android"; href: string; primary?: boolean }) {
  const label = store === "ios" ? "App Store" : "Google Play";
  const base = primary
    ? "inline-flex items-center justify-center rounded-[14px] px-6 py-3 text-base font-semibold"
    : "rounded-md border px-3 py-2 text-xs font-medium";

  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Bientôt disponible"
        className={cn(
          base,
          "cursor-default",
          primary ? "bg-outline-variant text-on-surface-variant" : "border-outline-variant text-on-surface-variant/60",
        )}
      >
        {label} — bientôt
      </span>
    );
  }

  return (
    <a
      href={href}
      aria-label={`Télécharger IncaCook sur ${label}`}
      className={cn(
        base,
        "transition-colors",
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-outline-variant text-on-surface-variant hover:text-on-surface",
      )}
    >
      {label}
    </a>
  );
}

/**
 * The landing page's one primary CTA, "Télécharger l'app". Links directly to
 * each live store listing and needs no client JS.
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
        <StoreBadge store="ios" href={STORE_LINKS.ios} />
        <StoreBadge store="android" href={STORE_LINKS.android} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm font-medium text-on-surface-variant">Télécharger l&apos;app</p>
      <div className="flex flex-wrap items-center gap-3">
        <StoreBadge store="ios" href={STORE_LINKS.ios} primary />
        <StoreBadge store="android" href={STORE_LINKS.android} primary />
      </div>
      {bothPending ? (
        <p className="text-xs text-on-surface-variant">
          L&apos;application est en cours de validation sur l&apos;App Store et Google Play.
        </p>
      ) : null}
    </div>
  );
}
