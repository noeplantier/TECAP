import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

type Navigation = { goBack?: () => void };

export function NotificationsScreen({ navigation }: { navigation: Navigation }) {
  const notifications = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  useEffect(() => markNotificationsRead(), [markNotificationsRead]);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack?.()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <BrandLogo size='small' />
        <Text style={styles.more}>♢</Text>
      </View>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Tout est calme pour l’instant</Text>
          <Text style={styles.emptyBody}>
            Nouveaux matchs, messages et réponses à tes demandes apparaîtront ici.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.dot}>
              <Text style={styles.dotText}>
                {item.type === 'match' ? '♡' : item.type === 'message' ? '⌁' : '✦'}
              </Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, paddingTop: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  more: { color: colors.mutedStrong, fontSize: 20 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 28, marginBottom: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: 9,
  },
  dot: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  dotText: { color: colors.pink, fontSize: 22 },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  cardBody: { color: colors.mutedStrong, fontSize: 10, lineHeight: 15, marginTop: 4 },
  time: { color: colors.muted, fontSize: 8, marginTop: 5 },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 18 },
  emptyIcon: { color: colors.gold, fontSize: 54 },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 15,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
