import type { Metadata } from "next";

import { LegalPageShell } from "../_components/legal-page-shell";

export const metadata: Metadata = {
  title: "Suppression des données · IncaCook",
  description: "Instructions pour demander la suppression de vos données IncaCook.",
};

export default function DataDeletionPage() {
  return (
    <LegalPageShell currentPath="/data-deletion">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">Vos données</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Demander la suppression de vos données
          </h1>
          <p className="leading-7 text-on-surface-variant">
            Vous pouvez demander la suppression de votre compte IncaCook et des données personnelles
            associées, y compris lorsque vous vous êtes inscrit avec Facebook.
          </p>
        </header>

        <section className="rounded-2xl border border-outline-variant bg-surface p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Méthode recommandée : depuis l&apos;application</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-on-surface-variant">
            <li>Ouvrez l&apos;application IncaCook et connectez-vous à votre compte.</li>
            <li>
              Accédez à <span className="font-medium text-on-surface">Réglages</span>, puis
              sélectionnez{" "}
              <span className="font-medium text-on-surface">« Supprimer mon compte »</span>.
            </li>
            <li>Confirmez la suppression en suivant les étapes indiquées à l&apos;écran.</li>
          </ol>
          <p className="mt-4 leading-7 text-on-surface-variant">
            Cette suppression est immédiate et ne nécessite aucune intervention de notre part. Si
            votre compte vendeur dispose d&apos;un abonnement actif, l&apos;application vous rappelle que
            la suppression du compte n&apos;annule pas automatiquement l&apos;abonnement auprès d&apos;Apple ou
            de Google : gérez-le depuis les réglages d&apos;abonnement de votre magasin d&apos;applications.
          </p>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface p-5 sm:p-7">
          <h2 className="text-xl font-semibold">
            Solution de secours : par e-mail (si vous ne pouvez plus vous connecter)
          </h2>
          <p className="mt-2 leading-7 text-on-surface-variant">
            Si vous avez perdu l&apos;accès à votre compte et ne pouvez pas utiliser l&apos;application,
            vous pouvez nous adresser une demande par e-mail :
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-on-surface-variant">
            <li>
              Envoyez un e-mail à{" "}
              <a className="text-primary underline underline-offset-2" href="mailto:tasseltess@gmail.com?subject=Demande%20de%20suppression%20de%20donn%C3%A9es%20IncaCook">
                tasseltess@gmail.com
              </a>
              .
            </li>
            <li>Utilisez, si possible, l&apos;adresse e-mail associée à votre compte IncaCook.</li>
            <li>Indiquez clairement : « Demande de suppression de données IncaCook ».</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ce qui se passe ensuite</h2>
          <p className="leading-7 text-on-surface-variant">
            Pour une demande par e-mail, nous pouvons vous demander des informations complémentaires
            afin de vérifier que vous êtes bien titulaire du compte. Une fois la demande vérifiée
            (ou immédiatement dans le cas d&apos;une suppression via l&apos;application), nous traiterons la
            suppression ou l&apos;anonymisation des données personnelles concernées. Certaines
            informations peuvent être conservées lorsque la loi l&apos;exige, notamment pour les
            obligations comptables, fiscales, la prévention de la fraude ou le règlement de litiges.
            Consultez notre{" "}
            <a className="text-primary underline underline-offset-2" href="/privacy">
              politique de confidentialité
            </a>{" "}
            pour le détail des données concernées et des durées de conservation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Données Facebook</h2>
          <p className="leading-7 text-on-surface-variant">
            La suppression de votre compte IncaCook supprime ou anonymise les données IncaCook reçues
            lors de votre connexion avec Facebook. Elle ne supprime pas votre compte Facebook ; celui-ci
            reste géré directement par Meta.
          </p>
        </section>
      </article>
    </LegalPageShell>
  );
}
