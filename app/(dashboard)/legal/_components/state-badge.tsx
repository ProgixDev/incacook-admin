import { CheckCircle2, History, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { documentState, type LegalDocument } from "./types";

/** État de la version: active, remplacée (publiée puis désactivée) ou brouillon. */
export function StateBadge({ document }: { document: LegalDocument }) {
  switch (documentState(document)) {
    case "active":
      return (
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    case "superseded":
      return (
        <Badge variant="neutral">
          <History className="h-3 w-3" />
          Remplacée
        </Badge>
      );
    default:
      return <Badge variant="neutral">Brouillon</Badge>;
  }
}

/** Marqueur « lecture seule » pour les versions publiées. */
export function ReadOnlyBadge() {
  return (
    <Badge variant="secondary">
      <Lock className="h-3 w-3" />
      Lecture seule
    </Badge>
  );
}
