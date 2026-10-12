import { useEffect } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleEveningReminder } from '../lib/notifications';
import { demoProfiles } from '../lib/demo';
import { goToDiscover, goToOutings } from '../navigation/routes';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { NeonIcon, type NeonIconName } from '../components/NeonIcon';
import { useAppStore } from '../state/useAppStore';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
const featuredProfile = demoProfiles.find((profile) => profile.id === 'lea') ?? demoProfiles[0]!;
const secondProfile = demoProfiles.find((profile) => profile.id === 'lucas') ?? demoProfiles[1]!;

export function HomeScreen({ navigation }: { navigation: Navigation }) {
  const city = useAppStore((state) => state.city);
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 850 }), withTiming(1, { duration: 850 })),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const enableReminder = async () => {
    const result = await scheduleEveningReminder();
    Alert.alert(
      result.status === 'scheduled' ? 'Rappel activé' : 'Rappel indisponible',
      result.status === 'scheduled'
        ? 'TÉCAP te demandera chaque soir à 18 h : « T’as quoi de prévu ce soir ? »'
        : result.status === 'denied'
          ? 'Autorise les notifications dans les réglages de ton téléphone.'
          : 'Le rappel quotidien est disponible sur iOS et Android.',
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.top}>
        <View>
          <BrandLogo size='medium' />
          <View style={styles.locationRow}>
            <NeonIcon name='location-outline' size={14} tone='gold' />
            <Text style={styles.location}>{city} · ce soir · 18+</Text>
          </View>
        </View>
        <NeonIcon name='notifications-outline' size={24} tone='gold' />
      </View>
      <Text style={styles.title}>Tes où ?{`\n`}On se capte.</Text>
      <Text style={styles.tagline}>La rencontre commence quand la soirée commence.</Text>
      <Pressable style={styles.statusCta} onPress={() => goToOutings(navigation, 'EveningStatus')}>
        <Animated.View style={pulseStyle}>
          <NeonIcon name='moon' size={24} tone='pink' style={styles.moon} />
        </Animated.View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>T’as quoi de prévu ce soir ?</Text>
          <Text style={styles.statusSub}>Ton soir, tes envies. Partage ce que tu veux.</Text>
        </View>
        <Text style={styles.plus}>＋</Text>
      </Pressable>
      <Pressable onPress={() => void enableReminder()} style={styles.reminder}>
        <Text style={styles.reminderMoon}>🌙</Text>
        <Text style={styles.reminderText}>Me rappeler chaque soir à 18 h</Text>
        <Text style={styles.reminderArrow}>›</Text>
      </Pressable>
      <View style={styles.hubGrid}>
        <HubButton
          title='Rencontre'
          icon='heart-outline'
          onPress={() => goToDiscover(navigation)}
        />
        <HubButton title='Sortie' icon='sparkles-outline' onPress={() => goToOutings(navigation)} />
        <HubButton
          title='Carte'
          icon='map-outline'
          onPress={() => goToOutings(navigation, 'Map')}
        />
        <HubButton
          title='Lieu'
          icon='location-outline'
          onPress={() => goToOutings(navigation, 'VenueDetail')}
        />
        <HubButton
          title='Statut'
          icon='moon-outline'
          onPress={() => goToOutings(navigation, 'EveningStatus')}
        />
        <HubButton
          title='Amis'
          icon='people-outline'
          onPress={() => goToOutings(navigation, 'Friends')}
        />
        <HubButton
          title='Crew'
          icon='people-circle-outline'
          onPress={() => goToOutings(navigation, 'Crew')}
        />
        <HubButton
          title='Mes likes'
          icon='heart-circle-outline'
          onPress={() => goToOutings(navigation, 'WhoLikedMe')}
          gold
        />
      </View>
      <View style={styles.filters}>
        <Text style={[styles.filter, styles.filterOn]}>Tout</Text>
        <Text style={styles.filter}>Bar 🍸</Text>
        <Text style={styles.filter}>Concert 🎶</Text>
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Qui sort ce soir ?</Text>
        <Pressable onPress={() => goToOutings(navigation, 'Map')}>
          <View style={styles.mapLink}>
            <NeonIcon name='map-outline' size={13} tone='pink' />
            <Text style={styles.link}>Voir la carte ↗</Text>
          </View>
        </Pressable>
      </View>
      <Pressable style={styles.featureCard} onPress={() => goToDiscover(navigation)}>
        <Image source={{ uri: featuredProfile.photo }} style={styles.featureImage} />
        <View style={styles.featureShade} />
        <View style={styles.featureText}>
          <View style={styles.featureEyebrowRow}>
            <NeonIcon name='location' size={13} tone='gold' />
            <Text style={styles.featureEyebrow}>Sort ce soir — bar 🍸</Text>
          </View>
          <Text style={styles.featureName}>
            {featuredProfile.name}, {featuredProfile.age}
          </Text>
          <Text style={styles.featureMeta}>{city} · lieu partagé volontairement</Text>
        </View>
      </Pressable>
      <Pressable style={styles.rowCard} onPress={() => goToDiscover(navigation)}>
        <Image source={{ uri: secondProfile.photo }} style={styles.smallAvatar} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>
            {secondProfile.name}, {secondProfile.age}
          </Text>
          <Text style={styles.rowMeta}>Sort ce soir — concert 🎶</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.waitlistCard} onPress={() => navigation.navigate('RennesWaitlist')}>
        <Text style={styles.waitlistIcon}>✦</Text>
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>Débloque TÉCAP à Rennes</Text>
          <Text style={styles.rowMeta}>Préinscriptions · Launch Night à venir</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        Zones choisies · aucune position en direct ni historique.
      </Text>
    </ScrollView>
  );
}
function HubButton({
  title,
  icon,
  onPress,
  gold = false,
}: {
  title: string;
  icon: NeonIconName;
  onPress: () => void;
  gold?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.hubButton, gold && styles.hubButtonGold]}>
      <NeonIcon
        name={icon}
        size={21}
        tone={gold ? 'gold' : 'pink'}
        color={gold ? colors.gold : colors.pinkLight}
        style={styles.hubIcon}
      />
      <Text style={styles.hubLabel}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 28,
    paddingBottom: 30,
    flexGrow: 1,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  location: { color: colors.goldLight, fontSize: 10, fontWeight: '700' },
  title: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 21,
    marginBottom: 16,
  },
  tagline: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
    marginTop: -10,
    marginBottom: 15,
  },
  statusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.hotPink,
  },
  moon: { marginRight: 10 },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  statusSub: { color: colors.muted, fontSize: 10, marginTop: 5 },
  plus: { color: colors.gold, fontSize: 22 },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldWash,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 9,
  },
  reminderMoon: { fontSize: 14, marginRight: 8 },
  reminderText: { color: colors.goldLight, flex: 1, fontSize: 10, fontWeight: '800' },
  reminderArrow: { color: colors.gold, fontSize: 20 },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  hubButton: {
    width: '31.5%',
    minHeight: 62,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hubButtonGold: { borderColor: colors.goldSoft, backgroundColor: colors.goldWash },
  hubIcon: { marginBottom: 1 },
  hubLabel: { color: colors.mutedStrong, fontSize: 9, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 15 },
  filter: {
    color: colors.mutedStrong,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 11,
  },
  filterOn: { color: colors.text, borderColor: colors.gold },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  link: { color: colors.pinkLight, fontSize: 10, fontWeight: '800' },
  featureCard: {
    height: 185,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  featureImage: { width: '100%', height: '100%' },
  featureShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,15,26,.42)' },
  featureText: { position: 'absolute', left: 15, right: 15, bottom: 15 },
  featureEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  featureEyebrow: { color: colors.goldLight, fontSize: 10, fontWeight: '900' },
  featureName: { color: colors.text, fontSize: 21, fontWeight: '800' },
  featureMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 4 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  smallAvatar: {
    width: 37,
    height: 37,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.pinkLight,
  },
  rowCopy: { flex: 1, marginLeft: 11 },
  rowName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  rowMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 22 },
  waitlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 12,
  },
  waitlistIcon: { color: colors.gold, fontSize: 20, marginRight: 9 },
  disclaimer: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 18 },
});
