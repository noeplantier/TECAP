import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../state/useAppStore';

export function ProfileScreen() {
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const city = useAppStore((state) => state.city);
  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setAuthenticated(false);
  };
  const deleteAccount = () =>
    Alert.alert(
      'Supprimer ton compte ?',
      'Cette action est irréversible. Utilise les réglages du compte pour confirmer.',
      [{ text: 'Annuler' }, { text: 'Contacter TÉCAP', onPress: () => undefined }],
    );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>MON PROFIL</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>
        <View>
          <Text style={styles.name}>Noé</Text>
          <Text style={styles.city}>📍 {city}</Text>
        </View>
        <Pressable style={styles.edit}>
          <Text style={styles.editText}>Modifier</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tes préférences</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Ville</Text>
          <Text style={styles.value}>{city}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications à 18h</Text>
          <Text style={styles.valueOn}>Activées</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Visibilité du statut</Text>
          <Text style={styles.value}>Ma ville uniquement</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Confidentialité</Text>
        <Text style={styles.privacy}>
          TÉCAP ne suit pas ta position en arrière-plan. Les photos sont stockées en privé et les
          liens expirent.
        </Text>
        <Pressable onPress={deleteAccount}>
          <Text style={styles.danger}>Demander la suppression du compte</Text>
        </Pressable>
      </View>
      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#08080b', padding: 22 },
  eyebrow: { color: '#ff4fd8', fontSize: 11, fontWeight: '800', letterSpacing: 1.3, marginTop: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 25 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6b25a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginLeft: 15 },
  city: { color: '#a4a4b0', marginLeft: 15, marginTop: 4 },
  edit: {
    marginLeft: 'auto',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    borderColor: '#383844',
    borderWidth: 1,
  },
  editText: { color: '#c4c4cf', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#15151c',
    borderRadius: 17,
    padding: 18,
    marginBottom: 14,
    borderColor: '#292936',
    borderWidth: 1,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 15 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopColor: '#292936',
    borderTopWidth: 1,
  },
  label: { color: '#9999a7', fontSize: 13 },
  value: { color: '#fff', fontSize: 13 },
  valueOn: { color: '#6ee0a6', fontSize: 13, fontWeight: '700' },
  privacy: { color: '#9a9aa8', fontSize: 13, lineHeight: 20 },
  danger: { color: '#ff879c', fontSize: 13, fontWeight: '700', marginTop: 18 },
  logout: { alignItems: 'center', padding: 15, marginTop: 6 },
  logoutText: { color: '#ff4fd8', fontWeight: '800' },
});
