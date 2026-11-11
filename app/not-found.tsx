import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-on-surface">Cette page est introuvable.</h1>
      <p className="text-sm text-on-surface-variant">La page demandée n’existe pas ou a été déplacée.</p>
      <Button asChild>
        <Link href="/dashboard">Retour à l’accueil</Link>
      </Button>
    </main>
  );
}
