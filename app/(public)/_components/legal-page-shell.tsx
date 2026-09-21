import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions" },
  { href: "/data-deletion", label: "Suppression des données" },
] as const;

export function LegalPageShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-on-surface sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-outline-variant pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex w-fit items-center gap-3 rounded-md">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
              <Image
                src="/app_logo.png"
                alt="IncaCook"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight">IncaCook</span>
          </Link>

          <nav aria-label="Pages légales" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={currentPath === link.href ? "page" : undefined}
                className={
                  currentPath === link.href
                    ? "font-medium text-primary"
                    : "text-on-surface-variant transition-colors hover:text-on-surface"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}

        <footer className="mt-12 border-t border-outline-variant pt-6 text-sm text-on-surface-variant">
          <p>
            Questions concernant vos données ? Contactez-nous à{" "}
            <a className="text-primary underline underline-offset-2" href="mailto:contact@incacook.com">
              contact@incacook.com
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
