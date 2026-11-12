import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { useAppStore } from '../state/useAppStore';
import { supabase } from '../lib/supabase';
import { isBackendEnabled } from '../lib/runtime';
import { BrandLogo } from '../components/BrandLogo';
import { requestPushPermissionAndRegister, triggerDemoNotification } from '../lib/notifications';

type Navigation = { navigate: (screen: string, params?: unknown) => void };
type Profile = {
  first_name: string;
  city: string;
  bio: string;
  seeking: string | null;
  discover_visible: boolean;
  birth_date: string;
  gender: string | null;
};
type EditableField = 'first_name' | 'city' | 'bio' | 'seeking';
const labels: Record<EditableField, string> = {
  first_name: 'Prénom',
  city: 'Ville',
  bio: 'Présentation',
  seeking: 'Genre / préférence de rencontre',
};

function seekingLabel(value: string) {
  if (value === 'men' || value === 'hommes') return 'Hommes';
  if (value === 'women' || value === 'femmes') return 'Femmes';
  if (value === 'both' || value === 'les deux' || value === 'hommes et femmes') return 'Les deux';
  return value || 'À renseigner';
}

function genderLabel(value: string) {
  if (value === 'woman' || value === 'female' || value === 'femme') return 'Femme';
  if (value === 'man' || value === 'male' || value === 'homme') return 'Homme';
  if (value === 'non_binary' || value === 'non-binaire') return 'Non binaire';
  return value || 'Non renseigné';
}

export function ProfileScreen({ navigation }: { navigation: Navigation }) {
  const demoName = useAppStore((s) => s.profileFirstName);
  const demoCity = useAppStore((s) => s.city);
  const demoBio = useAppStore((s) => s.profileBio);
  const demoSeeking = useAppStore((s) => s.profileSeeking);
  const demoGender = useAppStore((s) => s.profileGender);
  const demoVisible = useAppStore((s) => s.discoverVisible);
  const outing = useAppStore((s) => s.outingStatus);
  const updateDemo = useAppStore((s) => s.updateDemoProfile);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isBackendEnabled);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState('');
  const [discoverVisible, setDiscoverVisible] = useState(demoVisible);
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  useEffect(() => {
    if (!isBackendEnabled) return;
    let active = true;
    (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw authError ?? new Error('Session absente.');
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, city, bio, seeking, discover_visible, birth_date, gender')
          .eq('id', auth.user.id)
          .single();
        if (error) throw error;
        if (active) {
          setProfile(data as Profile);
          setDiscoverVisible(data.discover_visible);
        }
      } catch (error) {
        if (active)
          Alert.alert(
            'Profil indisponible',
            error instanceof Error ? error.message : 'Réessaie plus tard.',
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const values = isBackendEnabled
    ? {
        first_name: profile?.first_name ?? '',
        city: profile?.city ?? '',
        bio: profile?.bio ?? '',
        seeking: profile?.seeking ?? '',
        gender: profile?.gender ?? '',
      }
    : {
        first_name: demoName,
        city: demoCity,
        bio: demoBio,
        seeking: demoSeeking,
        gender: demoGender,
      };
  const birthDate = profile?.birth_date;
  const age = birthDate
    ? Math.max(
        0,
        new Date().getFullYear() -
          new Date(birthDate).getFullYear() -
          (new Date() < new Date(new Date(birthDate).setFullYear(new Date().getFullYear()))
            ? 1
            : 0),
      )
    : isBackendEnabled
      ? null
      : 25;
  const completion = useMemo(
    () =>
      [values.first_name, values.city, values.bio, values.seeking].filter(
        (v) => v.trim().length > 0,
      ).length,
    [values.first_name, values.city, values.bio, values.seeking],
  );
  const setValue = (field: EditableField, value: string) => {
    if (isBackendEnabled) setProfile((p) => (p ? { ...p, [field]: value } : p));
    else
      updateDemo(
        field === 'first_name'
          ? { profileFirstName: value }
          : field === 'city'
            ? { city: value }
            : field === 'bio'
              ? { profileBio: value }
              : { profileSeeking: value },
      );
  };
  const openEditor = (field: EditableField) => {
    setEditing(field);
    setDraft(values[field]);
  };
  const saveEdit = async () => {
    if (!editing) return;
    const field = editing;
    const value = draft.trim();
    if ((field === 'first_name' || field === 'city') && !value) {
      Alert.alert('Champ obligatoire', `${labels[field]} ne peut pas être vide.`);
      return;
    }
    setBusy(true);
    try {
      if (isBackendEnabled) {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw authError ?? new Error('Session absente.');
        const updatePayload =
          field === 'first_name'
            ? { first_name: value }
            : field === 'city'
              ? { city: value }
              : field === 'bio'
                ? { bio: value }
                : { seeking: value };
        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', auth.user.id)
          .select('first_name, city, bio, seeking, discover_visible, birth_date, gender')
          .single();
        if (error) throw error;
        setProfile(data as Profile);
      } else setValue(field, value);
      setEditing(null);
    } catch (error) {
      Alert.alert(
        'Enregistrement impossible',
        error instanceof Error ? error.message : 'Réessaie plus tard.',
      );
    } finally {
      setBusy(false);
    }
  };
  const changeVisibility = async () => {
    const next = !discoverVisible;
    if (!isBackendEnabled) {
      setDiscoverVisible(next);
      updateDemo({ discoverVisible: next });
      return;
    }
    setVisibilityBusy(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw authError ?? new Error('Session absente.');
      const { data, error } = await supabase
        .from('profiles')
        .update({ discover_visible: next })
        .eq('id', auth.user.id)
        .select('first_name, city, bio, seeking, discover_visible, birth_date, gender')
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      setDiscoverVisible(data.discover_visible);
    } catch (error) {
      Alert.alert(
        'Visibilité non modifiée',
        error instanceof Error ? error.message : 'Réessaie plus tard.',
      );
    } finally {
      setVisibilityBusy(false);
    }
  };
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
  const fieldRow = (field: EditableField, value: string) => (
    <View style={styles.fieldRow} key={field}>
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{labels[field]}</Text>
        <Text style={styles.fieldValue}>
          {field === 'seeking' ? seekingLabel(value) : value || 'À renseigner'}
        </Text>
      </View>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={`Modifier ${labels[field]}`}
        onPress={() => openEditor(field)}
        style={styles.editButton}
      >
        <Text style={styles.editText}>Modifier</Text>
      </Pressable>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>
            {isBackendEnabled ? 'MON PROFIL' : 'MON PROFIL · DÉMO'}
          </Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(values.first_name || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {values.first_name || 'Ton prénom'}
          {age !== null ? `, ${age}` : ''}
        </Text>
        <Text style={styles.location}>⌖ {values.city || 'Ville à renseigner'}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion * 25}%` }]} />
        </View>
        <Text style={styles.completion}>
          {completion === 4 ? 'Profil complété' : `Profil incomplet · ${completion}/4 informations`}
        </Text>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>Tes informations de rencontre</Text>
          <Text style={styles.cardHint}>Modifiables à tout moment</Text>
        </View>
        {fieldRow('first_name', values.first_name)}
        {fieldRow('city', values.city)}
        {fieldRow('bio', values.bio)}
        {fieldRow('seeking', values.seeking)}
        <View style={styles.fieldRow}>
          <View style={styles.fieldCopy}>
            <Text style={styles.fieldLabel}>Genre</Text>
            <Text style={styles.fieldValue}>{genderLabel(values.gender)}</Text>
          </View>
          <Text style={styles.readOnly}>Lecture seule</Text>
        </View>
        {age !== null && (
          <View style={styles.fieldRow}>
            <View style={styles.fieldCopy}>
              <Text style={styles.fieldLabel}>Âge</Text>
              <Text style={styles.fieldValue}>{age} ans</Text>
            </View>
            <Text style={styles.readOnly}>Lecture seule</Text>
          </View>
        )}
        {loading && <Text style={styles.cardHint}>Chargement du profil…</Text>}
      </View>
      <Pressable
        accessibilityRole='switch'
        accessibilityState={{ checked: discoverVisible }}
        disabled={visibilityBusy || loading}
        onPress={changeVisibility}
        style={styles.visibilityCard}
      >
        <View style={styles.fieldCopy}>
          <Text style={styles.cardTitle}>Apparaître dans Découvrir</Text>
          <Text style={styles.cardHint}>
            {discoverVisible
              ? 'Ton profil peut être proposé aux personnes compatibles.'
              : 'Ton profil est masqué de Découvrir.'}
          </Text>
        </View>
        <View style={[styles.switch, discoverVisible && styles.switchOn]}>
          <View style={[styles.switchKnob, discoverVisible && styles.switchKnobOn]} />
        </View>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ce que tu partages</Text>
        <Text style={styles.cardText}>
          Statuts volontaires, jamais de géolocalisation automatique ni de coordonnées. Tu gardes le
          contrôle.
        </Text>
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
          <Text style={styles.linkBody}>Gérer les alertes de cet appareil</Text>
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
          <Text style={styles.linkTitle}>Ma ville et la carte</Text>
          <Text style={styles.linkBody}>
            Ville renseignée manuellement · aucune localisation auto
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          navigation.navigate('MainTabs', {
            screen: 'OutingsTab',
            params: { screen: 'EveningStatus' },
          })
        }
        style={styles.linkCard}
      >
        <Text style={styles.linkIcon}>◷</Text>
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>Mon statut du soir</Text>
          <Text style={styles.linkBody}>
            {outing
              ? `${outing.activityType}${outing.venue ? ` · ${outing.venue}` : ''}`
              : 'Créer ou gérer une intention de sortie'}
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
      <Modal
        visible={editing !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>
              Modifier {editing ? labels[editing].toLocaleLowerCase('fr-FR') : ''}
            </Text>
            {editing === 'seeking' ? (
              <View style={styles.preferenceOptions}>
                {[
                  { value: 'men', label: 'Hommes' },
                  { value: 'women', label: 'Femmes' },
                  { value: 'both', label: 'Les deux' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setDraft(option.value)}
                    style={[
                      styles.preferenceOption,
                      draft === option.value && styles.preferenceOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.preferenceOptionText,
                        draft === option.value && styles.preferenceOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                autoFocus
                value={draft}
                onChangeText={setDraft}
                multiline={editing === 'bio'}
                maxLength={editing === 'bio' ? 500 : editing === 'first_name' ? 40 : 120}
                placeholder={editing ? labels[editing] : ''}
                placeholderTextColor={colors.muted}
                style={[styles.input, editing === 'bio' && styles.multiline]}
                accessibilityLabel={editing ? labels[editing] : 'Modifier le profil'}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditing(null)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable disabled={busy} onPress={() => void saveEdit()} style={styles.saveButton}>
                <Text style={styles.saveText}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 28,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.gold, fontSize: 7, letterSpacing: 1.2, fontWeight: '900' },
  more: { color: colors.mutedStrong, fontSize: 18 },
  profile: { alignItems: 'center', marginVertical: 25 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontSize: 30, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
  location: { color: colors.muted, fontSize: 12, marginTop: 5 },
  progressTrack: {
    width: '72%',
    height: 5,
    borderRadius: 4,
    backgroundColor: colors.surfaceSoft,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 5, backgroundColor: colors.gold, borderRadius: 4 },
  completion: { color: colors.gold, fontSize: 10, fontWeight: '800', marginTop: 7 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeading: { marginBottom: 4 },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  cardHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 9 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  fieldCopy: { flex: 1 },
  fieldLabel: { color: colors.mutedStrong, fontSize: 11, fontWeight: '700' },
  fieldValue: { color: colors.text, fontSize: 13, marginTop: 4 },
  editButton: {
    borderColor: colors.pink,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editText: { color: colors.pink, fontSize: 11, fontWeight: '800' },
  readOnly: { color: colors.muted, fontSize: 10 },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  switch: {
    width: 46,
    height: 27,
    padding: 3,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.pink },
  switchKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.text },
  switchKnobOn: { alignSelf: 'flex-end' },
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
  linkBody: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.mutedStrong, fontSize: 22 },
  logout: {
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: { color: colors.canvas, fontWeight: '800' },
  danger: { color: colors.pink, fontSize: 12, textAlign: 'center', marginTop: 18 },
  demoCard: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: 10,
  },
  demoTitle: { color: colors.gold, fontSize: 12, fontWeight: '900' },
  demoBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  demoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  demoButton: {
    borderColor: colors.pink,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  demoButtonText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 18,
  },
  input: {
    color: colors.text,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 14,
    minHeight: 46,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  preferenceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  preferenceOption: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  preferenceOptionSelected: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  preferenceOptionText: { color: colors.mutedStrong, fontSize: 12, fontWeight: '700' },
  preferenceOptionTextSelected: { color: colors.pink, fontWeight: '900' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 15 },
  cancelButton: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: colors.mutedStrong, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveText: { color: colors.text, fontWeight: '900' },
});
