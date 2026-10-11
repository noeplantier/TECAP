-- TÉCAP — durcissement performance de la carte et de Supabase Realtime.
-- Migration additive : aucun contenu utilisateur n’est supprimé.

-- Accélère la requête de carte par ville, publication et ordre d’affichage.
create index if not exists points_of_interest_map_order_idx
  on public.points_of_interest (
    city_slug,
    is_published,
    is_premium desc,
    participant_count desc,
    name
  );

-- Le client n’a besoin que de la nouvelle ligne pour rafraîchir ses POI.
-- REPLICA IDENTITY FULL augmente inutilement la taille des messages UPDATE/DELETE.
alter table public.points_of_interest replica identity default;

-- Évite une policy permissive FOR ALL qui se cumule avec la policy SELECT.
drop policy if exists points_of_interest_staff_write on public.points_of_interest;
drop policy if exists points_of_interest_staff_insert on public.points_of_interest;
drop policy if exists points_of_interest_staff_update on public.points_of_interest;
drop policy if exists points_of_interest_staff_delete on public.points_of_interest;

create policy points_of_interest_staff_insert
  on public.points_of_interest
  for insert to authenticated
  with check (public.is_staff_or_admin());

create policy points_of_interest_staff_update
  on public.points_of_interest
  for update to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy points_of_interest_staff_delete
  on public.points_of_interest
  for delete to authenticated
  using (public.is_staff_or_admin());

analyze public.points_of_interest;
analyze public.evening_statuses;
