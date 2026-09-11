import Link from "next/link";

import { StoreCta } from "./store-cta";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions" },
  { href: "/data-deletion", label: "Suppression des données" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-on-surface-variant sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Pages légales" className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-on-surface">
                {link.label}
              </Link>
            ))}
          </nav>

          <StoreCta variant="compact" />
        </div>

        <p>
          Une question ? Écrivez-nous à{" "}
          <a className="text-primary underline underline-offset-2" href="mailto:tasseltess@gmail.com">
            tasseltess@gmail.com
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
