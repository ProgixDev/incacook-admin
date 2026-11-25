import { PageShell } from "@/components/dashboard/page-shell";
import { AnalyticsClient } from "./_components/analytics-client";

export default function AnalyticsPage() {
  return (
    <PageShell
      title="Analytics"
      subtitle="Parcours dans l'application, avec l'accord des utilisateurs (Google Analytics)"
    >
      <AnalyticsClient />
    </PageShell>
  );
}
