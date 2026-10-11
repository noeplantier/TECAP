import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { demoProfiles } from '../lib/demo';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string) => void };
export function InvitationFlowScreen({ navigation }: { navigation: Navigation }) {
  const [step, setStep] = useState(0);
  const profile = demoProfiles[2]!;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <BrandLogo size='small' showTagline />
          <Text style={styles.tagline}>T’es où ? On se capte ?</Text>
        </View>
        <Text style={styles.info}>ⓘ</Text>
      </View>
      <View style={styles.progress}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={[styles.progressDot, item <= step && styles.progressOn]} />
        ))}
      </View>
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>INVITATION SPÉCIALE</Text>
          <Text style={styles.title}>On se capte{`\n`}ce soir ?</Text>
          <Text style={styles.subtitle}>
            Choisis une personne qui partage déjà son intention de sortie.
          </Text>
          <View style={styles.profileCard}>
            <Image source={{ uri: profile.photo }} style={styles.profileImage} />
            <View style={styles.profileShade} />
            <View style={styles.profileCopy}>
              <Text style={styles.status}>● EN LIGNE · SORT CE SOIR</Text>
              <Text style={styles.name}>
                {profile.name}, {profile.age}
              </Text>
              <Text style={styles.meta}>{profile.venue}</Text>
            </View>
          </View>
          <View style={styles.messageCard}>
            <Text style={styles.quote}>“ J’aimerais beaucoup qu’on se capte ce soir ✨ ”</Text>
            <Text style={styles.messageNote}>Ton invitation sera mise en avant pendant 1h.</Text>
          </View>
          <Pressable onPress={() => setStep(1)} style={[styles.cta, glow.pink]}>
            <Text style={styles.ctaText}>Voir la demande</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Discover')}>
            <Text style={styles.later}>Plus tard</Text>
          </Pressable>
        </ScrollView>
      )}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>DÉTAIL DE LA DEMANDE</Text>
          <View style={styles.avatarRing}>
            <Image source={{ uri: profile.photo }} style={styles.avatar} />
          </View>
          <Text style={styles.title}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.subtitle}>À 2 km · En ligne · disponible ce soir</Text>
          <View style={styles.inviteBubble}>
            <Text style={styles.inviteText}>“ On se capte ce soir ? ”</Text>
          </View>
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Une invitation qui change tout</Text>
            <Text style={styles.explanationBody}>
              Ton message arrive avec une mise en avant spéciale. La personne reste libre d’accepter
              ou de passer.
            </Text>
          </View>
          <Pressable onPress={() => setStep(2)} style={styles.cta}>
            <Text style={styles.ctaText}>♡ Ça me tente !</Text>
          </Pressable>
          <Pressable onPress={() => setStep(0)} style={styles.secondary}>
            <Text style={styles.secondaryText}>× Pas maintenant</Text>
          </Pressable>
        </ScrollView>
      )}
      {step === 2 && (
        <View style={styles.success}>
          <Text style={styles.successIcon}>♡</Text>
          <Text style={styles.successTitle}>C’est un match !</Text>
          <Text style={styles.successSubtitle}>Vous vous captez ce soir !</Text>
          <View style={styles.matchFaces}>
            <Image source={{ uri: profile.photo }} style={styles.matchImage} />
            <View style={styles.matchImageAlt}>
              <Text style={styles.matchLetter}>M</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('Chat')} style={styles.cta}>
            <Text style={styles.ctaText}>▢ Envoyer un message</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Night')} style={styles.secondary}>
            <Text style={styles.secondaryText}>Partager un plan</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  tagline: { color: colors.mutedStrong, fontSize: 9, marginTop: 2 },
  info: { color: colors.text, fontSize: 21 },
  progress: { flexDirection: 'row', gap: 5, marginTop: 20 },
  progressDot: { height: 3, flex: 1, backgroundColor: colors.line, borderRadius: 2 },
  progressOn: { backgroundColor: colors.pink },
  content: { paddingVertical: 32 },
  kicker: {
    color: colors.pink,
    fontSize: 10,
    letterSpacing: 1.7,
    fontWeight: '900',
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: 12,
  },
  subtitle: {
    color: colors.mutedStrong,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  profileCard: {
    height: 270,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 25,
  },
  profileImage: { width: '100%', height: '100%' },
  profileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,11,.34)' },
  profileCopy: { position: 'absolute', left: 16, bottom: 17 },
  status: { color: colors.gold, fontSize: 9, fontWeight: '800' },
  name: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 },
  meta: { color: colors.mutedStrong, fontSize: 11, marginTop: 4 },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 10,
  },
  quote: { color: colors.text, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  messageNote: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 9 },
  cta: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
    marginTop: 17,
  },
  ctaText: { color: '#190915', fontSize: 15, fontWeight: '900' },
  later: { color: colors.mutedStrong, textAlign: 'center', padding: 16, fontSize: 12 },
  avatarRing: {
    alignSelf: 'center',
    borderColor: colors.pink,
    borderWidth: 2,
    padding: 5,
    borderRadius: 70,
    marginTop: 28,
    ...glow.pink,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  inviteBubble: {
    borderColor: colors.pink,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 17,
    marginTop: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255,46,173,.1)',
  },
  inviteText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  explanation: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 12,
  },
  explanationTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  explanationBody: { color: colors.muted, lineHeight: 18, fontSize: 11, marginTop: 6 },
  secondary: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 9,
  },
  secondaryText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  success: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 60 },
  successIcon: {
    color: colors.pink,
    fontSize: 72,
    textShadowColor: colors.pink,
    textShadowRadius: 22,
  },
  successTitle: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 16 },
  successSubtitle: { color: colors.mutedStrong, fontSize: 14, marginTop: 8 },
  matchFaces: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  matchImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: colors.pink,
    borderWidth: 3,
  },
  matchImageAlt: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: colors.gold,
    borderWidth: 3,
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -25,
  },
  matchLetter: { color: colors.text, fontSize: 34, fontWeight: '900' },
});
