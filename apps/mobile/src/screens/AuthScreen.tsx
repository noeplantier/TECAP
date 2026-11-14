import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ensureBackendProfile } from '../lib/backend';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

function isValidEmail(value: string) {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf('@');
  const dotIndex = trimmed.lastIndexOf('.');
  return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < trimmed.length - 1;
}

export function AuthScreen({
  navigation,
}: { navigation?: { navigate: (screen: string) => void } } = {}) {
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
      if (!mounted) return;
      if (data.session) {
        void ensureBackendProfile().catch(() => undefined);
        setAccepted18Plus(true);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void ensureBackendProfile().catch(() => undefined);
        setAccepted18Plus(true);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [setAccepted18Plus, setAuthenticated]);

  const continueWithEmail = async () => {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail) || !accepted) {
      Alert.alert(
        'Encore une étape',
        'Entre un email valide et confirme que tu as 18 ans ou plus.',
      );
      return;
    }
    setLoading(true);
    try {
      if (isBackendEnabled) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: true },
        });
        if (error) {
          Alert.alert('Connexion impossible', error.message);
          return;
        }
        setEmail(cleanEmail);
        setOtpSent(true);
        Alert.alert('Code envoyé', 'Vérifie ta boîte mail pour continuer.');
        return;
      }
      setAccepted18Plus(true);
      setAuthenticated(true);
    } catch (error) {
      Alert.alert(
        'Connexion impossible',
        error instanceof Error ? error.message : 'Réessaie dans un instant.',
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      Alert.alert('Code incomplet', 'Entre le code à 6 chiffres reçu par email.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email',
      });
      if (error) {
        Alert.alert('Code invalide', error.message);
        return;
      }
      await ensureBackendProfile();
      setAccepted18Plus(true);
      setAuthenticated(true);
    } catch (profileError) {
      Alert.alert(
        'Profil non initialisé',
        profileError instanceof Error ? profileError.message : 'Réessaie dans un instant.',
      );
    } finally {
      setLoading(false);
    }
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
        editable={!loading && !otpSent}
        style={styles.input}
      />
      {otpSent && (
        <>
          <TextInput
            testID='otp-input'
            autoCapitalize='none'
            keyboardType='number-pad'
            placeholder='Code à 6 chiffres'
            placeholderTextColor={colors.muted}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
            style={[styles.input, styles.otpInput]}
          />
          <Pressable
            disabled={loading}
            onPress={() => {
              setOtp('');
              setOtpSent(false);
            }}
            style={styles.resetEmail}
          >
            <Text style={styles.resetEmailText}>Modifier l’adresse email</Text>
          </Pressable>
        </>
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
        onPress={() => void (otpSent ? verifyCode() : continueWithEmail())}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Un instant…' : otpSent ? 'Vérifier le code' : 'Entrer dans TÉCAP'}
        </Text>
      </Pressable>
      <Text style={styles.note}>
        Tu choisis toujours ce que tu partages. Aucun GPS automatique.
      </Text>
      <Pressable onPress={() => navigation?.navigate('RennesWaitlist')} style={styles.waitlistLink}>
        <Text style={styles.waitlistText}>
          Rennes n’est pas encore ouverte ? Rejoins la liste ↗
        </Text>
      </Pressable>
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
    color: colors.hotPink,
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
  resetEmail: { alignSelf: 'flex-end', paddingVertical: 8 },
  resetEmailText: { color: colors.pink, fontSize: 11, fontWeight: '700' },
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
  waitlistLink: { alignItems: 'center', paddingVertical: 14 },
  waitlistText: { color: colors.goldLight, fontSize: 10, fontWeight: '800' },
});
