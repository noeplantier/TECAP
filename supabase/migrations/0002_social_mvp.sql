create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catch_tonight_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  intent text not null check (intent in ('verre', 'manger', 'concert', 'club', 'improviser')),
  venue_optional text,
  time_option text,
  message_optional text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'alternative', 'expired')),
  alternative_message_optional text,
  expires_at timestamptz not null default (now() + interval '8 hours'),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint catch_distinct_users check (sender_id <> receiver_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.likes_usage (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  likes_used integer not null default 0 check (likes_used >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  purchase_type text not null check (purchase_type in ('subscription', 'consumable')),
  store_transaction_id text unique,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  remaining_uses integer check (remaining_uses is null or remaining_uses >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint boost_dates check (ends_at > starts_at)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint block_distinct_users check (blocker_id <> blocked_id)
);

create index if not exists catch_requests_receiver_status_idx on public.catch_tonight_requests (receiver_id, status, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists messages_conversation_created_idx on public.messages (match_id, created_at);
create index if not exists boosts_user_active_idx on public.boosts (user_id, ends_at) where status = 'active';

create or replace function public.create_conversation_after_match() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.conversations(match_id) values (new.id) on conflict (match_id) do nothing;
  return new;
end;
$$;

drop trigger if exists matches_conversation_trigger on public.matches;
create trigger matches_conversation_trigger after insert on public.matches for each row execute function public.create_conversation_after_match();

alter table public.conversations enable row level security;
alter table public.catch_tonight_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.likes_usage enable row level security;
alter table public.purchases enable row level security;
alter table public.boosts enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy conversations_member_read on public.conversations for select to authenticated using (exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));
create policy catch_requests_member_read on public.catch_tonight_requests for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy catch_requests_sender_insert on public.catch_tonight_requests for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.matches m where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())));
create policy catch_requests_member_update on public.catch_tonight_requests for update to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid()) with check (sender_id = auth.uid() or receiver_id = auth.uid());
create policy notifications_self_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy likes_usage_self on public.likes_usage for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy purchases_self_read on public.purchases for select to authenticated using (user_id = auth.uid());
create policy boosts_self_read on public.boosts for select to authenticated using (user_id = auth.uid());
create policy reports_self_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_self_read on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_staff_or_admin());
create policy blocks_self on public.blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.catch_tonight_requests;
alter publication supabase_realtime add table public.notifications;
