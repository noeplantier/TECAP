import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { type MapMarker, MapCanvas } from '../components/MapCanvas';
import {
  deletePrivateLocation,
  fetchBackendHotspots,
  fetchBackendLaunchAreas,
  fetchBackendPointsOfInterest,
  savePrivateLocation,
  setBackendCity,
  setBackendMapVisibility,
} from '../lib/backend';
import { demoPois, categoryLabels, SAINT_BRIEUC_CENTER, type TecapPoi } from '../lib/mapData';
import { isBackendEnabled } from '../lib/runtime';
import { requestApproximateLocation, simulatedSaintBrieucLocation } from '../lib/geolocation';
import { useAppStore } from '../state/useAppStore';
import { supabase } from '../lib/supabase';
import { colors, glow, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type Filter = 'all' | 'tonight' | 'bar' | 'restaurant' | 'concert' | 'club' | 'tecap_event';

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'tonight', label: 'Ce soir' },
  { id: 'bar', label: 'Bars' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'concert', label: 'Concerts' },
  { id: 'club', label: 'Clubs' },
  { id: 'tecap_event', label: 'TÉCAP Night' },
];

function matchesFilter(poi: TecapPoi, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'tonight') return poi.category === 'hotspot' || poi.participantCount > 0;
  return poi.category === filter;
}

function backendPoiToTecap(
  poi: NonNullable<Awaited<ReturnType<typeof fetchBackendPointsOfInterest>>[number]>,
): TecapPoi {
  return {
    id: poi.id,
    category: poi.category,
    name: poi.name,
    subtitle: poi.subtitle,
    description: poi.description,
    latitude: Number(poi.latitude),
    longitude: Number(poi.longitude),
    city: poi.city_slug === 'saint-brieuc' ? 'Saint-Brieuc' : poi.city_slug,
    citySlug: poi.city_slug,
    participantCount: poi.participant_count,
    accent: poi.accent,
    icon: poi.icon,
    isPremium: poi.is_premium,
    startsAt: poi.starts_at ?? undefined,
    action: poi.action,
  };
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
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedPoi, setSelectedPoi] = useState<TecapPoi | null>(null);
  const realtimeRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRefreshKinds = useRef(new Set<'poi' | 'hotspot'>());
  const launchAreasQuery = useQuery({
    queryKey: ['backend-launch-areas'],
    queryFn: fetchBackendLaunchAreas,
    enabled: isBackendEnabled,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const activeArea =
    launchAreasQuery.data?.find((area) => area.name === city) ?? launchAreasQuery.data?.[0];
  const citySlug = activeArea?.slug ?? 'saint-brieuc';
  const poisQuery = useQuery({
    queryKey: ['backend-points-of-interest', citySlug],
    queryFn: () => fetchBackendPointsOfInterest(citySlug),
    enabled: isBackendEnabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const hotspotsQuery = useQuery({
    queryKey: ['backend-hotspots', citySlug],
    queryFn: () => fetchBackendHotspots(citySlug),
    enabled: isBackendEnabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const backendPois = useMemo(
    () => (poisQuery.data ?? []).map(backendPoiToTecap),
    [poisQuery.data],
  );
  const fallbackPois = useMemo(() => {
    if (!isBackendEnabled) return demoPois;
    const hotspotPois = (hotspotsQuery.data ?? []).map((hotspot, index): TecapPoi => ({
      id: `backend-hotspot-${hotspot.venue}-${hotspot.activityType}`,
      category: 'hotspot',
      name: hotspot.venue,
      subtitle: `${hotspot.memberCount} personnes · ${hotspot.activityType}`,
      description: 'Zone agrégée issue des statuts publics expirant ce soir.',
      latitude: SAINT_BRIEUC_CENTER.latitude + ((index % 3) - 1) * 0.003,
      longitude: SAINT_BRIEUC_CENTER.longitude + ((index % 3) - 1) * 0.004,
      city,
      citySlug,
      participantCount: hotspot.memberCount,
      accent: index % 2 ? 'magenta' : 'pink',
      icon: '◎',
      action: 'outings',
    }));
    return hotspotPois;
  }, [city, citySlug, hotspotsQuery.data]);
  const allPois = useMemo(
    () => (backendPois.length > 0 ? backendPois : fallbackPois),
    [backendPois, fallbackPois],
  );
  const visiblePois = useMemo(
    () => allPois.filter((poi) => matchesFilter(poi, filter)),
    [allPois, filter],
  );
  const activePeople = useMemo(
    () => visiblePois.reduce((sum, poi) => sum + poi.participantCount, 0),
    [visiblePois],
  );
  const mapRegion = useMemo(
    () =>
      activeArea
        ? {
            latitude: Number(activeArea.center_lat),
            longitude: Number(activeArea.center_lng),
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }
        : { ...SAINT_BRIEUC_CENTER, latitudeDelta: 0.12, longitudeDelta: 0.12 },
    [activeArea],
  );

  useEffect(() => {
    if (!isBackendEnabled) return;
    const scheduleRefresh = (kind: 'poi' | 'hotspot') => {
      realtimeRefreshKinds.current.add(kind);
      if (realtimeRefreshTimer.current) return;
      realtimeRefreshTimer.current = setTimeout(() => {
        realtimeRefreshTimer.current = null;
        const pendingKinds = realtimeRefreshKinds.current;
        realtimeRefreshKinds.current = new Set();
        if (pendingKinds.has('poi')) {
          void queryClient.invalidateQueries({
            queryKey: ['backend-points-of-interest', citySlug],
          });
        }
        if (pendingKinds.has('hotspot')) {
          void queryClient.invalidateQueries({ queryKey: ['backend-hotspots', citySlug] });
        }
      }, 250);
    };
    const channel = supabase
      .channel(`tecap-map-pois-${citySlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_of_interest',
          filter: `city_slug=eq.${citySlug}`,
        },
        () => scheduleRefresh('poi'),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evening_statuses', filter: `city=eq.${city}` },
        () => scheduleRefresh('hotspot'),
      )
      .subscribe();
    return () => {
      if (realtimeRefreshTimer.current) {
        clearTimeout(realtimeRefreshTimer.current);
        realtimeRefreshTimer.current = null;
      }
      realtimeRefreshKinds.current.clear();
      void supabase.removeChannel(channel);
    };
  }, [city, citySlug, queryClient]);

  const applyApproximateLocation = async () => {
    const result = await requestApproximateLocation();
    if (result.status === 'denied') {
      setLocationConsent('denied');
      if (Platform.OS === 'web') {
        setCity('Saint-Brieuc');
        setApproximateLocation({ ...simulatedSaintBrieucLocation(), updatedAt: Date.now() });
      }
      Alert.alert(
        'Position non activée',
        'La carte reste centrée sur Saint-Brieuc sans exposer ta position exacte.',
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
    if (isBackendEnabled && Platform.OS !== 'web') await savePrivateLocation(next);
    Alert.alert(
      'Position approximative activée',
      'Elle reste privée et sert uniquement à améliorer ta zone.',
    );
  };

  const chooseCity = () => {
    const names = launchAreasQuery.data?.map((area) => area.name) ?? [city];
    const selectCity = (name: string) => {
      const area = launchAreasQuery.data?.find((item) => item.name === name);
      setCity(name);
      if (isBackendEnabled) void setBackendCity(name, area?.slug);
    };
    Alert.alert('Choisir ma ville', 'La ville filtre les profils et les sorties partagées.', [
      ...names.map((name) => ({ text: name, onPress: () => selectCity(name) })),
      { text: 'Annuler', onPress: () => undefined },
    ]);
  };

  const toggleVisibility = async () => {
    const next = !mapVisible;
    setMapVisible(next);
    if (isBackendEnabled) await setBackendMapVisibility(next);
    await queryClient.invalidateQueries({ queryKey: ['backend-hotspots', citySlug] });
  };

  const clearPrivateLocation = async () => {
    setLocationConsent('unknown');
    setApproximateLocation(undefined);
    if (isBackendEnabled) await deletePrivateLocation();
    Alert.alert('Position supprimée', 'TÉCAP utilise désormais ta ville manuelle.');
  };

  const openPoiAction = (poi: TecapPoi) => {
    setSelectedPoi(null);
    if (poi.action === 'event') navigation.navigate('Night');
    else if (poi.action === 'invite') navigation.navigate('Invitation');
    else navigation.navigate('OutingsHome');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            navigation.goBack ? navigation.goBack() : navigation.navigate('OutingsHome')
          }
          accessibilityLabel='Retour'
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>TÉCAP MAP · {city.toUpperCase()}</Text>
        </View>
        <Text style={styles.more}>ⓘ</Text>
      </View>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.kicker}>CARTE SOCIALE · CE SOIR</Text>
          <Text style={styles.title}>Qui sort ce soir ?</Text>
          <Text style={styles.subtitle}>
            Des lieux choisis, des événements et des zones d’ambiance autour de toi.
          </Text>
        </View>
        <View style={styles.peopleBadge}>
          <Text style={styles.peopleCount}>{activePeople || 26}</Text>
          <Text style={styles.peopleLabel}>plans partagés</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={[styles.filter, filter === item.id && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <MapCanvas
        initialRegion={mapRegion}
        markers={visiblePois as MapMarker[]}
        onMarkerPress={setSelectedPoi}
      />
      <View style={styles.mapActions}>
        <Pressable
          onPress={() => navigation.navigate('EveningStatus')}
          style={[styles.primaryAction, glow.pink]}
        >
          <Text style={styles.primaryActionText}>T’AS QUOI DE PRÉVU CE SOIR ?</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('OutingsHome')}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>QUI SORT CE SOIR ?</Text>
        </Pressable>
      </View>
      {selectedPoi && (
        <View
          style={[
            styles.bottomSheet,
            selectedPoi.accent === 'gold' ? styles.bottomSheetGold : styles.bottomSheetPink,
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={[styles.sheetIcon, selectedPoi.accent === 'gold' && styles.sheetIconGold]}>
              <Text style={styles.sheetIconText}>{selectedPoi.icon}</Text>
            </View>
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetCategory}>{categoryLabels[selectedPoi.category]}</Text>
              <Text style={styles.sheetTitle}>{selectedPoi.name}</Text>
              <Text style={styles.sheetSubtitle}>{selectedPoi.subtitle}</Text>
            </View>
            <Pressable onPress={() => setSelectedPoi(null)}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.sheetDescription}>{selectedPoi.description}</Text>
          {selectedPoi.startsAt && <Text style={styles.sheetTime}>◷ {selectedPoi.startsAt}</Text>}
          <Pressable
            onPress={() => openPoiAction(selectedPoi)}
            style={[
              styles.sheetCta,
              selectedPoi.accent === 'gold' ? styles.sheetCtaGold : styles.sheetCtaPink,
            ]}
          >
            <Text style={styles.sheetCtaText}>
              {selectedPoi.action === 'event'
                ? 'Voir l’événement'
                : selectedPoi.action === 'invite'
                  ? 'Proposer de se capter'
                  : 'Voir qui sort'}
            </Text>
          </Pressable>
        </View>
      )}
      <View style={styles.privacyCard}>
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Visibilité volontaire uniquement</Text>
          <Text style={styles.privacyBody}>
            Les markers sont des lieux choisis ou des groupes anonymisés. Jamais une position
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
        <Text style={styles.locationTitle}>Ta zone de découverte · {city}</Text>
        <Text style={styles.locationBody}>
          {locationConsent === 'granted'
            ? `Position approximative activée${approximateLocation?.accuracyM ? ` · précision ${Math.round(approximateLocation.accuracyM)} m` : ''}.`
            : 'La carte reste sur une zone publique tant que tu ne partages rien.'}
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
              <Text style={styles.locationButtonSecondaryText}>Supprimer</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={styles.note}>
        Les coordonnées démo sont approximatives. Un statut de sortie n’est jamais une preuve de
        présence ni un consentement.
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
    paddingBottom: 34,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    color: colors.text,
    fontSize: 32,
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 10,
  },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.goldLight, fontSize: 7, letterSpacing: 1.2, fontWeight: '900' },
  more: { color: colors.text, fontSize: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 22, marginBottom: 14 },
  titleCopy: { flex: 1, paddingRight: 10 },
  kicker: { color: colors.pinkLight, fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '900',
    marginTop: 5,
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 10,
  },
  subtitle: { color: colors.mutedStrong, fontSize: 12, lineHeight: 17, marginTop: 7 },
  peopleBadge: {
    width: 72,
    borderRadius: radius.md,
    borderColor: colors.goldHot,
    borderWidth: 1,
    backgroundColor: colors.goldWash,
    padding: 9,
    alignItems: 'center',
    ...glow.gold,
  },
  peopleCount: { color: colors.goldLight, fontSize: 22, fontWeight: '900' },
  peopleLabel: { color: colors.mutedStrong, fontSize: 8, textAlign: 'center' },
  filters: { gap: 8, paddingBottom: 14 },
  filter: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterActive: { borderColor: colors.hotPink, backgroundColor: colors.pinkWash, ...glow.pink },
  filterText: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: colors.text, fontWeight: '900' },
  mapActions: { gap: 8, marginTop: 10 },
  primaryAction: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkElectric,
  },
  primaryActionText: { color: colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  secondaryAction: {
    alignItems: 'center',
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    backgroundColor: colors.surface,
  },
  secondaryActionText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  bottomSheet: { borderRadius: radius.lg, borderWidth: 1, padding: 15, marginTop: 12 },
  bottomSheetPink: { borderColor: colors.hotPink, backgroundColor: colors.pinkWash, ...glow.pink },
  bottomSheetGold: { borderColor: colors.goldHot, backgroundColor: colors.goldWash, ...glow.gold },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginBottom: 12,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center' },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pinkElectric,
    marginRight: 11,
  },
  sheetIconGold: { backgroundColor: colors.goldHot },
  sheetIconText: { color: colors.text, fontSize: 21, fontWeight: '900' },
  sheetCopy: { flex: 1 },
  sheetCategory: { color: colors.goldLight, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 2 },
  sheetSubtitle: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  close: { color: colors.text, fontSize: 26, paddingLeft: 8 },
  sheetDescription: { color: colors.mutedStrong, fontSize: 11, lineHeight: 16, marginTop: 12 },
  sheetTime: { color: colors.goldLight, fontSize: 11, fontWeight: '800', marginTop: 8 },
  sheetCta: { alignItems: 'center', borderRadius: radius.pill, paddingVertical: 13, marginTop: 13 },
  sheetCtaPink: { backgroundColor: colors.pinkElectric },
  sheetCtaGold: { backgroundColor: colors.goldHot },
  sheetCtaText: { color: colors.ivoryText, fontSize: 12, fontWeight: '900' },
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
  note: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 18 },
});
