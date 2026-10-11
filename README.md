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

### Déploiement Netlify de l’application mobile Web

La configuration [`netlify.toml`](netlify.toml) à la racine déploie exclusivement `@tecap/mobile` en Expo Web statique. Elle ne référence jamais `apps/admin-web`, qui reste une application séparée pouvant être publiée sur un autre site Netlify.

Paramètres Netlify exacts :

| Paramètre         | Valeur                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Repository        | `noeplantier/TECAP`                                                                                                                  |
| Branch            | `feat/tecap-expo-web-netlify`                                                                                                        |
| Base directory    | `.`                                                                                                                                  |
| Build command     | `npm install --global pnpm@9.15.5 && pnpm --version && pnpm install --frozen-lockfile && pnpm --filter @tecap/mobile run export:web` |
| Publish directory | `apps/mobile/dist`                                                                                                                   |
| Node              | `22.13.0`                                                                                                                            |
| pnpm              | `9.15.5`                                                                                                                             |

Le build épingle pnpm avec `npm install --global` plutôt qu’avec `corepack prepare` : l’environnement Node 22 validé ici renvoie une erreur de signature Corepack avant installation. Cette variante conserve exactement pnpm 9.15.5 et a été exécutée avec succès sur le monorepo.

La sortie vérifiée est `apps/mobile/dist` et contient `index.html`, le bundle `_expo/static/js/web/` et `_redirects`. La règle SPA `/* /index.html 200` est définie dans `netlify.toml` et `apps/mobile/public/_redirects`, afin que les rafraîchissements directs ne chargent jamais OPS CONSOLE.

Variables publiques facultatives à créer sur Netlify :

```text
EXPO_PUBLIC_USE_SUPABASE=true
EXPO_PUBLIC_SUPABASE_URL=https://bzijrulrqhnwycgmhcti.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<clé publishable/anon>
EXPO_PUBLIC_APP_ENV=preview
```

Si elles sont absentes, l’export fonctionne en mode démo. Ne jamais ajouter `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_TOKEN`, les clés APNs, `ONESIGNAL_REST_API_KEY`, `SENTRY_AUTH_TOKEN` ou un secret Stripe dans Netlify ou dans le bundle Web. Après modification d’un ancien site, utiliser **Clear cache and deploy site**.

## Backend Supabase

1. Créer un projet Supabase.
2. Exécuter les migrations `0001_init.sql`, `0002_social_mvp.sql`, `0003_backend_actions.sql`, `0004_realtime_geo_discovery.sql`, `0005_catch_notifications.sql` et `0006_points_of_interest.sql` dans l’éditeur SQL ou avec la Supabase CLI.
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
- migrations appliquées : `init_p0`, `social_mvp`, `backend_actions`, `realtime_geo_discovery`, `catch_notifications`, `points_of_interest` ;
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

Quand `EXPO_PUBLIC_USE_SUPABASE=true`, l’application utilise Supabase pour l’OTP, la découverte scorée par RPC, les profils éligibles, les swipes atomiques, les quotas de likes, les matches, les messages avec Realtime, les statuts de soirée, les hotspots agrégés, les événements publiés, les notifications et la lecture des entitlements. Le mode local reste un fallback explicite pour les maquettes et les tests sans réseau.

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

Le seed prépare notamment 34 profils (Alex, 30 profils secondaires, Alex Limite, TÉCAP Admin et Staff TÉCAP Night), 16 matches, conversations, messages, 23 statuts dont trois groupes de hotspots anonymisés à Saint-Brieuc, demandes, notifications, achats de démonstration, boosts, deux événements TÉCAP Night, participants, pass QR, préinscriptions, blocage et signalement fictifs. Les colonnes absentes du schéma — genre, préférences, read-state des messages, capacité d’événement, conversation_id ou heure de début d’un statut — ne sont pas inventées.

Le seed ne peut être exécuté qu’avec `SUPABASE_SERVICE_ROLE_KEY` dans un environnement serveur non versionné. Cette variable n’est jamais utilisée dans le mobile. Les écrans backend principaux sont déjà branchés sur Supabase ; les fixtures Zustand restent un fallback explicite lorsque `EXPO_PUBLIC_USE_SUPABASE=false`.

### Discovery, carte et confidentialité géographique

- `get_discover_candidates` calcule côté serveur un score explicable : même zone, statut actif ce soir, fraîcheur du profil et visibilité volontaire. Il exclut l’utilisateur courant, les swipes déjà enregistrés, les blocages mutuels et les profils invisibles. Le curseur `p_cursor` repose sur `updated_at` et la page est plafonnée à 50 résultats.
- `launch_areas` rend Saint-Brieuc active et prépare Guingamp/Rennes fermées. Le mobile lit la zone ouverte au lieu de dériver une ville depuis une coordonnée.
- `user_location_private` ne contient une position que lorsque l’utilisateur l’autorise. La RLS limite toutes les opérations au propriétaire ; les RPC publiques ne retournent jamais ses coordonnées.
- La carte affiche uniquement des hotspots publics agrégés avec un seuil d’au moins trois membres, filtrés par visibilité et blocages. Les marqueurs de démonstration représentent des lieux publics approximatifs, pas les positions de membres.
- La permission Expo est foreground/When In Use, demandée depuis `Sorties > Carte` ou `Profil > Ma zone`, jamais au lancement. `Supprimer ma position` efface la ligne privée et réinitialise le consentement.
- `react-native-maps` est utilisé sur iOS/Android dans un development build ; le Web utilise Leaflet avec de vraies tuiles OpenStreetMap, zoom, déplacement, attribution et recadrage Saint-Brieuc, sans clé commerciale. Les tuiles sont filtrées en ambiance nocturne côté Web. En mode `__DEV__`, `Simuler Saint-Brieuc` permet de tester le centrage sans GPS du simulateur.

### POI publics et carte TÉCAP

La migration `0006_points_of_interest.sql` ajoute une table additive `points_of_interest` pour les lieux et événements publics :

- `tecap_event` : TÉCAP Night et événements gold ;
- `bar`, `restaurant`, `club`, `concert` : lieux de démonstration autour de Saint-Brieuc ;
- `hotspot` : zones agrégées sans position individuelle ;
- `user_plan` : extension prévue pour un plan explicitement rendu visible.

La table est protégée par RLS : lecture uniquement des POI publiés pour les membres authentifiés, écriture réservée aux comptes staff/admin. Les coordonnées de démonstration sont approximatives et aucun membre n’est placé à sa position privée. Les index couvrent la ville, la catégorie, la publication et les dates d’événement. La table est ajoutée à Realtime lorsque la publication Supabase est disponible.

Le mobile charge les POI via `get_points_of_interest` avec TanStack Query, écoute les changements `points_of_interest` et `evening_statuses` via Supabase Realtime, puis revient aux fixtures locales si le backend est désactivé ou si l’environnement n’a pas encore la table. Un tap sur un marker ouvre un bottom sheet premium avec catégorie, nombre de participants, horaires éventuels et CTA. Pour ajouter une ville, insérer une ligne ouverte dans `launch_areas`, puis ajouter ses POI avec le même `city_slug` : le composant ne code pas Saint-Brieuc comme seule ville.

### Notifications et Realtime

- Les triggers SQL créent des notifications in-app pour les matches, messages et demandes « On se capte ce soir ? » sans appel réseau bloquant. `notifications` reste RLS par utilisateur et est publié dans Realtime.
- Le mobile hydrate le centre depuis Supabase, marque les notifications lues, écoute les inserts Realtime, affiche une notification locale si la permission est accordée et redirige les taps vers les stacks imbriquées `MessagesTab`, `OutingsTab` ou `ShopTab`.
- Le panneau `Profil > Démo notifications` est disponible seulement en `__DEV__` et déclenche `match`, `message`, `catch` ou `system` dans le centre in-app et au niveau système si supporté.
- Les notifications locales sont testables sur un simulateur iOS après autorisation. Les push distantes Expo/APNs exigent un `EXPO_PUBLIC_EAS_PROJECT_ID`, un development/production build et des credentials Apple ; elles ne sont pas garanties dans Expo Go ou sur tous les simulateurs. Aucun token secret n’est stocké dans Git.

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
- écran Sorties avec intentions volontaires, vraie carte interactive OpenStreetMap, POI, bottom sheets et TÉCAP Night ;
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
