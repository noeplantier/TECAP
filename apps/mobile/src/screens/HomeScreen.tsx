import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string) => void };
export function HomeScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.top}>
        <View>
          <Text style={styles.wordmark}>TÉCAP</Text>
          <Text style={styles.location}>⌖ Rennes · ce soir · 18+</Text>
        </View>
        <Text style={styles.bell}>♧</Text>
      </View>
      <Text style={styles.title}>T’es où ?{`\n`}On se capte.</Text>
      <Pressable style={styles.statusCta} onPress={() => navigation.navigate('EveningStatus')}>
        <Text style={styles.moon}>☾</Text>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>T’as quoi de prévu ce soir ?</Text>
          <Text style={styles.statusSub}>Ton soir, tes envies. Partage ce que tu veux.</Text>
        </View>
        <Text style={styles.plus}>＋</Text>
      </Pressable>
      <View style={styles.filters}>
        <Text style={[styles.filter, styles.filterOn]}>Tous</Text>
        <Text style={styles.filter}>Bar 🍸</Text>
        <Text style={styles.filter}>Concert 🎶</Text>
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Qui sort ce soir ?</Text>
        <Pressable onPress={() => navigation.navigate('Map')}>
          <Text style={styles.link}>Voir la carte ↗</Text>
        </Pressable>
      </View>
      <Pressable style={styles.featureCard} onPress={() => navigation.navigate('Discover')}>
        <Image source={{ uri: demoPhotos.lea }} style={styles.featureImage} />
        <View style={styles.featureShade} />
        <View style={styles.featureText}>
          <Text style={styles.featureEyebrow}>✦ Sort ce soir — bar 🍸</Text>
          <Text style={styles.featureName}>Léa, 24</Text>
          <Text style={styles.featureMeta}>Centre · zone 1 km</Text>
        </View>
      </Pressable>
      <Pressable style={styles.rowCard} onPress={() => navigation.navigate('Discover')}>
        <View style={styles.smallAvatar}>
          <Text style={styles.avatarLetter}>L</Text>
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>Lucas, 25</Text>
          <Text style={styles.rowMeta}>Sort ce soir — bar 🍸</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Text style={styles.disclaimer}>Zones choisies · aucune position en direct.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28, flexGrow: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wordmark: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 1.4 },
  location: { color: colors.muted, fontSize: 10, marginTop: 9 },
  bell: { color: colors.mutedStrong, fontSize: 24 },
  title: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '800',
    marginTop: 25,
    marginBottom: 20,
  },
  statusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 13,
    borderWidth: 1,
    borderColor: '#26283F',
  },
  moon: { color: colors.violet, fontSize: 23, marginRight: 10 },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  statusSub: { color: colors.muted, fontSize: 10, marginTop: 5 },
  plus: { color: colors.ivory, fontSize: 22 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  filter: {
    color: colors.mutedStrong,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 11,
  },
  filterOn: { color: colors.text, borderColor: colors.ivory },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  link: { color: colors.muted, fontSize: 10 },
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
  featureEyebrow: { color: colors.mutedStrong, fontSize: 10, marginBottom: 7 },
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
    backgroundColor: colors.violetSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { color: colors.text, fontWeight: '800' },
  rowCopy: { flex: 1, marginLeft: 11 },
  rowName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  rowMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 22 },
  disclaimer: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 18 },
});
