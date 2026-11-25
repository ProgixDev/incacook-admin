import { PageShell } from "@/components/dashboard/page-shell";
import { ActivationClient } from "./_components/activation-client";

export default function SellerActivationPage() {
  return (
    <PageShell
      title="Activation vendeurs"
      subtitle="Entonnoir d'activation des 30 derniers jours et essais offerts"
    >
      <ActivationClient />
    </PageShell>
  );
}
