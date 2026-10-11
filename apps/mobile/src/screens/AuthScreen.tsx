import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ensureBackendProfile } from '../lib/backend';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const setAccepted18Plus = useAppStore((state) => state.setAccepted18Plus);

  useEffect(() => {
    if (!isBackendEnabled) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        void ensureBackendProfile().catch(() => undefined);
        setAccepted18Plus(true);
        setAuthenticated(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void ensureBackendProfile().catch(() => undefined);
        setAccepted18Plus(true);
        setAuthenticated(true);
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [setAccepted18Plus, setAuthenticated]);

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
      setOtpSent(true);
      Alert.alert('Code envoyé', 'Vérifie ta boîte mail pour continuer.');
      return;
    }
    setLoading(false);
    setAuthenticated(true);
  };

  const verifyCode = async () => {
    if (otp.trim().length < 6) {
      Alert.alert('Code incomplet', 'Entre le code à 6 chiffres reçu par email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email' });
    setLoading(false);
    if (error) return Alert.alert('Code invalide', error.message);
    try {
      await ensureBackendProfile();
    } catch (profileError) {
      return Alert.alert(
        'Profil non initialisé',
        profileError instanceof Error ? profileError.message : 'Réessaie dans un instant.',
      );
    }
    setAccepted18Plus(true);
    setAuthenticated(true);
  };
  return (
    <View style={styles.container}>
      <BrandLogo size='large' showTagline />
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
      {otpSent && (
        <TextInput
          testID='otp-input'
          autoCapitalize='none'
          keyboardType='number-pad'
          placeholder='Code à 6 chiffres'
          placeholderTextColor={colors.muted}
          value={otp}
          onChangeText={setOtp}
          style={[styles.input, styles.otpInput]}
        />
      )}
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
      <Pressable
        disabled={loading}
        onPress={otpSent ? verifyCode : continueWithEmail}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Un instant…' : otpSent ? 'Vérifier le code' : 'Entrer dans TÉCAP'}
        </Text>
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
  otpInput: { marginTop: 10, letterSpacing: 5, textAlign: 'center' },
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
