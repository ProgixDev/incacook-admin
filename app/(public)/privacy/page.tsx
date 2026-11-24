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
          <p className="text-sm text-on-surface-variant">Dernière mise à jour : 24 août 2026</p>
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
          <h2 className="text-xl font-semibold">
            Vérification d&apos;identité (KYC) : pièces et selfie
          </h2>
          <p className="leading-7 text-on-surface-variant">
            Pour vendre ou livrer sur IncaCook, nous devons vérifier votre identité. Nous vous
            demandons alors une pièce d&apos;identité (recto/verso) et, selon votre rôle, d&apos;autres
            documents comme un permis de conduire, une carte grise ou une attestation
            d&apos;assurance. Ces documents sont stockés dans un espace sécurisé et ne sont accessibles
            qu&apos;à nos équipes de conformité pour l&apos;examen de votre dossier.
          </p>
          <p className="leading-7 text-on-surface-variant">
            Nous vous demandons également un selfie afin de vérifier que vous correspondez bien à
            la pièce d&apos;identité fournie. Avant tout envoi, une vérification est effectuée
            directement sur votre appareil pour s&apos;assurer qu&apos;un visage est bien présent sur la
            photo ; seule la photo ayant passé cette vérification est transmise à nos serveurs.
            Votre consentement explicite est recueilli avant la prise de cette photo, et vous en
            êtes informé·e à cette étape. Le selfie et les documents d&apos;identité sont utilisés
            exclusivement à des fins de vérification d&apos;identité et de lutte contre la fraude ; ils
            sont conservés le temps nécessaire à l&apos;examen de votre dossier et à nos obligations
            réglementaires, puis supprimés au-delà de cette durée. Vous pouvez à tout moment
            demander la suppression de ces données via notre page{" "}
            <a className="text-primary underline underline-offset-2" href="/data-deletion">
              Suppression des données
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Localisation précise et en arrière-plan</h2>
          <p className="leading-7 text-on-surface-variant">
            Pour les comptes livreur, l&apos;application accède à votre position précise, y compris
            lorsque l&apos;application est en arrière-plan, afin de permettre le suivi de livraison en
            temps réel, l&apos;attribution des courses et l&apos;estimation des délais pour les acheteurs et
            vendeurs. Cette localisation n&apos;est utilisée que pendant vos périodes d&apos;activité en
            tant que livreur et peut être désactivée à tout moment depuis les réglages de votre
            appareil, avec pour conséquence l&apos;indisponibilité des fonctionnalités de livraison.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Pourquoi nous utilisons ces données</h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-on-surface-variant">
            <li>créer, sécuriser et administrer votre compte ;</li>
            <li>permettre les commandes, paiements, livraisons et échanges liés au service ;</li>
            <li>vérifier l&apos;identité des vendeurs et livreurs (KYC) et prévenir la fraude ;</li>
            <li>prévenir la fraude, les abus et les incidents de sécurité ;</li>
            <li>répondre à nos obligations légales, comptables et réglementaires ;</li>
            <li>vous envoyer les communications nécessaires au fonctionnement du service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Nos prestataires techniques</h2>
          <p className="leading-7 text-on-surface-variant">
            Nous faisons appel aux prestataires suivants, qui traitent des données en notre nom et
            selon nos instructions, dans le strict cadre des finalités décrites ci-dessus :
          </p>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-on-surface-variant">
            <li>
              <span className="font-medium text-on-surface">Stripe</span> — traitement des
              paiements et versements ;
            </li>
            <li>
              <span className="font-medium text-on-surface">RevenueCat</span> — gestion des
              abonnements vendeur ;
            </li>
            <li>
              <span className="font-medium text-on-surface">Apple et Google</span> — traitement
              des achats intégrés effectués via l&apos;App Store ou le Google Play Store ;
            </li>
            <li>
              <span className="font-medium text-on-surface">Firebase Cloud Messaging</span>{" "}
              (Google) — envoi des notifications push liées à vos commandes et messages ;
            </li>
            <li>
              <span className="font-medium text-on-surface">Supabase</span> — authentification et
              stockage sécurisé (y compris les documents KYC et selfies) ;
            </li>
            <li>
              <span className="font-medium text-on-surface">Google Maps</span> — géolocalisation,
              géocodage et affichage cartographique pour la livraison.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Partage et conservation</h2>
          <p className="leading-7 text-on-surface-variant">
            Nous partageons les données strictement nécessaires avec les utilisateurs impliqués
            dans une commande et avec nos prestataires techniques de confiance listés ci-dessus,
            notamment pour l&apos;hébergement, l&apos;authentification, les paiements, les notifications et
            la livraison. Les données sont conservées pendant la durée nécessaire à ces finalités
            et, lorsque la loi l&apos;impose, pendant les durées de conservation applicables.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Vos droits et suppression de compte</h2>
          <p className="leading-7 text-on-surface-variant">
            Vous pouvez demander l&apos;accès, la rectification, l&apos;effacement, la limitation ou la
            portabilité de vos données, ainsi que vous opposer à certains traitements. Vous pouvez
            supprimer votre compte directement depuis l&apos;application (Réglages → Supprimer mon
            compte) ; pour les autres cas, notamment si vous n&apos;avez plus accès à votre compte,
            consultez notre page{" "}
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
