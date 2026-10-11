import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/BrandLogo';
import { fetchBackendNotifications, markBackendNotificationsRead } from '../lib/backend';
import { isBackendEnabled } from '../lib/runtime';
import { presentLocalNotification, subscribeToBackendNotifications } from '../lib/notifications';
import { useAppStore } from '../state/useAppStore';
import { colors, radius, spacing } from '../theme';

type Navigation = { navigate: (screen: string, params?: unknown) => void; goBack?: () => void };
type NotificationItem = {
  id: string;
  type: 'match' | 'message' | 'catch' | 'system';
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  data?: Record<string, string>;
};

export function NotificationsScreen({ navigation }: { navigation: Navigation }) {
  const localNotifications = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  const queryClient = useQueryClient();
  const remoteNotifications = useQuery({
    queryKey: ['backend-notifications'],
    queryFn: fetchBackendNotifications,
    enabled: isBackendEnabled,
  });
  const notifications: NotificationItem[] = useMemo(
    () =>
      isBackendEnabled
        ? (remoteNotifications.data ?? []).map((item) => ({
            id: item.id,
            type: item.type as NotificationItem['type'],
            title: item.title,
            body: item.body,
            createdAt: new Date(item.created_at).getTime(),
            read: Boolean(item.read_at),
            data:
              typeof item.data === 'object' && item.data !== null
                ? (item.data as Record<string, string>)
                : undefined,
          }))
        : localNotifications.map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            body: item.body,
            createdAt: item.createdAt,
            read: item.read,
            data: item.data,
          })),
    [localNotifications, remoteNotifications.data],
  );

  useEffect(() => {
    if (isBackendEnabled) {
      void markBackendNotificationsRead().then(() =>
        queryClient.invalidateQueries({ queryKey: ['backend-notifications'] }),
      );
      let cleanup: (() => void) | undefined;
      void subscribeToBackendNotifications((notification) => {
        void queryClient.invalidateQueries({ queryKey: ['backend-notifications'] });
        if (notification) {
          void presentLocalNotification({
            type: notification.type as 'match' | 'message' | 'catch' | 'system',
            title: notification.title,
            body: notification.body,
            data:
              typeof notification.data === 'object' && notification.data !== null
                ? (notification.data as { matchId?: string; requestId?: string; route?: string })
                : undefined,
          });
        }
      }).then((unsubscribe) => {
        cleanup = unsubscribe;
      });
      return () => cleanup?.();
    }
    markNotificationsRead();
  }, [markNotificationsRead, queryClient]);

  const openNotification = (item: NotificationItem) => {
    if (item.data?.matchId) {
      navigation.navigate('MainTabs', {
        screen: 'MessagesTab',
        params: { screen: 'Conversation', params: { matchId: item.data.matchId } },
      });
      return;
    }
    if (item.data?.route === 'EveningStatus') {
      navigation.navigate('MainTabs', {
        screen: 'OutingsTab',
        params: { screen: 'EveningStatus' },
      });
      return;
    }
    navigation.goBack?.();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack?.()} accessibilityLabel='Retour'>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <BrandLogo size='small' />
        <Text style={styles.more}>♢</Text>
      </View>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Tes matchs, messages et plans de soirée au même endroit.</Text>
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Tout est calme pour l’instant</Text>
          <Text style={styles.emptyBody}>
            Les nouveautés apparaîtront ici, même si tu n’actives pas les notifications système.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openNotification(item)}
            style={[styles.card, !item.read && styles.cardUnread]}
            accessibilityRole='button'
          >
            <View style={styles.dot}>
              <Text style={styles.dotText}>
                {item.type === 'match'
                  ? '♡'
                  : item.type === 'message'
                    ? '⌁'
                    : item.type === 'catch'
                      ? '✦'
                      : '!'}
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
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 32 },
  more: { color: colors.mutedStrong, fontSize: 20 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 28 },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 15 },
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
  cardUnread: { borderColor: colors.pink, backgroundColor: colors.pinkWash },
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
  chevron: { color: colors.mutedStrong, fontSize: 22, marginLeft: 8 },
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
