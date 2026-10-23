import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { fetchBackendMatches } from '../lib/backend';
import { supabase } from '../lib/supabase';
import { demoProfiles } from '../lib/demo';
import { goToDiscover } from '../navigation/routes';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void };

function formatConversationTime(timestamp: number | null) {
  if (timestamp === null) return 'nouveau';
  const date = new Date(timestamp);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const age = startToday - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (age === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (age === 86_400_000) return 'Hier';
  if (age < 7 * 86_400_000) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ChatListScreen({ navigation }: { navigation: Navigation }) {
  const matches = useAppStore((state) => state.matches);
  const messages = useAppStore((state) => state.messages);
  const requests = useAppStore((state) => state.catchRequests);
  const currentUser = useQuery({
    queryKey: ['chat-list-current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    enabled: isBackendEnabled,
  });
  const remoteMatches = useQuery({
    queryKey: ['backend-matches'],
    queryFn: fetchBackendMatches,
    enabled: isBackendEnabled,
  });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartTime = weekStart.getTime();
  const rows = isBackendEnabled
    ? (remoteMatches.data ?? []).map((match) => ({
        id: match.id,
        name: `${match.profile.name}, ${match.profile.age}`,
        photo: match.profile.photo,
        city: `${match.profile.city} · à proximité`,
        lastAt: match.lastMessage ? new Date(match.lastMessage.createdAt).getTime() : null,
        text: match.lastMessage?.text ?? null,
        sent:
          match.lastMessage && currentUser.data
            ? match.lastMessage.senderId === currentUser.data
            : null,
      }))
    : matches.flatMap((match) => {
        const profile = demoProfiles.find((item) => item.id === match.profileId);
        if (!profile) return [];
        const thread = messages.filter((message) => message.matchId === match.id);
        const last = thread.reduce<(typeof thread)[number] | undefined>(
          (latest, message) => (!latest || message.createdAt > latest.createdAt ? message : latest),
          undefined,
        );
        const pending = requests.some(
          (request) => request.matchId === match.id && request.status === 'pending',
        );
        return [
          {
            id: match.id,
            name: `${profile.name}, ${profile.age}`,
            photo: profile.photo,
            city: `${profile.city} · ${profile.venue ?? 'disponible ce soir'}`,
            lastAt: last?.createdAt ?? null,
            text: pending ? '✦ Demande On se capte ce soir ?' : (last?.text ?? null),
            sent: last ? last.sender === 'me' : null,
          },
        ];
      });
  const categoryFor = (row: (typeof rows)[number]) => {
    if (row.lastAt === null) return 'Nouveaux matchs';
    if (row.lastAt >= todayStart) return 'Aujourd’hui';
    if (row.lastAt >= weekStartTime) return 'Cette semaine';
    return 'Plus anciens';
  };
  const categoryOrder = ['Nouveaux matchs', 'Aujourd’hui', 'Cette semaine', 'Plus anciens'];
  const groupedRows = categoryOrder
    .map((category) => ({
      category,
      rows: rows
        .filter((row) => categoryFor(row) === category)
        .sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0)),
    }))
    .filter((group) => group.rows.length > 0);
  const hasMatches = rows.length > 0;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <BrandLogo size='medium' showTagline />
        <Text style={styles.count}>
          {isBackendEnabled ? (remoteMatches.data?.length ?? 0) : matches.length} match
          {(isBackendEnabled ? (remoteMatches.data?.length ?? 0) : matches.length) > 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.title}>Tes conversations</Text>
      {!hasMatches ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⌁</Text>
          <Text style={styles.emptyTitle}>Pas encore de conversation</Text>
          <Text style={styles.emptyBody}>
            Les conversations apparaissent après un like réciproque. La soirée commence par une
            rencontre.
          </Text>
          <Pressable onPress={() => goToDiscover(navigation)} style={styles.primary}>
            <Text style={styles.primaryText}>Découvrir des profils</Text>
          </Pressable>
        </View>
      ) : (
        groupedRows.map((group) => (
          <View key={group.category}>
            <Text style={styles.sectionTitle}>{group.category}</Text>
            {group.rows.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => navigation.navigate('Conversation', { matchId: row.id })}
                style={styles.row}
                accessibilityRole='button'
              >
                <Image source={{ uri: row.photo }} style={styles.avatar} />
                <View style={styles.copy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{row.name}</Text>
                    <Text style={styles.time}>{formatConversationTime(row.lastAt)}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.preview}>
                    {row.text === null
                      ? 'Nouveau match · commence la conversation'
                      : `${row.sent === null ? '' : row.sent ? 'Vous : ' : 'Reçu : '}${row.text}`}
                  </Text>
                  <Text style={styles.location}>⌖ {row.city}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 28,
    paddingBottom: 30,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: colors.gold, fontSize: 10, fontWeight: '800' },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 28, marginBottom: 14 },
  sectionTitle: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 9,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, borderColor: colors.pink, borderWidth: 1 },
  copy: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 14, fontWeight: '900' },
  time: { color: colors.muted, fontSize: 9 },
  preview: { color: colors.mutedStrong, fontSize: 11, marginTop: 6 },
  location: { color: colors.muted, fontSize: 9, marginTop: 5 },
  chevron: { color: colors.mutedStrong, fontSize: 24, marginLeft: 8 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    paddingHorizontal: 20,
  },
  emptyIcon: { color: colors.pink, fontSize: 62 },
  emptyTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 15,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  primary: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    padding: 15,
    paddingHorizontal: 22,
    marginTop: 19,
  },
  primaryText: { color: colors.ivoryText, fontWeight: '900' },
});
