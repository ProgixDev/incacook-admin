const OFFERINGS = [
  {
    name: "Le Bon Fait Maison",
    audience: "Particuliers",
    note: "KYC auto-approuvé · plafond 4,50 €",
    body: "Pour les voisins qui cuisinent chez eux. Inscription simplifiée, sans dossier d'entreprise — et un prix par plat plafonné à 4,50 €, par conviction : du fait maison bon et accessible à tous.",
  },
  {
    name: "L'Atelier Traiteur",
    audience: "Traiteurs",
    note: "KYC complet · SIRET, horaires",
    body: "Pour les traiteurs professionnels. Vérification complète et informations d'entreprise (SIRET, horaires d'ouverture) avant mise en ligne.",
  },
  {
    name: "Sauve Ton Panier",
    audience: "Restaurants",
    note: "KYC complet · paniers surplus",
    body: "Pour les restaurants avec des invendus en fin de service. Vérification complète et modèle de panier surplus à prix réduit.",
  },
] as const;

/**
 * Three offerings — the three seller archetypes from the PRD, content no
 * competitor has. Informational, not competing CTAs, so three cards here is
 * fine (unlike a repeated-feature-card pattern elsewhere on the page).
 */
export function Offerings() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-secondary">
          Qui vend sur IncaCook
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-on-surface sm:text-4xl">
          Trois façons de proposer du fait maison
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {OFFERINGS.map((offering) => (
          <div
            key={offering.name}
            className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface p-6"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {offering.audience}
            </span>
            <h3 className="font-display text-xl font-semibold text-on-surface">{offering.name}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{offering.body}</p>
            <p className="mt-auto border-t border-outline-variant pt-3 font-mono text-xs text-on-surface-variant">
              {offering.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
