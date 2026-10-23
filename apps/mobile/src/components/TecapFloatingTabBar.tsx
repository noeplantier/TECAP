import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isBackendEnabled } from '../lib/runtime';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../state/useAppStore';
import { colors, radius } from '../theme';
import { NeonIcon, type NeonIconName } from './NeonIcon';

type TabBarState = { index: number; routes: Array<{ key: string; name: string }> };
type TabBarNavigation = { navigate: (name: string, params?: object) => void };
type TabDefinition = {
  label: string;
  icon: NeonIconName;
  activeIcon: NeonIconName;
  accent?: 'pink' | 'gold';
};

const tabItems: Record<string, TabDefinition> = {
  DiscoverTab: { label: 'Découvrir', icon: 'eye-outline', activeIcon: 'eye', accent: 'pink' },
  OutingsTab: {
    label: 'Sorties',
    icon: 'location-outline',
    activeIcon: 'location',
    accent: 'pink',
  },
  MessagesTab: {
    label: 'Messages',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
    accent: 'pink',
  },
  ProfileTab: { label: 'Profil', icon: 'person-outline', activeIcon: 'person', accent: 'pink' },
  ShopTab: {
    label: 'Boutique',
    icon: 'bag-handle-outline',
    activeIcon: 'bag-handle',
    accent: 'gold',
  },
};
const tabRoots: Record<string, string> = {
  DiscoverTab: 'DiscoverHome',
  OutingsTab: 'OutingsHome',
  MessagesTab: 'MessagesHome',
  ProfileTab: 'ProfileHome',
  ShopTab: 'ShopHome',
};

export function TecapFloatingTabBar({
  state,
  navigation,
}: {
  state: TabBarState;
  navigation: TabBarNavigation;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [discoverBlinkSignal, setDiscoverBlinkSignal] = useState(0);
  const localUnread = useAppStore(
    (appState) =>
      appState.messages.filter((message) => !message.read && message.sender === 'them').length,
  );
  const remoteUnread = useQuery({
    queryKey: ['backend-unread-message-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_message_count');
      if (error) throw error;
      return data ?? 0;
    },
    enabled: isBackendEnabled,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!isBackendEnabled) return;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      channel = supabase
        .channel(`tecap-tab-unread-${data.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          void queryClient.invalidateQueries({ queryKey: ['backend-unread-message-count'] });
        })
        .subscribe();
    });
    return () => {
      mounted = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = isBackendEnabled ? (remoteUnread.data ?? 0) : localUnread;
  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.capsule} accessibilityRole='tablist'>
        {state.routes.map((route) => {
          const active = state.routes[state.index]?.name === route.name;
          const item = tabItems[route.name] ?? tabItems.DiscoverTab!;
          const color = active
            ? item.accent === 'gold'
              ? colors.gold
              : colors.pink
            : colors.mutedStrong;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (route.name === 'DiscoverTab') {
                  setDiscoverBlinkSignal((signal) => signal + 1);
                }
                navigation.navigate(
                  route.name,
                  active ? { screen: tabRoots[route.name] } : undefined,
                );
              }}
              accessibilityRole='tab'
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              hitSlop={4}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconWrap}>
                {route.name === 'DiscoverTab' ? (
                  <DiscoverEyeIcon
                    color={color}
                    active={active}
                    blinkSignal={discoverBlinkSignal}
                  />
                ) : (
                  <NeonIcon
                    name={active ? item.activeIcon : item.icon}
                    size={20}
                    color={color}
                    tone={active ? (item.accent === 'gold' ? 'gold' : 'pink') : 'none'}
                  />
                )}
                {route.name === 'MessagesTab' && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.label, { color }, active && styles.labelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DiscoverEyeIcon({
  color,
  active,
  blinkSignal,
}: {
  color: string;
  active: boolean;
  blinkSignal: number;
}) {
  const scaleY = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  useEffect(() => {
    if (blinkSignal === 0) return;
    scaleY.value = withSequence(
      withTiming(0.06, { duration: 75, easing: Easing.in(Easing.quad) }),
      withTiming(1, { duration: 125, easing: Easing.out(Easing.quad) }),
    );
  }, [blinkSignal, scaleY]);

  return (
    <Animated.View style={animatedStyle}>
      <NeonIcon name='eye-outline' size={20} color={color} tone={active ? 'pink' : 'none'} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: { paddingHorizontal: 14, paddingTop: 6, backgroundColor: 'transparent' },
  capsule: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(27,27,29,0.96)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: 1,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.07)' },
  pressed: { opacity: 0.72 },
  iconWrap: { minHeight: 22, minWidth: 24, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -9,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  label: { fontSize: 9, includeFontPadding: false },
  labelActive: { fontWeight: '700' },
});
