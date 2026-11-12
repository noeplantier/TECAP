-- TÉCAP — correctif discovery + permissions explicites pour fonctions SECURITY DEFINER.
-- Aucun historique de coordonnées n’est retourné au client; seules les coordonnées volontaires
-- et non expirées sont utilisées dans le calcul interne.

create or replace function public.get_discover_candidates(
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
      coalesce(la.initial_radius_km, 15)::numeric as radius_km,
      own_loc.latitude::numeric as lat,
      own_loc.longitude::numeric as lng
    from public.profiles p
    left join public.launch_areas la on la.slug = p.city_slug
    left join public.user_location_private own_loc
      on own_loc.user_id = p.id
      and own_loc.expires_at > now()
    where p.id = actor and p.role = 'user' and p.is_18_plus_verified
  ), ranked as (
    select p.id as profile_id,
      p.first_name,
      extract(year from age(current_date, p.birth_date))::integer as age,
      p.city, p.city_slug, p.bio, p.avatar_path, p.gender, p.seeking,
      (
        45
        + case when p.city = v.city then 25 else 0 end
        + case when s.user_id is not null then 20 else 0 end
        + case when p.updated_at > now() - interval '7 days' then 10 else 0 end
        + case when distance.km is null then 0
          else greatest(0, 15 - least(15, floor(distance.km))) end
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
    left join public.user_location_private candidate_loc
      on candidate_loc.user_id = p.id
      and candidate_loc.expires_at > now()
    cross join lateral (
      select case
        when v.lat is null or v.lng is null
          or candidate_loc.latitude is null or candidate_loc.longitude is null
          then null::numeric
        else 6371::double precision * 2 * asin(sqrt(least(1::double precision, greatest(0::double precision,
          power(sin(radians(candidate_loc.latitude::double precision - v.lat::double precision) / 2), 2)
          + cos(radians(v.lat::double precision)) * cos(radians(candidate_loc.latitude::double precision))
          * power(sin(radians(candidate_loc.longitude::double precision - v.lng::double precision) / 2), 2)
        ))))::numeric
      end as km
    ) distance
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
      and (
        p.city = v.city
        or (
          p.city_slug = coalesce(p_city_slug, v.city_slug)
          and exists (
            select 1 from public.launch_areas open_area
            where open_area.slug = p.city_slug and open_area.is_open
          )
        )
      )
      and (distance.km is null or distance.km <= v.radius_km)
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

-- Remove default/public and anonymous execution from SECURITY DEFINER functions. Triggers
-- continue to execute as their owner; API-facing RPCs are granted explicitly below.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon', fn.signature);
  end loop;
end;
$$;

-- Authenticated application RPCs.
grant execute on function public.can_view_profile_media(text) to authenticated;
grant execute on function public.get_discover_candidates(text, integer, timestamptz) to authenticated;
grant execute on function public.get_match_profiles(uuid[]) to authenticated;
grant execute on function public.record_swipe(uuid, text) to authenticated;
grant execute on function public.send_chat_message(uuid, text, uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.get_unread_message_count() to authenticated;
grant execute on function public.get_evening_hotspots(text, integer, integer) to authenticated;
grant execute on function public.get_points_of_interest(text, text, integer) to authenticated;
grant execute on function public.is_staff_or_admin() to authenticated;
grant execute on function public.validate_pass(uuid, text) to authenticated;

-- The public landing page may read the city waitlist counter and submit a consented signup.
grant execute on function public.get_rennes_waitlist_status() to anon, authenticated;
grant execute on function public.join_rennes_waitlist(text, smallint, text, boolean) to anon, authenticated;

-- Scheduled cleanup remains service-role-only.
grant execute on function public.expire_evening_statuses() to service_role;
