const STEPS = [
  {
    number: "1",
    title: "Parcourez les plats près de chez vous",
    body: "Le fil géolocalisé montre les plats disponibles chez des voisins, traiteurs et restaurants autour de vous.",
  },
  {
    number: "2",
    title: "Commandez et payez dans l'app",
    body: "Paiement sécurisé par carte via Stripe, directement dans l'application — aucun échange d'espèces.",
  },
  {
    number: "3",
    title: "Retrait ou livraison, puis notez le cuisinier",
    body: "Choisissez de récupérer votre commande sur place ou de vous faire livrer, puis laissez un avis.",
  },
] as const;

/**
 * How it works — buyer POV, 3 steps from the PRD user journey. Pickup and
 * delivery both exist; this must not read as delivery-only.
 */
export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-secondary">
          Comment ça marche
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-on-surface sm:text-4xl">
          De la découverte à l&apos;assiette, en trois étapes
        </h2>
      </div>

      <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step) => (
          <li key={step.number} className="flex flex-col gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant font-display text-lg font-semibold text-on-surface"
            >
              {step.number}
            </span>
            <h3 className="text-lg font-semibold text-on-surface">{step.title}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
