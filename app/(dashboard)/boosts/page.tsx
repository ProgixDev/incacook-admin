import { PageShell } from "@/components/dashboard/page-shell";
import { BoostsClient } from "./_components/boosts-client";

export default function BoostsPage() {
  return (
    <PageShell
      title="Mise à la Une"
      subtitle="Suivi des boosts de visibilité des annonces vendeurs (lecture seule)"
    >
      <BoostsClient />
    </PageShell>
  );
}
