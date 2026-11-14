import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  cancelEveningReminder,
  getEveningReminderEnabled,
  scheduleEveningReminder,
} from '../lib/notifications';
import { fetchBackendNotifications, fetchBackendProfiles } from '../lib/backend';
import { demoPhotos, demoProfiles, type DemoProfile } from '../lib/demo';
import { isBackendEnabled } from '../lib/runtime';
import { goToDiscover, goToOutings } from '../navigation/routes';
import { colors, gradients, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { NeonIcon, type NeonIconName } from '../components/NeonIcon';
import { useAppStore } from '../state/useAppStore';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type NightlifeFilter = 'all' | 'bar' | 'concert' | 'club' | 'event';
type FeatureTileModel = {
  title: string;
  icon: NeonIconName;
  image?: string;
  onPress: () => void;
  gold?: boolean;
  texture?: 'map';
};

const categoryFilters: Array<{
  id: NightlifeFilter;
  label: string;
  icon?: NeonIconName;
}> = [
  { id: 'all', label: 'Tout' },
  { id: 'bar', label: 'Bar', icon: 'wine-outline' },
  { id: 'concert', label: 'Concert', icon: 'musical-notes-outline' },
  { id: 'club', label: 'Club', icon: 'globe-outline' },
  { id: 'event', label: 'Event', icon: 'calendar-outline' },
];

const filterKeywords: Record<Exclude<NightlifeFilter, 'all'>, string[]> = {
  bar: ['bar', 'verre', 'apero', 'cocktail', 'vin', 'pub', 'terrasse'],
  concert: ['concert', 'musique', 'live', 'jam', 'projection'],
  club: ['club', 'electro', 'dj', 'after', 'house', 'danse'],
  event: ['evenement', 'festival', 'soiree', 'concert', 'dj set', 'projection', 'salsa'],
};

function normalizedSearchText(profile: DemoProfile) {
  return `${profile.status ?? ''} ${profile.venue ?? ''} ${profile.interests.join(' ')}`
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesFilter(profile: DemoProfile, filter: NightlifeFilter) {
  if (filter === 'all') return true;
  const text = normalizedSearchText(profile);
  return filterKeywords[filter].some((keyword) => text.includes(keyword));
}

export function HomeScreen({ navigation }: { navigation: Navigation }) {
  const { width: viewportWidth } = useWindowDimensions();
  const [shortcutGridWidth, setShortcutGridWidth] = useState(0);
  const compactTiles = shortcutGridWidth > 0 ? shortcutGridWidth < 340 : viewportWidth < 360;
  const city = useAppStore((state) => state.city);
  const localUnreadNotifications = useAppStore(
    (state) => state.notifications.filter((notification) => !notification.read).length,
  );
  const remoteNotifications = useQuery({
    queryKey: ['backend-notifications'],
    queryFn: fetchBackendNotifications,
    enabled: isBackendEnabled,
    staleTime: 30_000,
  });
  const unreadNotifications = isBackendEnabled
    ? (remoteNotifications.data ?? []).filter((item) => item.read_at === null).length
    : localUnreadNotifications;
  const pulse = useSharedValue(1);
  const [selectedFilter, setSelectedFilter] = useState<NightlifeFilter>('all');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const remoteProfiles = useQuery({
    queryKey: ['discover-profiles', isBackendEnabled],
    queryFn: () => fetchBackendProfiles(),
    enabled: isBackendEnabled,
    staleTime: 30_000,
  });
  const activeMembers = useMemo(
    () =>
      (isBackendEnabled ? (remoteProfiles.data ?? []) : demoProfiles).filter((profile) =>
        Boolean(profile.status),
      ),
    [remoteProfiles.data],
  );
  const visibleMembers = useMemo(
    () => activeMembers.filter((profile) => matchesFilter(profile, selectedFilter)),
    [activeMembers, selectedFilter],
  );
  const featuredProfile = visibleMembers[0];
  const secondaryProfiles = visibleMembers.slice(1, 3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void getEveningReminderEnabled()
        .then((enabled) => {
          if (mounted) setReminderEnabled(enabled);
        })
        .catch(() => {
          if (mounted) setReminderEnabled(false);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const toggleReminder = async () => {
    if (reminderBusy) return;
    setReminderBusy(true);
    setReminderFeedback(null);
    try {
      if (reminderEnabled) {
        const result = await cancelEveningReminder();
        if (result.status === 'disabled') {
          setReminderEnabled(false);
        } else {
          setReminderFeedback('Le rappel du soir ne peut pas être modifié sur cet appareil.');
        }
        return;
      }
      const result = await scheduleEveningReminder();
      if (result.status === 'scheduled') {
        setReminderEnabled(true);
      } else if (result.status === 'denied') {
        setReminderEnabled(false);
        setReminderFeedback('Autorise les notifications dans les réglages de ton téléphone.');
      } else {
        setReminderEnabled(false);
        setReminderFeedback('Le rappel quotidien est disponible dans l’app iOS ou Android.');
      }
    } catch {
      setReminderEnabled(false);
      setReminderFeedback('Le rappel n’a pas pu être enregistré. Réessaie dans un instant.');
    } finally {
      setReminderBusy(false);
    }
  };

  const tiles: FeatureTileModel[] = [
    {
      title: 'Rencontre',
      icon: 'heart-outline',
      image: demoPhotos.lea,
      onPress: () => goToDiscover(navigation),
    },
    {
      title: 'Sortie',
      icon: 'sparkles-outline',
      image: demoPhotos.night,
      onPress: () => goToOutings(navigation),
    },
    {
      title: 'Carte',
      icon: 'map-outline',
      texture: 'map',
      onPress: () => goToOutings(navigation, 'Map'),
    },
    {
      title: 'Lieu',
      icon: 'location-outline',
      image: demoPhotos.night,
      onPress: () => goToOutings(navigation, 'VenueDetail'),
    },
    {
      title: 'Statut',
      icon: 'moon-outline',
      image: demoPhotos.manon,
      onPress: () => goToOutings(navigation, 'EveningStatus'),
    },
    {
      title: 'Amis',
      icon: 'people-outline',
      image: demoPhotos.friends,
      onPress: () => goToOutings(navigation, 'Friends'),
    },
    {
      title: 'Crew',
      icon: 'people-circle-outline',
      image: demoPhotos.friends,
      onPress: () => goToOutings(navigation, 'Crew'),
    },
    {
      title: 'Mes likes',
      icon: 'heart-circle-outline',
      gold: true,
      onPress: () => goToOutings(navigation, 'WhoLikedMe'),
    },
  ];

  const openNotifications = () =>
    navigation.navigate('MainTabs', {
      screen: 'ProfileTab',
      params: { screen: 'Notifications' },
    });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={{ uri: demoPhotos.night }}
          style={styles.heroPhoto}
          resizeMode='cover'
          accessible={false}
        />
        <LinearGradient
          pointerEvents='none'
          colors={['rgba(5,5,5,0.10)', 'rgba(5,5,5,0.28)', colors.canvas]}
          locations={[0, 0.48, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.heroShade}
        />
        <View style={styles.heroContent}>
          <View style={styles.top}>
            <BrandLogo size='medium' />
            <Pressable
              onPress={openNotifications}
              style={styles.notificationButton}
              accessibilityRole='button'
              accessibilityLabel={
                unreadNotifications > 0
                  ? `Notifications, ${unreadNotifications} non lues`
                  : 'Notifications'
              }
            >
              <NeonIcon name='notifications-outline' size={23} tone='none' color={colors.text} />
              {unreadNotifications > 0 && <View style={styles.notificationDot} />}
            </Pressable>
          </View>
          <Pressable
            onPress={() => goToOutings(navigation, 'Map')}
            style={styles.locationRow}
            accessibilityRole='button'
            accessibilityLabel={`Ville ${city}, ouvrir la carte`}
          >
            <NeonIcon name='location' size={20} tone='gold' />
            <Text style={styles.location} numberOfLines={1}>
              {city}
            </Text>
            <NeonIcon name='chevron-down' size={16} tone='none' color={colors.text} />
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>18+</Text>
            </View>
            {!isBackendEnabled && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>DÉMO</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.slogan}>
            <Text style={styles.sloganFirst}>T’es où ?</Text>
            <LinearGradient
              colors={gradients.primaryCta}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 1, y: 0.7 }}
              style={styles.sloganBand}
            >
              <Text style={styles.sloganSecond}>On se capte ?</Text>
            </LinearGradient>
            <View style={styles.sloganUnderline} />
          </View>
          <Text style={styles.tagline}>La rencontre commence quand la soirée commence.</Text>
        </View>
      </View>

      <Pressable
        style={styles.statusCta}
        onPress={() => goToOutings(navigation, 'EveningStatus')}
        accessibilityRole='button'
      >
        <LinearGradient
          pointerEvents='none'
          colors={gradients.primaryCta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.calendarIcon}>
          <NeonIcon name='calendar-outline' size={31} tone='none' color={colors.text} />
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>T’as quoi de prévu ce soir ?</Text>
          <Text style={styles.statusSub}>Partage ton plan, ton lieu, tes envies…</Text>
        </View>
        <Animated.View style={[styles.plusCircle, pulseStyle]}>
          <Text style={styles.plus}>＋</Text>
        </Animated.View>
      </Pressable>

      <Pressable
        onPress={() => void toggleReminder()}
        style={styles.reminder}
        accessibilityRole='switch'
        accessibilityState={{ checked: reminderEnabled, disabled: reminderBusy }}
        accessibilityLabel='Me rappeler chaque soir à 18 h'
        disabled={reminderBusy}
      >
        <NeonIcon name='notifications-outline' size={22} tone='gold' />
        <Text style={styles.reminderText}>Me rappeler chaque soir à 18 h</Text>
        <View style={[styles.switchTrack, reminderEnabled && styles.switchTrackOn]}>
          <View style={[styles.switchThumb, reminderEnabled && styles.switchThumbOn]} />
        </View>
      </Pressable>
      {reminderFeedback && <Text style={styles.reminderFeedback}>{reminderFeedback}</Text>}

      <View
        style={styles.hubGrid}
        onLayout={(event) => setShortcutGridWidth(Math.round(event.nativeEvent.layout.width))}
      >
        {tiles.map((tile) => (
          <FeatureTile key={tile.title} {...tile} compact={compactTiles} />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {categoryFilters.map((filter) => {
          const active = selectedFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[styles.filter, active && styles.filterOn]}
              accessibilityRole='button'
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextOn]}>{filter.label}</Text>
              {filter.icon && (
                <NeonIcon
                  name={filter.icon}
                  size={14}
                  tone={active ? 'gold' : 'none'}
                  color={active ? colors.gold : colors.mutedStrong}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHead}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Qui sort ce soir ?</Text>
          {!isBackendEnabled && <Text style={styles.sectionDemo}>DÉMO</Text>}
        </View>
        <Pressable
          onPress={() => goToOutings(navigation, 'Map')}
          accessibilityRole='link'
          style={styles.mapLink}
        >
          <NeonIcon name='map-outline' size={19} tone='pink' />
          <Text style={styles.link}>Voir la carte ↗</Text>
        </Pressable>
      </View>
      <Text style={styles.memberCount}>
        {visibleMembers.length} plan{visibleMembers.length === 1 ? '' : 's'} partagé
        {visibleMembers.length === 1 ? '' : 's'} volontairement
      </Text>

      {isBackendEnabled && remoteProfiles.isError && !featuredProfile ? (
        <View style={styles.emptyState} accessibilityRole='alert'>
          <NeonIcon name='alert-circle-outline' size={23} tone='pink' />
          <Text style={styles.emptyTitle}>Plans indisponibles pour le moment.</Text>
          <Text style={styles.emptyBody}>
            Impossible de récupérer les sorties partagées depuis le serveur.
          </Text>
          <Pressable onPress={() => void remoteProfiles.refetch()} style={styles.retryPill}>
            <Text style={styles.retryPillText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : featuredProfile ? (
        <>
          <Pressable style={styles.featureCard} onPress={() => goToDiscover(navigation)}>
            <Image source={{ uri: featuredProfile.photo }} style={styles.featureImage} />
            <LinearGradient
              pointerEvents='none'
              colors={gradients.cardOverlay}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.featureText}>
              <View style={styles.featureEyebrowRow}>
                <NeonIcon name='location' size={14} tone='gold' />
                <Text style={styles.featureEyebrow} numberOfLines={1}>
                  {featuredProfile.status}
                </Text>
              </View>
              <Text style={styles.featureName}>
                {featuredProfile.name}, {featuredProfile.age}
              </Text>
              <Text style={styles.featureMeta} numberOfLines={1}>
                {featuredProfile.city} · {featuredProfile.venue ?? 'lieu partagé volontairement'}
              </Text>
            </View>
          </Pressable>
          {secondaryProfiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={styles.rowCard}
              onPress={() => goToDiscover(navigation)}
            >
              <Image source={{ uri: profile.photo }} style={styles.smallAvatar} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowName}>
                  {profile.name}, {profile.age}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {profile.status}
                  {profile.venue ? ` · ${profile.venue}` : ''}
                </Text>
              </View>
              <NeonIcon name='chevron-forward' size={19} tone='none' color={colors.mutedStrong} />
            </Pressable>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <NeonIcon name='moon-outline' size={23} tone='pink' />
          <Text style={styles.emptyTitle}>Pas encore de plan dans cette catégorie.</Text>
          <Text style={styles.emptyBody}>
            Publie ton statut; les sorties partagées apparaîtront ici.
          </Text>
        </View>
      )}

      <Pressable
        style={styles.waitlistCard}
        onPress={() => navigation.navigate('RennesWaitlist')}
        accessibilityRole='button'
      >
        <NeonIcon name='sparkles-outline' size={21} tone='gold' />
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>Débloque TÉCAP à Rennes</Text>
          <Text style={styles.rowMeta}>Préinscriptions · Launch Night à venir</Text>
        </View>
        <NeonIcon name='chevron-forward' size={19} tone='none' color={colors.mutedStrong} />
      </Pressable>
      <Text style={styles.disclaimer}>
        Localisation volontaire · aucune position en direct ni historique.
      </Text>
    </ScrollView>
  );
}

function FeatureTile({
  title,
  icon,
  image,
  onPress,
  gold = false,
  texture,
  compact = false,
}: FeatureTileModel & { compact?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.hubButton, compact && styles.hubButtonCompact, gold && styles.hubButtonGold]}
      accessibilityRole='button'
      accessibilityLabel={title}
    >
      <View pointerEvents='none' style={styles.tileBackdrop}>
        {image && <Image source={{ uri: image }} style={styles.tileImage} resizeMode='cover' />}
        {texture === 'map' && <MapTileTexture />}
        {!gold && (
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.78)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </View>
      <View style={styles.tileContent}>
        <NeonIcon
          name={icon}
          size={25}
          tone={gold ? 'gold' : 'pink'}
          color={gold ? colors.gold : colors.text}
        />
        <View style={styles.tileBottom}>
          <Text style={[styles.hubLabel, gold && styles.hubLabelGold]} numberOfLines={1}>
            {title}
          </Text>
          <NeonIcon
            name='chevron-forward'
            size={18}
            tone='none'
            color={gold ? colors.gold : colors.text}
          />
        </View>
      </View>
    </Pressable>
  );
}

function MapTileTexture() {
  return (
    <View style={styles.mapTileTexture}>
      <View style={[styles.mapRoad, styles.mapRoadOne]} />
      <View style={[styles.mapRoad, styles.mapRoadTwo]} />
      <View style={[styles.mapRoad, styles.mapRoadThree]} />
      <View style={styles.mapTilePin}>
        <NeonIcon name='location' size={20} tone='pink' />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  container: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 28,
  },
  hero: {
    minHeight: 231,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroPhoto: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '80%',
    height: 190,
    opacity: 0.78,
  },
  heroShade: { ...StyleSheet.absoluteFillObject },
  heroContent: { position: 'relative' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.lineBright,
    backgroundColor: 'rgba(10,10,10,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 8,
    maxWidth: '100%',
  },
  location: { color: colors.text, fontSize: 15, fontWeight: '800', maxWidth: 190 },
  ageBadge: {
    borderWidth: 1,
    borderColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.pinkWash,
  },
  ageText: { color: colors.pink, fontSize: 13, fontWeight: '900' },
  demoBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.goldWash,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  demoBadgeText: { color: colors.goldLight, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  slogan: { alignSelf: 'flex-start', marginTop: 17, maxWidth: '100%' },
  sloganFirst: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  sloganBand: {
    alignSelf: 'flex-start',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  sloganSecond: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  sloganUnderline: {
    alignSelf: 'center',
    width: 134,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.pink,
    marginTop: 3,
    transform: [{ rotate: '-2deg' }],
  },
  tagline: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 9,
    maxWidth: 370,
  },
  statusCta: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.pink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
    shadowColor: colors.pink,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  calendarIcon: { width: 45, alignItems: 'center', justifyContent: 'center' },
  statusDivider: {
    width: 1,
    height: 43,
    backgroundColor: 'rgba(255,255,255,0.58)',
    marginHorizontal: 9,
  },
  statusCopy: { flex: 1, minWidth: 0, paddingRight: 5 },
  statusTitle: { color: colors.text, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  statusSub: { color: 'rgba(255,255,255,0.82)', fontSize: 11, lineHeight: 15, marginTop: 3 },
  plusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { color: colors.ivoryText, fontSize: 27, lineHeight: 30, fontWeight: '500' },
  reminder: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.goldWash,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 9,
  },
  reminderText: { color: colors.goldLight, flex: 1, fontSize: 13, fontWeight: '800' },
  switchTrack: {
    width: 49,
    height: 27,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    padding: 3,
  },
  switchTrackOn: { backgroundColor: colors.gold },
  switchThumb: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.mutedStrong,
  },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: colors.text },
  reminderFeedback: {
    color: colors.goldLight,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
    paddingHorizontal: 14,
  },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hubButton: {
    width: '31.3%',
    minHeight: 62,
    aspectRatio: 1.75,
    borderRadius: radius.md,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  hubButtonCompact: { width: '48%' },
  hubButtonGold: {
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldWash,
    ...glow.gold,
  },
  tileBackdrop: { ...StyleSheet.absoluteFillObject },
  tileImage: { ...StyleSheet.absoluteFillObject, opacity: 0.84 },
  tileContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  tileBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  hubLabel: { color: colors.text, flex: 1, fontSize: 12, fontWeight: '900' },
  hubLabelGold: { color: colors.goldLight },
  mapTileTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  mapRoad: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4 },
  mapRoadOne: { width: '130%', height: 5, left: -8, top: '35%', transform: [{ rotate: '-18deg' }] },
  mapRoadTwo: { width: '140%', height: 3, left: -10, top: '68%', transform: [{ rotate: '15deg' }] },
  mapRoadThree: {
    width: 4,
    height: '130%',
    left: '58%',
    top: -12,
    transform: [{ rotate: '28deg' }],
  },
  mapTilePin: {
    position: 'absolute',
    top: '20%',
    right: '17%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: 8, paddingVertical: 14, paddingRight: 8 },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.canvas,
  },
  filterOn: { borderColor: colors.gold, backgroundColor: colors.goldWash },
  filterText: { color: colors.mutedStrong, fontSize: 11, fontWeight: '700' },
  filterTextOn: { color: colors.text, fontWeight: '900' },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  sectionDemo: { color: colors.goldLight, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 6 },
  link: { color: colors.pink, fontSize: 11, fontWeight: '900' },
  memberCount: { color: colors.muted, fontSize: 10, marginBottom: 9 },
  featureCard: {
    height: 172,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featureText: { position: 'absolute', left: 14, right: 14, bottom: 13 },
  featureEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  featureEyebrow: { color: colors.goldLight, flex: 1, fontSize: 10, fontWeight: '900' },
  featureName: { color: colors.text, fontSize: 21, fontWeight: '900' },
  featureMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  rowCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 9,
    marginTop: 8,
  },
  smallAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.pink,
  },
  rowCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  rowName: { color: colors.text, fontWeight: '800', fontSize: 12 },
  rowMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  emptyState: {
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 18,
  },
  emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  retryPill: {
    marginTop: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.pink,
    backgroundColor: colors.pinkWash,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryPillText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  waitlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    marginTop: 13,
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 14,
  },
});
