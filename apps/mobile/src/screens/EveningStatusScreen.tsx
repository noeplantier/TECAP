import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { fetchBackendStatus, publishBackendStatus, removeBackendStatus } from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { goToDiscover } from '../navigation/routes';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type StatusRoute = { params?: { venue?: string } };
const options = [
  'Rien de prévu',
  'Verre / bar',
  'Restaurant',
  'Concert',
  'Club',
  'Match',
  'Plage',
  'Chill',
  'Entre amis',
  'Autre',
];
const venueSuggestions = ['L’Apsara', 'Le Connétable', 'Le Liberté', 'Le MeM'];
const durationOptions = [30, 60, 120, 240];

export function EveningStatusScreen({
  navigation,
  route,
}: {
  navigation: Navigation;
  route?: StatusRoute;
}) {
  const city = useAppStore((state) => state.city);
  const outingStatus = useAppStore((state) => state.outingStatus);
  const publishOutingStatus = useAppStore((state) => state.publishOutingStatus);
  const removeOutingStatus = useAppStore((state) => state.removeOutingStatus);
  const queryClient = useQueryClient();
  const remoteStatus = useQuery({
    queryKey: ['backend-evening-status'],
    queryFn: fetchBackendStatus,
    enabled: isBackendEnabled,
  });
  const [selected, setSelected] = useState(outingStatus?.activityType ?? 'Verre / bar');
  const [venue, setVenue] = useState(outingStatus?.venue ?? route?.params?.venue ?? '');
  const [duration, setDuration] = useState(120);

  useEffect(() => {
    if (!isBackendEnabled && outingStatus && outingStatus.expiresAt <= Date.now())
      removeOutingStatus();
  }, [outingStatus, removeOutingStatus]);

  useEffect(() => {
    if (!remoteStatus.data) return;
    setVenue(remoteStatus.data.venue ?? '');
    setSelected(
      remoteStatus.data.status_type === 'bar' ? 'Verre / bar' : remoteStatus.data.status_type,
    );
  }, [remoteStatus.data]);

  const hasStatus = isBackendEnabled
    ? Boolean(remoteStatus.data && new Date(remoteStatus.data.expires_at).getTime() > Date.now())
    : Boolean(outingStatus && outingStatus.expiresAt > Date.now());
  const publish = async () => {
    try {
      if (isBackendEnabled) {
        await publishBackendStatus({
          activityType: selected,
          city,
          venue: venue || undefined,
          durationMinutes: duration,
        });
        await queryClient.invalidateQueries({ queryKey: ['backend-evening-status'] });
        Alert.alert('Statut publié', 'Ton intention est visible pendant la durée choisie.');
      } else {
        publishOutingStatus({
          activityType: selected,
          city,
          venue: venue || undefined,
          timeWindow: 'Ce soir',
          expiresAt: Date.now() + duration * 60 * 1000,
        });
        Alert.alert('Statut publié', 'Ton intention est visible pendant la durée choisie.');
      }
    } catch (error) {
      Alert.alert(
        'Publication impossible',
        error instanceof Error ? error.message : 'Réessaie dans un instant.',
      );
    }
  };

  const remove = async () => {
    try {
      if (isBackendEnabled) {
        await removeBackendStatus();
        await queryClient.invalidateQueries({ queryKey: ['backend-evening-status'] });
      } else removeOutingStatus();
      Alert.alert('Statut retiré', 'Ton intention n’est plus visible.');
    } catch (error) {
      Alert.alert(
        'Retrait impossible',
        error instanceof Error ? error.message : 'Réessaie dans un instant.',
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goToDiscover(navigation, 'Home')}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.brandHeader}>
          <BrandLogo size='small' />
          <Text style={styles.context}>MON SOIR</Text>
        </View>
        <Text style={styles.more}>•••</Text>
      </View>
      <Text style={styles.heroTitle}>T’as quoi de prévu ce soir ?</Text>
      <Text style={styles.meta}>Partage une intention, sans GPS automatique.</Text>
      <Text style={styles.question}>Choisis ton plan du soir</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => setSelected(option)}
            style={[styles.option, selected === option && styles.optionActive]}
          >
            <Text style={[styles.optionText, selected === option && styles.optionTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.venuePicker}>
        <Text style={styles.venueLabel}>Lieu facultatif · partagé uniquement si tu le choisis</Text>
        <TextInput
          value={venue}
          onChangeText={setVenue}
          placeholder='Où es-tu ?'
          placeholderTextColor={colors.muted}
          style={styles.venueInput}
          accessibilityLabel='Où es-tu ? lieu facultatif'
        />
        <View style={styles.suggestions}>
          {venueSuggestions
            .filter((item) => !venue || item.toLowerCase().includes(venue.toLowerCase()))
            .map((item) => (
              <Pressable
                key={item}
                onPress={() => setVenue(item)}
                style={[styles.suggestion, venue === item && styles.suggestionActive]}
              >
                <Text
                  style={[styles.suggestionText, venue === item && styles.suggestionTextActive]}
                >
                  ⌖ {item}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>
      <Text style={styles.durationTitle}>Visible pendant</Text>
      <View style={styles.durations}>
        {durationOptions.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => setDuration(minutes)}
            style={[styles.durationChip, duration === minutes && styles.durationChipActive]}
          >
            <Text style={[styles.durationText, duration === minutes && styles.durationTextActive]}>
              {minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.info}>
        <Text style={styles.infoRow}>
          ◷ <Text style={styles.infoStrong}>Expire cette nuit</Text>
          {`\n`}Ton statut disparaîtra automatiquement après{' '}
          {duration < 60 ? `${duration} minutes` : `${duration / 60} heure(s)`}.
        </Text>
        <Text style={styles.infoRow}>
          ♧ <Text style={styles.infoStrong}>Tu gardes le contrôle</Text>
          {`\n`}Tu peux modifier ou retirer ton statut à tout moment.
        </Text>
      </View>
      <Pressable onPress={publish} style={styles.primary}>
        <Text style={styles.primaryText}>
          {hasStatus ? 'Mettre à jour mon statut' : 'Publier mon statut'}
        </Text>
      </Pressable>
      {hasStatus && (
        <Pressable onPress={remove} style={styles.secondary}>
          <Text style={styles.secondaryText}>Retirer mon statut</Text>
        </Pressable>
      )}
      <Text style={styles.note}>
        {hasStatus
          ? 'Ton statut est visible dans Qui sort ce soir.'
          : 'Rien ne sera publié sans ta validation.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingTop: 28,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  back: { color: colors.text, fontSize: 32 },
  brandHeader: { alignItems: 'center', gap: 2 },
  context: { color: colors.pink, fontSize: 8, letterSpacing: 0.8, fontWeight: '700' },
  more: { color: colors.mutedStrong },
  heroTitle: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '800', marginTop: 3 },
  meta: { color: colors.mutedStrong, fontSize: 11, marginTop: 5 },
  question: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  option: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  optionActive: { borderColor: colors.pink, backgroundColor: colors.pinkWash },
  optionText: { color: colors.mutedStrong, fontSize: 10 },
  optionTextActive: { color: colors.text, fontWeight: '800' },
  venuePicker: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 14,
  },
  venueLabel: { color: colors.muted, fontSize: 9 },
  venueValue: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 5 },
  venueInput: { color: colors.text, fontSize: 13, paddingVertical: 8, marginTop: 4 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  suggestion: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  suggestionActive: { borderColor: colors.pink, backgroundColor: colors.pinkWash },
  suggestionText: { color: colors.mutedStrong, fontSize: 9 },
  suggestionTextActive: { color: colors.pink, fontWeight: '700' },
  durationTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 14 },
  durations: { flexDirection: 'row', gap: 7, marginTop: 8 },
  durationChip: {
    flex: 1,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  durationChipActive: { borderColor: colors.pink, backgroundColor: colors.pinkWash },
  durationText: { color: colors.mutedStrong, fontSize: 9, fontWeight: '700' },
  durationTextActive: { color: colors.pinkLight, fontWeight: '900' },
  info: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 15,
    gap: 14,
    marginTop: 13,
  },
  infoRow: { color: colors.mutedStrong, fontSize: 11, lineHeight: 18 },
  infoStrong: { color: colors.text, fontWeight: '700' },
  primary: {
    backgroundColor: colors.ivory,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  primaryText: { color: colors.ivoryText, fontWeight: '900' },
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  note: { color: colors.muted, textAlign: 'center', fontSize: 9, lineHeight: 15, marginTop: 18 },
});
