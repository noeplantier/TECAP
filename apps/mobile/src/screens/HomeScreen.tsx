import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EVENING_STATUS_TYPES, statusLabel, type EveningStatusType } from '@tecap/shared';
import { useAppStore } from '../state/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const people = [
  { name: 'Léa', status: 'Concert', color: '#ff7b98' },
  { name: 'Tom', status: 'Bar', color: '#6e8cff' },
  { name: 'Maya', status: 'Chill', color: '#e0a5ff' },
];

export function HomeScreen() {
  const city = useAppStore((state) => state.city);
  const [selected, setSelected] = useState<EveningStatusType | null>(null);
  const [venue, setVenue] = useState('');
  const [published, setPublished] = useState(false);
  const expires = useMemo(() => new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), []);

  const publish = async () => {
    if (!selected)
      return Alert.alert('Choisis une ambiance', 'Dis-nous ce que tu as prévu ce soir.');
    if (isSupabaseConfigured) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user)
        await supabase.from('evening_statuses').upsert({
          user_id: user.id,
          city,
          status_type: selected,
          venue: venue || null,
          expires_at: expires,
        });
    }
    setPublished(true);
    Alert.alert('C’est partagé', 'Ton statut expirera automatiquement à 4h.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SAINT-BRIEUC · CE SOIR</Text>
          <Text style={styles.title}>T’as quoi de prévu ?</Text>
        </View>
        <View style={styles.live}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.description}>
        Partage ton plan, sans pression. Visible uniquement dans ta ville.
      </Text>
      <View style={styles.grid}>
        {EVENING_STATUS_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setSelected(type)}
            style={[styles.choice, selected === type && styles.choiceActive]}
          >
            <Text style={styles.choiceEmoji}>
              {
                (
                  {
                    bar: '🍸',
                    club: '🪩',
                    restaurant: '🍜',
                    concert: '🎵',
                    match: '⚽',
                    beach: '🌊',
                    chill: '🛋️',
                    other: '✨',
                  } as Record<string, string>
                )[type]
              }
            </Text>
            <Text style={[styles.choiceText, selected === type && styles.choiceTextActive]}>
              {statusLabel[type]}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={venue}
        onChangeText={setVenue}
        placeholder='Ajouter un lieu (optionnel)'
        placeholderTextColor='#777784'
        style={styles.input}
        maxLength={120}
      />
      <Pressable onPress={publish} style={[styles.primary, published && styles.primaryDone]}>
        <Text style={styles.primaryText}>
          {published ? '✓ Statut publié' : 'Partager mon plan'}
        </Text>
      </Pressable>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dans ta ville</Text>
        <Text style={styles.count}>24 personnes actives</Text>
      </View>
      {people.map((person) => (
        <View key={person.name} style={styles.person}>
          <View style={[styles.avatar, { backgroundColor: person.color }]}>
            <Text style={styles.avatarText}>{person.name[0]}</Text>
          </View>
          <View style={styles.personCopy}>
            <Text style={styles.personName}>{person.name}</Text>
            <Text style={styles.personStatus}>Ce soir · {person.status}</Text>
          </View>
          <Pressable style={styles.wave}>
            <Text>👋</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#08080b', flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  eyebrow: { color: '#ff4fd8', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#fff', fontSize: 29, fontWeight: '800', marginTop: 9 },
  description: { color: '#9797a6', fontSize: 15, lineHeight: 22, marginVertical: 14 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1c1520',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff4f83' },
  liveText: { color: '#ff9bc2', fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 9 },
  choice: {
    width: '22%',
    minWidth: 69,
    flexGrow: 1,
    aspectRatio: 0.95,
    backgroundColor: '#14141b',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#252530',
  },
  choiceActive: { borderColor: '#ff4fd8', backgroundColor: '#28182a' },
  choiceEmoji: { fontSize: 25, marginBottom: 8 },
  choiceText: { color: '#a7a7b5', fontSize: 12, fontWeight: '700' },
  choiceTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#14141b',
    borderColor: '#252530',
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    color: '#fff',
    marginTop: 16,
  },
  primary: {
    backgroundColor: '#ff4fd8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryDone: { backgroundColor: '#5dd6a0' },
  primaryText: { color: '#08080b', fontWeight: '800', fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 34,
    marginBottom: 12,
  },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  count: { color: '#777784', fontSize: 12 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111116',
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  personCopy: { flex: 1, marginLeft: 12 },
  personName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  personStatus: { color: '#8e8e9d', marginTop: 3, fontSize: 13 },
  wave: { backgroundColor: '#24202a', padding: 10, borderRadius: 13 },
});
