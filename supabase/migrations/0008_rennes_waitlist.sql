-- TÉCAP — compteur public et préinscription Rennes.
-- Les données personnelles restent protégées par RLS; seules les RPC exposent un compteur agrégé.

create or replace function public.get_rennes_waitlist_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  waiting_count bigint;
  city_open boolean;
begin
  select count(*) into waiting_count
  from public.preinscriptions
  where lower(city) = 'rennes';

  if waiting_count >= 500 then
    update public.launch_areas set is_open = true where slug = 'rennes';
    city_open := true;
  else
    select is_open into city_open from public.launch_areas where slug = 'rennes';
  end if;

  return jsonb_build_object(
    'count', coalesce(waiting_count, 0),
    'threshold', 500,
    'cityOpen', coalesce(city_open, false)
  );
end;
$$;

create or replace function public.join_rennes_waitlist(
  p_first_name text,
  p_age smallint,
  p_email text,
  p_consent boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(coalesce(p_email, '')));
  waiting_count bigint;
  city_open boolean;
begin
  if p_consent is distinct from true then
    raise exception 'Le consentement à la préinscription est requis.' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_first_name, ''))) not between 1 and 40 then
    raise exception 'Le prénom doit contenir entre 1 et 40 caractères.' using errcode = '22023';
  end if;
  if p_age is null or p_age < 18 or p_age > 120 then
    raise exception 'La préinscription est réservée aux personnes majeures.' using errcode = '22023';
  end if;
  if normalized_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Adresse email invalide.' using errcode = '22023';
  end if;

  insert into public.preinscriptions (first_name, age, email, city, source)
  values (btrim(p_first_name), p_age, normalized_email, 'Rennes', 'mobile_waitlist')
  on conflict (email) do nothing;

  select count(*) into waiting_count
  from public.preinscriptions
  where lower(city) = 'rennes';

  if waiting_count >= 500 then
    update public.launch_areas set is_open = true where slug = 'rennes';
    city_open := true;
  else
    select is_open into city_open from public.launch_areas where slug = 'rennes';
  end if;

  return jsonb_build_object(
    'count', coalesce(waiting_count, 0),
    'threshold', 500,
    'cityOpen', coalesce(city_open, false)
  );
end;
$$;

revoke all on function public.get_rennes_waitlist_status() from public;
revoke all on function public.join_rennes_waitlist(text, smallint, text, boolean) from public;
grant execute on function public.get_rennes_waitlist_status() to anon, authenticated;
grant execute on function public.join_rennes_waitlist(text, smallint, text, boolean) to anon, authenticated;
