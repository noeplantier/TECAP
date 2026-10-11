import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { useAppStore } from '../state/useAppStore';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { BrandLogo } from '../components/BrandLogo';
import { requestPushPermissionAndRegister, triggerDemoNotification } from '../lib/notifications';

type Navigation = { navigate: (screen: string, params?: unknown) => void };

export function ProfileScreen({ navigation }: { navigation: Navigation }) {
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const city = useAppStore((state) => state.city);
  const requestNotifications = async () => {
    const result = await requestPushPermissionAndRegister();
    Alert.alert(
      result.status === 'registered'
        ? 'Notifications activées'
        : 'Notifications in-app disponibles',
      result.status === 'registered'
        ? 'Tu recevras aussi les notifications système sur les appareils compatibles.'
        : 'Le centre de notifications TÉCAP reste actif même sans permission système.',
    );
  };
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
      <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.linkCard}>
        <Text style={styles.linkIcon}>✦</Text>
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>Centre de notifications</Text>
          <Text style={styles.linkBody}>Matchs, messages et demandes de sortie</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Safety')} style={styles.linkCard}>
        <Text style={styles.linkIcon}>♢</Text>
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>Sécurité TÉCAP</Text>
          <Text style={styles.linkBody}>Conseils, blocage et signalement</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable onPress={requestNotifications} style={styles.linkCard}>
        <Text style={styles.linkIcon}>◉</Text>
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>Notifications système</Text>
          <Text style={styles.linkBody}>
            Autoriser les alertes locales et enregistrer ton appareil
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          navigation.navigate('MainTabs', { screen: 'OutingsTab', params: { screen: 'Map' } })
        }
        style={styles.linkCard}
      >
        <Text style={styles.linkIcon}>⌖</Text>
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>Ma zone et ma carte</Text>
          <Text style={styles.linkBody}>
            Position approximative, ville manuelle et visibilité publique
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {__DEV__ && (
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Démo notifications</Text>
          <Text style={styles.demoBody}>
            Scénarios locaux visibles dans le centre et au niveau système si la permission est
            accordée.
          </Text>
          <View style={styles.demoActions}>
            {(['match', 'message', 'catch', 'system'] as const).map((scenario) => (
              <Pressable
                key={scenario}
                onPress={() => void triggerDemoNotification(scenario)}
                style={styles.demoButton}
              >
                <Text style={styles.demoButtonText}>{scenario}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
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
    backgroundColor: colors.magenta,
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
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: 9,
  },
  linkIcon: { color: colors.pink, fontSize: 21, marginRight: 10 },
  linkCopy: { flex: 1 },
  linkTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  linkBody: { color: colors.muted, fontSize: 9, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 22 },
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
  demoCard: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.goldSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 3,
    marginBottom: 10,
  },
  demoTitle: { color: colors.goldLight, fontSize: 12, fontWeight: '900' },
  demoBody: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  demoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  demoButton: {
    borderColor: colors.pink,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  demoButtonText: { color: colors.text, fontSize: 9, fontWeight: '800' },
});
