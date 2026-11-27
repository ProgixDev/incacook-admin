import { PageShell } from "@/components/dashboard/page-shell";
import { ActivationClient } from "./_components/activation-client";

export default async function SellerActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  // The admin home links here with ?view=pending|ready; anything else is the full list.
  const { view } = await searchParams;
  const initialView = view === "pending" || view === "ready" ? view : "all";
  return (
    <PageShell
      title="Activation vendeurs"
      subtitle="Entonnoir d'activation des 30 derniers jours et essais offerts"
    >
      <ActivationClient initialView={initialView} />
    </PageShell>
  );
}
