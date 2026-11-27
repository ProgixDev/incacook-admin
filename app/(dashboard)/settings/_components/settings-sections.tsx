"use client";

import { isFullAdminRole, useAuth } from "@/lib/auth";
import { DeliveryFeeCard } from "./delivery-fee-card";
import { DispatchRadiusCard } from "./dispatch-radius-card";
import { TrialSettingsCard } from "./trial-settings-card";

/**
 * The settings, grouped by what they govern. One rhythm: 40 px between sections, 16 px from a
 * heading to its cards, 24 px between cards; every card has the same width (a 2-column grid from
 * `lg`, one column below) and is as tall as its own content, so a short card never stretches.
 */
export function SettingsSections() {
  const { user } = useAuth();
  const isAdmin = !!user && isFullAdminRole(user.role);
  return (
    <div className="flex flex-col gap-10">
      <Section
        id="settings-delivery"
        title="Livraison"
        description="Ce que coûte une livraison et comment les livreurs sont appelés."
      >
        <DeliveryFeeCard />
        <DispatchRadiusCard />
      </Section>
      {/* The trial settings are admin only: a moderator gets neither the card nor an empty heading. */}
      {isAdmin && (
        <Section
          id="settings-sellers"
          title="Vendeurs"
          description="L’offre d’essai gratuit proposée aux nouveaux vendeurs."
        >
          <TrialSettingsCard />
        </Section>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div>
        <h2 id={id} className="text-[10.5px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-on-surface">{description}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">{children}</div>
    </section>
  );
}
