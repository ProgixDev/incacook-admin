import { PageShell } from "@/components/dashboard/page-shell";
import { RefundsClient } from "./refunds-client";

export default function RefundsPage() {
  return <PageShell title="Remboursements" subtitle="Suivi des remboursements en attente ou à régulariser"><RefundsClient /></PageShell>;
}
