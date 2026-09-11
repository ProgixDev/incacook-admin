import { Button } from "@/components/ui/button";

const PATHS = [
  {
    title: "Vendre sur IncaCook",
    body: "Home cooks, traiteurs et restaurants : proposez vos plats faits maison ou vos surplus à des voisins, en toute conformité.",
    cta: "Devenir vendeur",
    href: "#devenir-vendeur",
  },
  {
    title: "Livrer avec IncaCook",
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
            <div key={path.title} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-on-surface">{path.title}</h3>
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
