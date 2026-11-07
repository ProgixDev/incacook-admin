import { PageShell } from "@/components/dashboard/page-shell";
import { ZonesClient } from "./_components/zones-client";

export default function ZonesPage() {
  return (
    <PageShell
      title="Zones de livraison"
      subtitle="Les zones sont indicatives : elles ne limitent pas les commandes visibles par les livreurs."
    >
      <ZonesClient />
    </PageShell>
  );
}
