import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, glow, radius, spacing } from '../theme';
type Navigation = { navigate: (screen: string) => void };
export function MatchScreen({ navigation }: { navigation: Navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Découvrir</Text>
        <Text style={styles.more}>ⓘ</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.kicker}>APRÈS ACCEPTATION · MATCH CRÉÉ</Text>
        <Text style={styles.title}>C’est un match !</Text>
        <Text style={styles.subtitle}>Vous vous captez ce soir !</Text>
        <View style={styles.faces}>
          <Image source={{ uri: demoPhotos.alex }} style={[styles.faceImage, styles.faceOne]} />
          <Image source={{ uri: demoPhotos.lea }} style={[styles.faceImage, styles.faceTwo]} />
          <View style={styles.heartBadge}>
            <Text style={styles.heartText}>♡</Text>
          </View>
        </View>
        <Text style={styles.plan}>◷ Vous sortez tous les deux ce soir · L’Apsara 🍸</Text>
        <Pressable onPress={() => navigation.navigate('Chat')} style={[styles.primary, glow.pink]}>
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
  more: { color: colors.mutedStrong, fontSize: 20 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 },
  kicker: { color: colors.muted, fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.mutedStrong, fontSize: 13, marginTop: 10, textAlign: 'center' },
  faces: {
    width: '100%',
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  faceImage: { width: 122, height: 122, borderRadius: 61, borderWidth: 3, position: 'absolute' },
  faceOne: { borderColor: colors.pink, left: '18%' },
  faceTwo: { borderColor: colors.gold, right: '18%' },
  heartBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...glow.pink,
  },
  heartText: { color: '#190915', fontSize: 28, fontWeight: '900' },
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
