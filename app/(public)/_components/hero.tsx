import Image from "next/image";

import { StoreCta } from "./store-cta";

const TRUST_BULLETS = ["Vérification KYC", "Allergènes déclarés", "Paiement sécurisé"] as const;

/**
 * Hero — Direction A ("product-first"), the decision locked in TASK-026.
 *
 * Desktop: headline + CTA on the left, a real screen from the app
 * composited over real dish photography, dominant on the right.
 * Mobile: recomposed (not shrunk) — the photo/phone block leads, copy
 * follows below it — matching the reviewed artifact's `.a-m` behaviour.
 *
 * The background photo is one source file with a deliberate, per-breakpoint
 * crop anchor (`object-[…]`), not a second commissioned mobile photo: the
 * food in `hero-food.jpg` clusters top-left with empty tablecloth
 * bottom-right, so the anchor shifts per container aspect ratio to keep food
 * (not empty table) in frame at every size — a real, if lighter-weight,
 * answer to `01-Design/Responsive-Mobile`'s "recompose, don't just shrink."
 *
 * Both images are real IncaCook material sourced from the app repo
 * (`assets/images/welcome.jpg`, and a raw onboarding-screen capture) — not
 * stock or fabricated mockups. The onboarding screen is what a buyer
 * actually sees first, which is why it's used here rather than an invented
 * dish-detail screen that doesn't exist yet as a real capture. TASK-028
 * still owns sourcing a dedicated dish-detail screenshot if one becomes
 * available, and final hero-specific photography.
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
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-container-high sm:aspect-[16/10] lg:aspect-auto lg:h-[560px]">
          <Image
            src="/landing/hero-food.jpg"
            alt="Plats faits maison dressés sur une table"
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover object-[22%_18%] sm:object-[28%_20%] lg:object-[32%_22%]"
          />

          {/* Real onboarding screen from the app — see file header for why this
              screen rather than a dish-detail mockup. */}
          <div className="absolute bottom-0 right-4 w-[150px] rounded-[28px] bg-[#241611] p-2 shadow-[0_24px_48px_-12px_rgba(43,23,19,0.35)] sm:right-6 sm:w-[190px] lg:bottom-0 lg:right-10 lg:w-[240px]">
            <div className="relative h-[300px] overflow-hidden rounded-[22px] bg-background sm:h-[380px] lg:h-[480px]">
              <span
                aria-hidden
                className="absolute left-1/2 top-2 z-[1] h-3 w-12 -translate-x-1/2 rounded-full bg-[#241611] sm:top-2.5"
              />
              <Image
                src="/landing/app-screen-onboarding.jpg"
                alt="Capture d'écran réelle de l'application IncaCook — écran d'inscription"
                fill
                sizes="240px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] text-on-surface-variant">
          Photo et capture d&apos;écran réelles IncaCook.
        </p>
      </div>
    </section>
  );
}
