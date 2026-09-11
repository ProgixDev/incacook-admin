import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STORE_LINKS } from "../_lib/store-links";

/**
 * The landing page's one primary CTA — "Télécharger l'app". Renders both
 * store badges unconditionally (UA-sniffed platform preference is a
 * nice-to-have, not required for this pass — see TASK-027).
 *
 * Store URLs live in `_lib/store-links.ts` as obviously-placeholder values
 * until TASK-028 supplies the real listings.
 */
export function StoreCta({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <a
          href={STORE_LINKS.ios}
          className="rounded-md border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          App Store
        </a>
        <a
          href={STORE_LINKS.android}
          className="rounded-md border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Google Play
        </a>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <Button variant="default" size="lg" asChild>
        <a href={STORE_LINKS.ios}>Télécharger l&apos;app →</a>
      </Button>
      <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
        <a href={STORE_LINKS.ios} className="rounded-md border border-outline-variant px-2.5 py-1.5 transition-colors hover:text-on-surface">
          App Store
        </a>
        <a
          href={STORE_LINKS.android}
          className="rounded-md border border-outline-variant px-2.5 py-1.5 transition-colors hover:text-on-surface"
        >
          Google Play
        </a>
      </div>
    </div>
  );
}
