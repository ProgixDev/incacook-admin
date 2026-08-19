# Mise en ligne de Facebook Login (Meta)

Ce document rassemble les liens publics et la configuration Meta nécessaires pour
mettre Facebook Login en production pour IncaCook.

## Liens à renseigner dans Meta

Utiliser les liens déployés de l'administration :

- Politique de confidentialité : `https://incacook-admin.vercel.app/privacy`
- Conditions d'utilisation : `https://incacook-admin.vercel.app/terms`
- Suppression des données : `https://incacook-admin.vercel.app/data-deletion`
- E-mail de support : `tasseltess@gmail.com`

La page des conditions lit les CGU et CGV actives publiées depuis l'administration.
Les pages de confidentialité et de suppression des données sont publiques, sans
connexion au back-office.

## Configuration Meta for Developers

Dans **Settings → Basic**, renseigner l'icône existante `public/app_logo.png`,
l'adresse e-mail de contact, le domaine `incacook-admin.vercel.app`, ainsi que les
trois liens publics ci-dessus.

Dans **Facebook Login → Settings**, ajouter exactement cette URI de redirection
OAuth valide :

`https://eoxrrofpdtrwjbhywcvz.supabase.co/auth/v1/callback`

Dans Supabase, le fournisseur Facebook doit être activé avec l'App ID et le secret
Meta, et la liste des URL de redirection doit contenir
`incacook://auth/callback`.

## Vérification avant passage en production

1. Ajouter les comptes de test dans les rôles Meta et leur faire accepter l'invitation.
2. Tester une première connexion Facebook, une reconnexion et une annulation sur
   iOS et Android.
3. Vérifier qu'une demande envoyée à `tasseltess@gmail.com` permet de traiter la
   suppression du compte et des données IncaCook associées.
4. Lorsque les informations de l'application sont complètes et les tests validés,
   passer l'application Meta en mode **Live**.

La vérification de l'entreprise dans Meta Business Suite peut être demandée par
Meta selon les fonctionnalités utilisées ; utiliser alors exactement la raison
sociale, l'adresse et les justificatifs officiels de l'entreprise.
