import type { Metadata } from "next";

import { LegalPageShell } from "../_components/legal-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité · IncaCook",
  description: "Politique de confidentialité IncaCook.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell currentPath="/privacy">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">Informations légales</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-on-surface-variant">Dernière mise à jour : 19 août 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Les données que nous traitons</h2>
          <p className="leading-7 text-on-surface-variant">
            IncaCook traite les informations nécessaires à la création et à la sécurité d&apos;un
            compte, à l&apos;utilisation de la marketplace, aux commandes, aux paiements et à la
            livraison. Cela peut inclure vos nom, prénom, adresse e-mail, numéro de téléphone,
            adresse, informations de profil et données liées à vos commandes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Connexion avec Facebook</h2>
          <p className="leading-7 text-on-surface-variant">
            Lorsque vous choisissez de vous connecter avec Facebook, nous recevons uniquement les
            informations autorisées par vous et Meta, notamment votre adresse e-mail et les
            informations de profil de base. Elles servent exclusivement à authentifier votre
            compte, éviter les doublons et préremplir votre profil. IncaCook ne publie pas de
            contenu sur Facebook en votre nom.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Pourquoi nous utilisons ces données</h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-on-surface-variant">
            <li>créer, sécuriser et administrer votre compte ;</li>
            <li>permettre les commandes, paiements, livraisons et échanges liés au service ;</li>
            <li>prévenir la fraude, les abus et les incidents de sécurité ;</li>
            <li>répondre à nos obligations légales, comptables et réglementaires ;</li>
            <li>vous envoyer les communications nécessaires au fonctionnement du service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Partage et conservation</h2>
          <p className="leading-7 text-on-surface-variant">
            Nous partageons les données strictement nécessaires avec les utilisateurs impliqués
            dans une commande et avec nos prestataires techniques de confiance, notamment pour
            l&apos;hébergement, l&apos;authentification, les paiements, les notifications et la livraison.
            Les données sont conservées pendant la durée nécessaire à ces finalités et, lorsque la
            loi l&apos;impose, pendant les durées de conservation applicables.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Vos droits</h2>
          <p className="leading-7 text-on-surface-variant">
            Vous pouvez demander l&apos;accès, la rectification, l&apos;effacement, la limitation ou la
            portabilité de vos données, ainsi que vous opposer à certains traitements. Pour une
            demande de suppression, consultez notre page{" "}
            <a className="text-primary underline underline-offset-2" href="/data-deletion">
              Suppression des données
            </a>
            .
          </p>
        </section>
      </article>
    </LegalPageShell>
  );
}
