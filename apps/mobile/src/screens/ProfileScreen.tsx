import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { useAppStore } from '../state/useAppStore';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { BrandLogo } from '../components/BrandLogo';

export function ProfileScreen() {
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const city = useAppStore((state) => state.city);
  const logout = async () => {
    if (isBackendEnabled) await supabase.auth.signOut();
    setAuthenticated(false);
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>MON PROFIL</Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <Text style={styles.name}>Manon, 25</Text>
        <Text style={styles.location}>⌖ {city}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ce que tu partages</Text>
        <Text style={styles.cardText}>
          Statuts volontaires, jamais de géolocalisation automatique. Tu gardes le contrôle.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Confidentialité</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notifications à 18h</Text>
          <Text style={styles.on}>Activées</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Visibilité du statut</Text>
          <Text style={styles.value}>Ma ville uniquement</Text>
        </View>
      </View>
      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Suppression du compte',
            'La demande sera traitée depuis les réglages Supabase.',
          )
        }
      >
        <Text style={styles.danger}>Demander la suppression du compte</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.gold, fontSize: 7, letterSpacing: 1.2, fontWeight: '900' },
  more: { color: colors.mutedStrong, fontSize: 18 },
  profile: { alignItems: 'center', marginVertical: 30 },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontSize: 32, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 14 },
  location: { color: colors.muted, fontSize: 12, marginTop: 5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  rowLabel: { color: colors.mutedStrong, fontSize: 13 },
  on: { color: colors.green, fontSize: 12, fontWeight: '700' },
  value: { color: colors.text, fontSize: 12 },
  logout: {
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: { color: colors.ivoryText, fontWeight: '800' },
  danger: { color: colors.danger, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
