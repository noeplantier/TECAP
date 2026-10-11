import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { demoProfiles } from '../lib/demo';
import { fetchBackendProfiles, recordBackendSwipe } from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToMessages, goToShop } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, glow, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };

export function DiscoverScreen({ navigation }: { navigation: Navigation }) {
  const [index, setIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const translateX = useSharedValue(0);
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

  const finishSwipe = (direction: 'like' | 'pass') => {
    if (!current) return;
    if (direction === 'pass') passProfile(current.id);
    setSwiping(false);
    translateX.value = 0;
  };

  const swipe = async (direction: 'like' | 'pass') => {
    if (!current || swiping) return;
    if (isBackendEnabled) {
      try {
        const result = await recordBackendSwipe(current.id, direction);
        if (!result.allowed) {
          goToShop(navigation);
          return;
        }
        if (direction === 'pass') passProfile(current.id);
        else likeProfile(current.id, result.matched);
        if (result.matched) {
          goToMessages(navigation);
          return;
        }
      } catch (error) {
        Alert.alert(
          'Action indisponible',
          error instanceof Error ? error.message : 'Réessaie dans un instant.',
        );
        return;
      }
    }
    if (direction === 'like') {
      const result = isBackendEnabled
        ? { allowed: true, matched: false }
        : likeProfile(current.id, current.willMatchOnLike);
      if (!result.allowed) {
        goToShop(navigation);
        return;
      }
      if (result.matched) {
        navigation.navigate('Match');
        return;
      }
    }
    setSwiping(true);
    translateX.value = withSpring(
      direction === 'like' ? 420 : -420,
      { damping: 18, stiffness: 160 },
      (finished) => {
        if (finished) runOnJS(finishSwipe)(direction);
      },
    );
  };

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
          <Animated.View style={[styles.card, cardStyle]}>
            <Image source={{ uri: current.photo }} style={styles.photo} />
            <View style={styles.photoShade} />
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
              onPress={() => swipe('pass')}
              style={[styles.action, styles.reject]}
              accessibilityLabel='Passer'
            >
              <Text style={styles.rejectText}>×</Text>
            </Pressable>
            <Pressable
              disabled={swiping}
              onPress={() => swipe('like')}
              style={[styles.action, styles.like, glow.pink]}
              accessibilityLabel='J’aime'
            >
              <Text style={styles.actionText}>♡</Text>
            </Pressable>
            <Pressable
              disabled={swiping}
              onPress={() => swipe('like')}
              style={[styles.action, styles.star]}
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
  back: { color: colors.text, fontSize: 29 },
  brandHeader: { alignItems: 'center', gap: 2 },
  eyebrow: { color: colors.mutedStrong, fontSize: 9, letterSpacing: 1.4, fontWeight: '800' },
  shield: { color: colors.mutedStrong, fontSize: 23 },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quota: { color: colors.mutedStrong, fontSize: 10, fontWeight: '700' },
  quotaLink: { color: colors.gold, fontSize: 10, fontWeight: '800' },
  specialInvite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pinkWash,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 12,
  },
  specialIcon: { color: colors.pink, fontSize: 24, marginRight: 9 },
  specialCopy: { flex: 1 },
  specialTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  specialBody: { color: colors.muted, fontSize: 9, marginTop: 3 },
  specialArrow: { color: colors.pink, fontSize: 23 },
  card: {
    flex: 1,
    maxHeight: 535,
    minHeight: 330,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,11,.32)' },
  cardTop: {
    position: 'absolute',
    left: 14,
    top: 15,
    backgroundColor: colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  status: { color: colors.text, fontSize: 10 },
  copy: { position: 'absolute', left: 17, right: 17, bottom: 17 },
  name: { color: colors.text, fontSize: 27, fontWeight: '900' },
  bio: { color: colors.text, fontSize: 13, marginTop: 7, lineHeight: 18 },
  meta: { color: colors.mutedStrong, fontSize: 10, marginTop: 7 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tag: {
    color: colors.text,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
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
  reject: { borderColor: colors.line, backgroundColor: colors.surface },
  like: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ivory,
    borderColor: colors.ivory,
  },
  star: { borderColor: colors.goldSoft, backgroundColor: colors.surface },
  actionText: { color: colors.ivoryText, fontSize: 32, lineHeight: 35 },
  rejectText: { color: colors.mutedStrong, fontSize: 32, lineHeight: 35 },
  starText: { color: colors.gold, fontSize: 28 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { color: colors.gold, fontSize: 58 },
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
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 15,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  emptyButtonText: { color: colors.ivoryText, fontWeight: '900' },
});
