const FACTS = [
  {
    claim: "Vendeurs vérifiés",
    proof: "KYC obligatoire pour les traiteurs, les restaurants et tous les livreurs avant leur mise en ligne.",
  },
  {
    claim: "Allergènes déclarés",
    proof: "Déclaration obligatoire des 14 allergènes réglementaires (noms français) sur chaque plat.",
  },
  {
    claim: "Prix encadré",
    proof: "Notre plafond fait-maison — 4,50 € — est bloqué au niveau du produit, pas seulement affiché. Un choix IncaCook, pour rester abordable.",
  },
  {
    claim: "Paiement sécurisé",
    proof: "Paiement dans l'app via Stripe ; remise en main propre vérifiée par QR code.",
  },
  {
    claim: "Vendeurs tenus responsables",
    proof: "Système de notes et politique publique de sanctions/exclusion en cas de manquement.",
  },
] as const;

/**
 * Trust & compliance — the honest substitute for social proof. IncaCook is
 * pre-launch: NO fabricated proof (no download counts, no testimonials, no
 * logo wall, no invented ratings). Every line here is a real, verifiable
 * mechanism fact, placed next to the claim it supports.
 */
export function Trust() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-secondary">
          Confiance &amp; conformité
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-on-surface sm:text-4xl">
          Pas de promesses en l&apos;air — des règles appliquées
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
          IncaCook démarre tout juste : plutôt que d&apos;inventer des chiffres, voici comment la
          plateforme fonctionne réellement.
        </p>
      </div>

      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.claim} className="border-l-2 border-outline-variant pl-4">
            <dt className="font-semibold text-on-surface">{fact.claim}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{fact.proof}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
