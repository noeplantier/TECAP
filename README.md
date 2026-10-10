# TÉCAP

Application mobile de rencontres autour des sorties du soir : **« T’as quoi de prévu ce soir ? »**. Le dépôt contient le socle P0 iOS/Android, le dashboard opérateur et les primitives Supabase sécurisées.

## Stack

- **Mobile** : React Native + Expo SDK 52, TypeScript, React Navigation, Reanimated 3, Zustand, TanStack Query
- **Backend** : Supabase PostgreSQL, Auth, Realtime, Storage et Edge Functions
- **Admin** : Vite + React + TypeScript
- **Observabilité** : PostHog côté client, Sentry à brancher dans les builds EAS
- **CI** : GitHub Actions, EAS Build

## Démarrage

Le dépôt utilise volontairement **pnpm 9.15.5**. Vérifie la version avant toute commande :

```bash
pnpm --version
# attendu : 9.15.5
```

Si macOS affiche une erreur `Unknown options: allow-build, dangerously-allow-all-builds`, une autre version de pnpm essaie d’installer automatiquement la version du projet avec des options incompatibles. Réinstalle directement la version attendue :

```bash
npm install --global pnpm@9.15.5
hash -r
pnpm --version
```

Si tu as activé une politique pnpm globale de scripts de build, supprime-la ensuite :

```bash
pnpm config delete dangerously-allow-all-builds --global || true
pnpm config delete allow-build --global || true
```

Puis installe et démarre :

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
pnpm typecheck
pnpm test
pnpm --filter @tecap/mobile start
pnpm --filter @tecap/admin-web dev
```

Le mode local affiche une expérience utilisable avec des données de démonstration si `EXPO_PUBLIC_USE_SUPABASE=false` ou si Supabase n’est pas configuré. Pour activer le backend mobile, renseigner `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` et passer `EXPO_PUBLIC_USE_SUPABASE=true`.

**Important :** ne copie pas le `.env.example` racine dans `apps/mobile/.env`. Le fichier racine documente aussi des secrets serveur et CI. Utilise `apps/mobile/.env.example` pour Expo et `apps/admin-web/.env.example` pour le dashboard. Ne mets jamais `EXPO_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_AUTH_TOKEN` ou `ONESIGNAL_REST_API_KEY` dans l’environnement mobile.

Si Expo affiche `ApiV2Error: The bearer token is invalid`, supprime `EXPO_TOKEN` de `apps/mobile/.env` ou lance `unset EXPO_TOKEN` dans le terminal avant `pnpm --filter @tecap/mobile start`. `EXPO_TOKEN` doit uniquement exister dans les secrets GitHub Actions/EAS.

Si le bundler affiche `Unable to resolve "../../App" from .../expo/AppEntry.js`, récupère la dernière version de la branche. L’application utilise un point d’entrée local `apps/mobile/index.js` (`main: "./index.js"`) afin d’éviter l’import relatif d’Expo qui peut casser avec les liens symboliques pnpm.

## Backend Supabase

1. Créer un projet Supabase.
2. Exécuter `supabase/migrations/0001_init.sql` dans l’éditeur SQL ou avec la Supabase CLI.
3. Déployer les fonctions :

```bash
supabase functions deploy validate-pass
supabase functions deploy expire-statuses
```

Les tables sensibles ont des policies RLS par utilisateur, événement et rôle. La clé `service_role` ne doit jamais être embarquée dans une app.

## Variables d’environnement

Les variables mobiles publiques sont dans `apps/mobile/.env.example`. Les variables du dashboard sont dans `apps/admin-web/.env.example`. Le `.env.example` racine sert de catalogue CI/backend et ne doit pas être copié tel quel dans une application.

Les variables `EXPO_PUBLIC_*` et `VITE_*` sont publiques par nature ; les secrets serveur restent dans Supabase Vault, les secrets EAS ou les variables CI.

## Commandes

| Commande            | Usage                              |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Lance les apps en développement    |
| `pnpm build`        | Build de tous les packages         |
| `pnpm typecheck`    | Vérification TypeScript            |
| `pnpm lint`         | ESLint                             |
| `pnpm test`         | Tests unitaires                    |
| `pnpm e2e`          | Tests Detox sur appareil configuré |
| `pnpm format:check` | Vérification Prettier              |

## Flux P0 couvert

Préinscription virale → compte → statut du soir → inscription TÉCAP Night → pass QR → scan partenaire server-side → second scan refusé. Le client reste volontairement sans tracking GPS automatique : la ville et le lieu de sortie sont saisis par l’utilisateur.

## Expérience premium locale

La branche mobile contient maintenant une expérience Boutique alignée sur les nouvelles maquettes néon :

- onglets `Découvrir`, `Sorties`, `Messages`, `Profil`, `Boutique` ;
- offres `Invitation spéciale`, `TÉCAP Premium` et `Boost` avec sélection d’offre et CTA ;
- parcours local en trois étapes `On se capte ce soir ?` → détail → match → conversation ;
- écran Sorties avec intentions volontaires, carte illustrative, lieux et TÉCAP Night ;
- état Zustand local pour l’abonnement, les crédits d’invitation et les boosts ;
- adaptateur `apps/mobile/src/lib/commerce.ts` remplaçable par RevenueCat ou un flux Supabase Edge Function.

Les boutons d’achat sont volontairement en **mode démo** : aucun paiement réel n’est déclenché. Le futur branchement devra ajouter la vérification serveur, les reçus App Store/Google Play, l’idempotence et la synchronisation de l’entitlement avant de rendre les offres payantes disponibles.

## RGPD et sécurité

- Confirmation 18+ et consentements séparés.
- Photos privées via URLs signées à durée de vie limitée.
- Localisation réduite à la ville et au lieu manuel.
- Suppression de compte prévue via RPC dédiée et journalisation des actions d’administration.
- Validation d’un pass atomique côté serveur avec verrouillage de ligne.
- Ne jamais considérer le bracelet social comme une preuve de consentement.

## Structure

```text
apps/mobile            App Expo iOS/Android
apps/admin-web         Dashboard admin/partenaire/staff
packages/shared        Types métier et constantes partagées
packages/supabase-types Types générés/compatibles Supabase
supabase/migrations    Schéma PostgreSQL + RLS
supabase/functions     Fonctions server-side
```
