-- TÉCAP — points d’intérêt publics pour la vraie carte sociale.
-- Migration additive et idempotente : aucune donnée privée n’est stockée dans cette table.

create table if not exists public.points_of_interest (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null references public.launch_areas(slug),
  category text not null check (category in ('tecap_event', 'bar', 'restaurant', 'club', 'concert', 'hotspot', 'user_plan')),
  name text not null,
  subtitle text not null,
  description text not null,
  latitude numeric(8, 5) not null check (latitude between -90 and 90),
  longitude numeric(8, 5) not null check (longitude between -180 and 180),
  participant_count integer not null default 0 check (participant_count >= 0),
  accent text not null check (accent in ('pink', 'gold', 'magenta')),
  icon text not null,
  is_premium boolean not null default false,
  is_published boolean not null default false,
  starts_at timestamptz,
  action text not null check (action in ('event', 'outings', 'invite', 'profile')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, name)
);

create index if not exists points_of_interest_city_category_idx
  on public.points_of_interest (city_slug, category, is_published);
create index if not exists points_of_interest_published_starts_idx
  on public.points_of_interest (is_published, starts_at);

alter table public.points_of_interest enable row level security;
drop policy if exists points_of_interest_read_published on public.points_of_interest;
create policy points_of_interest_read_published
  on public.points_of_interest
  for select to authenticated
  using (is_published or public.is_staff_or_admin());
drop policy if exists points_of_interest_staff_write on public.points_of_interest;
create policy points_of_interest_staff_write
  on public.points_of_interest
  for all to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create or replace function public.get_points_of_interest(
  p_city_slug text default 'saint-brieuc',
  p_category text default null,
  p_limit integer default 100
)
returns setof public.points_of_interest
language sql
security definer
set search_path = public
as $$
  select poi.*
  from public.points_of_interest poi
  join public.launch_areas area on area.slug = poi.city_slug and area.is_open
  where poi.is_published
    and poi.city_slug = coalesce(p_city_slug, 'saint-brieuc')
    and (p_category is null or poi.category = p_category)
  order by poi.is_premium desc, poi.participant_count desc, poi.name
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke execute on function public.get_points_of_interest(text, text, integer) from public;
grant execute on function public.get_points_of_interest(text, text, integer) to authenticated;

-- Démonstration publique non privée : coordonnées approximatives autour du centre-ville.
insert into public.points_of_interest (
  city_slug, category, name, subtitle, description, latitude, longitude,
  participant_count, accent, icon, is_premium, is_published, starts_at, action
)
values
  ('saint-brieuc', 'bar', 'Le Velvet Bar', 'Bar · 7 plans partagés', 'Un point de rendez-vous démo pour partager un verre ce soir.', 48.51340, -2.76810, 7, 'pink', '🍸', false, true, null, 'outings'),
  ('saint-brieuc', 'restaurant', 'La Verrière', 'Restaurant · 4 plans partagés', 'Adresse de démonstration pour dîner et prolonger la soirée.', 48.51190, -2.76450, 4, 'pink', '🍽', false, true, null, 'outings'),
  ('saint-brieuc', 'club', 'Club Horizon', 'Club · 11 personnes ce soir', 'Hotspot nocturne démo avec ambiance club et DJ set.', 48.51810, -2.75940, 11, 'magenta', '✦', true, true, null, 'outings'),
  ('saint-brieuc', 'concert', 'Concert en ville', 'Concert · 8 personnes intéressées', 'Événement de démonstration en centre-ville.', 48.51630, -2.76270, 8, 'pink', '♫', false, true, null, 'event'),
  ('saint-brieuc', 'tecap_event', 'TÉCAP Night', 'Événement TÉCAP · 26 participants', 'Événement de démonstration TÉCAP Night à Saint-Brieuc.', 48.51520, -2.76970, 26, 'gold', '♛', true, true, now() + interval '1 day', 'event'),
  ('saint-brieuc', 'hotspot', 'Hotspot centre-ville', '7 partants pour un verre', 'Zone agrégée : aucune position individuelle n’est affichée.', 48.51480, -2.76520, 7, 'pink', '◎', false, true, null, 'outings'),
  ('saint-brieuc', 'hotspot', 'Hotspot nocturne', '11 personnes en soirée', 'Zone agrégée autour d’une ambiance club / DJ set.', 48.51760, -2.76080, 11, 'magenta', '✧', false, true, null, 'outings')
on conflict (city_slug, name) do update set
  category = excluded.category,
  subtitle = excluded.subtitle,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  participant_count = excluded.participant_count,
  accent = excluded.accent,
  icon = excluded.icon,
  is_premium = excluded.is_premium,
  is_published = excluded.is_published,
  starts_at = excluded.starts_at,
  action = excluded.action,
  updated_at = now();

alter table public.points_of_interest replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'points_of_interest'
     ) then
    alter publication supabase_realtime add table public.points_of_interest;
  end if;
end;
$$;
