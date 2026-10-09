import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../state/useAppStore';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const setAccepted18Plus = useAppStore((state) => state.setAccepted18Plus);

  const continueWithEmail = async () => {
    if (!email.includes('@') || !accepted) {
      Alert.alert(
        'Encore une étape',
        'Entre un email valide et confirme que tu as 18 ans ou plus.',
      );
      return;
    }
    setLoading(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      setLoading(false);
      if (error) return Alert.alert('Connexion impossible', error.message);
      Alert.alert(
        'Code envoyé',
        'Vérifie ta boîte mail puis relance l’application pour continuer.',
      );
      return;
    }
    setLoading(false);
    setAccepted18Plus(true);
    setAuthenticated(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.logo}>TÉCAP</Text>
        <Text style={styles.pill}>18+</Text>
      </View>
      <Text style={styles.title}>Ce soir, tu fais quoi ?</Text>
      <Text style={styles.subtitle}>
        Rencontre les personnes qui sortent au même endroit que toi.
      </Text>
      <TextInput
        testID='email-input'
        autoCapitalize='none'
        keyboardType='email-address'
        placeholder='ton@email.com'
        placeholderTextColor='#777784'
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Pressable
        onPress={() => setAccepted((value) => !value)}
        style={styles.checkboxRow}
        accessibilityRole='checkbox'
        accessibilityState={{ checked: accepted }}
      >
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
          {accepted ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.legal}>J’ai 18 ans ou plus et j’accepte les CGU.</Text>
      </Pressable>
      <Pressable disabled={loading} onPress={continueWithEmail} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? 'Un instant…' : 'Commencer'}</Text>
      </Pressable>
      <Text style={styles.note}>Pas de GPS automatique. Tu choisis ce que tu partages.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080b', padding: 24, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  logo: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  pill: {
    backgroundColor: '#ff4fd8',
    color: '#08080b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '800',
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { color: '#a7a7b5', fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 30 },
  input: {
    backgroundColor: '#15151c',
    color: '#fff',
    borderRadius: 14,
    padding: 17,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#292936',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#555565',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#ff4fd8', borderColor: '#ff4fd8' },
  check: { color: '#08080b', fontWeight: '900' },
  legal: { color: '#bdbdc8', flex: 1 },
  button: { backgroundColor: '#ff4fd8', padding: 17, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#08080b', fontSize: 16, fontWeight: '800' },
  note: { color: '#777784', textAlign: 'center', marginTop: 22, fontSize: 12 },
});
