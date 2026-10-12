import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerBackendPushToken } from './backend';
import type { BackendNotification } from './backend';
import { supabase } from './supabase';
import { useAppStore } from '../state/useAppStore';

export type NotificationPayload = {
  type: 'match' | 'message' | 'catch' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
};

let configured = false;

export async function configureNotifications() {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tecap-default', {
      name: 'TÉCAP',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: '#FF2BAA',
    });
  }
}

export async function requestPushPermissionAndRegister() {
  if (Platform.OS === 'web') return { status: 'unavailable' as const };
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return { status: 'denied' as const };
  try {
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await registerBackendPushToken({
      provider: 'expo',
      token: token.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    return { status: 'registered' as const, token: token.data };
  } catch {
    return { status: 'local-only' as const };
  }
}

export async function presentLocalNotification(payload: NotificationPayload) {
  if (Platform.OS === 'web') return;
  await configureNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: false,
    },
    trigger: null,
  });
}

export async function triggerDemoNotification(scenario: 'match' | 'message' | 'catch' | 'system') {
  if (!__DEV__) return;
  const scenarios: Record<typeof scenario, NotificationPayload> = {
    match: {
      type: 'match',
      title: 'C’est un match !',
      body: 'Toi et Léa vous vous plaisez. Lance la conversation.',
      data: { route: 'Conversation', matchId: 'demo' },
    },
    message: {
      type: 'message',
      title: 'Nouveau message de Léa',
      body: 'Bonne intuition, je pensais passer vers 21 h 30.',
      data: { route: 'Conversation', matchId: 'demo' },
    },
    catch: {
      type: 'catch',
      title: 'Une invitation pour ce soir',
      body: 'Tom te propose un cocktail après son service.',
      data: { route: 'Conversation', matchId: 'demo' },
    },
    system: {
      type: 'system',
      title: 'Ton plan de ce soir expire bientôt',
      body: 'Tu peux le prolonger ou le modifier.',
      data: { route: 'EveningStatus' },
    },
  };
  useAppStore.getState().addNotification(scenarios[scenario]);
  await presentLocalNotification(scenarios[scenario]);
}

export async function scheduleEveningReminder() {
  if (Platform.OS === 'web') return { status: 'unavailable' as const };
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return { status: 'denied' as const };
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.content.data?.tecapReminder === 'evening') {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 T’as quoi de prévu ce soir ?',
      body: 'Partage ton plan en quelques secondes et vois qui sort près de toi.',
      data: { route: 'EveningStatus', tecapReminder: 'evening' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
      channelId: Platform.OS === 'android' ? 'tecap-default' : undefined,
    },
  });
  return { status: 'scheduled' as const, identifier };
}

export async function subscribeToBackendNotifications(
  onInsert: (notification?: BackendNotification) => void,
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return () => undefined;
  const channel = supabase
    .channel(`tecap-notifications-${data.user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${data.user.id}`,
      },
      (payload) => onInsert(payload.new as BackendNotification),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
