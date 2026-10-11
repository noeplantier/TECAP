import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoVenues } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
type Navigation = { navigate: (screen: string) => void };
export function MapScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>RENNES · CE SOIR</Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.filters}>
        <Text style={[styles.filter, styles.active]}>Tous</Text>
        <Text style={styles.filter}>Bar 🍸</Text>
        <Text style={styles.filter}>Boîte 🪩</Text>
      </View>
      <View style={styles.map}>
        <Text style={styles.street}>Rue de la Soif · 18</Text>
        <Text style={[styles.pin, styles.pinA]}>L’Apsara · 12</Text>
        <Text style={[styles.pin, styles.pinB]}>Le Tire-Bouchon · 8</Text>
      </View>
      <Text style={styles.caption}>
        Carte illustrative · lieux agréés, jamais de position individuelle.
      </Text>
      <Text style={styles.section}>Les lieux du soir</Text>
      <View style={styles.venueList}>
        {demoVenues.map((venue) => (
          <View key={venue.name} style={styles.venue}>
            <Text style={styles.pinIcon}>⌖</Text>
            <View style={styles.venueCopy}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <Text style={styles.venueMeta}>
                {venue.count} statuts · {venue.type} {venue.emoji}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>Statuts volontaires · chiffres d’exemple.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.gold, fontSize: 7, letterSpacing: 1.2, fontWeight: '900' },
  more: { color: colors.mutedStrong },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 17 },
  filter: {
    color: colors.mutedStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
    fontSize: 10,
  },
  active: { color: colors.text, borderColor: colors.ivory },
  map: {
    height: 240,
    borderRadius: radius.lg,
    backgroundColor: '#1A1B32',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#303149',
  },
  street: {
    color: colors.mutedStrong,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
    position: 'absolute',
    top: 24,
    left: 20,
  },
  pin: {
    color: colors.text,
    backgroundColor: colors.violetSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 9,
    position: 'absolute',
  },
  pinA: { top: 100, left: 122 },
  pinB: { top: 166, left: 44 },
  caption: { color: colors.muted, fontSize: 9, marginTop: 9 },
  section: { color: colors.text, fontSize: 17, fontWeight: '800', marginVertical: 13 },
  venueList: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 13 },
  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  pinIcon: { color: colors.mutedStrong, fontSize: 19, marginRight: 11 },
  venueCopy: { flex: 1 },
  venueName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  venueMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 21 },
  note: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 18 },
});
