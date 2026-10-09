# TÉCAP

Application mobile de rencontres autour des sorties du soir : **« T’as quoi de prévu ce soir ? »**. Le dépôt contient le socle P0 iOS/Android, le dashboard opérateur et les primitives Supabase sécurisées.

## Stack

- **Mobile** : React Native + Expo SDK 52, TypeScript, React Navigation, Reanimated 3, Zustand, TanStack Query
- **Backend** : Supabase PostgreSQL, Auth, Realtime, Storage et Edge Functions
- **Admin** : Vite + React + TypeScript
- **Observabilité** : PostHog côté client, Sentry à brancher dans les builds EAS
- **CI** : GitHub Actions, EAS Build

## Démarrage

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm typecheck
pnpm test
pnpm --filter @tecap/mobile start
pnpm --filter @tecap/admin-web dev
```

Le mode local affiche une expérience utilisable avec des données de démonstration si Supabase n’est pas configuré. Pour activer le backend, renseigner `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

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

Voir `.env.example`. Les variables `EXPO_PUBLIC_*` et `VITE_*` sont publiques par nature ; les secrets serveur restent dans Supabase Vault, les secrets EAS ou les variables CI.

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
