import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { fetchBackendEvents, fetchBackendProfiles, fetchBackendStatus } from '../lib/backend';
import { demoPhotos, demoProfiles, demoVenues } from '../lib/demo';
import { demoPois, SAINT_BRIEUC_CENTER } from '../lib/mapData';
import { MapCanvas } from '../components/MapCanvas';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { NeonIcon } from '../components/NeonIcon';

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
  const peopleOutTonight = (isBackendEnabled ? (remoteProfiles.data ?? []) : demoProfiles).filter(
    (profile) => Boolean(profile.status),
  );
  const venueCounts = peopleOutTonight.reduce<Map<string, number>>((counts, profile) => {
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
  const mapCard = (
    <View style={styles.mapCard}>
      <View style={styles.mapCardHeader}>
        <View style={styles.mapHeadCopy}>
          <View style={styles.mapLabelRow}>
            <NeonIcon name='location-outline' size={14} tone='pink' />
            <Text style={styles.mapLabel}>
              {isBackendEnabled ? 'CARTE' : 'CARTE · DÉMO'} · {city.toLocaleUpperCase('fr-FR')}
            </Text>
          </View>
          <Text style={styles.mapTitle}>La carte du soir</Text>
          <Text style={styles.mapSubtitle}>
            {peopleOutTonight.length} plan{peopleOutTonight.length === 1 ? '' : 's'} partagé
            {peopleOutTonight.length === 1 ? '' : 's'} volontairement
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Map')} style={styles.mapButton}>
          <NeonIcon name='expand-outline' size={14} tone='none' color={colors.ivoryText} />
          <Text style={styles.mapButtonText}>Ouvrir</Text>
        </Pressable>
      </View>
      {isFocused ? (
        <MapCanvas
          height={246}
          initialRegion={{ ...SAINT_BRIEUC_CENTER, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
          markers={isBackendEnabled ? [] : demoPois}
          onMarkerPress={() => navigation.navigate('Map')}
        />
      ) : (
        <View style={styles.mapPlaceholder} />
      )}
      <View style={styles.mapFooter}>
        <NeonIcon name='shield-checkmark-outline' size={13} tone='none' color={colors.muted} />
        <Text style={styles.mapFooterText}>
          Lieux partagés par choix · jamais de GPS automatique
        </Text>
      </View>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <BrandLogo size='medium' />
          <Text style={styles.location}>
            ⌖ {city} · ce soir{isBackendEnabled ? '' : ' · mode démo'}
          </Text>
        </View>
        <Text style={styles.info}>ⓘ</Text>
      </View>
      <Text style={styles.title}>Ce soir</Text>
      <Text style={styles.subtitle}>
        Partage ton plan, puis découvre les membres qui sortent dans {city}.
      </Text>
      <Pressable
        onPress={() => navigation.navigate('EveningStatus')}
        style={styles.statusCta}
        accessibilityRole='button'
      >
        <Text style={styles.statusCtaTitle} numberOfLines={1}>
          T’as quoi de prévu ce soir ? ›
        </Text>
      </Pressable>
      {mapCard}
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
      <View style={styles.peopleHeader}>
        <Text style={styles.section}>Qui sort ce soir ?</Text>
        <Text style={styles.peopleCount}>{peopleOutTonight.length}</Text>
      </View>
      {peopleOutTonight.length ? (
        peopleOutTonight.slice(0, 6).map((person) => (
          <Pressable
            key={person.id}
            style={styles.personRow}
            onPress={() =>
              navigation.navigate('DiscoverTab', {
                screen: 'ProfileDetail',
                params: { profileId: person.id },
              })
            }
          >
            <Image source={{ uri: person.photo }} style={styles.personPhoto} />
            <View style={styles.personCopy}>
              <Text style={styles.personName}>
                {person.name}, {person.age}
              </Text>
              <Text style={styles.personPlan} numberOfLines={1}>
                {person.status}
              </Text>
              <Text style={styles.personCity}>
                {person.city}
                {person.venue ? ` · ${person.venue}` : ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.peopleEmpty}>
          Les plans partagés apparaîtront ici. Ta position reste privée.
        </Text>
      )}
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
          <Text style={styles.eventEyebrow}>
            {event ? 'ÉVÉNEMENT TÉCAP' : 'ÉVÉNEMENT À CONFIRMER'}
          </Text>
          <Text style={styles.eventTitle}>On se capte IRL.</Text>
          <Text style={styles.eventMeta}>
            {event
              ? `${new Date(event.starts_at).toLocaleDateString('fr-FR')} · ${event.venue} · ${event.city}`
              : 'Aucune date ni aucun lieu confirmés'}
          </Text>
        </View>
        <View style={styles.eventCta}>
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
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 25 },
  subtitle: { color: colors.mutedStrong, fontSize: 13, lineHeight: 19, marginTop: 9 },
  statusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: 'rgba(248,23,149,0.36)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 16,
  },
  statusCtaTitle: { color: colors.pink, fontSize: 13, fontWeight: '800' },
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 13,
  },
  myStatusIcon: { color: colors.pink, fontSize: 17, marginRight: 10 },
  myStatusCopy: { flex: 1 },
  myStatusTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  myStatusBody: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 9,
  },
  peopleCount: { color: colors.muted, fontSize: 11 },
  personRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 9,
    marginBottom: 8,
  },
  personPhoto: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.surfaceStrong },
  personCopy: { flex: 1, marginLeft: 11, gap: 3 },
  personName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  personPlan: { color: colors.pink, fontSize: 10 },
  personCity: { color: colors.muted, fontSize: 9 },
  peopleEmpty: {
    color: colors.muted,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 11,
    lineHeight: 16,
  },
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
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  quickLinkText: { color: colors.pink, fontSize: 9, fontWeight: '700' },
  quickLinkTextGold: { color: colors.pink, fontSize: 9, fontWeight: '700' },
  mapCard: {
    backgroundColor: colors.surfaceStrong,
    borderColor: 'rgba(248,23,149,0.38)',
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    padding: 10,
    marginTop: 14,
    shadowColor: colors.pink,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    paddingBottom: 12,
    gap: 10,
  },
  mapHeadCopy: { flex: 1 },
  mapLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapPlaceholder: {
    height: 246,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
  },
  mapLabel: {
    color: colors.pink,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '900',
  },
  mapTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 4 },
  mapSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapButtonText: { color: colors.ivoryText, fontSize: 10, fontWeight: '900' },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 9,
  },
  mapFooterText: { color: colors.muted, fontSize: 9 },
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
  eventEyebrow: { color: colors.pink, fontSize: 9, fontWeight: '700' },
  eventTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  eventMeta: { color: colors.mutedStrong, fontSize: 10, marginTop: 4 },
  eventCta: {
    position: 'absolute',
    right: 13,
    bottom: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  eventCtaText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 18 },
});
