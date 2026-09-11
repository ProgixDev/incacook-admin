import { StoreCta } from "./store-cta";

const TRUST_BULLETS = ["Vérification KYC", "Allergènes déclarés", "Paiement sécurisé"] as const;

/**
 * Hero — Direction A ("product-first"), the decision locked in TASK-026.
 *
 * Desktop: headline + CTA on the left, the app's dish-detail screen
 * composited over a photo placeholder, dominant on the right.
 * Mobile: recomposed (not shrunk) — the phone/photo block leads, copy
 * follows below it — matching the reviewed artifact's `.a-m` behaviour.
 *
 * The phone screen and photo block are illustrative placeholders only; real
 * app screenshots and dish photography land in TASK-028.
 */
export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:flex-row lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
      <div className="order-2 flex flex-col lg:order-1 lg:w-[46%] lg:shrink-0">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.09em] text-secondary sm:mb-5">
          Fait maison · traiteurs · restaurants
        </p>
        <h1 className="mb-4 text-balance font-display text-4xl font-semibold leading-[1.1] text-on-surface sm:text-5xl lg:mb-5 lg:text-[56px] lg:leading-[1.06]">
          Des plats faits maison, à prix juste, près de chez vous.
        </h1>
        <p className="mb-6 max-w-[46ch] text-balance text-base leading-relaxed text-on-surface-variant sm:text-lg lg:mb-7">
          Commandez en quelques minutes des plats cuisinés par des voisins, des traiteurs et des
          restaurants de votre quartier — à retirer sur place ou à faire livrer.
        </p>

        <StoreCta className="mb-6 lg:mb-7" />

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-surface-variant">
          {TRUST_BULLETS.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2">
              <span aria-hidden className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="order-1 lg:order-2 lg:flex-1">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#E7B48A] via-[#C8553D] to-[#8C3A28] sm:aspect-[16/10] lg:aspect-auto lg:h-[560px]">
          <span className="absolute left-4 top-4 rounded-md bg-[#2B1713]/35 px-2.5 py-1.5 font-mono text-[11px] text-[#FFF8F4]/90">
            photo placeholder — plat, lumière naturelle
          </span>

          {/* App dish-detail screen mockup — illustrative only, real screenshot in TASK-028 */}
          <div className="absolute bottom-0 right-4 w-[150px] rounded-[28px] bg-[#241611] p-2 shadow-[0_24px_48px_-12px_rgba(43,23,19,0.35)] sm:right-6 sm:w-[190px] lg:bottom-0 lg:right-10 lg:w-[240px]">
            <div className="relative flex h-[300px] flex-col overflow-hidden rounded-[22px] bg-background sm:h-[380px] lg:h-[480px]">
              <span
                aria-hidden
                className="absolute left-1/2 top-2 h-3 w-12 -translate-x-1/2 rounded-full bg-[#241611] sm:top-2.5"
              />
              <div className="h-[38%] shrink-0 bg-gradient-to-br from-[#F2C6A0] via-[#C8553D] to-[#8C3A28]" />
              <div className="relative z-[1] -mt-6 flex flex-1 flex-col gap-2.5 rounded-t-2xl bg-white p-3 shadow-[0_10px_26px_-8px_rgba(43,23,19,0.22)] sm:p-4">
                <div className="h-2.5 w-[70%] rounded bg-outline-variant" />
                <div className="h-2 w-[45%] rounded bg-outline-variant opacity-70" />
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface sm:text-base">8,90&nbsp;€</span>
                  <span className="rounded-md bg-outline-variant px-1.5 py-0.5 font-mono text-[9px] text-on-surface-variant">
                    gluten · lactose
                  </span>
                </div>
                <div className="w-full rounded-md bg-primary py-2 text-center text-xs font-semibold text-primary-foreground">
                  Réserver
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 flex justify-between font-mono text-[11px] text-on-surface-variant">
          <span>app UI — illustrative uniquement, capture réelle en TASK-028</span>
        </p>
      </div>
    </section>
  );
}
