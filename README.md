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
2. Exécuter `supabase/migrations/0001_init.sql`, puis `supabase/migrations/0002_social_mvp.sql` dans l’éditeur SQL ou avec la Supabase CLI.
3. Déployer les fonctions :

```bash
supabase functions deploy validate-pass
supabase functions deploy expire-statuses
```

Les tables sensibles ont des policies RLS par utilisateur, événement et rôle. La clé `service_role` ne doit jamais être embarquée dans une app.

### Projet de développement connecté

Le dépôt a été vérifié et déployé sur le projet Supabase TÉCAP de développement :

- référence : `bzijrulrqhnwycgmhcti` ;
- région : `ca-central-1` ;
- migrations appliquées : `init_p0`, `social_mvp`, `backend_actions` ;
- tables publiques : RLS activée sur toutes les tables créées ;
- Edge Functions actives : `validate-pass` et `expire-statuses`, toutes deux avec JWT obligatoire ;
- types TypeScript du package `@tecap/supabase-types` synchronisés avec le schéma distant.

Le projet ne possède actuellement **aucun scheduler distant `pg_cron` actif**. La configuration versionnée conserve le cron horaire attendu, mais l’exécution de `expire-statuses` doit encore être branchée via un scheduler autorisé (Supabase Cron, GitHub Actions ou autre) avec le secret serveur configuré dans Supabase Vault/EAS/CI, jamais dans l’application mobile.

Pour activer le client mobile réel, renseigne uniquement les variables publiques dans `apps/mobile/.env` :

```bash
EXPO_PUBLIC_USE_SUPABASE=true
EXPO_PUBLIC_SUPABASE_URL=https://bzijrulrqhnwycgmhcti.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<clé publishable/anon récupérée dans Supabase>
```

Le mode démo reste disponible si `EXPO_PUBLIC_USE_SUPABASE=false` ou si les clés sont absentes.

Quand `EXPO_PUBLIC_USE_SUPABASE=true`, l’application utilise Supabase pour l’OTP, les profils de la même ville, les swipes, les quotas de likes via RPC transactionnelle, les matches, les messages avec Realtime, les statuts de soirée, les événements publiés et la lecture des entitlements. Le mode local reste un fallback explicite pour les maquettes et les tests sans réseau.

### Seed développement idempotent

Le seed serveur est dans `supabase/seed/`. Il utilise des emails fictifs `example.test`, des UUID métier déterministes et des `upsert` ciblés. Il ne contient aucun mot de passe ni clé réelle et ne supprime jamais une donnée hors du périmètre `tecap.demo+*@example.test`.

Le schéma actuel ne contient ni `is_demo_data` ni `seed_registry`, mais l’idempotence est assurée par les emails Auth de démonstration, les IDs stables des événements/relations et les contraintes métier existantes. Les 30 profils secondaires, Alex, Alex Limite, TÉCAP Admin et Staff TÉCAP Night sont créés comme vrais utilisateurs Auth par le script serveur, avec e-mail automatiquement confirmé.

Prépare un shell serveur local ou un secret manager à partir de [`.env.demo.example`](.env.demo.example), sans jamais ajouter de valeur dans Git :

```bash
export SUPABASE_PROJECT_REF=bzijrulrqhnwycgmhcti
export SUPABASE_URL=https://bzijrulrqhnwycgmhcti.supabase.co
export SUPABASE_SERVICE_ROLE_KEY='<valeur fournie par le gestionnaire de secrets>'
export TECAP_DEMO_PASSWORD='<mot de passe de démo temporaire, 12 caractères minimum>'

pnpm seed:development
pnpm verify:seed
```

Commandes disponibles :

```bash
pnpm seed:development # crée ou met à jour les comptes et fixtures de démo
pnpm verify:seed       # vérifie les volumes minimums du seed
pnpm seed:reset-demo   # supprime uniquement les données tecap.demo+*@example.test
```

Le seed prépare notamment 34 profils (Alex, 30 profils secondaires, Alex Limite, TÉCAP Admin et Staff TÉCAP Night), 16 matches, conversations, messages, statuts actifs/expirés, demandes, notifications, achats de démonstration, boosts, deux événements TÉCAP Night, participants, pass QR, préinscriptions, blocage et signalement fictifs. Les colonnes absentes du schéma — genre, préférences, read-state des messages, capacité d’événement, conversation_id ou heure de début d’un statut — ne sont pas inventées.

Le seed ne peut être exécuté qu’avec `SUPABASE_SERVICE_ROLE_KEY` dans un environnement serveur non versionné. Cette variable n’est jamais utilisée dans le mobile. Le mode backend réel du mobile devra ensuite remplacer progressivement les fixtures Zustand par des requêtes Supabase ; le mode démo local reste conservé comme fallback.

## Variables d’environnement

Les variables mobiles publiques sont dans `apps/mobile/.env.example`. Les variables du dashboard sont dans `apps/admin-web/.env.example`. Le `.env.example` racine sert de catalogue CI/backend et ne doit pas être copié tel quel dans une application.

Les variables `EXPO_PUBLIC_*` et `VITE_*` sont publiques par nature ; les secrets serveur restent dans Supabase Vault, les secrets EAS ou les variables CI.

## Commandes

| Commande                | Usage                                     |
| ----------------------- | ----------------------------------------- |
| `pnpm dev`              | Lance les apps en développement           |
| `pnpm build`            | Build de tous les packages                |
| `pnpm typecheck`        | Vérification TypeScript                   |
| `pnpm lint`             | ESLint                                    |
| `pnpm test`             | Tests unitaires                           |
| `pnpm e2e`              | Tests Detox sur appareil configuré        |
| `pnpm format:check`     | Vérification Prettier                     |
| `pnpm seed:development` | Seed Supabase de développement idempotent |
| `pnpm verify:seed`      | Vérification des données de seed          |
| `pnpm seed:reset-demo`  | Nettoyage ciblé des seules données démo   |

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

## MVP social démontrable

Le mode local-first est maintenant un vrai parcours cliquable et persistant dans AsyncStorage :

- `apps/mobile/src/lib/seedProfiles.ts` contient 30 profils fictifs adultes de Saint-Brieuc, de la côte et des villes voisines ;
- `apps/mobile/src/state/useAppStore.ts` gère les likes, les 25 likes gratuits sur une fenêtre glissante de 24 h, les passes, matchs, messages, demandes « On se capte ce soir ? », notifications, blocages et statuts de soirée ;
- les likes réciproques avec `willMatchOnLike: true` créent un match et une notification ;
- la liste Messages n’affiche que les matchs et la conversation simule la réponse de l’autre membre avec une courte latence ;
- les statuts de soirée sont publiables, modifiables, supprimables et expirent localement ;
- la navigation utilise `MainTabs` et une stack propre par onglet : `DiscoverTab`, `OutingsTab`, `MessagesTab`, `ProfileTab`, `ShopTab` ;
- les routes transverses passent par `apps/mobile/src/navigation/routes.ts`, ce qui évite les appels directs non gérés comme `navigation.navigate('Discover')` depuis une stack enfant ;
- Notifications et Sécurité TÉCAP sont accessibles depuis le profil.

### Démo rapide

1. Lance l’application avec `pnpm --filter @tecap/mobile start` puis entre en mode démo.
2. Dans `Découvrir`, passe quelques profils à gauche ; un pass ne consomme aucun like.
3. Like Léa, Inès ou Camille : le scénario `willMatchOnLike` affiche le match et ajoute la conversation dans `Messages`.
4. Ouvre la conversation, envoie un message et attends la réponse locale simulée.
5. Ouvre `On se capte ce soir ?`, valide une demande puis consulte `Notifications` depuis `Profil`.
6. Publie un statut dans `Sorties` → `T’as quoi de prévu ce soir ?` et vérifie qu’il apparaît dans `Qui sort ce soir ?`.
7. Après 25 likes, `Découvrir` redirige vers `Boutique` sans perdre l’état des tabs.

Pour réinitialiser la démo, utilise le bouton de réinitialisation prévu dans le profil ou supprime la clé AsyncStorage `tecap-demo-state-v2` depuis les outils de développement.

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
