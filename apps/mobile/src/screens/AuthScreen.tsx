import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const continueWithEmail = async () => {
    if (!email.includes('@') || !accepted) {
      Alert.alert(
        'Encore une étape',
        'Entre un email valide et confirme que tu as 18 ans ou plus.',
      );
      return;
    }
    setLoading(true);
    if (isBackendEnabled) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      setLoading(false);
      if (error) return Alert.alert('Connexion impossible', error.message);
      Alert.alert('Code envoyé', 'Vérifie ta boîte mail pour continuer.');
      return;
    }
    setLoading(false);
    setAuthenticated(true);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>TÉCAP</Text>
      <Text style={styles.kicker}>RENCONTRES · SORTIES · IRL</Text>
      <Text style={styles.title}>Ton soir ?{`\n`}On se capte.</Text>
      <Text style={styles.subtitle}>Ta ville, tes envies, les bonnes personnes au bon moment.</Text>
      <TextInput
        testID='email-input'
        autoCapitalize='none'
        keyboardType='email-address'
        placeholder='ton@email.com'
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Pressable
        onPress={() => setAccepted((value) => !value)}
        style={styles.checkRow}
        accessibilityRole='checkbox'
        accessibilityState={{ checked: accepted }}
      >
        <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
          {accepted && <Text style={styles.check}>✓</Text>}
        </View>
        <Text style={styles.legal}>J’ai 18 ans ou plus et j’accepte les CGU.</Text>
      </Pressable>
      <Pressable disabled={loading} onPress={continueWithEmail} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? 'Un instant…' : 'Entrer dans TÉCAP'}</Text>
      </Pressable>
      <Text style={styles.note}>
        Tu choisis toujours ce que tu partages. Aucun GPS automatique.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  wordmark: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 3 },
  kicker: {
    color: colors.violet,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 58,
  },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14, marginBottom: 30 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    fontSize: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: colors.muted },
  checkboxOn: { backgroundColor: colors.ivory, borderColor: colors.ivory },
  check: { color: colors.ivoryText, textAlign: 'center', fontWeight: '900' },
  legal: { color: colors.mutedStrong, flex: 1, fontSize: 13 },
  button: {
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.ivoryText, fontWeight: '800' },
  note: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 22 },
});
