import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function MatchScreen({ navigation }: { navigation: Navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Découvrir</Text>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.kicker}>LE SOIR COMMENCE BIEN</Text>
        <Text style={styles.title}>C’est un match !</Text>
        <Text style={styles.subtitle}>Toi et Léa, vous avez envie de vous capter.</Text>
        <View style={styles.faces}>
          <Image source={{ uri: demoPhotos.friends }} style={styles.faceImage} />
        </View>
        <Text style={styles.plan}>◷ Vous sortez tous les deux ce soir 🍸</Text>
        <Pressable onPress={() => navigation.navigate('Chat')} style={styles.primary}>
          <Text style={styles.primaryText}>◌ Envoyer un message</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Discover')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Continuer à swiper</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  headerTitle: { color: colors.text, fontWeight: '800' },
  more: { color: colors.mutedStrong },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 },
  kicker: { color: colors.muted, fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 10, textAlign: 'center' },
  faces: {
    width: '100%',
    height: 190,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginVertical: 22,
  },
  faceImage: { width: '100%', height: '100%' },
  plan: { color: colors.mutedStrong, fontSize: 11, marginBottom: 18 },
  primary: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.ivory,
    padding: 16,
    alignItems: 'center',
  },
  primaryText: { color: colors.ivoryText, fontWeight: '800' },
  secondary: { width: '100%', alignItems: 'center', padding: 16 },
  secondaryText: { color: colors.text, fontSize: 12 },
});
