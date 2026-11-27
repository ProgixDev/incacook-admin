import { PageShell } from "@/components/dashboard/page-shell";
import { SettingsSections } from "./_components/settings-sections";

export default function SettingsPage() {
  return (
    <PageShell title="Paramètres" subtitle="Configuration de la plateforme">
      <SettingsSections />
    </PageShell>
  );
}
