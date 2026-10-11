-- TÉCAP — notifications in-app pour les demandes « On se capte ce soir ? ».
-- Aucun appel réseau dans le trigger : l’événement est stocké puis consommé par le mobile Realtime.

create or replace function public.notify_catch_request_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
  title_text text;
  body_text text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  select first_name into sender_name from public.profiles where id = new.sender_id;
  if new.status = 'pending' then
    recipient := new.receiver_id;
    title_text := 'Une invitation pour ce soir';
    body_text := coalesce(sender_name, 'Un membre') || ' te propose de vous capter ce soir.';
  elsif new.status = 'accepted' then
    recipient := new.sender_id;
    title_text := 'Ton invitation est acceptée';
    body_text := 'Votre plan de ce soir peut commencer dans la conversation.';
  elsif new.status = 'declined' then
    recipient := new.sender_id;
    title_text := 'Réponse à ton invitation';
    body_text := 'La personne ne peut pas ce soir, mais sa réponse reste respectueuse.';
  elsif new.status = 'alternative' then
    recipient := new.sender_id;
    title_text := 'Une autre idée pour se capter';
    body_text := coalesce(new.alternative_message_optional, 'Une autre proposition est disponible.');
  else
    return new;
  end if;
  insert into public.notifications (user_id, type, title, body, data)
  values (
    recipient,
    'catch',
    title_text,
    left(body_text, 200),
    jsonb_build_object('requestId', new.id, 'matchId', new.match_id, 'route', 'Conversation')
  );
  return new;
end;
$$;

drop trigger if exists catch_request_notification_trigger on public.catch_tonight_requests;
create trigger catch_request_notification_trigger
after insert or update on public.catch_tonight_requests
for each row execute function public.notify_catch_request_changed();

revoke execute on function public.notify_catch_request_changed() from public;
