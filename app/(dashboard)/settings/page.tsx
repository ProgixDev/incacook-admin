import { PageShell } from "@/components/dashboard/page-shell";
import { DeliveryFeeCard } from "./_components/delivery-fee-card";
import { DispatchRadiusCard } from "./_components/dispatch-radius-card";
import { TrialSettingsCard } from "./_components/trial-settings-card";

export default function SettingsPage() {
  return (
    <PageShell
      title="Paramètres"
      subtitle="Configuration de la plateforme"
    >
      <DeliveryFeeCard />
      <DispatchRadiusCard />
      <TrialSettingsCard />
    </PageShell>
  );
}
