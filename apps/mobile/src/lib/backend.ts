import type { Tables, TablesInsert } from '@tecap/supabase-types';
import { demoProfiles, type DemoProfile } from './demo';
import { supabase } from './supabase';

export type BackendMatchSummary = {
  id: string;
  profile: DemoProfile;
  lastMessage?: { text: string; createdAt: string; senderId: string };
};

export type BackendConversation = {
  id: string;
  profile: DemoProfile;
  messages: Array<{ id: string; text: string; createdAt: string; senderId: string }>;
};

export type BackendStatus = Tables<'evening_statuses'>;

function ageFromBirthDate(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayPassed =
    now.getUTCMonth() > birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() >= birth.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function remoteProfileToDemo(
  profile: Tables<'profiles'>,
  status?: Tables<'evening_statuses'>,
): DemoProfile {
  const photo =
    profile.avatar_path ??
    `https://api.dicebear.com/9.x/shapes/svg?seed=tecap-${encodeURIComponent(profile.id)}`;
  const interests = profile.bio
    .split(/[,.]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 2)
    .slice(0, 4);
  return {
    id: profile.id,
    name: profile.first_name,
    age: ageFromBirthDate(profile.birth_date),
    city: profile.city,
    gender: 'non renseigné',
    seeking: 'rencontres respectueuses',
    bio: profile.bio,
    interests,
    tags: interests.slice(0, 2),
    status: status ? `${status.status_type} · ${status.venue ?? 'lieu partagé'}` : undefined,
    venue: status?.venue ?? undefined,
    distance: 'à proximité',
    photo,
    gallery: [photo],
    willMatchOnLike: false,
  };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new Error('Session Supabase absente. Reconnecte-toi pour continuer.');
  return data.user.id;
}

export async function ensureBackendProfile() {
  const userId = await currentUserId();
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return;
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    first_name: 'Nouveau membre',
    birth_date: '1998-06-15',
    city: 'Saint-Brieuc',
    bio: 'Je découvre TÉCAP.',
    avatar_path: null,
    role: 'user',
    is_18_plus_verified: true,
    consent_terms_at: new Date().toISOString(),
    consent_notifications_at: null,
    consent_sms_at: null,
  });
  if (error) throw error;
}

export async function fetchBackendProfiles(city?: string) {
  const userId = await currentUserId();
  const { data: me, error: meError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (meError) throw meError;
  const selectedCity = city ?? me.city;
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('city', selectedCity)
    .neq('id', userId)
    .eq('role', 'user')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const profileIds = profiles.map((profile) => profile.id);
  if (!profileIds.length) return [];
  const { data: statuses, error: statusError } = await supabase
    .from('evening_statuses')
    .select('*')
    .in('user_id', profileIds)
    .gt('expires_at', new Date().toISOString());
  if (statusError) throw statusError;
  const statusByUser = new Map((statuses ?? []).map((status) => [status.user_id, status]));
  return profiles.map((profile) => remoteProfileToDemo(profile, statusByUser.get(profile.id)));
}

async function remoteMatchesFor(userId: string) {
  const [asFirst, asSecond] = await Promise.all([
    supabase.from('matches').select('*').eq('user_a', userId),
    supabase.from('matches').select('*').eq('user_b', userId),
  ]);
  if (asFirst.error) throw asFirst.error;
  if (asSecond.error) throw asSecond.error;
  return [...(asFirst.data ?? []), ...(asSecond.data ?? [])];
}

export async function recordBackendSwipe(profileId: string, direction: 'like' | 'pass') {
  const { data, error } = await supabase.rpc('record_swipe', {
    target_id: profileId,
    direction,
  });
  if (error) throw error;
  const result = data as { allowed?: boolean; matched?: boolean };
  return { allowed: result.allowed === true, matched: result.matched === true };
}

export async function fetchBackendMatches(): Promise<BackendMatchSummary[]> {
  const userId = await currentUserId();
  const matches = await remoteMatchesFor(userId);
  if (!matches.length) return [];
  const otherIds = matches.map((match) => (match.user_a === userId ? match.user_b : match.user_a));
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', otherIds);
  if (profileError) throw profileError;
  const { data: messages, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .in(
      'match_id',
      matches.map((match) => match.id),
    )
    .order('created_at', { ascending: false });
  if (messageError) throw messageError;
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const lastMessageByMatch = new Map<string, Tables<'messages'>>();
  for (const message of messages ?? [])
    if (!lastMessageByMatch.has(message.match_id))
      lastMessageByMatch.set(message.match_id, message);
  return matches
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .flatMap((match) => {
      const otherId = match.user_a === userId ? match.user_b : match.user_a;
      const profile = profileById.get(otherId);
      if (!profile) return [];
      const lastMessage = lastMessageByMatch.get(match.id);
      return [
        {
          id: match.id,
          profile: remoteProfileToDemo(profile),
          lastMessage: lastMessage
            ? {
                text: lastMessage.body,
                createdAt: lastMessage.created_at,
                senderId: lastMessage.sender_id,
              }
            : undefined,
        },
      ];
    });
}

export async function fetchBackendConversation(matchId: string): Promise<BackendConversation> {
  const userId = await currentUserId();
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  if (matchError) throw matchError;
  if (match.user_a !== userId && match.user_b !== userId)
    throw new Error('Conversation inaccessible.');
  const otherId = match.user_a === userId ? match.user_b : match.user_a;
  const [{ data: profile, error: profileError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', otherId).single(),
      supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true }),
    ]);
  if (profileError) throw profileError;
  if (messagesError) throw messagesError;
  return {
    id: match.id,
    profile: remoteProfileToDemo(profile),
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      text: message.body,
      createdAt: message.created_at,
      senderId: message.sender_id,
    })),
  };
}

export async function sendBackendMessage(matchId: string, body: string) {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: userId, body });
  if (error) throw error;
}

function statusTypeFor(activityType: string): TablesInsert<'evening_statuses'>['status_type'] {
  if (activityType.includes('bar') || activityType.includes('Verre')) return 'bar';
  if (activityType.includes('Restaurant')) return 'restaurant';
  if (activityType.includes('Concert')) return 'concert';
  if (activityType.includes('Club')) return 'club';
  if (activityType.includes('amis')) return 'chill';
  return 'other';
}

export async function fetchBackendStatus() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('evening_statuses')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchBackendEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchBackendEntitlements() {
  const userId = await currentUserId();
  const [{ data: purchases, error: purchasesError }, { data: boosts, error: boostsError }] =
    await Promise.all([
      supabase
        .from('purchases')
        .select('product_id,remaining_uses,status,expires_at')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('boosts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('ends_at', new Date().toISOString()),
    ]);
  if (purchasesError) throw purchasesError;
  if (boostsError) throw boostsError;
  const premium = (purchases ?? []).some(
    (purchase) =>
      purchase.product_id.includes('premium') &&
      (!purchase.expires_at || purchase.expires_at > new Date().toISOString()),
  );
  const invitationCredits = (purchases ?? [])
    .filter((purchase) => purchase.product_id.includes('invite'))
    .reduce((total, purchase) => total + (purchase.remaining_uses ?? 0), 0);
  return { premium, invitationCredits, activeBoosts: boosts?.length ?? 0 };
}

export async function publishBackendStatus(input: {
  activityType: string;
  city: string;
  venue?: string;
}) {
  const userId = await currentUserId();
  const row: TablesInsert<'evening_statuses'> = {
    user_id: userId,
    city: input.city,
    status_type: statusTypeFor(input.activityType),
    venue: input.venue ?? null,
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
  const { error } = await supabase.from('evening_statuses').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function removeBackendStatus() {
  const userId = await currentUserId();
  const { error } = await supabase.from('evening_statuses').delete().eq('user_id', userId);
  if (error) throw error;
}

export function localProfilesFallback() {
  return demoProfiles;
}
