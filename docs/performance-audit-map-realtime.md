# Audit performance — carte TÉCAP et Supabase Realtime

**Date :** 11 octobre 2026
**Projet :** `bzijrulrqhnwycgmhcti` — environnement Supabase de développement
**Branche :** `feat/tecap-wireframe-parity-map-poi`

## Conclusion exécutive

La carte ne présente pas de latence bloquante dans le build testé. Le principal problème trouvé n’était pas Leaflet lui-même : la navigation conservait **deux cartes Leaflet montées simultanément** lorsqu’on ouvrait la carte complète depuis Sorties. Cela doublait les markers et les tuiles.

Le correctif livré :

- démonte la preview Leaflet lorsque l’écran Sorties perd le focus ;
- conserve une seule instance de carte et ses markers dans l’écran Map ;
- filtre les événements Realtime par ville ;
- regroupe les invalidations Realtime dans une fenêtre de 250 ms ;
- mémoïse les POI, markers visibles, compteurs et région de carte ;
- adapte les durées de cache selon la volatilité des données ;
- évite la rerasterisation permanente des markers natifs ;
- ajoute un index d’ordre d’affichage POI et réduit le payload Realtime UPDATE/DELETE avec `REPLICA IDENTITY DEFAULT` ;
- sépare les policies RLS POI par opération afin d’éviter une policy permissive `FOR ALL` concurrente avec la policy de lecture.

> Il est impossible de garantir « zéro latence » sur tous les téléphones, réseaux et zones géographiques. Les mesures ci-dessous sont reproductibles sur le sandbox et le projet de développement, mais un p95 de production nécessite une charge représentative et de vrais appareils.

## Mesures navigateur

Mesure réalisée sur l’export Expo Web local, route `/outings/map`, navigateur sandbox :

| Indicateur | Avant correction | Après correction |
|---|---:|---:|
| Instances `.leaflet-container` | 2 | 1 |
| Markers DOM | 14 | 7 |
| Tuiles OSM observées | doublées lors de la double carte | 7 |
| `DOMContentLoaded` | — | 592 ms |
| `loadEventEnd` | — | 598 ms |
| Bundle JS transféré | — | 2,807,824 octets |
| Bundle JS brut | 2.68 MiB | environ 2.68 MiB |
| Bundle JS gzip | — | 732,242 octets |
| Durée moyenne tuile OSM | — | 25 ms |
| Durée maximale tuile OSM | — | 46 ms |

La durée des tuiles est celle observée dans ce test ; OpenStreetMap public ne constitue pas un SLA. La latence réelle dépendra de la région, de la connectivité et d’un éventuel fournisseur de tuiles en production.

## Correctifs frontend

### 1. Navigation et instances Leaflet

`EventsHubScreen` utilise maintenant `useIsFocused()` : la preview carte n’est rendue que lorsque l’onglet Sorties est réellement actif. Quand l’utilisateur ouvre la carte complète, la carte de la page précédente est démontée. Le test DOM confirme le passage de **2 cartes / 14 markers** à **1 carte / 7 markers**.

### 2. Leaflet Web

La configuration Leaflet utilise maintenant :

- `preferCanvas: true` ;
- `updateWhenIdle: true` ;
- `updateWhenZooming: false` ;
- `keepBuffer: 1`.

Cela limite les recalculs et les téléchargements de tuiles pendant un zoom ou un déplacement rapide, sans supprimer l’interaction.

### 3. Cache React Query

Les données carte sont séparées par volatilité :

- zones : cache 10 minutes, garbage collection 30 minutes ;
- POI : cache 5 minutes, garbage collection 30 minutes ;
- hotspots de soirée : cache 15 secondes, garbage collection 5 minutes ;
- refetch automatique au focus navigateur désactivé sur ces queries.

Les données continuent d’être rafraîchies via Realtime et les actions explicites de l’utilisateur.

### 4. Realtime

Le channel carte :

- écoute uniquement les POI de la ville active avec `city_slug=eq.<ville>` ;
- écoute uniquement les statuts de la ville active avec `city=eq.<ville>` ;
- regroupe les rafraîchissements pendant 250 ms ;
- conserve deux invalidations distinctes si POI et hotspots arrivent dans la même fenêtre ;
- annule le timer et supprime le channel lors du démontage.

Cette stratégie évite le « refetch storm » lors d’une série d’updates administratifs ou d’une expiration groupée de statuts.

### 5. Native

Les markers natifs désactivent `tracksViewChanges` après leur création afin d’éviter une rerasterisation coûteuse à chaque rendu React.

## Mesures Supabase

### État de données au moment de l’audit

| Table | Volume |
|---|---:|
| `points_of_interest` | 7 |
| `evening_statuses` | 0 |

Le volume est encore trop faible pour simuler une charge production. L’absence de statut explique aussi pourquoi un benchmark hotspots réel n’est pas représentatif.

### Requête POI

Requête mesurée : POI publiés de Saint-Brieuc, triés par premium, nombre de participants puis nom, avec limite 100.

- Avant migration : **1.336 ms** d’exécution, 13 blocs partagés touchés, scan index puis tri mémoire.
- Après migration : **0.127 ms** dans l’environnement courant, 12 blocs partagés touchés.
- Le planner choisit actuellement un sequential scan car la table ne contient que 7 lignes ; c’est normal et plus efficace à cette taille.
- L’index ajouté `points_of_interest_map_order_idx` devient utile lorsque le volume augmente et couvre la ville, la publication et l’ordre d’affichage.

### RLS et Realtime

Vérifications effectuées :

- `points_of_interest` et `evening_statuses` sont publiées dans `supabase_realtime` ;
- `points_of_interest` est en `REPLICA IDENTITY DEFAULT` après migration ;
- la policy POI de lecture est séparée des policies staff `INSERT`, `UPDATE`, `DELETE` ;
- la migration `map_realtime_performance` est appliquée sur le projet cible.

### Advisor Supabase

L’advisor performance a également signalé des sujets généraux à traiter dans une passe séparée :

- 14 clés étrangères sans index couvrant ;
- 27 policies avec réévaluation de `auth.*` par ligne ;
- 4 cas de policies permissives multiples ;
- 1 paire d’index identiques sur `messages` ;
- 15 index non encore utilisés.

Ces alertes ne bloquent pas la carte actuelle. Les index « non utilisés » sont attendus en partie car le projet de développement contient encore très peu de données. Les optimisations RLS globales doivent être traitées avec des tests de permissions complets, pas au milieu de cette optimisation ciblée.

`pg_stat_statements` est activé, mais les statistiques disponibles pendant cet audit contiennent principalement les migrations et les `EXPLAIN` de vérification, pas encore un trafic réel de l’application. Aucun p95 de production ne peut donc être déduit à ce stade.

## Validation

Commandes exécutées avec succès :

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm lint
pnpm --filter @tecap/mobile run export:web
```

Résultats :

- TypeScript : 4 packages validés ;
- tests : 4 suites, 9 tests réussis ;
- lint : 4 packages validés ;
- export Expo Web : réussi ;
- audit DOM : 1 carte Leaflet et 7 markers sur `/outings/map`.

## Prochaines mesures recommandées avant production

1. Faire un test de charge avec au moins 10 000 POI/stats synthétiques et mesurer p50/p95/p99.
2. Ajouter des métriques client : temps d’affichage de la première carte, durée de la première tuile, nombre de refetch Realtime et erreurs de channel.
3. Servir les tuiles depuis un fournisseur avec SLA et cache CDN si le produit sort du prototype.
4. Réduire le bundle Expo Web, actuellement autour de 2.8 MB brut, par découpage de routes ou réduction des assets/icônes chargés.
5. Traiter séparément les 14 foreign keys et l’optimisation des policies RLS après ajout de tests d’autorisation.
