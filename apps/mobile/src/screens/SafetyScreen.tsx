import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { colors, radius, spacing } from '../theme';

type Navigation = { goBack?: () => void };
const tips = [
  [
    'Choisis un lieu public',
    'Pour une première rencontre, privilégie un endroit fréquenté et garde ton autonomie.',
  ],
  [
    'Préviens une personne de confiance',
    'Partage ton plan et ton horaire approximatif avec un proche.',
  ],
  ['Écoute ton intuition', 'Tu peux annuler ou partir à tout moment, sans avoir à te justifier.'],
  [
    'Signale un comportement',
    'Utilise les options de signalement et bloque si une interaction te met mal à l’aise.',
  ],
];

export function SafetyScreen({ navigation }: { navigation: Navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack?.()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <BrandLogo size='small' />
        <Text style={styles.more}>♢</Text>
      </View>
      <Text style={styles.title}>Sécurité TÉCAP</Text>
      <Text style={styles.subtitle}>
        Les rencontres sont volontaires. Aucun rendez-vous n’est garanti.
      </Text>
      {tips.map(([title, body], index) => (
        <View key={title} style={styles.card}>
          <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.copy}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardBody}>{body}</Text>
          </View>
        </View>
      ))}
      <View style={styles.emergency}>
        <Text style={styles.emergencyTitle}>En cas d’urgence</Text>
        <Text style={styles.emergencyBody}>
          Contacte les services d’urgence locaux. TÉCAP ne remplace pas les services de secours.
        </Text>
      </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  more: { color: colors.mutedStrong, fontSize: 20 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 28 },
  subtitle: {
    color: colors.mutedStrong,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 17,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 9,
  },
  number: { color: colors.pink, fontSize: 16, fontWeight: '900', marginRight: 12 },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  cardBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  emergency: {
    backgroundColor: colors.pinkWash,
    borderColor: colors.pinkSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 9,
  },
  emergencyTitle: { color: colors.pink, fontSize: 13, fontWeight: '900' },
  emergencyBody: { color: colors.mutedStrong, fontSize: 10, lineHeight: 15, marginTop: 5 },
});
