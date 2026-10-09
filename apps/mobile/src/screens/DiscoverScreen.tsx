import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { demoProfiles } from '../lib/demo';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string) => void };
export function DiscoverScreen({ navigation }: { navigation: Navigation }) {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const current = demoProfiles[index % demoProfiles.length]!;
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${translateX.value / 22}deg` }],
  }));
  const swipe = (direction: 'like' | 'pass') => {
    translateX.value = withSpring(direction === 'like' ? 420 : -420, {}, (finished) => {
      if (finished) {
        if (direction === 'like') runOnJS(navigation.navigate)('Match');
        else runOnJS(setIndex)(index + 1);
      }
    });
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>×</Text>
        </Pressable>
        <Text style={styles.eyebrow}>DÉCOUVRIR</Text>
        <Text style={styles.shield}>♢</Text>
      </View>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image source={{ uri: current.photo }} style={styles.photo} />
        <View style={styles.photoShade} />
        <View style={styles.cardTop}>
          <Text style={styles.status}>● Sort ce soir — bar 🍸</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>
            {current.name}, {current.age}
          </Text>
          <Text style={styles.bio}>{current.bio} ✨</Text>
          <Text style={styles.meta}>{current.venue}</Text>
          <View style={styles.tags}>
            {current.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </Animated.View>
      <View style={styles.actions}>
        <Pressable onPress={() => swipe('pass')} style={[styles.action, styles.reject]}>
          <Text style={styles.rejectText}>×</Text>
        </Pressable>
        <Pressable onPress={() => swipe('like')} style={[styles.action, styles.like]}>
          <Text style={styles.actionText}>♡</Text>
        </Pressable>
        <Pressable onPress={() => swipe('pass')} style={[styles.action, styles.star]}>
          <Text style={styles.starText}>☆</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  back: { color: colors.text, fontSize: 29 },
  eyebrow: { color: colors.mutedStrong, fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  shield: { color: colors.mutedStrong, fontSize: 23 },
  card: {
    flex: 1,
    maxHeight: 565,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,15,26,.28)' },
  cardTop: {
    position: 'absolute',
    left: 14,
    top: 15,
    backgroundColor: 'rgba(14,15,26,.72)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  status: { color: colors.text, fontSize: 10 },
  copy: { position: 'absolute', left: 17, right: 17, bottom: 17 },
  name: { color: colors.text, fontSize: 25, fontWeight: '800' },
  bio: { color: colors.text, fontSize: 13, marginTop: 7 },
  meta: { color: colors.mutedStrong, fontSize: 10, marginTop: 7 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tag: {
    color: colors.text,
    backgroundColor: 'rgba(14,15,26,.62)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 9,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 19,
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
  star: { borderColor: colors.line, backgroundColor: colors.surface },
  actionText: { color: colors.ivoryText, fontSize: 32, lineHeight: 35 },
  rejectText: { color: colors.mutedStrong, fontSize: 32, lineHeight: 35 },
  starText: { color: colors.mutedStrong, fontSize: 28 },
});
