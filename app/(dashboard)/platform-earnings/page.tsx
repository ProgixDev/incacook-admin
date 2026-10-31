import { PageShell } from "@/components/dashboard/page-shell";
import { PlatformEarningsClient } from "./_components/platform-earnings-client";

export default function PlatformEarningsPage() {
  return (
    <PageShell
      title="Revenus de la plateforme"
      subtitle="Commission nette après frais Stripe et montants dus aux vendeurs et livreurs"
    >
      <PlatformEarningsClient />
    </PageShell>
  );
}
