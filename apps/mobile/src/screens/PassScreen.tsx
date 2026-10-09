import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function PassScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Night')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Ton pass Night</Text>
        <Text style={styles.more}>•••</Text>
      </View>
      <Text style={styles.badge}>● PASS VALIDE</Text>
      <Text style={styles.headline}>Manon, t’es sur la liste.</Text>
      <Text style={styles.subhead}>Présente ce pass à l’accueil de la soirée.</Text>
      <View style={styles.passCard}>
        <Text style={styles.passKicker}>TÉCAP NIGHT · RENNES</Text>
        <View style={styles.qr}>
          <Text style={styles.qrText}>▦</Text>
        </View>
        <Text style={styles.passName}>Manon · DEMO–MANON–024</Text>
        <Text style={styles.passMeta}>23 octobre · L’Apsara · événement démo</Text>
      </View>
      <View style={styles.choiceCard}>
        <Text style={styles.choiceTitle}>Ton choix : ON VERRA</Text>
        <Text style={styles.choiceText}>Le bracelet reste optionnel, même sur place.</Text>
      </View>
      <Text style={styles.note}>
        QR de démonstration uniquement. Aucun accès réel garanti. Identifiant visuel unique pour
        cette maquette.
      </Text>
      <Pressable style={styles.help}>
        <Text style={styles.helpText}>Besoin d’aide ?</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  back: { color: colors.text, fontSize: 32 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  more: { color: colors.mutedStrong },
  badge: {
    alignSelf: 'flex-start',
    color: colors.mutedStrong,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
  },
  headline: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 13 },
  subhead: { color: colors.muted, fontSize: 10, marginTop: 7 },
  passCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 15,
    marginTop: 18,
    alignItems: 'center',
  },
  passKicker: { alignSelf: 'flex-start', color: colors.muted, fontSize: 9, marginBottom: 13 },
  qr: {
    width: 190,
    height: 190,
    backgroundColor: '#F8F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  qrText: { color: '#11121B', fontSize: 140, lineHeight: 140 },
  passName: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 15 },
  passMeta: { color: colors.muted, fontSize: 9, marginTop: 5 },
  choiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 15,
    marginTop: 8,
  },
  choiceTitle: { color: colors.text, fontSize: 11, fontWeight: '700' },
  choiceText: { color: colors.muted, fontSize: 10, marginTop: 6 },
  note: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 17 },
  help: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    padding: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  helpText: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
});
