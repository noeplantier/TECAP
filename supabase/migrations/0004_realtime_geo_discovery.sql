-- TÉCAP — discovery, zones de lancement, géolocalisation privée et événements temps réel.
-- Migration additive : aucune table métier existante n’est supprimée et la RLS reste active.

create table if not exists public.launch_areas (
  slug text primary key,
  name text not null,
  department text not null,
  country_code text not null default 'FR',
  timezone text not null default 'Europe/Paris',
  center_lat numeric(8, 5) not null,
  center_lng numeric(8, 5) not null,
  initial_radius_km numeric(6, 2) not null default 15,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.launch_areas (slug, name, department, center_lat, center_lng, initial_radius_km, is_open)
values
  ('saint-brieuc', 'Saint-Brieuc', 'Côtes-d’Armor', 48.5142, -2.7658, 15, true),
  ('guingamp', 'Guingamp', 'Côtes-d’Armor', 48.5620, -3.1460, 15, false),
  ('rennes', 'Rennes', 'Ille-et-Vilaine', 48.1173, -1.6778, 20, false)
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  initial_radius_km = excluded.initial_radius_km,
  is_open = excluded.is_open;

alter table public.profiles add column if not exists city_slug text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists seeking text;
alter table public.profiles add column if not exists discover_visible boolean not null default true;
alter table public.profiles add column if not exists location_consent boolean not null default false;

update public.profiles
set city_slug = case
  when lower(city) = 'saint-brieuc' then 'saint-brieuc'
  when lower(city) = 'guingamp' then 'guingamp'
  when lower(city) = 'rennes' then 'rennes'
  else null
end
where city_slug is null;

create index if not exists profiles_discovery_idx
  on public.profiles (city_slug, discover_visible, updated_at desc);
create index if not exists swipes_actor_created_idx
  on public.swipes (actor_id, created_at desc);
create index if not exists blocks_blocked_idx
  on public.blocks (blocked_id, blocker_id);

alter table public.launch_areas enable row level security;
drop policy if exists launch_areas_read_open on public.launch_areas;
create policy launch_areas_read_open on public.launch_areas
  for select to authenticated using (is_open or public.is_staff_or_admin());

create table if not exists public.user_location_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude numeric(8, 5) not null check (latitude between -90 and 90),
  longitude numeric(8, 5) not null check (longitude between -180 and 180),
  accuracy_m integer check (accuracy_m is null or accuracy_m >= 0),
  consented_at timestamptz not null,
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists user_location_private_expiry_idx
  on public.user_location_private (expires_at, updated_at);
alter table public.user_location_private enable row level security;
drop policy if exists private_location_owner on public.user_location_private;
create policy private_location_owner on public.user_location_private
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('expo', 'apns', 'fcm')),
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text,
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, token)
);

create index if not exists device_push_tokens_user_idx
  on public.device_push_tokens (user_id, disabled_at, last_seen_at desc);
alter table public.device_push_tokens enable row level security;
drop policy if exists push_tokens_owner on public.device_push_tokens;
create policy push_tokens_owner on public.device_push_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.get_discover_candidates(
  p_city_slug text default null,
  p_limit integer default 20,
  p_cursor timestamptz default null
)
returns table (
  profile_id uuid,
  first_name text,
  birth_date date,
  city text,
  city_slug text,
  bio text,
  avatar_path text,
  gender text,
  seeking text,
  score numeric,
  score_reason text,
  status_type text,
  venue text,
  status_expires_at timestamptz,
  cursor_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_city text;
  actor_city_slug text;
begin
  if actor is null then return; end if;
  select p.city, p.city_slug into actor_city, actor_city_slug
  from public.profiles p where p.id = actor;
  if actor_city is null then return; end if;

  return query
  with ranked as (
    select
      p.id as profile_id,
      p.first_name,
      p.birth_date,
      p.city,
      p.city_slug,
      p.bio,
      p.avatar_path,
      p.gender,
      p.seeking,
      (
        45
        + case when p.city = actor_city then 25 else 0 end
        + case when s.user_id is not null then 20 else 0 end
        + case when p.updated_at > now() - interval '7 days' then 10 else 0 end
      )::numeric as score,
      case
        when s.user_id is not null then 'Disponible ce soir dans ta zone'
        when p.city = actor_city then 'Dans ta ville'
        else 'Dans une zone voisine ouverte'
      end as score_reason,
      s.status_type,
      s.venue,
      s.expires_at as status_expires_at,
      p.updated_at as cursor_updated_at
    from public.profiles p
    left join lateral (
      select es.user_id, es.status_type, es.venue, es.expires_at
      from public.evening_statuses es
      where es.user_id = p.id and es.expires_at > now()
      order by es.created_at desc
      limit 1
    ) s on true
    where p.id <> actor
      and p.role = 'user'
      and p.is_18_plus_verified
      and p.discover_visible
      and (p.city = actor_city or p.city_slug = coalesce(p_city_slug, actor_city_slug))
      and not exists (
        select 1 from public.swipes sw
        where sw.actor_id = actor and sw.target_id = p.id
      )
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = actor and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = actor)
      )
      and (p_cursor is null or p.updated_at < p_cursor)
  )
  select * from ranked
  order by ranked.score desc, ranked.cursor_updated_at desc, ranked.profile_id
  limit greatest(1, least(coalesce(p_limit, 20), 50));
end;
$$;

grant execute on function public.get_discover_candidates(text, integer, timestamptz) to authenticated;

create or replace function public.get_evening_hotspots(
  p_city_slug text default null,
  p_min_members integer default 3,
  p_limit integer default 30
)
returns table (
  city text,
  venue text,
  activity_type text,
  member_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    es.city,
    coalesce(es.venue, 'Zone sans lieu précis') as venue,
    es.status_type as activity_type,
    count(*)::bigint as member_count
  from public.evening_statuses es
  join public.profiles viewer on viewer.id = auth.uid()
  join public.profiles member on member.id = es.user_id and member.discover_visible
  where auth.uid() is not null
    and es.expires_at > now()
    and (es.city = viewer.city or es.city = (select la.name from public.launch_areas la where la.slug = p_city_slug and la.is_open))
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = es.user_id)
         or (b.blocker_id = es.user_id and b.blocked_id = auth.uid())
    )
  group by es.city, coalesce(es.venue, 'Zone sans lieu précis'), es.status_type
  having count(*) >= greatest(1, coalesce(p_min_members, 3))
  order by count(*) desc, es.city, venue
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

grant execute on function public.get_evening_hotspots(text, integer, integer) to authenticated;

create or replace function public.notify_match_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_a text;
  first_b text;
begin
  select first_name into first_a from public.profiles where id = new.user_a;
  select first_name into first_b from public.profiles where id = new.user_b;
  insert into public.notifications (user_id, type, title, body, data)
  values
    (new.user_a, 'match', 'C’est un match !', format('Toi et %s vous vous plaisez. Lance la conversation.', first_b), jsonb_build_object('matchId', new.id, 'route', 'Conversation')),
    (new.user_b, 'match', 'C’est un match !', format('Toi et %s vous vous plaisez. Lance la conversation.', first_a), jsonb_build_object('matchId', new.id, 'route', 'Conversation'));
  return new;
end;
$$;

drop trigger if exists matches_notification_trigger on public.matches;
create trigger matches_notification_trigger
after insert on public.matches
for each row execute function public.notify_match_created();

create or replace function public.notify_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
begin
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end
    into recipient
  from public.matches m where m.id = new.match_id;
  select first_name into sender_name from public.profiles where id = new.sender_id;
  if recipient is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      recipient,
      'message',
      'Nouveau message de ' || coalesce(sender_name, 'ton match'),
      left(new.body, 140),
      jsonb_build_object('matchId', new.match_id, 'route', 'Conversation')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists messages_notification_trigger on public.messages;
create trigger messages_notification_trigger
after insert on public.messages
for each row execute function public.notify_message_created();

revoke execute on function public.get_discover_candidates(text, integer, timestamptz) from public;
grant execute on function public.get_discover_candidates(text, integer, timestamptz) to authenticated;
revoke execute on function public.get_evening_hotspots(text, integer, integer) from public;
grant execute on function public.get_evening_hotspots(text, integer, integer) to authenticated;
revoke execute on function public.record_swipe(uuid, text) from public;
grant execute on function public.record_swipe(uuid, text) to authenticated;
revoke execute on function public.notify_match_created() from public;
revoke execute on function public.notify_message_created() from public;
