import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { demoPhotos } from '../lib/demo';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string) => void };

export function IncomingRequestScreen({ navigation }: { navigation: Navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Chat')} accessibilityRole='button'>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.headerTitle}>NOUVELLE DEMANDE</Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.orbit}>
          <View style={styles.orbitDot} />
          <Image source={{ uri: demoPhotos.alex }} style={styles.avatar} />
        </View>
        <Text style={styles.kicker}>INVITATION SPÉCIALE · IL Y A 2 MIN</Text>
        <Text style={styles.title}>On se capte{`\n`}ce soir ?</Text>
        <Text style={styles.subtitle}>Alex t’a envoyé une invitation spéciale.</Text>
        <View style={styles.messageCard}>
          <Text style={styles.quote}>“ J’aimerais beaucoup qu’on se capte ce soir ✨ ”</Text>
          <Text style={styles.meta}>Alex · 27 ans · à 2 km · en ligne</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Match')}
          style={[styles.primary, glow.pink]}
          accessibilityRole='button'
        >
          <Text style={styles.primaryText}>Voir la demande</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Discover')}
          style={styles.secondary}
          accessibilityRole='button'
        >
          <Text style={styles.secondaryText}>Plus tard</Text>
        </Pressable>
        <Text style={styles.disclaimer}>
          Tu gardes toujours le contrôle. Aucun rendez-vous n’est automatique.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  headerTitle: { color: colors.mutedStrong, fontSize: 10, letterSpacing: 1.3, fontWeight: '800' },
  brandHeader: { alignItems: 'center', gap: 2 },
  more: { color: colors.mutedStrong, fontSize: 15 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 55 },
  orbit: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderColor: colors.pink,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow.pink,
  },
  orbitDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
    top: 7,
    right: 19,
  },
  avatar: { width: 116, height: 116, borderRadius: 58, borderColor: colors.gold, borderWidth: 3 },
  kicker: { color: colors.pink, fontSize: 9, letterSpacing: 1.3, fontWeight: '900', marginTop: 24 },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: { color: colors.mutedStrong, fontSize: 13, textAlign: 'center', marginTop: 8 },
  messageCard: {
    width: '100%',
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 17,
    marginTop: 25,
  },
  quote: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 21,
  },
  meta: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 9 },
  primary: {
    width: '100%',
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: 17,
  },
  primaryText: { color: '#190915', fontSize: 15, fontWeight: '900' },
  secondary: {
    width: '100%',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 9,
  },
  secondaryText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  disclaimer: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 17,
  },
});
