import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const profiles = [
  {
    name: 'Camille',
    age: 24,
    city: 'Saint-Brieuc',
    status: 'Concert · Le Chaland',
    color: '#8b6fff',
    bio: 'Toujours partante pour un bon live et une virée improvisée.',
  },
  {
    name: 'Nolan',
    age: 27,
    city: 'Saint-Brieuc',
    status: 'Bar · Centre-ville',
    color: '#ff806e',
    bio: 'Team terrasse, musique et nouvelles rencontres.',
  },
  {
    name: 'Inès',
    age: 23,
    city: 'Saint-Brieuc',
    status: 'Chill · Chez des amis',
    color: '#4bcab2',
    bio: 'On verra où la soirée nous mène.',
  },
];

export function DiscoverScreen() {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const current = profiles[index];
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${translateX.value / 18}deg` }],
  }));
  const swipe = (direction: 'like' | 'pass') => {
    translateX.value = withSpring(direction === 'like' ? 500 : -500, {}, (finished) => {
      if (finished) runOnJS(setIndex)((index + 1) % profiles.length);
    });
  };
  if (!current) return null;
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>DÉCOUVRIR</Text>
          <Text style={styles.title}>Les plans du soir</Text>
        </View>
        <Text style={styles.counter}>
          {index + 1}/{profiles.length}
        </Text>
      </View>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={[styles.photo, { backgroundColor: current.color }]}>
          <Text style={styles.photoInitial}>{current.name[0]}</Text>
          <View style={styles.status}>
            <Text style={styles.statusText}>● {current.status}</Text>
          </View>
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.name}>
            {current.name}, {current.age}
          </Text>
          <Text style={styles.city}>{current.city}</Text>
          <Text style={styles.bio}>{current.bio}</Text>
        </View>
      </Animated.View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => swipe('pass')}
          style={[styles.action, styles.pass]}
          accessibilityLabel='Passer'
        >
          <Text style={styles.actionIcon}>×</Text>
        </Pressable>
        <Pressable
          onPress={() => swipe('like')}
          style={[styles.action, styles.like]}
          accessibilityLabel='Liker'
        >
          <Text style={styles.actionIcon}>♥</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>Un match ? Vous pourrez discuter en toute simplicité.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080b', padding: 22 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  eyebrow: { color: '#ff4fd8', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#fff', fontSize: 27, fontWeight: '800', marginTop: 8 },
  counter: { color: '#777784', fontWeight: '700' },
  card: {
    flex: 1,
    maxHeight: 570,
    backgroundColor: '#16161e',
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#292936',
  },
  photo: { flex: 1, minHeight: 330, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { color: 'rgba(255,255,255,0.72)', fontSize: 120, fontWeight: '900' },
  status: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(8,8,11,0.78)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardCopy: { padding: 20 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  city: { color: '#9c9cac', fontSize: 13, marginTop: 4 },
  bio: { color: '#d0d0da', fontSize: 14, lineHeight: 21, marginTop: 13 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginVertical: 22 },
  action: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pass: { backgroundColor: '#211a22', borderColor: '#e383b4' },
  like: { backgroundColor: '#ff4fd8', borderColor: '#ff4fd8' },
  actionIcon: { fontSize: 33, color: '#fff', fontWeight: '300' },
  hint: { color: '#777784', textAlign: 'center', fontSize: 12, marginBottom: 8 },
});
