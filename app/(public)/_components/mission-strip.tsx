/**
 * Anti-gaspillage mission strip — the one place `--primary` carries a full
 * surface rather than just a button (TASK-026/027 decision). This is
 * IncaCook's actual thesis, from the PRD: home cooks and small food
 * businesses waste edible surplus and have no compliant, geolocated channel
 * to sell it to neighbours. No impact counter — we have no real number yet.
 */
export function MissionStrip() {
  return (
    <section id="mission" className="bg-primary py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.09em] text-primary-foreground/80">
          Notre mission
        </p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-primary-foreground sm:text-4xl">
          Chaque jour, des voisins et des petits commerces cuisinent plus qu&apos;ils ne peuvent
          vendre.
        </h2>
        <p className="mt-5 text-balance text-lg leading-relaxed text-primary-foreground/90">
          IncaCook leur donne un canal simple et conforme pour proposer ces plats faits maison, en
          portions, aux gens du quartier — plutôt que de les jeter.
        </p>
      </div>
    </section>
  );
}
