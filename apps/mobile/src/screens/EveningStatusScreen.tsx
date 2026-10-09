import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function EveningStatusScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Mon soir</Text>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.hero}>
        <Image source={{ uri: demoPhotos.manon }} style={styles.image} />
        <View style={styles.shade} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>✦ Sort ce soir — bar 🍸</Text>
          <Text style={styles.name}>Manon, 25</Text>
          <Text style={styles.meta}>Lieu choisi · L’Apsara</Text>
        </View>
      </View>
      <Text style={styles.venue}>À l’Apsara 👀</Text>
      <View style={styles.info}>
        <Text style={styles.infoRow}>
          ◷ <Text style={styles.infoStrong}>Encore 3 h 18</Text>
          {`\n`} Ton statut disparaîtra à 02:00.
        </Text>
        <Text style={styles.infoRow}>
          ♧ <Text style={styles.infoStrong}>Visible par tes amis</Text>
          {`\n`} Tu choisis qui peut voir ton soir.
        </Text>
      </View>
      <Pressable style={styles.primary}>
        <Text style={styles.primaryText}>Modifier mon statut</Text>
      </Pressable>
      <Pressable style={styles.secondary}>
        <Text style={styles.secondaryText}>Retirer mon statut</Text>
      </Pressable>
      <Text style={styles.note}>
        Pas de géolocalisation automatique. Le lieu a été choisi manuellement.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  back: { color: colors.text, fontSize: 32 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  more: { color: colors.mutedStrong },
  hero: { height: 205, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,15,26,.36)' },
  heroCopy: { position: 'absolute', bottom: 16, left: 15 },
  eyebrow: { color: colors.mutedStrong, fontSize: 10 },
  name: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 7 },
  meta: { color: colors.mutedStrong, fontSize: 10, marginTop: 3 },
  venue: { color: colors.text, fontSize: 19, fontWeight: '800', marginVertical: 15 },
  info: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 15, gap: 14 },
  infoRow: { color: colors.mutedStrong, fontSize: 11, lineHeight: 18 },
  infoStrong: { color: colors.text, fontWeight: '700' },
  primary: {
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  primaryText: { color: colors.ivoryText, fontWeight: '800' },
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  note: { color: colors.muted, textAlign: 'center', fontSize: 9, lineHeight: 15, marginTop: 20 },
});
