import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoPhotos, demoVenues } from '../lib/demo';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string) => void };
export function EventsHubScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <BrandLogo size='medium' />
          <Text style={styles.location}>⌖ Rennes · ce soir</Text>
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
      <View style={styles.filters}>
        <Text style={[styles.filter, styles.filterActive]}>Tous</Text>
        <Text style={styles.filter}>Bar 🍸</Text>
        <Text style={styles.filter}>Concert 🎶</Text>
      </View>
      <View style={styles.mapCard}>
        <Text style={styles.mapLabel}>CARTE DES SORTIES</Text>
        <Text style={styles.mapIcon}>⌖</Text>
        <View style={styles.mapPinOne}>
          <Text style={styles.pinText}>L’Apsara · 12</Text>
        </View>
        <View style={styles.mapPinTwo}>
          <Text style={styles.pinText}>Le Bodega · 8</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Map')} style={styles.mapButton}>
          <Text style={styles.mapButtonText}>Ouvrir la carte ↗</Text>
        </Pressable>
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.section}>Les lieux du soir</Text>
        <Pressable onPress={() => navigation.navigate('Map')}>
          <Text style={styles.link}>Tout voir</Text>
        </Pressable>
      </View>
      {demoVenues.map((venue) => (
        <Pressable
          key={venue.name}
          style={styles.venue}
          onPress={() => navigation.navigate('Discover')}
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
          <Text style={styles.eventMeta}>Vendredi · L’Apsara · Rennes</Text>
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
  filters: { flexDirection: 'row', gap: 8, marginVertical: 17 },
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
    height: 205,
    backgroundColor: '#17132B',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapLabel: {
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 1,
    position: 'absolute',
    top: 13,
    left: 14,
  },
  mapIcon: {
    color: colors.pink,
    fontSize: 72,
    position: 'absolute',
    alignSelf: 'center',
    top: 56,
    textShadowColor: colors.pink,
    textShadowRadius: 18,
  },
  mapPinOne: {
    position: 'absolute',
    top: 48,
    left: 22,
    borderColor: colors.pink,
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 7,
  },
  mapPinTwo: {
    position: 'absolute',
    right: 20,
    top: 112,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 7,
  },
  pinText: { color: colors.text, fontSize: 9 },
  mapButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  mapButtonText: { color: colors.text, fontSize: 10, fontWeight: '700' },
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
