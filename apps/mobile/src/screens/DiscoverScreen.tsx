import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { DemoProfile } from '../lib/seedProfiles';
import { demoProfiles } from '../lib/demo';
import { fetchBackendProfiles, recordBackendSwipe } from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { NeonIcon } from '../components/NeonIcon';
import { rankDiscoveryProfiles } from '../lib/discoveryRanking';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type SwipeDirection = 'like' | 'pass';

export function DiscoverScreen({ navigation }: { navigation: Navigation }) {
  const { width, height } = useWindowDimensions();
  const swipeThreshold = Math.min(140, Math.max(72, width * 0.28));
  const [index, setIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const translateX = useSharedValue(0);
  const pendingProfileRef = useRef<DemoProfile | null>(null);
  const likedProfileIds = useAppStore((state) => state.likedProfileIds);
  const passedProfileIds = useAppStore((state) => state.passedProfileIds);
  const blockedProfileIds = useAppStore((state) => state.blockedProfileIds);
  const city = useAppStore((state) => state.city);
  const outingActivity = useAppStore((state) => state.outingStatus?.activityType);
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
      rankDiscoveryProfiles(
        sourceProfiles.filter(
          (profile) =>
            !likedProfileIds.includes(profile.id) &&
            !passedProfileIds.includes(profile.id) &&
            !blockedProfileIds.includes(profile.id),
        ),
        { city, activityType: outingActivity },
      ),
    [blockedProfileIds, city, likedProfileIds, outingActivity, passedProfileIds, sourceProfiles],
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

  const resetSwipe = useCallback(() => {
    pendingProfileRef.current = null;
    setSwiping(false);
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [translateX]);

  const finishSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const profile = pendingProfileRef.current;
      if (!profile) {
        resetSwipe();
        return;
      }
      const openMatch = () =>
        navigation.navigate('Match', {
          profileId: profile.id,
          profileName: profile.name,
          profilePhoto: profile.photo,
          venue: profile.venue,
          status: profile.status,
        });
      try {
        if (isBackendEnabled) {
          const result = await recordBackendSwipe(profile.id, direction);
          if (!result.allowed) {
            resetSwipe();
            goToShop(navigation);
            return;
          }
          if (direction === 'pass') passProfile(profile.id);
          else likeProfile(profile.id, false);
          pendingProfileRef.current = null;
          setSwiping(false);
          translateX.value = 0;
          if (result.matched) openMatch();
          return;
        }

        if (direction === 'pass') {
          passProfile(profile.id);
        } else {
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
            openMatch();
            return;
          }
        }

        pendingProfileRef.current = null;
        setSwiping(false);
        translateX.value = 0;
      } catch (error) {
        resetSwipe();
        Alert.alert(
          'Action indisponible',
          error instanceof Error ? error.message : 'Réessaie dans un instant.',
        );
      }
    },
    [likeProfile, navigation, passProfile, resetSwipe, translateX],
  );

  const swipe = useCallback(
    (direction: SwipeDirection) => {
      if (!current || swiping || pendingProfileRef.current) return;
      pendingProfileRef.current = current;
      setSwiping(true);
      cancelAnimation(translateX);
      translateX.value = withTiming(
        direction === 'like' ? 520 : -520,
        { duration: 230, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(finishSwipe)(direction);
        },
      );
    },
    [current, finishSwipe, swiping, translateX],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!swiping)
        .activeOffsetX([-8, 8])
        .failOffsetY([-14, 14])
        .onUpdate((event) => {
          translateX.value = event.translationX;
        })
        .onEnd((event) => {
          if (Math.abs(event.translationX) >= swipeThreshold) {
            runOnJS(swipe)(event.translationX > 0 ? 'like' : 'pass');
          } else {
            translateX.value = withSpring(0, { damping: 20, stiffness: 210 });
          }
        })
        .onFinalize((_event, success) => {
          if (!success) translateX.value = withSpring(0, { damping: 20, stiffness: 210 });
        }),
    [swipe, swiping, swipeThreshold, translateX],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')} accessibilityRole='button'>
          <NeonIcon name='close' size={23} tone='none' color={colors.mutedStrong} />
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.eyebrow}>{isBackendEnabled ? 'DÉCOUVRIR' : 'DÉCOUVRIR · DÉMO'}</Text>
        </View>
        <NeonIcon name='shield-checkmark-outline' size={21} tone='none' color={colors.muted} />
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
      <Pressable onPress={() => navigation.navigate('Invitation')} style={styles.eveningLink}>
        <Text style={styles.eveningLinkText}>T’as quoi de prévu ce soir ?</Text>
        <Text style={styles.eveningLinkArrow}>›</Text>
      </Pressable>
      {current ? (
        <>
          <View style={styles.cardStage}>
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[styles.card, cardStyle, { maxHeight: Math.min(535, height * 0.62) }]}
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
                {current.status ? (
                  <View style={styles.cardTop}>
                    <Text style={styles.status}>● {current.status}</Text>
                  </View>
                ) : null}
                <View style={styles.copy}>
                  <Text style={styles.name}>
                    {current.name}, {current.age}
                  </Text>
                  <Text style={styles.bio}>{current.bio} ✨</Text>
                  <View style={styles.metaRow}>
                    <NeonIcon
                      name='location-outline'
                      size={13}
                      tone='none'
                      color={colors.mutedStrong}
                    />
                    <Text style={styles.meta}>
                      {current.city} · {current.distance} · volontairement partagé
                    </Text>
                  </View>
                  <View style={styles.tags}>
                    {current.tags.slice(0, 3).map((tag) => (
                      <Text key={tag} style={styles.tag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>
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
              <NeonIcon name='close' size={27} tone='none' color={colors.mutedStrong} />
            </Pressable>
            <Pressable
              disabled={swiping}
              onPress={() => void swipe('like')}
              style={({ pressed }) => [styles.action, styles.like, pressed && styles.actionPressed]}
              accessibilityLabel='J’aime à droite'
            >
              <NeonIcon name='heart' size={33} tone='pink' color={colors.text} />
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
          <Pressable onPress={() => navigation.navigate('Home')} style={styles.emptyButton}>
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
  brandHeader: { alignItems: 'center', gap: 2 },
  eyebrow: { color: colors.pinkLight, fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quota: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  quotaLink: {
    color: colors.pink,
    fontSize: 10,
    fontWeight: '700',
  },
  eveningLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
    marginBottom: 5,
  },
  eveningLinkText: { color: colors.pink, fontSize: 12, fontWeight: '700' },
  eveningLinkArrow: { color: colors.mutedStrong, fontSize: 21 },
  cardStage: { flex: 1, minHeight: 250, maxHeight: 535, position: 'relative' },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
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
  likeLabel: { left: 20, borderColor: colors.pink, backgroundColor: 'rgba(5,5,5,0.64)' },
  passLabel: { right: 20, borderColor: colors.text, backgroundColor: 'rgba(5,5,5,0.64)' },
  likeLabelText: { color: colors.pinkLight, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  passLabelText: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 1.2 },
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
  name: { color: colors.text, fontSize: 27, fontWeight: '800' },
  bio: { color: colors.text, fontSize: 13, marginTop: 7, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  meta: { color: colors.mutedStrong, fontSize: 10 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tag: {
    color: colors.text,
    backgroundColor: colors.overlay,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
  },
  swipeHint: {
    color: colors.mutedStrong,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 7,
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
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  like: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.pink,
    borderColor: colors.pinkLight,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: {
    color: colors.pink,
    fontSize: 42,
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
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    padding: 15,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  emptyButtonText: { color: colors.ivoryText, fontWeight: '900' },
});
