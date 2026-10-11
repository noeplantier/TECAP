create or replace function public.record_swipe(target_id uuid, direction text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  existing_direction text;
  likes_used_count integer;
  window_started timestamptz;
  premium_active boolean;
  matched boolean;
begin
  if actor is null then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'unauthorized');
  end if;
  if target_id is null or target_id = actor then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'invalid_target');
  end if;
  if direction not in ('like', 'pass') then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'invalid_direction');
  end if;
  if not exists (select 1 from public.profiles where id = target_id and role = 'user') then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'profile_not_found');
  end if;
  if exists (select 1 from public.blocks where blocker_id = actor and blocked_id = target_id) then
    return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'blocked');
  end if;

  select s.direction into existing_direction
  from public.swipes s
  where s.actor_id = actor and s.target_id = record_swipe.target_id;

  if existing_direction is not null then
    select exists (
      select 1 from public.matches m
      where m.user_a = least(actor, record_swipe.target_id)
        and m.user_b = greatest(actor, record_swipe.target_id)
    ) into matched;
    return jsonb_build_object('allowed', true, 'matched', matched, 'reason', 'already_recorded');
  end if;

  if direction = 'like' then
    insert into public.likes_usage(user_id, window_started_at, likes_used)
    values (actor, now(), 0)
    on conflict (user_id) do nothing;

    select l.window_started_at, l.likes_used
      into window_started, likes_used_count
      from public.likes_usage l
     where l.user_id = actor
     for update;

    if window_started <= now() - interval '24 hours' then
      update public.likes_usage
         set window_started_at = now(), likes_used = 0, updated_at = now()
       where user_id = actor;
      likes_used_count := 0;
    end if;

    select exists (
      select 1
      from public.purchases p
      where p.user_id = actor
        and p.status = 'active'
        and p.product_id ilike '%premium%'
        and (p.expires_at is null or p.expires_at > now())
    ) into premium_active;

    if not premium_active and likes_used_count >= 25 then
      return jsonb_build_object('allowed', false, 'matched', false, 'reason', 'daily_limit');
    end if;

    update public.likes_usage
       set likes_used = likes_used_count + 1, updated_at = now()
     where user_id = actor;
  end if;

  insert into public.swipes(actor_id, target_id, direction)
  values (actor, record_swipe.target_id, record_swipe.direction);

  select exists (
    select 1 from public.matches m
    where m.user_a = least(actor, record_swipe.target_id)
      and m.user_b = greatest(actor, record_swipe.target_id)
  ) into matched;

  return jsonb_build_object('allowed', true, 'matched', matched, 'reason', 'recorded');
end;
$$;

grant execute on function public.record_swipe(uuid, text) to authenticated;
