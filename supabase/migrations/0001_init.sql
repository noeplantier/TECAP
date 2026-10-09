create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.user_role as enum ('user', 'admin', 'partner', 'staff');
create type public.lead_status as enum ('PREINSCRIT', 'COMPTE_CRÉÉ', 'INSCRIT TÉCAP NIGHT', 'PASS GÉNÉRÉ', 'PASS UTILISÉ');
create type public.pass_state as enum ('generated', 'used', 'invalid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  birth_date date not null,
  city text not null,
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text,
  role public.user_role not null default 'user',
  is_18_plus_verified boolean not null default false,
  consent_terms_at timestamptz,
  consent_notifications_at timestamptz,
  consent_sms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adult_profile check (birth_date <= (current_date - interval '18 years')::date)
);

create table public.preinscriptions (
  id uuid primary key default gen_random_uuid(),
  public_id text generated always as ('TC' || lpad(row_number::text, 6, '0')) stored,
  row_number bigint generated always as identity unique,
  first_name text not null check (char_length(first_name) between 1 and 40),
  age smallint not null check (age between 18 and 120),
  email citext not null unique,
  phone text,
  city text not null,
  referral_code text,
  source text,
  status public.lead_status not null default 'PREINSCRIT',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint event_dates check (ends_at > starts_at)
);

create table public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  bracelet_choice text check (bracelet_choice in ('I OPEN', 'I ON VERRA', 'I EN COUPLE', 'I PAS DE BRACELET')),
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.evening_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  status_type text not null check (status_type in ('bar', 'club', 'restaurant', 'concert', 'match', 'beach', 'chill', 'other')),
  venue text check (venue is null or char_length(venue) <= 120),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer text not null default 'standard',
  qr_token_hash text not null unique,
  state public.pass_state not null default 'generated',
  generated_at timestamptz not null default now(),
  used_at timestamptz,
  unique (event_id, user_id, offer)
);

create table public.pass_scans (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references public.passes(id) on delete restrict,
  scanned_by uuid not null references public.profiles(id) on delete restrict,
  scan_source text not null default 'partner',
  outcome text not null check (outcome in ('accepted', 'already_used', 'invalid', 'unauthorized')),
  created_at timestamptz not null default now()
);

create table public.swipes (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id),
  check (actor_id <> target_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint ordered_users check (user_a < user_b),
  unique (user_a, user_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index evening_statuses_city_expiry_idx on public.evening_statuses (city, expires_at);
create index event_participants_event_idx on public.event_participants (event_id);
create index passes_event_state_idx on public.passes (event_id, state);
create index messages_match_created_idx on public.messages (match_id, created_at);

create or replace function public.is_staff_or_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff', 'partner'));
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.create_match_after_like() returns trigger language plpgsql security definer set search_path = public as $$
declare low_id uuid; high_id uuid;
begin
  if new.direction = 'like' and exists (select 1 from public.swipes where actor_id = new.target_id and target_id = new.actor_id and direction = 'like') then
    low_id := least(new.actor_id, new.target_id); high_id := greatest(new.actor_id, new.target_id);
    insert into public.matches(user_a, user_b) values (low_id, high_id) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger swipes_match_trigger after insert or update on public.swipes for each row execute function public.create_match_after_like();

create or replace function public.validate_pass(pass_id uuid, scan_source text default 'partner') returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.passes%rowtype; scanner_role public.user_role; result jsonb;
begin
  select role into scanner_role from public.profiles where id = auth.uid();
  if scanner_role not in ('admin', 'partner', 'staff') then
    insert into public.pass_scans(pass_id, scanned_by, scan_source, outcome) values (pass_id, auth.uid(), scan_source, 'unauthorized');
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  select * into p from public.passes where id = pass_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  if p.state <> 'generated' then
    insert into public.pass_scans(pass_id, scanned_by, scan_source, outcome) values (p.id, auth.uid(), scan_source, 'already_used');
    return jsonb_build_object('ok', false, 'reason', 'already_used', 'used_at', p.used_at);
  end if;
  update public.passes set state = 'used', used_at = now() where id = p.id;
  insert into public.pass_scans(pass_id, scanned_by, scan_source, outcome) values (p.id, auth.uid(), scan_source, 'accepted');
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id) values (auth.uid(), 'pass_scanned', 'pass', p.id);
  result := jsonb_build_object('ok', true, 'reason', 'accepted', 'pass_id', p.id, 'used_at', now());
  return result;
end;
$$;

create or replace function public.expire_evening_statuses() returns integer language sql security definer set search_path = public as $$
  with deleted as (delete from public.evening_statuses where expires_at <= now() returning id) select count(*)::integer from deleted;
$$;

alter table public.profiles enable row level security;
alter table public.preinscriptions enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.evening_statuses enable row level security;
alter table public.passes enable row level security;
alter table public.pass_scans enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.admin_audit_log enable row level security;

create policy profiles_read_same_city on public.profiles for select to authenticated using (city = (select city from public.profiles where id = auth.uid()) or id = auth.uid() or public.is_staff_or_admin());
create policy profiles_self_write on public.profiles for all to authenticated using (id = auth.uid() or public.is_staff_or_admin()) with check (id = auth.uid() or public.is_staff_or_admin());
create policy events_public_read on public.events for select to authenticated using (is_published or public.is_staff_or_admin());
create policy events_staff_write on public.events for all to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy participants_read on public.event_participants for select to authenticated using (user_id = auth.uid() or public.is_staff_or_admin() or exists (select 1 from public.events e join public.profiles p on p.city = e.city where e.id = event_id and p.id = auth.uid()));
create policy participants_self_write on public.event_participants for insert to authenticated with check (user_id = auth.uid());
create policy participants_self_delete on public.event_participants for delete to authenticated using (user_id = auth.uid() or public.is_staff_or_admin());
create policy statuses_city_read on public.evening_statuses for select to authenticated using (expires_at > now() and city = (select city from public.profiles where id = auth.uid()) or user_id = auth.uid() or public.is_staff_or_admin());
create policy statuses_self_write on public.evening_statuses for all to authenticated using (user_id = auth.uid() or public.is_staff_or_admin()) with check (user_id = auth.uid() or public.is_staff_or_admin());
create policy passes_self_read on public.passes for select to authenticated using (user_id = auth.uid() or public.is_staff_or_admin());
create policy passes_self_insert on public.passes for insert to authenticated with check (user_id = auth.uid());
create policy scans_staff_read on public.pass_scans for select to authenticated using (public.is_staff_or_admin());
create policy swipes_self on public.swipes for all to authenticated using (actor_id = auth.uid()) with check (actor_id = auth.uid());
create policy matches_member_read on public.matches for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy messages_member_read on public.messages for select to authenticated using (sender_id = auth.uid() or exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));
create policy messages_member_insert on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));
create policy audit_staff_read on public.admin_audit_log for select to authenticated using (public.is_staff_or_admin());

alter publication supabase_realtime add table public.evening_statuses;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.event_participants;
