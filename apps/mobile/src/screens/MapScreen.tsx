import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { type HotspotMarker, MapCanvas } from '../components/MapCanvas';
import {
  deletePrivateLocation,
  fetchBackendHotspots,
  fetchBackendLaunchAreas,
  savePrivateLocation,
  setBackendCity,
  setBackendMapVisibility,
} from '../lib/backend';
import { demoVenues } from '../lib/demo';
import {
  requestApproximateLocation,
  SAINT_BRIEUC_REGION,
  simulatedSaintBrieucLocation,
} from '../lib/geolocation';
import { isBackendEnabled } from '../lib/runtime';
import { goToOutings } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { supabase } from '../lib/supabase';
import { colors, glow, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type Filter = 'Tous' | 'Verre' | 'Restaurant' | 'Concert' | 'Club' | 'Sans plan';

const venueCoordinates: Record<string, { latitude: number; longitude: number }> = {
  'L’Apsara': { latitude: 48.5162, longitude: -2.7622 },
  'Le Velvet Bar': { latitude: 48.5134, longitude: -2.7681 },
  'La Verrière': { latitude: 48.5119, longitude: -2.7645 },
  'Club Horizon': { latitude: 48.5181, longitude: -2.7594 },
  'La Citrouille': { latitude: 48.5154, longitude: -2.7702 },
};

function filterMatches(filter: Filter, activityType: string) {
  if (filter === 'Tous') return true;
  if (filter === 'Sans plan') return activityType === 'other';
  return activityType.toLowerCase().includes(filter.toLowerCase());
}

export function MapScreen({ navigation }: { navigation: Navigation }) {
  const city = useAppStore((state) => state.city);
  const setCity = useAppStore((state) => state.setCity);
  const locationConsent = useAppStore((state) => state.locationConsent);
  const mapVisible = useAppStore((state) => state.mapVisible);
  const approximateLocation = useAppStore((state) => state.approximateLocation);
  const setLocationConsent = useAppStore((state) => state.setLocationConsent);
  const setMapVisible = useAppStore((state) => state.setMapVisible);
  const setApproximateLocation = useAppStore((state) => state.setApproximateLocation);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('Tous');
  const launchAreasQuery = useQuery({
    queryKey: ['backend-launch-areas'],
    queryFn: fetchBackendLaunchAreas,
    enabled: isBackendEnabled,
  });
  const activeArea =
    launchAreasQuery.data?.find((area) => area.name === city) ?? launchAreasQuery.data?.[0];
  const hotspotsQuery = useQuery({
    queryKey: ['backend-hotspots', activeArea?.slug ?? city],
    queryFn: () => fetchBackendHotspots(activeArea?.slug),
    enabled: isBackendEnabled && Boolean(activeArea),
  });
  const mapRegion = activeArea
    ? {
        latitude: Number(activeArea.center_lat),
        longitude: Number(activeArea.center_lng),
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : SAINT_BRIEUC_REGION;

  useEffect(() => {
    if (!isBackendEnabled) return;
    const channel = supabase
      .channel(`tecap-map-statuses-${city}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evening_statuses' }, () => {
        void queryClient.invalidateQueries({
          queryKey: ['backend-hotspots', activeArea?.slug ?? city],
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeArea?.slug, city, queryClient]);

  const fallbackHotspots = useMemo(
    () =>
      demoVenues.map((venue) => ({
        city,
        venue: venue.name,
        activityType: venue.type.toLowerCase(),
        memberCount: venue.count,
      })),
    [city],
  );
  const hotspots = isBackendEnabled ? (hotspotsQuery.data ?? []) : fallbackHotspots;
  const filteredHotspots = hotspots.filter((hotspot) =>
    filterMatches(filter, hotspot.activityType),
  );
  const markers: HotspotMarker[] = filteredHotspots.map((hotspot, index) => {
    const coordinate = venueCoordinates[hotspot.venue] ?? {
      latitude: SAINT_BRIEUC_REGION.latitude + (index % 3) * 0.003,
      longitude: SAINT_BRIEUC_REGION.longitude + (index % 3) * 0.004,
    };
    return {
      id: `${hotspot.venue}-${hotspot.activityType}`,
      title: hotspot.venue,
      subtitle: `${hotspot.memberCount} personne(s) · ${hotspot.activityType}`,
      ...coordinate,
      accent: index % 2 === 0 ? 'pink' : 'gold',
    };
  });

  const applyApproximateLocation = async () => {
    const result = await requestApproximateLocation();
    if (result.status === 'denied') {
      setLocationConsent('denied');
      Alert.alert(
        'Position non activée',
        `Aucun souci : tu peux continuer avec ${city} ou choisir ta ville manuellement. Ta position exacte ne sera jamais affichée.`,
      );
      return;
    }
    const next = {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracyM: result.accuracyM,
      updatedAt: Date.now(),
    };
    setLocationConsent('granted');
    setApproximateLocation(next);
    if (isBackendEnabled) await savePrivateLocation(next);
    Alert.alert(
      'Position approximative activée',
      'Elle sert uniquement à améliorer ta zone de découverte. Elle reste privée.',
    );
  };

  const simulateLocation = async () => {
    const simulated = simulatedSaintBrieucLocation();
    const next = { ...simulated, updatedAt: Date.now() };
    setLocationConsent('granted');
    setApproximateLocation(next);
    if (isBackendEnabled) await savePrivateLocation(next);
    Alert.alert(
      'Position de démo activée',
      'Saint-Brieuc est utilisé comme position approximative de démonstration.',
    );
  };

  const toggleVisibility = async () => {
    const next = !mapVisible;
    setMapVisible(next);
    if (isBackendEnabled) await setBackendMapVisibility(next);
    await queryClient.invalidateQueries({
      queryKey: ['backend-hotspots', activeArea?.slug ?? city],
    });
  };

  const chooseCity = () => {
    const names = launchAreasQuery.data?.map((area) => area.name) ?? [city];
    const selectCity = (name: string) => {
      const area = launchAreasQuery.data?.find((item) => item.name === name);
      setCity(name);
      if (isBackendEnabled) void setBackendCity(name, area?.slug);
    };
    Alert.alert(
      'Choisir ma ville',
      'La ville sert à filtrer les profils et les sorties. Les villes fermées restent indisponibles jusqu’à leur ouverture.',
      names
        .map((name) => ({ text: name, onPress: () => selectCity(name) }))
        .concat([{ text: 'Annuler', onPress: () => undefined }]),
    );
  };

  const clearPrivateLocation = async () => {
    setLocationConsent('unknown');
    setApproximateLocation(undefined);
    if (isBackendEnabled) await deletePrivateLocation();
    Alert.alert('Position supprimée', 'TÉCAP utilisera désormais ta ville manuelle.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            navigation.goBack ? navigation.goBack() : goToOutings(navigation, 'OutingsHome')
          }
          accessibilityLabel='Retour'
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>{city.toUpperCase()} · CE SOIR</Text>
        </View>
        <Text style={styles.more}>ⓘ</Text>
      </View>
      <Text style={styles.title}>Autour de toi ce soir</Text>
      <Text style={styles.subtitle}>
        {filteredHotspots.length > 0
          ? `${city} est actif ce soir · ${filteredHotspots.length} hotspot(s) public(s)`
          : `Pas encore d’activité visible à ${city}.`}
      </Text>
      <View style={styles.filters}>
        {(['Tous', 'Verre', 'Restaurant', 'Concert', 'Club', 'Sans plan'] as Filter[]).map(
          (item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filter, filter === item && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      <MapCanvas initialRegion={mapRegion} markers={markers} />
      <View style={styles.privacyCard}>
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Je suis visible sur la carte</Text>
          <Text style={styles.privacyBody}>
            Seuls des lieux choisis et des groupes anonymisés apparaissent. Jamais ta position
            exacte.
          </Text>
        </View>
        <Pressable
          onPress={toggleVisibility}
          accessibilityRole='switch'
          accessibilityState={{ checked: mapVisible }}
          style={[styles.switch, mapVisible && styles.switchOn]}
        >
          <View style={[styles.switchThumb, mapVisible && styles.switchThumbOn]} />
        </Pressable>
      </View>
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>Ta zone de découverte</Text>
        <Text style={styles.locationBody}>
          {locationConsent === 'granted'
            ? `Position approximative activée${approximateLocation?.accuracyM ? ` · précision ${Math.round(approximateLocation.accuracyM)} m` : ''}.`
            : locationConsent === 'denied'
              ? 'Position refusée · tu utilises une ville manuelle.'
              : 'Choisis une ville ou utilise une position approximative.'}
        </Text>
        <View style={styles.locationActions}>
          <Pressable onPress={applyApproximateLocation} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Utiliser ma position</Text>
          </Pressable>
          <Pressable onPress={chooseCity} style={styles.locationButtonSecondary}>
            <Text style={styles.locationButtonSecondaryText}>Choisir ma ville</Text>
          </Pressable>
          {locationConsent === 'granted' && (
            <Pressable onPress={clearPrivateLocation} style={styles.locationButtonSecondary}>
              <Text style={styles.locationButtonSecondaryText}>Supprimer ma position</Text>
            </Pressable>
          )}
          {__DEV__ && (
            <Pressable onPress={simulateLocation} style={styles.locationButtonSecondary}>
              <Text style={styles.locationButtonSecondaryText}>Simuler Saint-Brieuc</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={styles.section}>Les hotspots du soir</Text>
      {filteredHotspots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>On élargit bientôt autour de {city}.</Text>
          <Text style={styles.emptyBody}>
            Publie ton statut, regarde les événements ou élargis tes préférences pour créer plus
            d’occasions.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('EveningStatus')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Publier mon statut</Text>
          </Pressable>
        </View>
      ) : (
        filteredHotspots.map((hotspot) => (
          <Pressable
            key={`${hotspot.venue}-${hotspot.activityType}`}
            onPress={() => navigation.navigate('OutingsHome')}
            style={styles.venue}
          >
            <Text style={styles.pinIcon}>✦</Text>
            <View style={styles.venueCopy}>
              <Text style={styles.venueName}>{hotspot.venue}</Text>
              <Text style={styles.venueMeta}>
                {hotspot.memberCount} personnes · {hotspot.activityType}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
      <Text style={styles.note}>
        Les membres indiquent volontairement leur intention de sortie. Un statut n’est jamais une
        preuve de présence ni un consentement à une rencontre.
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
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.gold, fontSize: 7, letterSpacing: 1.2, fontWeight: '900' },
  more: { color: colors.mutedStrong, fontSize: 16 },
  title: { color: colors.text, fontSize: 27, lineHeight: 32, fontWeight: '900', marginTop: 25 },
  subtitle: { color: colors.mutedStrong, fontSize: 12, lineHeight: 18, marginTop: 7 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  filter: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterActive: { borderColor: colors.pink, backgroundColor: colors.pinkWash },
  filterText: { color: colors.mutedStrong, fontSize: 10 },
  filterTextActive: { color: colors.text, fontWeight: '800' },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  privacyCopy: { flex: 1, paddingRight: 12 },
  privacyTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  privacyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  switch: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.pink, ...glow.pink },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.text },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: colors.canvas },
  locationCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldWash,
  },
  locationTitle: { color: colors.goldLight, fontSize: 12, fontWeight: '900' },
  locationBody: { color: colors.mutedStrong, fontSize: 10, lineHeight: 15, marginTop: 4 },
  locationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  locationButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationButtonText: { color: colors.ivoryText, fontSize: 10, fontWeight: '900' },
  locationButtonSecondary: {
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationButtonSecondaryText: { color: colors.goldLight, fontSize: 10, fontWeight: '800' },
  section: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 20, marginBottom: 10 },
  empty: {
    padding: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: { color: colors.text, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  emptyBody: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 12,
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyButtonText: { color: colors.ivoryText, fontWeight: '900', fontSize: 11 },
  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
  },
  pinIcon: { color: colors.pink, fontSize: 20, marginRight: 11 },
  venueCopy: { flex: 1 },
  venueName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  venueMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 21 },
  note: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 18 },
});
