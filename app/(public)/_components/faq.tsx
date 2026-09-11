const QUESTIONS = [
  {
    q: "Comment être sûr que la nourriture est sans risque ?",
    a: "Chaque vendeur passe une vérification (KYC auto-approuvée pour les particuliers, complète pour les traiteurs et restaurants) et doit déclarer les 14 allergènes réglementaires sur chaque plat avant de le publier.",
  },
  {
    q: "Qui sont les cuisiniers ?",
    a: "Des voisins (Le Bon Fait Maison), des traiteurs professionnels (L'Atelier Traiteur) et des restaurants (Sauve Ton Panier) de votre quartier — chacun avec son propre niveau de vérification.",
  },
  {
    q: "Comment suis-je remboursé en cas de problème ?",
    a: "Le paiement passe par Stripe dans l'app. En cas de souci avec une commande, un litige peut être ouvert depuis l'app et traité selon la politique de remboursement du vendeur et d'IncaCook.",
  },
  {
    q: "Livraison ou retrait : comment ça marche ?",
    a: "Les deux existent selon le vendeur : vous pouvez récupérer votre commande sur place, ou vous faire livrer par un livreur indépendant. Le mode disponible est indiqué sur chaque fiche plat avant la commande.",
  },
  {
    q: "Dans quelles villes IncaCook est-il disponible ?",
    a: "Le fil de plats est géolocalisé : l'app affiche ce qui est réellement disponible autour de vous. La couverture s'étend au fur et à mesure de l'arrivée de nouveaux vendeurs.",
  },
  {
    q: "Combien ça coûte pour vendre sur IncaCook ?",
    a: "IncaCook prélève une commission sur chaque vente réglée dans l'app ; aucun frais n'est demandé pour créer un compte vendeur.",
  },
] as const;

/**
 * FAQ — objection handling drawn from the PRD's constraints. Uses native
 * `<details>`/`<summary>` for the accordion: accessible and keyboard-operable
 * by default, no client JS or accordion library needed.
 */
export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-secondary">
          Questions fréquentes
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-on-surface sm:text-4xl">
          Ce qu&apos;on nous demande le plus souvent
        </h2>
      </div>

      <div className="divide-y divide-outline-variant border-y border-outline-variant">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-on-surface marker:content-none">
              {item.q}
              <span aria-hidden className="shrink-0 text-lg text-on-surface-variant transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
