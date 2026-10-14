-- TÉCAP: minimum privilege for profile data, private media, matching and chat.
-- Additive: no user rows are deleted; RLS remains enabled.

-- Profile reads are private by default. Public matching/profile data is returned only
-- through narrowly scoped RPCs below, which omit birth_date and private coordinates.
drop policy if exists profiles_read_same_city on public.profiles;
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff_or_admin());

-- Never allow an authenticated client to assign staff roles or verification flags.
create or replace function public.guard_profile_identity_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.id <> auth.uid() then
      raise exception 'profile owner mismatch' using errcode = '42501';
    end if;
    new.role := 'user';
    new.is_18_plus_verified := new.birth_date <= (current_date - interval '18 years')::date;
  else
    if new.id <> old.id then
      raise exception 'profile id is immutable' using errcode = '42501';
    end if;
    new.role := old.role;
    new.is_18_plus_verified := old.is_18_plus_verified;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_identity_fields on public.profiles;
create trigger profiles_guard_identity_fields
  before insert or update on public.profiles
  for each row execute function public.guard_profile_identity_fields();

revoke insert, update, delete on public.profiles from authenticated;
grant insert (id, first_name, birth_date, city, bio, avatar_path, consent_terms_at,
              consent_notifications_at, consent_sms_at, city_slug, gender, seeking,
              discover_visible, location_consent)
  on public.profiles to authenticated;
grant update (first_name, birth_date, city, bio, avatar_path, consent_notifications_at,
              city_slug, gender, seeking, discover_visible, location_consent)
  on public.profiles to authenticated;

-- Private image objects: first path segment is the immutable auth user UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 8388608,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_view_profile_media(p_owner_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.profiles owner_profile
    join public.profiles viewer on viewer.id = auth.uid()
    where owner_profile.id::text = p_owner_id
      and (
        owner_profile.id = auth.uid()
        or (
          owner_profile.discover_visible
          and owner_profile.city_slug is not null
          and owner_profile.city_slug = viewer.city_slug
          and not exists (
            select 1 from public.blocks b
            where (b.blocker_id = auth.uid() and b.blocked_id = owner_profile.id)
               or (b.blocker_id = owner_profile.id and b.blocked_id = auth.uid())
          )
        )
      )
  );
$$;
revoke all on function public.can_view_profile_media(text) from public;
grant execute on function public.can_view_profile_media(text) to authenticated;

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  object_path text not null unique,
  sort_order smallint not null default 0 check (sort_order between 0 and 9),
  created_at timestamptz not null default now(),
  constraint profile_photo_owner_path check (object_path like user_id::text || '/%')
);
create index if not exists profile_photos_owner_order_idx
  on public.profile_photos(user_id, sort_order, created_at);
alter table public.profile_photos enable row level security;
drop policy if exists profile_photos_visible_read on public.profile_photos;
create policy profile_photos_visible_read on public.profile_photos
  for select to authenticated using (public.can_view_profile_media(user_id::text));
drop policy if exists profile_photos_owner_insert on public.profile_photos;
create policy profile_photos_owner_insert on public.profile_photos
  for insert to authenticated with check (user_id = auth.uid() and object_path like auth.uid()::text || '/%');
drop policy if exists profile_photos_owner_update on public.profile_photos;
create policy profile_photos_owner_update on public.profile_photos
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and object_path like auth.uid()::text || '/%');
drop policy if exists profile_photos_owner_delete on public.profile_photos;
create policy profile_photos_owner_delete on public.profile_photos
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists tecap_profile_photos_read on storage.objects;
create policy tecap_profile_photos_read on storage.objects
  for select to authenticated using (
    bucket_id = 'profile-photos'
    and public.can_view_profile_media(split_part(name, '/', 1))
  );
drop policy if exists tecap_profile_photos_insert on storage.objects;
create policy tecap_profile_photos_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text
  );
drop policy if exists tecap_profile_photos_update on storage.objects;
create policy tecap_profile_photos_update on storage.objects
  for update to authenticated using (
    bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text
  );
drop policy if exists tecap_profile_photos_delete on storage.objects;
create policy tecap_profile_photos_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text
  );

-- A stable client UUID makes retries idempotent. read_at is a message-level read receipt.
alter table public.messages
  add column if not exists client_message_id uuid not null default gen_random_uuid(),
  add column if not exists read_at timestamptz;
create unique index if not exists messages_sender_client_id_uq
  on public.messages(sender_id, client_message_id);
alter table public.messages replica identity full;

-- Discovery RPC does not disclose a full birth date or raw location. It applies both
-- members' stored gender preferences and uses volunteered, unexpired coordinates only
-- inside the server-side distance calculation.
drop function if exists public.get_discover_candidates(text, integer, timestamptz);
create function public.get_discover_candidates(
  p_city_slug text default null,
  p_limit integer default 20,
  p_cursor timestamptz default null
)
returns table (
  profile_id uuid,
  first_name text,
  age integer,
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
declare actor uuid := auth.uid();
begin
  if actor is null then return; end if;
  return query
  with viewer as (
    select p.id, p.city, p.city_slug, p.gender, p.seeking,
      la.initial_radius_km,
      loc.latitude as lat, loc.longitude as lng
    from public.profiles p
    left join public.launch_areas la on la.slug = p.city_slug
    left join public.user_location_private loc on loc.user_id = p.id
      and (loc.expires_at is null or loc.expires_at > now())
    where p.id = actor and p.role = 'user' and p.is_18_plus_verified
  ), ranked as (
    select p.id as profile_id, p.first_name,
      extract(year from age(current_date, p.birth_date))::integer as age,
      p.city, p.city_slug, p.bio, p.avatar_path, p.gender, p.seeking,
      (
        45
        + case when p.city = v.city then 25 else 0 end
        + case when s.user_id is not null then 20 else 0 end
        + case when p.updated_at > now() - interval '7 days' then 10 else 0 end
        + case when distance.km is null then 0 else greatest(0, 15 - least(15, floor(distance.km))) end
      )::numeric as score,
      case
        when s.user_id is not null then 'Disponible ce soir dans ta zone'
        when distance.km is not null and distance.km <= 5 then 'À moins de 5 km · position volontaire'
        when p.city = v.city then 'Dans ta ville'
        else 'Dans une zone voisine ouverte'
      end as score_reason,
      s.status_type, s.venue, s.expires_at as status_expires_at,
      p.updated_at as cursor_updated_at
    from public.profiles p
    cross join viewer v
    left join public.user_location_private loc on loc.user_id = v.id
      and (loc.expires_at is null or loc.expires_at > now())
    cross join lateral (
      select case when loc.latitude is null or loc.longitude is null then null::numeric else
        6371 * 2 * asin(sqrt(
          power(sin(radians(p_loc.latitude::numeric - loc.latitude::numeric) / 2), 2)
          + cos(radians(loc.latitude::numeric)) * cos(radians(p_loc.latitude::numeric))
          * power(sin(radians(p_loc.longitude::numeric - loc.longitude::numeric) / 2), 2)
        )) end as km
      from (select p.latitude as latitude, p.longitude as longitude) p_loc
    ) distance
    left join lateral (
      select es.user_id, es.status_type, es.venue, es.expires_at
      from public.evening_statuses es
      where es.user_id = p.id and es.expires_at > now()
      order by es.created_at desc limit 1
    ) s on true
    where p.id <> actor
      and p.role = 'user' and p.is_18_plus_verified and p.discover_visible
      and (p.city = v.city or (
        p.city_slug = coalesce(p_city_slug, v.city_slug)
        and exists (select 1 from public.launch_areas open_area
                    where open_area.slug = p.city_slug and open_area.is_open)
      ))
      and (loc.latitude is null or distance.km <= coalesce(v.initial_radius_km, 15))
      and (
        lower(coalesce(v.seeking, 'both')) not in ('women','woman','femme','femmes')
        or lower(coalesce(p.gender, '')) in ('women','woman','femme','femmes','female')
      )
      and (
        lower(coalesce(v.seeking, 'both')) not in ('men','man','homme','hommes')
        or lower(coalesce(p.gender, '')) in ('men','man','homme','hommes','male')
      )
      and (
        lower(coalesce(p.seeking, 'both')) not in ('women','woman','femme','femmes')
        or lower(coalesce(v.gender, '')) in ('women','woman','femme','femmes','female')
      )
      and (
        lower(coalesce(p.seeking, 'both')) not in ('men','man','homme','hommes')
        or lower(coalesce(v.gender, '')) in ('men','man','homme','hommes','male')
      )
      and not exists (select 1 from public.swipes sw where sw.actor_id = actor and sw.target_id = p.id)
      and not exists (select 1 from public.blocks b where
        (b.blocker_id = actor and b.blocked_id = p.id)
        or (b.blocker_id = p.id and b.blocked_id = actor))
      and (p_cursor is null or p.updated_at < p_cursor)
  )
  select * from ranked
  order by ranked.score desc, ranked.cursor_updated_at desc, ranked.profile_id
  limit greatest(1, least(coalesce(p_limit, 20), 50));
end;
$$;
revoke all on function public.get_discover_candidates(text, integer, timestamptz) from public;
grant execute on function public.get_discover_candidates(text, integer, timestamptz) to authenticated;

create or replace function public.get_match_profiles(p_match_ids uuid[])
returns table (
  match_id uuid, profile_id uuid, first_name text, age integer, city text,
  bio text, avatar_path text, gender text, seeking text
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, p.id, p.first_name,
    extract(year from age(current_date, p.birth_date))::integer,
    p.city, p.bio, p.avatar_path, p.gender, p.seeking
  from public.matches m
  join public.profiles viewer on viewer.id = auth.uid()
  join public.profiles p on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where auth.uid() is not null
    and m.id = any(coalesce(p_match_ids, array[]::uuid[]))
    and (m.user_a = auth.uid() or m.user_b = auth.uid())
    and not exists (select 1 from public.blocks b where
      (b.blocker_id = auth.uid() and b.blocked_id = p.id)
      or (b.blocker_id = p.id and b.blocked_id = auth.uid()));
$$;
revoke all on function public.get_match_profiles(uuid[]) from public;
grant execute on function public.get_match_profiles(uuid[]) to authenticated;

-- Atomic swipe: serialize one actor's writes, enforce the rolling 24-hour quota from
-- actual like rows, reject either-direction blocks, and return the real match ID.
create or replace function public.record_swipe(target_id uuid, direction text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  existing_direction text;
  likes_used_count integer;
  premium_active boolean;
  matched_match_id uuid;
begin
  if actor is null then return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'unauthorized'); end if;
  if target_id is null or target_id = actor or direction not in ('like', 'pass') then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'invalid_target');
  end if;
  select * into actor_profile from public.profiles where id = actor for update;
  if not found or actor_profile.role <> 'user' or not actor_profile.is_18_plus_verified then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'profile_incomplete');
  end if;
  select * into target_profile from public.profiles
    where id = target_id and role = 'user' and is_18_plus_verified and discover_visible;
  if not found then return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'profile_not_found'); end if;
  if exists (select 1 from public.blocks b where
    (b.blocker_id = actor and b.blocked_id = target_id)
    or (b.blocker_id = target_id and b.blocked_id = actor)) then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'blocked');
  end if;
  select s.direction into existing_direction from public.swipes s
    where s.actor_id = actor and s.target_id = target_id;
  if existing_direction is not null then
    select m.id into matched_match_id from public.matches m
      where m.user_a = least(actor, target_id) and m.user_b = greatest(actor, target_id);
    return jsonb_build_object('allowed', true, 'matched', matched_match_id is not null,
      'match_id', matched_match_id, 'reason', 'already_recorded');
  end if;

  if direction = 'like' then
    select exists (select 1 from public.purchases p
      where p.user_id = actor and p.status = 'active'
        and p.product_id ilike '%premium%'
        and (p.expires_at is null or p.expires_at > now())) into premium_active;
    select count(*)::integer into likes_used_count from public.swipes s
      where s.actor_id = actor and s.direction = 'like'
        and s.created_at > now() - interval '24 hours';
    if not coalesce(premium_active, false) and likes_used_count >= 25 then
      return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'daily_limit');
    end if;
  end if;

  insert into public.swipes(actor_id, target_id, direction) values (actor, target_id, direction);
  select m.id into matched_match_id from public.matches m
    where m.user_a = least(actor, target_id) and m.user_b = greatest(actor, target_id);
  return jsonb_build_object('allowed', true, 'matched', matched_match_id is not null,
    'match_id', matched_match_id, 'reason', 'recorded');
end;
$$;
revoke all on function public.record_swipe(uuid, text) from public;
grant execute on function public.record_swipe(uuid, text) to authenticated;
revoke insert, update, delete on public.swipes from authenticated;

create or replace function public.send_chat_message(
  p_match_id uuid, p_body text, p_client_message_id uuid
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := auth.uid(); saved public.messages%rowtype;
begin
  if actor is null then raise exception 'auth required' using errcode = '42501'; end if;
  if p_match_id is null or p_client_message_id is null or p_body is null
     or char_length(btrim(p_body)) < 1 or char_length(p_body) > 2000 then
    raise exception 'invalid message' using errcode = '22023';
  end if;
  if not exists (select 1 from public.matches m where m.id = p_match_id
      and (m.user_a = actor or m.user_b = actor)) then
    raise exception 'conversation unavailable' using errcode = '42501';
  end if;
  if exists (select 1 from public.matches m join public.blocks b on
      (b.blocker_id = least(m.user_a,m.user_b) and b.blocked_id = greatest(m.user_a,m.user_b))
      or (b.blocker_id = greatest(m.user_a,m.user_b) and b.blocked_id = least(m.user_a,m.user_b))
      where m.id = p_match_id) then
    raise exception 'conversation unavailable' using errcode = '42501';
  end if;
  insert into public.messages(match_id, sender_id, body, client_message_id)
    values (p_match_id, actor, btrim(p_body), p_client_message_id)
    on conflict (sender_id, client_message_id) do nothing;
  select * into saved from public.messages
    where sender_id = actor and client_message_id = p_client_message_id;
  if not found or saved.match_id <> p_match_id or saved.body <> btrim(p_body) then
    raise exception 'idempotency key reused with different content' using errcode = '22023';
  end if;
  return saved;
end;
$$;
revoke all on function public.send_chat_message(uuid, text, uuid) from public;
grant execute on function public.send_chat_message(uuid, text, uuid) to authenticated;
revoke insert, update, delete on public.messages from authenticated;

create or replace function public.mark_conversation_read(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare actor uuid := auth.uid(); changed integer;
begin
  if actor is null or not exists (select 1 from public.matches m where m.id = p_match_id
      and (m.user_a = actor or m.user_b = actor)) then
    raise exception 'conversation unavailable' using errcode = '42501';
  end if;
  update public.messages set read_at = now()
    where match_id = p_match_id and sender_id <> actor and read_at is null;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.get_unread_message_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.messages msg
  join public.matches m on m.id = msg.match_id
  where auth.uid() is not null and msg.sender_id <> auth.uid() and msg.read_at is null
    and (m.user_a = auth.uid() or m.user_b = auth.uid());
$$;
revoke all on function public.get_unread_message_count() from public;
grant execute on function public.get_unread_message_count() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
                     and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
