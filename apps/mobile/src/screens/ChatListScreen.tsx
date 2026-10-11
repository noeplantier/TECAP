import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { fetchBackendMatches } from '../lib/backend';
import { demoProfiles } from '../lib/demo';
import { goToDiscover } from '../navigation/routes';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void };

export function ChatListScreen({ navigation }: { navigation: Navigation }) {
  const matches = useAppStore((state) => state.matches);
  const messages = useAppStore((state) => state.messages);
  const requests = useAppStore((state) => state.catchRequests);
  const remoteMatches = useQuery({
    queryKey: ['backend-matches'],
    queryFn: fetchBackendMatches,
    enabled: isBackendEnabled,
  });
  const hasMatches = isBackendEnabled ? Boolean(remoteMatches.data?.length) : matches.length > 0;
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
      ) : isBackendEnabled ? (
        remoteMatches.data?.map((match) => (
          <Pressable
            key={match.id}
            onPress={() => navigation.navigate('Conversation', { matchId: match.id })}
            style={styles.row}
            accessibilityRole='button'
          >
            <Image source={{ uri: match.profile.photo }} style={styles.avatar} />
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>
                  {match.profile.name}, {match.profile.age}
                </Text>
                <Text style={styles.time}>
                  {match.lastMessage
                    ? new Date(match.lastMessage.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'récent'}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.preview}>
                {match.lastMessage?.text ?? 'Nouveau match · commence la conversation'}
              </Text>
              <Text style={styles.location}>⌖ {match.profile.city} · à proximité</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      ) : (
        matches.map((match) => {
          const profile = demoProfiles.find((item) => item.id === match.profileId);
          if (!profile) return null;
          const thread = messages.filter((message) => message.matchId === match.id);
          const last = thread[thread.length - 1];
          const pending = requests.some(
            (request) => request.matchId === match.id && request.status === 'pending',
          );
          return (
            <Pressable
              key={match.id}
              onPress={() => navigation.navigate('Conversation', { matchId: match.id })}
              style={styles.row}
              accessibilityRole='button'
            >
              <Image source={{ uri: profile.photo }} style={styles.avatar} />
              <View style={styles.copy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>
                    {profile.name}, {profile.age}
                  </Text>
                  <Text style={styles.time}>
                    {last
                      ? new Date(last.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'récent'}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.preview}>
                  {pending
                    ? '✦ Demande On se capte ce soir ?'
                    : (last?.text ?? 'Nouveau match · commence la conversation')}
                </Text>
                <Text style={styles.location}>
                  ⌖ {profile.city} · {profile.venue ?? 'disponible ce soir'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })
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
  primaryText: { color: '#190915', fontWeight: '900' },
});
