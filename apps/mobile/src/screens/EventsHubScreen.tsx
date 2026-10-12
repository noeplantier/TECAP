import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { fetchBackendEvents, fetchBackendProfiles, fetchBackendStatus } from '../lib/backend';
import { demoPhotos, demoVenues } from '../lib/demo';
import { demoPois, SAINT_BRIEUC_CENTER } from '../lib/mapData';
import { MapCanvas } from '../components/MapCanvas';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type VenueItem = { name: string; count: number; type: string; emoji: string };
export function EventsHubScreen({ navigation }: { navigation: Navigation }) {
  const isFocused = useIsFocused();
  const city = useAppStore((state) => state.city);
  const outingStatus = useAppStore((state) => state.outingStatus);
  const remoteStatus = useQuery({
    queryKey: ['backend-evening-status'],
    queryFn: fetchBackendStatus,
    enabled: isBackendEnabled,
  });
  const remoteProfiles = useQuery({
    queryKey: ['discover-profiles', isBackendEnabled],
    queryFn: () => fetchBackendProfiles(),
    enabled: isBackendEnabled,
  });
  const remoteEvents = useQuery({
    queryKey: ['backend-events'],
    queryFn: fetchBackendEvents,
    enabled: isBackendEnabled,
  });
  const displayStatus = isBackendEnabled ? remoteStatus.data : outingStatus;
  const displayStatusLabel = isBackendEnabled
    ? remoteStatus.data?.status_type
    : outingStatus?.activityType;
  const displayVenue = isBackendEnabled ? remoteStatus.data?.venue : outingStatus?.venue;
  const venueCounts = (remoteProfiles.data ?? []).reduce<Map<string, number>>((counts, profile) => {
    if (profile.venue) counts.set(profile.venue, (counts.get(profile.venue) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const venues: VenueItem[] = isBackendEnabled
    ? Array.from(venueCounts.entries()).map(([name, count]) => ({
        name,
        count,
        type: 'membres présents',
        emoji: '✦',
      }))
    : demoVenues;
  const event = remoteEvents.data?.[0];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <BrandLogo size='medium' />
          <Text style={styles.location}>⌖ {city} · ce soir</Text>
        </View>
        <Text style={styles.info}>ⓘ</Text>
      </View>
      <Text style={styles.title}>
        Qui sort{`\n`}
        <Text style={styles.titleAccent}>ce soir ?</Text>
      </Text>
      <Text style={styles.subtitle}>
        Découvre les intentions de sortie et les lieux indiqués volontairement par les membres.
      </Text>
      {displayStatus && (
        <Pressable onPress={() => navigation.navigate('EveningStatus')} style={styles.myStatus}>
          <Text style={styles.myStatusIcon}>●</Text>
          <View style={styles.myStatusCopy}>
            <Text style={styles.myStatusTitle}>Ton statut est visible</Text>
            <Text style={styles.myStatusBody}>
              {displayStatusLabel} · {displayVenue ?? 'lieu partagé'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
      <View style={styles.filters}>
        <Text style={[styles.filter, styles.filterActive]}>Tous</Text>
        <Text style={styles.filter}>Bar 🍸</Text>
        <Text style={styles.filter}>Concert 🎶</Text>
      </View>
      <View style={styles.quickLinks}>
        <Pressable onPress={() => navigation.navigate('Friends')} style={styles.quickLink}>
          <Text style={styles.quickLinkText}>♧ Amis</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Crew')} style={styles.quickLink}>
          <Text style={styles.quickLinkText}>✧ Crew</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('WhoLikedMe')} style={styles.quickLinkGold}>
          <Text style={styles.quickLinkTextGold}>♛ Likes</Text>
        </Pressable>
      </View>
      <View style={styles.mapCard}>
        <View style={styles.mapCardHeader}>
          <View>
            <Text style={styles.mapLabel}>TÉCAP MAP · SAINT-BRIEUC</Text>
            <Text style={styles.mapTitle}>26 personnes ont partagé un plan</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Map')} style={styles.mapButton}>
            <Text style={styles.mapButtonText}>Ouvrir ↗</Text>
          </Pressable>
        </View>
        {isFocused ? (
          <MapCanvas
            height={210}
            initialRegion={{ ...SAINT_BRIEUC_CENTER, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
            markers={demoPois}
            onMarkerPress={() => navigation.navigate('Map')}
          />
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.section}>Les lieux du soir</Text>
        <Pressable onPress={() => navigation.navigate('Map')}>
          <Text style={styles.link}>Tout voir</Text>
        </Pressable>
      </View>
      {venues.map((venue) => (
        <Pressable
          key={venue.name}
          style={styles.venue}
          onPress={() =>
            navigation.navigate('VenueDetail', {
              venue: venue.name,
              count: venue.count,
              kind: venue.type,
            })
          }
        >
          <View style={styles.venueIcon}>
            <Text style={styles.venueIconText}>⌖</Text>
          </View>
          <View style={styles.venueCopy}>
            <Text style={styles.venueName}>
              {venue.name} {venue.emoji}
            </Text>
            <Text style={styles.venueMeta}>
              {venue.count} personnes · {venue.type}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => navigation.navigate('Night')} style={styles.event}>
        <Image source={{ uri: demoPhotos.night }} style={styles.eventImage} />
        <View style={styles.eventShade} />
        <View style={styles.eventCopy}>
          <Text style={styles.eventEyebrow}>ÉVÉNEMENT TÉCAP · 18+</Text>
          <Text style={styles.eventTitle}>On se capte IRL.</Text>
          <Text style={styles.eventMeta}>
            {event
              ? `${new Date(event.starts_at).toLocaleDateString('fr-FR')} · ${event.venue} · ${event.city}`
              : 'Vendredi · L’Apsara · Rennes'}
          </Text>
        </View>
        <View style={[styles.eventCta, glow.gold]}>
          <Text style={styles.eventCtaText}>Découvrir</Text>
        </View>
      </Pressable>
      <Text style={styles.note}>
        Les lieux sont partagés volontairement. Aucune localisation individuelle n’est affichée.
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  location: { color: colors.muted, fontSize: 10, marginTop: 6 },
  info: { color: colors.text, fontSize: 22 },
  title: { color: colors.text, fontSize: 32, lineHeight: 35, fontWeight: '900', marginTop: 26 },
  titleAccent: { color: colors.pink },
  subtitle: { color: colors.mutedStrong, fontSize: 13, lineHeight: 19, marginTop: 9 },
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldWash,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 13,
  },
  myStatusIcon: { color: colors.green, fontSize: 17, marginRight: 10 },
  myStatusCopy: { flex: 1 },
  myStatusTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  myStatusBody: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 17 },
  quickLinks: { flexDirection: 'row', gap: 7, marginBottom: 13 },
  quickLink: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  quickLinkGold: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldWash,
  },
  quickLinkText: { color: colors.pinkLight, fontSize: 9, fontWeight: '900' },
  quickLinkTextGold: { color: colors.goldLight, fontSize: 9, fontWeight: '900' },
  filter: {
    color: colors.mutedStrong,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
    fontSize: 10,
  },
  filterActive: { borderColor: colors.pink, color: colors.text },
  mapCard: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.lineBright,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    padding: 10,
    ...glow.pink,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    paddingBottom: 10,
  },
  mapPlaceholder: {
    height: 210,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
  },
  mapLabel: {
    color: colors.pinkLight,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '900',
  },
  mapTitle: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 4 },
  mapButton: {
    backgroundColor: colors.goldHot,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapButtonText: { color: colors.ivoryText, fontSize: 10, fontWeight: '900' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  section: { color: colors.text, fontSize: 18, fontWeight: '900' },
  link: { color: colors.mutedStrong, fontSize: 10 },
  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  venueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueIconText: { color: colors.pink, fontSize: 20 },
  venueCopy: { flex: 1, marginLeft: 11 },
  venueName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  venueMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 22 },
  event: {
    height: 142,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 9,
  },
  eventImage: { width: '100%', height: '100%' },
  eventShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,11,.48)' },
  eventCopy: { position: 'absolute', left: 15, bottom: 15 },
  eventEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '800' },
  eventTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  eventMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 4 },
  eventCta: {
    position: 'absolute',
    right: 13,
    bottom: 14,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  eventCtaText: { color: colors.ivoryText, fontSize: 10, fontWeight: '900' },
  note: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 18 },
});
