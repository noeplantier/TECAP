import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoProfiles } from '../lib/demo';
import { goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type Route = { params?: { profileId?: string } };

export function ProfileDetailScreen({
  navigation,
  route,
}: {
  navigation: Navigation;
  route: Route;
}) {
  const profile =
    demoProfiles.find((item) => item.id === route.params?.profileId) ?? demoProfiles[0]!;
  const likeProfile = useAppStore((state) => state.likeProfile);
  const blockProfile = useAppStore((state) => state.blockProfile);
  const onLike = () => {
    const result = likeProfile(profile.id, profile.willMatchOnLike);
    if (!result.allowed) {
      goToShop(navigation);
      return;
    }
    if (result.matched) navigation.navigate('Match');
    else navigation.goBack?.();
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack?.()} accessibilityRole='button'>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>FICHE PROFIL</Text>
        <Pressable onPress={() => blockProfile(profile.id)} accessibilityRole='button'>
          <Text style={styles.more}>•••</Text>
        </Pressable>
      </View>
      <Image source={{ uri: profile.photo }} style={styles.hero} />
      <Text style={styles.name}>
        {profile.name}, {profile.age}
      </Text>
      <Text style={styles.meta}>
        ⌖ {profile.city} · {profile.distance} · profil vérifié
      </Text>
      {profile.status && (
        <View style={styles.status}>
          <Text style={styles.statusText}>● Ce soir · {profile.status}</Text>
          <Text style={styles.statusMeta}>{profile.venue}</Text>
        </View>
      )}
      <Text style={styles.bio}>{profile.bio}</Text>
      <Text style={styles.section}>Ses centres d’intérêt</Text>
      <View style={styles.tags}>
        {profile.interests.map((interest) => (
          <Text key={interest} style={styles.tag}>
            {interest}
          </Text>
        ))}
      </View>
      <Pressable onPress={onLike} style={[styles.primary, glow.pink]} accessibilityRole='button'>
        <Text style={styles.primaryText}>♡ J’aime</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('Invitation')}
        style={styles.catchButton}
        accessibilityRole='button'
      >
        <Text style={styles.catchText}>✦ On se capte ce soir ?</Text>
      </Pressable>
      <Text style={styles.safety}>
        Les lieux sont volontaires et approximatifs. Aucun GPS ni rendez-vous garanti.
      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  back: { color: colors.text, fontSize: 32 },
  headerTitle: { color: colors.mutedStrong, fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  more: { color: colors.mutedStrong, fontSize: 16 },
  hero: { width: '100%', height: 330, borderRadius: radius.lg },
  name: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 16 },
  meta: { color: colors.mutedStrong, fontSize: 11, marginTop: 5 },
  status: {
    backgroundColor: colors.pinkWash,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 15,
  },
  statusText: { color: colors.pink, fontSize: 12, fontWeight: '800' },
  statusMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 5 },
  bio: { color: colors.mutedStrong, fontSize: 14, lineHeight: 21, marginTop: 18 },
  section: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  tag: {
    color: colors.text,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 10,
  },
  primary: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  primaryText: { color: '#190915', fontSize: 15, fontWeight: '900' },
  catchButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: 9,
  },
  catchText: { color: colors.ivoryText, fontSize: 13, fontWeight: '900' },
  safety: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 14 },
});
