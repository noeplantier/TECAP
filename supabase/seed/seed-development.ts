import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { activeStatusKeys, expiredStatusKeys } from './data/statuses';
import { eventFixtures } from './data/events';
import {
  matchKeys,
  messageFixtures,
  passedKeys,
  requestFixtures,
  notificationFixtures,
} from './data/fixtures';
import { profiles, alexProfile, type SeedProfile } from './data/profiles';
import { demoProducts } from './data/purchases';

const TARGET_PROJECT_REF = 'bzijrulrqhnwycgmhcti';
const DEMO_EMAIL_DOMAIN = 'example.test';
const DEMO_PREFIX = 'tecap.demo+';
const AVATAR_BASE_URL =
  process.env.TECAP_DEMO_AVATAR_BASE_URL ?? 'https://api.dicebear.com/9.x/shapes/svg';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const demoPassword = process.env.TECAP_DEMO_PASSWORD ?? '';
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl.match(/https:\/\/([a-z]+)\.supabase\.co/)?.[1] ??
  '';

function requireConfiguration() {
  if (!supabaseUrl || !serviceRoleKey || !demoPassword) {
    throw new Error(
      'Configuration manquante. Définis SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et TECAP_DEMO_PASSWORD uniquement dans un environnement serveur non versionné.',
    );
  }
  if (projectRef !== TARGET_PROJECT_REF) {
    throw new Error(
      `Projet refusé : ${projectRef || 'inconnu'}. Le seed est autorisé uniquement sur ${TARGET_PROJECT_REF}.`,
    );
  }
  if (demoPassword.length < 12)
    throw new Error('TECAP_DEMO_PASSWORD doit contenir au moins 12 caractères.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

type AuthKey = 'alex' | 'admin' | 'staff' | 'limit' | string;
type UserMap = Record<AuthKey, string>;

type AuthDefinition = {
  key: string;
  email: string;
  firstName: string;
  role: 'user' | 'admin' | 'partner' | 'staff';
  age: number;
  city: string;
  bio: string;
};

function stableUuid(value: string) {
  const hash = createHash('sha256')
    .update(`tecap-development-seed:${value}`)
    .digest('hex')
    .split('');
  hash[12] = '5';
  hash[16] = ['8', '9', 'a', 'b'][Number.parseInt(hash[16]!, 16) % 4]!;
  return `${hash.slice(0, 8).join('')}-${hash.slice(8, 12).join('')}-${hash.slice(12, 16).join('')}-${hash.slice(16, 20).join('')}-${hash.slice(20, 32).join('')}`;
}

function demoEmail(key: string) {
  return `${DEMO_PREFIX}${key}@${DEMO_EMAIL_DOMAIN}`;
}

function dateForAge(age: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - age, 5, 15)).toISOString().slice(0, 10);
}

function relativeIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function avatarPath(key: string) {
  return `${AVATAR_BASE_URL}?seed=tecap-${encodeURIComponent(key)}&backgroundColor=180d24,2b1247,4a103f`;
}

async function upsertRows(table: string, rows: Record<string, unknown>[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function listDemoUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.filter(
    (user) => user.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`) && user.email.startsWith(DEMO_PREFIX),
  );
}

async function ensureAuthUsers(definitions: AuthDefinition[]) {
  const existing = await listDemoUsers();
  const byEmail = new Map(existing.map((user) => [user.email, user]));
  const users: UserMap = {};
  let created = 0;
  for (const definition of definitions) {
    const email = definition.email;
    const current = byEmail.get(email);
    if (current) {
      users[definition.key] = current.id;
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        demo_key: definition.key,
        display_name: definition.firstName,
        demo_role: definition.role,
      },
      app_metadata: { tecap_demo: true },
    });
    if (error || !data.user)
      throw new Error(
        `auth.users ${definition.key}: ${error?.message ?? 'user absent après création'}`,
      );
    users[definition.key] = data.user.id;
    created += 1;
  }
  return { users, created, reused: definitions.length - created };
}

function profileDefinitions(): AuthDefinition[] {
  return [
    {
      key: 'alex',
      email: demoEmail('alex'),
      firstName: alexProfile.firstName,
      age: alexProfile.age,
      city: alexProfile.city,
      bio: alexProfile.bio,
      role: 'user',
    },
    {
      key: 'admin',
      email: demoEmail('admin'),
      firstName: 'TÉCAP Admin',
      age: 34,
      city: 'Saint-Brieuc',
      bio: 'Compte opérateur de démonstration TÉCAP.',
      role: 'admin',
    },
    {
      key: 'staff',
      email: demoEmail('staff'),
      firstName: 'Staff TÉCAP Night',
      age: 36,
      city: 'Saint-Brieuc',
      bio: 'Compte partenaire limité à la validation des pass.',
      role: 'partner',
    },
    {
      key: 'limit',
      email: demoEmail('alex-limite'),
      firstName: 'Alex Limite',
      age: 27,
      city: 'Saint-Brieuc',
      bio: 'Compte de scénario dédié au paywall des likes.',
      role: 'user',
    },
    ...profiles.map((profile) => ({
      key: profile.key,
      email: demoEmail(profile.key),
      firstName: profile.firstName,
      age: profile.age,
      city: profile.city,
      bio: profile.bio,
      role: 'user' as const,
    })),
  ];
}

function profileRows(users: UserMap, definitions: AuthDefinition[]) {
  return definitions.map((profile) => ({
    id: users[profile.key],
    first_name: profile.firstName,
    birth_date: dateForAge(profile.age),
    city: profile.city,
    city_slug: profile.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-'),
    bio: profile.bio,
    avatar_path: avatarPath(profile.key),
    role: profile.role,
    is_18_plus_verified: true,
    consent_terms_at: new Date().toISOString(),
    consent_notifications_at: new Date().toISOString(),
    consent_sms_at: null,
    discover_visible: true,
    location_consent: false,
  }));
}

function profileByKey(key: string) {
  return profiles.find((profile) => profile.key === key);
}

async function seed() {
  requireConfiguration();
  const definitions = profileDefinitions();
  const auth = await ensureAuthUsers(definitions);
  const users = auth.users;
  const alexId = users.alex!;
  const staffId = users.staff!;

  await upsertRows('profiles', profileRows(users, definitions), 'id');

  const eventIds = Object.fromEntries(
    eventFixtures.map((event) => [event.key, stableUuid(`event:${event.key}`)]),
  );
  const upcomingStart = relativeIso(24 * 7);
  const upcomingEnd = relativeIso(24 * 7 + 8);
  const pastStart = relativeIso(-24 * 7);
  const pastEnd = relativeIso(-24 * 7 + 6);
  await upsertRows(
    'events',
    [
      {
        id: eventIds['night-upcoming'],
        name: eventFixtures[0]!.name,
        city: eventFixtures[0]!.city,
        venue: eventFixtures[0]!.venue,
        starts_at: upcomingStart,
        ends_at: upcomingEnd,
        cover_path: avatarPath('night-upcoming'),
        is_published: true,
      },
      {
        id: eventIds['night-past'],
        name: eventFixtures[1]!.name,
        city: eventFixtures[1]!.city,
        venue: eventFixtures[1]!.venue,
        starts_at: pastStart,
        ends_at: pastEnd,
        cover_path: avatarPath('night-past'),
        is_published: true,
      },
    ],
    'id',
  );

  const matchIds: Record<string, string> = {};
  const matchRows = matchKeys.map((key) => {
    const otherId = users[key]!;
    const [userA, userB] = [alexId, otherId].sort();
    const id = stableUuid(`match:${key}`);
    matchIds[key] = id;
    return {
      id,
      user_a: userA,
      user_b: userB,
      created_at: relativeIso(-24 * (key === 'lea' || key === 'ines' || key === 'camille' ? 1 : 3)),
    };
  });
  await upsertRows('matches', matchRows, 'id');
  await upsertRows(
    'conversations',
    matchKeys.map((key) => ({
      id: stableUuid(`conversation:${key}`),
      match_id: matchIds[key],
      updated_at: new Date().toISOString(),
    })),
    'match_id',
  );

  const swipeRows = [
    ...matchKeys.map((key) => ({
      actor_id: alexId,
      target_id: users[key],
      direction: 'like',
      created_at: relativeIso(-24),
    })),
    ...matchKeys.map((key) => ({
      actor_id: users[key],
      target_id: alexId,
      direction: 'like',
      created_at: relativeIso(-23),
    })),
    ...['mathis', 'zoe', 'chloe', 'sacha'].map((key) => ({
      actor_id: users[key],
      target_id: alexId,
      direction: 'like',
      created_at: relativeIso(-12),
    })),
    ...passedKeys.map((key) => ({
      actor_id: alexId,
      target_id: users[key],
      direction: 'pass',
      created_at: relativeIso(-48),
    })),
  ];
  await upsertRows('swipes', swipeRows, 'actor_id,target_id');

  const messageRows = messageFixtures.flatMap((fixture) =>
    fixture.messages.map(([senderKey, body], index) => ({
      id: stableUuid(`message:${fixture.matchKey}:${index}`),
      match_id: matchIds[fixture.matchKey],
      sender_id: senderKey === 'alex' ? alexId : users[senderKey],
      body,
      created_at: relativeIso(-(index + 1) * 5 - (fixture.matchKey === 'ines' ? 1 : 0)),
    })),
  );
  await upsertRows('messages', messageRows, 'id');

  const hotspotOverrides: Record<string, { statusType: SeedProfile['statusType']; venue: string }> =
    {
      lea: { statusType: 'bar', venue: 'Le Velvet Bar' },
      anais: { statusType: 'bar', venue: 'Le Velvet Bar' },
      paul: { statusType: 'bar', venue: 'Le Velvet Bar' },
      camille: { statusType: 'concert', venue: 'TÉCAP Night · Zone événementielle' },
      arthur: { statusType: 'concert', venue: 'TÉCAP Night · Zone événementielle' },
      maxime: { statusType: 'concert', venue: 'TÉCAP Night · Zone événementielle' },
      enzo: { statusType: 'club', venue: 'Club Horizon' },
      sacha: { statusType: 'club', venue: 'Club Horizon' },
      elise: { statusType: 'club', venue: 'Club Horizon' },
    };
  const statusRows = [
    {
      key: 'alex',
      statusType: 'other',
      venue: 'Le Velvet Bar',
      time: 'à partir de 20 h 30',
      expires: 14,
    },
    ...activeStatusKeys.map((key) => {
      const profile = profileByKey(key)!;
      const override = hotspotOverrides[key];
      return {
        key,
        statusType: override?.statusType ?? profile.statusType,
        venue: override?.venue ?? profile.venue,
        time: profile.timeOption,
        expires: 12,
      };
    }),
    ...expiredStatusKeys.map((key) => {
      const profile = profileByKey(key)!;
      return {
        key,
        statusType: profile.statusType,
        venue: profile.venue,
        time: profile.timeOption,
        expires: -2,
      };
    }),
  ];
  await upsertRows(
    'evening_statuses',
    statusRows.map((status) => ({
      id: stableUuid(`status:${status.key}`),
      user_id: users[status.key],
      city: status.key === 'alex' ? alexProfile.city : profileByKey(status.key)!.city,
      status_type: status.statusType,
      venue: status.venue,
      expires_at: relativeIso(status.expires),
      created_at: relativeIso(status.expires < 0 ? -18 : -1),
    })),
    'user_id',
  );

  const requestIds: Record<string, string> = {};
  const requestRows = requestFixtures.map((request) => {
    const id = stableUuid(`request:${request.key}`);
    requestIds[request.key] = id;
    const senderId = users[request.sender]!;
    const receiverId = users[request.receiver]!;
    const matchKey = request.sender === 'alex' ? request.receiver : request.sender;
    return {
      id,
      match_id: matchIds[matchKey],
      sender_id: senderId,
      receiver_id: receiverId,
      intent: request.intent,
      venue_optional: request.venue,
      time_option: request.time,
      message_optional: request.message,
      status: request.status,
      alternative_message_optional: request.response,
      expires_at: relativeIso(request.status === 'expired' ? -2 : 8),
      responded_at: request.status === 'pending' ? null : relativeIso(-1),
    };
  });
  await upsertRows('catch_tonight_requests', requestRows, 'id');

  await upsertRows(
    'notifications',
    notificationFixtures.map((notification) => ({
      id: stableUuid(`notification:${notification.key}`),
      user_id: alexId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: {
        profileId:
          notification.target === 'alex' || notification.target === 'limit'
            ? alexId
            : users[notification.target],
        matchId: matchIds[notification.target],
        requestId:
          requestIds[`${notification.target}-pending`] ??
          requestIds[`${notification.target}-declined`] ??
          requestIds[`${notification.target}-alternative`],
        route: notification.type === 'message' ? 'Conversation' : 'Notifications',
      },
      read_at: notification.read ? relativeIso(-2) : null,
      created_at: relativeIso(-notificationFixtures.indexOf(notification) - 1),
    })),
    'id',
  );

  await upsertRows(
    'likes_usage',
    [
      {
        user_id: alexId,
        window_started_at: relativeIso(-2),
        likes_used: 7,
        updated_at: new Date().toISOString(),
      },
      {
        user_id: users.limit,
        window_started_at: relativeIso(-2),
        likes_used: 25,
        updated_at: new Date().toISOString(),
      },
    ],
    'user_id',
  );

  await upsertRows(
    'purchases',
    [
      {
        id: stableUuid('purchase:alex-premium'),
        user_id: alexId,
        product_id: demoProducts.premium,
        purchase_type: 'subscription',
        store_transaction_id: 'tecap-demo-tx-premium',
        status: 'active',
        started_at: relativeIso(-24),
        expires_at: relativeIso(24 * 60),
        remaining_uses: null,
      },
      {
        id: stableUuid('purchase:alex-invites'),
        user_id: alexId,
        product_id: demoProducts.inviteBundle,
        purchase_type: 'consumable',
        store_transaction_id: 'tecap-demo-tx-invites',
        status: 'active',
        started_at: relativeIso(-12),
        expires_at: null,
        remaining_uses: 3,
      },
      {
        id: stableUuid('purchase:alex-boosts'),
        user_id: alexId,
        product_id: demoProducts.boostBundle,
        purchase_type: 'consumable',
        store_transaction_id: 'tecap-demo-tx-boosts',
        status: 'active',
        started_at: relativeIso(-8),
        expires_at: null,
        remaining_uses: 4,
      },
    ],
    'id',
  );

  await upsertRows(
    'boosts',
    [
      {
        id: stableUuid('boost:active'),
        user_id: alexId,
        starts_at: relativeIso(-0.25),
        ends_at: relativeIso(0.75),
        status: 'active',
      },
      {
        id: stableUuid('boost:expired'),
        user_id: alexId,
        starts_at: relativeIso(-48),
        ends_at: relativeIso(-47),
        status: 'expired',
      },
    ],
    'id',
  );

  const upcomingParticipants = ['alex', ...matchKeys.slice(0, 11)];
  const pastParticipants = ['alex', ...matchKeys.slice(4, 11)];
  await upsertRows(
    'event_participants',
    [
      ...upcomingParticipants.map((key, index) => ({
        event_id: eventIds['night-upcoming'],
        user_id: users[key],
        bracelet_choice: ['I OPEN', 'I ON VERRA', 'I EN COUPLE', 'I PAS DE BRACELET'][index % 4],
      })),
      ...pastParticipants.map((key, index) => ({
        event_id: eventIds['night-past'],
        user_id: users[key],
        bracelet_choice: ['I OPEN', 'I ON VERRA', 'I EN COUPLE', 'I PAS DE BRACELET'][index % 4],
      })),
    ],
    'event_id,user_id',
  );

  const passRows = [
    { key: 'alex-upcoming', event: 'night-upcoming', user: 'alex', state: 'generated' },
    ...matchKeys.slice(0, 5).map((key) => ({
      key: `${key}-upcoming`,
      event: 'night-upcoming',
      user: key,
      state: 'generated',
    })),
    ...matchKeys
      .slice(0, 4)
      .map((key) => ({ key: `${key}-past`, event: 'night-past', user: key, state: 'used' })),
    { key: 'invalid-demo', event: 'night-upcoming', user: 'alex', state: 'invalid' },
  ];
  await upsertRows(
    'passes',
    passRows.map((pass) => ({
      id: stableUuid(`pass:${pass.key}`),
      event_id: eventIds[pass.event],
      user_id: users[pass.user],
      offer: 'standard',
      qr_token_hash: createHash('sha256').update(`tecap-demo-qr:${pass.key}`).digest('hex'),
      state: pass.state,
      generated_at: relativeIso(-24),
      used_at: pass.state === 'used' ? relativeIso(-20) : null,
    })),
    'id',
  );

  await upsertRows(
    'pass_scans',
    [
      {
        id: stableUuid('scan:past-accepted'),
        pass_id: stableUuid('pass:lea-past'),
        scanned_by: staffId,
        scan_source: 'partner',
        outcome: 'accepted',
        created_at: relativeIso(-20),
      },
      {
        id: stableUuid('scan:past-rejected'),
        pass_id: stableUuid('pass:lea-past'),
        scanned_by: staffId,
        scan_source: 'partner',
        outcome: 'already_used',
        created_at: relativeIso(-19),
      },
      {
        id: stableUuid('scan:invalid'),
        pass_id: stableUuid('pass:invalid-demo'),
        scanned_by: staffId,
        scan_source: 'partner',
        outcome: 'invalid',
        created_at: relativeIso(-18),
      },
    ],
    'id',
  );

  const sourceNames = ['V&B', 'club', 'DJ', 'influenceur', 'TikTok', 'Instagram', 'QR'];
  const leadStatuses = [
    'PREINSCRIT',
    'COMPTE_CRÉÉ',
    'INSCRIT TÉCAP NIGHT',
    'PASS GÉNÉRÉ',
    'PASS UTILISÉ',
  ];
  await upsertRows(
    'preinscriptions',
    profiles.slice(0, 15).map((profile, index) => ({
      id: stableUuid(`preinscription:${profile.key}`),
      first_name: profile.firstName,
      age: profile.age,
      email: `preinscription.${profile.key}@example.test`,
      phone: null,
      city: profile.city,
      referral_code: index % 3 === 0 ? 'TECAP-DEMO' : null,
      source: sourceNames[index % sourceNames.length],
      status: leadStatuses[index % leadStatuses.length],
    })),
    'id',
  );

  await upsertRows(
    'blocks',
    [{ blocker_id: users.limit, blocked_id: users.sacha }],
    'blocker_id,blocked_id',
  );
  await upsertRows(
    'reports',
    [
      {
        id: stableUuid('report:demo'),
        reporter_id: users.limit,
        reported_user_id: users.sacha,
        message_id: null,
        reason: 'Profil de démonstration à vérifier',
        details: 'Signalement fictif pour tester le dashboard opérateur.',
        status: 'open',
      },
    ],
    'id',
  );

  await upsertRows(
    'admin_audit_log',
    [
      {
        id: stableUuid('audit:accepted'),
        actor_id: staffId,
        action: 'pass_scanned',
        entity_type: 'pass',
        entity_id: stableUuid('pass:lea-past'),
        metadata: { demo: true, outcome: 'accepted' },
      },
      {
        id: stableUuid('audit:rejected'),
        actor_id: staffId,
        action: 'pass_scanned',
        entity_type: 'pass',
        entity_id: stableUuid('pass:lea-past'),
        metadata: { demo: true, outcome: 'already_used' },
      },
    ],
    'id',
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        projectRef,
        authUsersCreated: auth.created,
        authUsersReused: auth.reused,
        profiles: definitions.length,
        matches: matchRows.length,
        conversations: matchRows.length,
        messages: messageRows.length,
        statuses: statusRows.length,
        requests: requestRows.length,
        notifications: notificationFixtures.length,
        events: eventFixtures.length,
        participants: upcomingParticipants.length + pastParticipants.length,
        passes: passRows.length,
        preinscriptions: 15,
      },
      null,
      2,
    ),
  );
}

async function count(table: string) {
  const { count: rowCount, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return rowCount ?? 0;
}

async function verify() {
  requireConfiguration();
  const expected = {
    profiles: 34,
    matches: 16,
    conversations: 16,
    messages: 32,
    evening_statuses: 23,
    catch_tonight_requests: 6,
    notifications: 10,
    events: 2,
    event_participants: 23,
    passes: 11,
    preinscriptions: 15,
  };
  const actual = Object.fromEntries(
    await Promise.all(Object.keys(expected).map(async (table) => [table, await count(table)])),
  );
  const failures = Object.entries(expected)
    .filter(([table, minimum]) => Number(actual[table]) < minimum)
    .map(([table, minimum]) => `${table}: ${actual[table]} < ${minimum}`);
  if (failures.length) throw new Error(`Seed incomplet : ${failures.join(', ')}`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectRef,
        counts: actual,
        checks: ['minimum_counts', 'seed_is_non_destructive'],
      },
      null,
      2,
    ),
  );
}

async function resetDemo() {
  requireConfiguration();
  const demoUsers = await listDemoUsers();
  const userIds = demoUsers.map((user) => user.id);
  if (!userIds.length) {
    console.log(
      JSON.stringify({ ok: true, deleted: 0, message: 'Aucune donnée démo trouvée.' }, null, 2),
    );
    return;
  }
  const deleteIn = async (table: string, column: string, values: string[]) => {
    const { error } = await supabase.from(table).delete().in(column, values);
    if (error) throw new Error(`${table}: ${error.message}`);
  };
  const eventIds = eventFixtures.map((event) => stableUuid(`event:${event.key}`));
  const passIds = [
    'alex-upcoming',
    ...matchKeys.slice(0, 5).map((key) => `${key}-upcoming`),
    ...matchKeys.slice(0, 4).map((key) => `${key}-past`),
    'invalid-demo',
  ].map((key) => stableUuid(`pass:${key}`));
  const matchIds = matchKeys.map((key) => stableUuid(`match:${key}`));
  await deleteIn('pass_scans', 'pass_id', passIds);
  await deleteIn('admin_audit_log', 'actor_id', userIds);
  await deleteIn('messages', 'match_id', matchIds);
  await deleteIn('catch_tonight_requests', 'sender_id', userIds);
  await deleteIn('catch_tonight_requests', 'receiver_id', userIds);
  await deleteIn('notifications', 'user_id', userIds);
  await deleteIn('conversations', 'match_id', matchIds);
  await deleteIn('passes', 'id', passIds);
  await deleteIn('event_participants', 'user_id', userIds);
  await deleteIn('matches', 'id', matchIds);
  await deleteIn('swipes', 'actor_id', userIds);
  await deleteIn('swipes', 'target_id', userIds);
  await deleteIn('evening_statuses', 'user_id', userIds);
  await deleteIn('purchases', 'user_id', userIds);
  await deleteIn('boosts', 'user_id', userIds);
  await deleteIn('likes_usage', 'user_id', userIds);
  await deleteIn('reports', 'reporter_id', userIds);
  await deleteIn('reports', 'reported_user_id', userIds);
  await deleteIn('blocks', 'blocker_id', userIds);
  await deleteIn('blocks', 'blocked_id', userIds);
  await deleteIn('profiles', 'id', userIds);
  await deleteIn(
    'preinscriptions',
    'id',
    profiles.slice(0, 15).map((profile) => stableUuid(`preinscription:${profile.key}`)),
  );
  await deleteIn('events', 'id', eventIds);
  for (const user of demoUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`auth.users ${user.id}: ${error.message}`);
  }
  console.log(
    JSON.stringify(
      { ok: true, deleted: demoUsers.length, scope: 'tecap.demo+*@example.test uniquement' },
      null,
      2,
    ),
  );
}

async function main() {
  const command = process.argv[2] ?? 'seed';
  if (command === 'seed') await seed();
  else if (command === 'verify') await verify();
  else if (command === 'reset') await resetDemo();
  else throw new Error(`Commande inconnue : ${command}. Utilise seed, verify ou reset.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
