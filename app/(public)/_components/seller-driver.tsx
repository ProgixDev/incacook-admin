import Image from "next/image";

import { Button } from "@/components/ui/button";

const PATHS = [
  {
    key: "vendeur",
    image: "/landing/seller-devenir-vendeur.png",
    alt: "Devenez vendeur et gérez votre activité facilement — capture d'écran de l'application IncaCook",
    body: "Home cooks, traiteurs et restaurants : proposez vos plats faits maison ou vos surplus à des voisins, en toute conformité.",
    cta: "Devenir vendeur",
    href: "#devenir-vendeur",
  },
  {
    key: "livreur",
    image: "/landing/driver-devenir-livreur.png",
    alt: "Devenez livreur et gagnez de l'argent à votre rythme — capture d'écran de l'application IncaCook",
    body: "Devenez livreur indépendant : acceptez des courses près de chez vous, remise vérifiée par QR code, paiement sur portefeuille.",
    cta: "Devenir livreur",
    href: "#devenir-livreur",
  },
] as const;

/**
 * Vendre / Livrer — secondary CTAs with a genuinely distinct intent from the
 * primary "Télécharger l'app". Deliberately visually subordinate: outline
 * buttons, no `--primary` fill, smaller type scale than the hero. Never
 * presented as a third equal choice next to the install CTA.
 *
 * The two images are real, finished App Store screenshots from the app repo
 * (`docs/store_submission/`) — each already carries its own French headline,
 * so no separate `<h3>` is added here to avoid duplicating it.
 */
export function SellerDriver() {
  return (
    <section className="border-y border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.09em] text-on-surface-variant">
          Vous êtes plutôt vendeur ou livreur ?
        </p>
        <div className="grid gap-8 sm:grid-cols-2">
          {PATHS.map((path) => (
            <div key={path.key} className="flex flex-col gap-4">
              <div className="relative h-64 w-full overflow-hidden rounded-xl bg-surface-container-high sm:h-72">
                <Image
                  src={path.image}
                  alt={path.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{path.body}</p>
              <div>
                <Button variant="outline" size="md" asChild>
                  <a href={path.href}>{path.cta}</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
