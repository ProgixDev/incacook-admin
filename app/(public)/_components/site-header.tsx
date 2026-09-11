import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const SECTIONS = [
  { href: "#mission", label: "Notre mission" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
] as const;

/**
 * Sticky public nav — logo, section anchors, one primary CTA slot.
 *
 * This is the ONLY place `.frost` is used on the landing page (see
 * `app/globals.css`); everywhere else on `/` should use ordinary theme
 * tokens.
 */
export function SiteHeader() {
  return (
    <header className="frost sticky top-0 z-40 w-full">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-md" title="IncaCook">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
            <Image src="/app_logo.png" alt="IncaCook" width={28} height={28} className="object-contain" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-on-surface">IncaCook</span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-6 text-sm font-medium text-on-surface-variant sm:flex">
          {SECTIONS.map((section) => (
            <a key={section.href} href={section.href} className="transition-colors hover:text-on-surface">
              {section.label}
            </a>
          ))}
        </nav>

        {/* Primary CTA — a real store-detection button lands in a later task. */}
        <Button variant="default" size="md" asChild>
          <a href="#telecharger">Télécharger l&apos;app</a>
        </Button>
      </div>
    </header>
  );
}
