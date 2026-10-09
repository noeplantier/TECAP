import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function NightScreen({ navigation }: { navigation: Navigation }) {
  const [joined, setJoined] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>TÉCAP Night</Text>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.hero}>
        <Image source={{ uri: demoPhotos.night }} style={styles.image} />
        <View style={styles.shade} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>✦ RENNES · 18+</Text>
          <Text style={styles.heroTitle}>On se capte IRL.</Text>
        </View>
      </View>
      <Text style={styles.date}>Vendredi 23 octobre · 20:00–01:00</Text>
      <Text style={styles.meta}>L’Apsara · Rennes</Text>
      <Text style={styles.description}>
        Événement exemple · date, lieu et horaires à confirmer.
      </Text>
      <View style={styles.counter}>
        <Text style={styles.counterText}>128 personnes partantes · compteur d’exemple</Text>
      </View>
      <Text style={styles.section}>Ton bracelet, ton choix.</Text>
      <View style={styles.bracelets}>
        <Text style={styles.bracelet}>OPEN</Text>
        <Text style={styles.bracelet}>ON VERRA</Text>
        <Text style={styles.bracelet}>EN COUPLE</Text>
        <Text style={styles.bracelet}>PAS DE BRACELET</Text>
      </View>
      <Text style={styles.disclaimer}>
        Signal social volontaire, jamais un consentement. Tu peux changer d’avis et ne pas porter de
        bracelet.
      </Text>
      <Pressable
        onPress={() => {
          setJoined(true);
          navigation.navigate('Pass');
        }}
        style={styles.primary}
      >
        <Text style={styles.primaryText}>{joined ? 'Pass généré' : 'JE VIENS'}</Text>
      </Pressable>
      <Text style={styles.footer}>Respect, consentement et équipe d’accueil sur place.</Text>
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
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,15,26,.42)' },
  heroCopy: { position: 'absolute', left: 15, bottom: 17 },
  eyebrow: { color: colors.mutedStrong, fontSize: 9 },
  heroTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 7 },
  date: { color: colors.text, fontWeight: '700', fontSize: 12, marginTop: 16 },
  meta: { color: colors.mutedStrong, fontSize: 10, marginTop: 7 },
  description: { color: colors.muted, fontSize: 10, marginTop: 8 },
  counter: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginTop: 15 },
  counterText: { color: colors.mutedStrong, fontSize: 11 },
  section: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 18 },
  bracelets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  bracelet: {
    color: colors.text,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 9,
  },
  disclaimer: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 12 },
  primary: {
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryText: { color: colors.ivoryText, fontWeight: '900' },
  footer: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 12 },
});
