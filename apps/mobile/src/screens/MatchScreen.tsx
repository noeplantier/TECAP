import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { demoPhotos, demoProfiles } from '../lib/demo';
import { isBackendEnabled } from '../lib/runtime';
import { supabase } from '../lib/supabase';
import { goToMessages } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { NeonIcon, type NeonIconTone } from '../components/NeonIcon';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type MatchParams = {
  matchId?: string;
  profileId?: string;
  profileName?: string;
  profilePhoto?: string;
  venue?: string;
  status?: string;
};
type MatchRoute = { params?: MatchParams };

const celebration = [
  { angle: -2.75, tone: 'pink' as const, icon: 'heart' as const },
  { angle: -2.1, tone: 'gold' as const, icon: 'sparkles' as const },
  { angle: -1.45, tone: 'pink' as const, icon: 'heart' as const },
  { angle: -0.7, tone: 'gold' as const, icon: 'star' as const },
  { angle: 0.05, tone: 'pink' as const, icon: 'heart' as const },
  { angle: 0.75, tone: 'gold' as const, icon: 'sparkles' as const },
  { angle: 1.45, tone: 'pink' as const, icon: 'heart' as const },
  { angle: 2.15, tone: 'gold' as const, icon: 'star' as const },
];

export function MatchScreen({ navigation, route }: { navigation: Navigation; route?: MatchRoute }) {
  const city = useAppStore((state) => state.city);
  const demoName = useAppStore((state) => state.profileFirstName);
  const selfProfileQuery = useQuery({
    queryKey: ['match-self-profile'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, avatar_path')
        .eq('id', auth.user.id)
        .maybeSingle();
      return data;
    },
    enabled: isBackendEnabled,
    staleTime: 5 * 60_000,
  });

  const demoMatched = isBackendEnabled
    ? undefined
    : (demoProfiles.find((profile) => profile.id === route?.params?.profileId) ?? demoProfiles[0]);
  const matchedName = route?.params?.profileName ?? demoMatched?.name ?? 'Votre match';
  const matchedPhoto = route?.params?.profilePhoto ?? demoMatched?.photo;
  const selfPhoto = isBackendEnabled
    ? (selfProfileQuery.data?.avatar_path ?? undefined)
    : demoPhotos.alex;
  const selfInitial = ((isBackendEnabled ? selfProfileQuery.data?.first_name : demoName) || 'T')
    .slice(0, 1)
    .toUpperCase();
  const matchedInitial = matchedName.slice(0, 1).toUpperCase();
  const venue = route?.params?.venue ?? demoMatched?.venue ?? city;
  const matchId = route?.params?.matchId ?? (demoMatched ? `match-${demoMatched.id}` : undefined);

  const pulse = useSharedValue(0.86);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 700 }), withTiming(0.92, { duration: 700 })),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const openChat = () => {
    if (matchId) {
      goToMessages(navigation, 'Conversation', { matchId });
    } else {
      goToMessages(navigation);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('DiscoverHome')} accessibilityRole='button'>
          <NeonIcon name='arrow-back' size={24} tone='gold' />
        </Pressable>
        <BrandLogo size='small' />
        <NeonIcon name='heart' size={22} tone='pink' />
      </View>
      <View style={styles.content}>
        <View style={styles.celebrationStage}>
          {celebration.map((particle, index) => (
            <MatchSpark key={`${particle.icon}-${index}`} {...particle} index={index} />
          ))}
          <View style={styles.faces}>
            {selfPhoto ? (
              <Image source={{ uri: selfPhoto }} style={[styles.faceImage, styles.faceOne]} />
            ) : (
              <View style={[styles.faceImage, styles.faceOne, styles.faceFallback]}>
                <Text style={styles.faceInitial}>{selfInitial}</Text>
              </View>
            )}
            {matchedPhoto ? (
              <Image source={{ uri: matchedPhoto }} style={[styles.faceImage, styles.faceTwo]} />
            ) : (
              <View style={[styles.faceImage, styles.faceTwo, styles.faceFallback]}>
                <Text style={styles.faceInitial}>{matchedInitial}</Text>
              </View>
            )}
            <Animated.View style={[styles.heartBadge, glow.pink, pulseStyle]}>
              <NeonIcon name='heart' size={25} color={colors.text} tone='pink' />
            </Animated.View>
          </View>
        </View>
        <View style={styles.congratsPill}>
          <NeonIcon name='sparkles' size={14} tone='gold' />
          <Text style={styles.congrats}>Bravo, {matchedName} t’a aussi liké·e !</Text>
          <NeonIcon name='sparkles' size={14} tone='gold' />
        </View>
        <Text style={styles.kicker}>LA SOIRÉE PREND UNE AUTRE TOURNURE</Text>
        <Text style={styles.title}>C’est un match !</Text>
        <Text style={styles.subtitle}>Vous vous plaisez. À vous de lancer la conversation.</Text>
        <View style={styles.planRow}>
          <NeonIcon name='location' size={16} tone='pink' />
          <Text style={styles.plan}>
            {route?.params?.status ?? 'Vous sortez tous les deux ce soir'} · {venue}
          </Text>
        </View>
        <Pressable
          onPress={openChat}
          style={({ pressed }) => [styles.primary, glow.gold, pressed && styles.pressed]}
          accessibilityRole='button'
        >
          <NeonIcon name='chatbubble-ellipses' size={19} tone='none' color={colors.ivoryText} />
          <Text style={styles.primaryText}>Envoyer un message</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('DiscoverHome')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          accessibilityRole='button'
        >
          <NeonIcon name='heart-outline' size={17} tone='pink' />
          <Text style={styles.secondaryText}>Continuer à swiper</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MatchSpark({
  angle,
  index,
  tone,
  icon,
}: {
  angle: number;
  index: number;
  tone: NeonIconTone;
  icon: 'heart' | 'sparkles' | 'star';
}) {
  const progress = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    const distance = 52 + index * 2;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * distance * progress.value },
        { translateY: Math.sin(angle) * distance * progress.value },
        { scale: 0.65 + progress.value * 0.5 },
      ],
    };
  });

  useEffect(() => {
    progress.value = withDelay(
      index * 45,
      withTiming(1, { duration: 1050, easing: Easing.out(Easing.cubic) }),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  return (
    <Animated.View style={[styles.spark, style]}>
      <NeonIcon name={icon} size={index % 3 === 0 ? 20 : 15} tone={tone} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
  celebrationStage: { width: '100%', height: 205, alignItems: 'center', justifyContent: 'center' },
  faces: {
    width: '100%',
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    position: 'relative',
  },
  faceImage: { width: 122, height: 122, borderRadius: 61, borderWidth: 3, position: 'absolute' },
  faceFallback: {
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceInitial: { color: colors.text, fontSize: 36, fontWeight: '900' },
  faceOne: { borderColor: colors.pinkLight, left: '18%' },
  faceTwo: { borderColor: colors.gold, right: '18%' },
  heartBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.pink,
    borderColor: colors.pinkLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  spark: { position: 'absolute', zIndex: 3 },
  congratsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldWash,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginBottom: 15,
  },
  congrats: { color: colors.goldLight, fontSize: 11, fontWeight: '900' },
  kicker: { color: colors.pinkLight, fontSize: 9, letterSpacing: 1.7, marginBottom: 10 },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '900',
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 14,
  },
  subtitle: { color: colors.mutedStrong, fontSize: 13, marginTop: 9, textAlign: 'center' },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
  },
  plan: { color: colors.goldLight, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  primary: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: { color: colors.ivoryText, fontWeight: '900' },
  secondary: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  secondaryText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
