import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { DemoProfile } from '../lib/seedProfiles';
import { demoProfiles } from '../lib/demo';
import { fetchBackendProfiles, recordBackendSwipe } from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToMessages, goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
const SWIPE_THRESHOLD = 110;

type SwipeDirection = 'like' | 'pass';

export function DiscoverScreen({ navigation }: { navigation: Navigation }) {
  const [index, setIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const translateX = useSharedValue(0);
  const pendingProfileRef = useRef<DemoProfile | null>(null);
  const likedProfileIds = useAppStore((state) => state.likedProfileIds);
  const passedProfileIds = useAppStore((state) => state.passedProfileIds);
  const blockedProfileIds = useAppStore((state) => state.blockedProfileIds);
  const subscription = useAppStore((state) => state.subscription);
  const likesRemaining = useAppStore((state) => state.likesRemaining());
  const likeProfile = useAppStore((state) => state.likeProfile);
  const passProfile = useAppStore((state) => state.passProfile);
  const remoteProfiles = useQuery({
    queryKey: ['discover-profiles', isBackendEnabled],
    queryFn: () => fetchBackendProfiles(),
    enabled: isBackendEnabled,
  });
  const sourceProfiles = isBackendEnabled ? (remoteProfiles.data ?? []) : demoProfiles;

  const visibleProfiles = useMemo(
    () =>
      sourceProfiles.filter(
        (profile) =>
          !likedProfileIds.includes(profile.id) &&
          !passedProfileIds.includes(profile.id) &&
          !blockedProfileIds.includes(profile.id),
      ),
    [blockedProfileIds, likedProfileIds, passedProfileIds, sourceProfiles],
  );
  const current = visibleProfiles[index];

  useEffect(() => {
    setIndex(0);
  }, [visibleProfiles.length]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${translateX.value / 22}deg` }],
  }));
  const likeLabelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, translateX.value / 90)),
    transform: [
      { rotate: '-12deg' },
      { scale: 0.86 + Math.min(0.16, Math.max(0, translateX.value / 800)) },
    ],
  }));
  const passLabelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -translateX.value / 90)),
    transform: [
      { rotate: '12deg' },
      { scale: 0.86 + Math.min(0.16, Math.max(0, -translateX.value / 800)) },
    ],
  }));

  const resetSwipe = () => {
    pendingProfileRef.current = null;
    setSwiping(false);
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
  };

  const finishSwipe = (direction: SwipeDirection) => {
    const profile = pendingProfileRef.current;
    if (!profile) {
      resetSwipe();
      return;
    }
    if (direction === 'pass') passProfile(profile.id);
    else likeProfile(profile.id, false);
    pendingProfileRef.current = null;
    translateX.value = 0;
    setSwiping(false);
  };

  const swipe = async (direction: SwipeDirection) => {
    if (!current || swiping) return;
    const profile = current;
    pendingProfileRef.current = profile;
    setSwiping(true);

    if (isBackendEnabled) {
      try {
        const result = await recordBackendSwipe(profile.id, direction);
        if (!result.allowed) {
          resetSwipe();
          goToShop(navigation);
          return;
        }
        if (result.matched) {
          likeProfile(profile.id, false);
          pendingProfileRef.current = null;
          setSwiping(false);
          goToMessages(navigation);
          return;
        }
      } catch (error) {
        resetSwipe();
        Alert.alert(
          'Action indisponible',
          error instanceof Error ? error.message : 'Réessaie dans un instant.',
        );
        return;
      }
    } else if (direction === 'like') {
      const result = likeProfile(profile.id, profile.willMatchOnLike);
      if (!result.allowed) {
        resetSwipe();
        goToShop(navigation);
        return;
      }
      if (result.matched) {
        pendingProfileRef.current = null;
        setSwiping(false);
        translateX.value = 0;
        navigation.navigate('Match');
        return;
      }
    }

    translateX.value = withSpring(
      direction === 'like' ? 460 : -460,
      { damping: 18, stiffness: 160 },
      (finished) => {
        if (finished) runOnJS(finishSwipe)(direction);
      },
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !swiping && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          translateX.value = gesture.dx;
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) >= SWIPE_THRESHOLD) {
            void swipe(gesture.dx > 0 ? 'like' : 'pass');
          } else {
            translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
          }
        },
        onPanResponderTerminate: () => {
          translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        },
      }),
    [swipe, swiping, translateX],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')} accessibilityRole='button'>
          <Text style={styles.back}>×</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.eyebrow}>DÉCOUVRIR</Text>
        </View>
        <Text style={styles.shield}>♢</Text>
      </View>
      <View style={styles.quotaRow}>
        <Text style={styles.quota}>
          {subscription === 'premium'
            ? 'Likes illimités'
            : `${likesRemaining} likes gratuits restants`}
        </Text>
        <Pressable onPress={() => goToShop(navigation)} accessibilityRole='button'>
          <Text style={styles.quotaLink}>
            {subscription === 'premium' ? 'Premium actif' : 'Voir Premium'}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => navigation.navigate('Invitation')}
        style={styles.specialInvite}
        accessibilityRole='button'
      >
        <Text style={styles.specialIcon}>♡</Text>
        <View style={styles.specialCopy}>
          <Text style={styles.specialTitle}>On se capte ce soir ?</Text>
          <Text style={styles.specialBody}>
            Envoie une invitation spéciale au profil qui te plaît.
          </Text>
        </View>
        <Text style={styles.specialArrow}>›</Text>
      </Pressable>
      {current ? (
        <>
          <View style={styles.cardStage}>
            <View style={styles.cardBackTwo} />
            <View style={styles.cardBack} />
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.card, glow.pink, cardStyle]}
              accessibilityLabel={`Profil de ${current.name}, glisse à droite pour aimer ou à gauche pour passer`}
            >
              <Image source={{ uri: current.photo }} style={styles.photo} />
              <View style={styles.photoShade} />
              <Animated.View style={[styles.swipeLabel, styles.likeLabel, likeLabelStyle]}>
                <Text style={styles.likeLabelText}>J’AIME</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeLabel, styles.passLabel, passLabelStyle]}>
                <Text style={styles.passLabelText}>PASSER</Text>
              </Animated.View>
              <View style={styles.cardTop}>
                <Text style={styles.status}>● {current.status ?? 'Disponible ce soir'}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>
                  {current.name}, {current.age}
                </Text>
                <Text style={styles.bio}>{current.bio} ✨</Text>
                <Text style={styles.meta}>
                  ⌖ {current.city} · {current.distance} · volontairement partagé
                </Text>
                <View style={styles.tags}>
                  {current.tags.slice(0, 3).map((tag) => (
                    <Text key={tag} style={styles.tag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>
          <Text style={styles.swipeHint}>Glisse à droite pour aimer · à gauche pour passer</Text>
          <Pressable
            onPress={() => navigation.navigate('ProfileDetail', { profileId: current.id })}
            style={styles.detailLink}
            accessibilityRole='button'
          >
            <Text style={styles.detailText}>Voir la fiche complète · intérêts et galerie</Text>
          </Pressable>
          <View style={styles.actions}>
            <Pressable
              disabled={swiping}
              onPress={() => void swipe('pass')}
              style={({ pressed }) => [
                styles.action,
                styles.reject,
                pressed && styles.actionPressed,
              ]}
              accessibilityLabel='Passer à gauche'
            >
              <Text style={styles.rejectText}>×</Text>
            </Pressable>
            <Pressable
              disabled={swiping}
              onPress={() => void swipe('like')}
              style={({ pressed }) => [
                styles.action,
                styles.like,
                glow.pink,
                pressed && styles.actionPressed,
              ]}
              accessibilityLabel='J’aime à droite'
            >
              <Text style={styles.actionText}>♡</Text>
            </Pressable>
            <Pressable
              disabled={swiping}
              onPress={() => void swipe('like')}
              style={({ pressed }) => [styles.action, styles.star, pressed && styles.actionPressed]}
              accessibilityLabel='Super like'
            >
              <Text style={styles.starText}>☆</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Plus de profils près de toi</Text>
          <Text style={styles.emptyBody}>
            Élargis tes préférences ou découvre qui sort ce soir.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Home')}
            style={[styles.emptyButton, glow.gold]}
          >
            <Text style={styles.emptyButtonText}>Qui sort ce soir ?</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  back: {
    color: colors.text,
    fontSize: 29,
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 12,
  },
  brandHeader: { alignItems: 'center', gap: 2 },
  eyebrow: { color: colors.pinkLight, fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  shield: {
    color: colors.goldLight,
    fontSize: 23,
    textShadowColor: colors.goldGlow,
    textShadowRadius: 10,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quota: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  quotaLink: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '900',
    textShadowColor: colors.goldGlow,
    textShadowRadius: 8,
  },
  specialInvite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pinkWash,
    borderColor: colors.hotPink,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 12,
    shadowColor: colors.pinkElectric,
    shadowOpacity: 0.48,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
  specialIcon: {
    color: colors.pinkLight,
    fontSize: 24,
    marginRight: 9,
    textShadowColor: colors.pink,
    textShadowRadius: 12,
  },
  specialCopy: { flex: 1 },
  specialTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  specialBody: { color: colors.mutedStrong, fontSize: 9, marginTop: 3 },
  specialArrow: { color: colors.pinkLight, fontSize: 23 },
  cardStage: { flex: 1, minHeight: 330, maxHeight: 535, position: 'relative' },
  cardBackTwo: {
    ...StyleSheet.absoluteFillObject,
    top: 12,
    left: 12,
    right: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.magentaDeep,
    opacity: 0.26,
    transform: [{ rotate: '3deg' }],
  },
  cardBack: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    left: 6,
    right: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    transform: [{ rotate: '1.5deg' }],
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
    borderColor: colors.hotPink,
    borderWidth: 1,
  },
  photo: { width: '100%', height: '100%' },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,3,8,.30)' },
  swipeLabel: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 9,
  },
  likeLabel: { left: 20, borderColor: colors.pinkLight, backgroundColor: colors.pinkGlow },
  passLabel: { right: 20, borderColor: colors.goldLight, backgroundColor: colors.goldGlow },
  likeLabelText: { color: colors.pinkLight, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  passLabelText: { color: colors.goldLight, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  cardTop: {
    position: 'absolute',
    left: 14,
    top: 15,
    backgroundColor: colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderColor: colors.lineBright,
    borderWidth: 1,
  },
  status: { color: colors.text, fontSize: 10 },
  copy: { position: 'absolute', left: 17, right: 17, bottom: 17 },
  name: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 10,
  },
  bio: { color: colors.text, fontSize: 13, marginTop: 7, lineHeight: 18 },
  meta: { color: colors.mutedStrong, fontSize: 10, marginTop: 7 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tag: {
    color: colors.text,
    backgroundColor: colors.overlay,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
  },
  swipeHint: {
    color: colors.pinkLight,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 7,
    textShadowColor: colors.pinkGlow,
    textShadowRadius: 7,
  },
  detailLink: { alignItems: 'center', paddingVertical: 7 },
  detailText: { color: colors.mutedStrong, fontSize: 10, textDecorationLine: 'underline' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 10,
  },
  action: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionPressed: { transform: [{ scale: 0.91 }], opacity: 0.78 },
  reject: {
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  like: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.pink,
    borderColor: colors.pinkLight,
  },
  star: { borderColor: colors.gold, backgroundColor: colors.surface },
  actionText: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 37,
    textShadowColor: colors.pinkElectric,
    textShadowRadius: 12,
  },
  rejectText: { color: colors.goldLight, fontSize: 32, lineHeight: 35 },
  starText: {
    color: colors.goldLight,
    fontSize: 28,
    textShadowColor: colors.gold,
    textShadowRadius: 11,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: {
    color: colors.goldLight,
    fontSize: 58,
    textShadowColor: colors.goldGlow,
    textShadowRadius: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 14,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: 15,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  emptyButtonText: { color: colors.ivoryText, fontWeight: '900' },
});
