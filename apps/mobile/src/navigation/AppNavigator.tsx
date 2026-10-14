import {
  createNavigationContainerRef,
  NavigationContainer,
  DarkTheme,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { EveningStatusScreen } from '../screens/EveningStatusScreen';
import { MapScreen } from '../screens/MapScreen';
import { NightScreen } from '../screens/NightScreen';
import { PassScreen } from '../screens/PassScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { InvitationFlowScreen } from '../screens/InvitationFlowScreen';
import { IncomingRequestScreen } from '../screens/IncomingRequestScreen';
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import {
  FriendsScreen,
  VenueDetailScreen,
  CrewScreen,
  WhoLikedMeScreen,
  RennesWaitlistScreen,
} from '../screens/CommunityScreens';
import { useAppStore } from '../state/useAppStore';
import { colors } from '../theme';
import { NeonIcon } from '../components/NeonIcon';
import { isBackendEnabled } from '../lib/runtime';
import { supabase } from '../lib/supabase';
import { TECAP_TAB_ORDER } from './tabConfig';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const OutingsStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();

type DiscoverParamList = {
  DiscoverHome: undefined;
  Home: undefined;
  Match:
    | {
        profileId?: string;
        profileName?: string;
        profilePhoto?: string;
        venue?: string;
        status?: string;
      }
    | undefined;
  Invitation: undefined;
  ProfileDetail: { profileId?: string } | undefined;
};
type OutingsParamList = {
  OutingsHome: undefined;
  Map: undefined;
  EveningStatus: undefined;
  Night: undefined;
  Pass: undefined;
  Friends: undefined;
  VenueDetail: { venue?: string; count?: number; kind?: string } | undefined;
  Crew: undefined;
  WhoLikedMe: undefined;
};
type MessagesParamList = {
  MessagesHome: undefined;
  Conversation: { matchId: string };
  IncomingRequest: { requestId?: string } | undefined;
};
type ProfileParamList = {
  ProfileHome: undefined;
  Notifications: undefined;
  Safety: undefined;
};
type ShopParamList = { ShopHome: undefined };
type MainTabParamList = {
  DiscoverTab: NavigatorScreenParams<DiscoverParamList>;
  OutingsTab: NavigatorScreenParams<OutingsParamList>;
  MessagesTab: NavigatorScreenParams<MessagesParamList>;
  ProfileTab: NavigatorScreenParams<ProfileParamList>;
  ShopTab: NavigatorScreenParams<ShopParamList>;
};
type RootParamList = {
  Auth: undefined;
  RennesWaitlist: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
const navigationRef = createNavigationContainerRef<RootParamList>();
const linking: LinkingOptions<RootParamList> = {
  prefixes: [],
  config: {
    screens: {
      Auth: 'auth',
      RennesWaitlist: 'rennes-waitlist',
      MainTabs: {
        path: '',
        screens: {
          DiscoverTab: {
            path: 'discover',
            screens: {
              DiscoverHome: '',
              Home: 'home',
              Match: 'match',
              Invitation: 'invitation',
              ProfileDetail: 'profile/:profileId',
            },
          },
          OutingsTab: {
            path: 'outings',
            screens: {
              OutingsHome: '',
              Map: 'map',
              EveningStatus: 'evening-status',
              Night: 'night',
              Pass: 'pass',
            },
          },
          MessagesTab: {
            path: 'messages',
            screens: {
              MessagesHome: '',
              Conversation: 'conversation/:matchId',
              IncomingRequest: 'request',
            },
          },
          ProfileTab: {
            path: 'profile',
            screens: { ProfileHome: '', Notifications: 'notifications', Safety: 'safety' },
          },
          ShopTab: { path: 'shop', screens: { ShopHome: '' } },
        },
      },
    },
  },
};

function navigateFromNotification(data: Record<string, unknown>) {
  if (!navigationRef.isReady()) return;
  const matchId = typeof data.matchId === 'string' ? data.matchId : undefined;
  if (matchId) {
    navigationRef.navigate('MainTabs', {
      screen: 'MessagesTab',
      params: { screen: 'Conversation', params: { matchId } },
    });
    return;
  }
  if (data.route === 'EveningStatus') {
    navigationRef.navigate('MainTabs', {
      screen: 'OutingsTab',
      params: { screen: 'EveningStatus' },
    });
  } else if (data.route === 'Shop') {
    navigationRef.navigate('MainTabs', { screen: 'ShopTab', params: { screen: 'ShopHome' } });
  } else if (data.route === 'Map') {
    navigationRef.navigate('MainTabs', { screen: 'OutingsTab', params: { screen: 'Map' } });
  }
}

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.canvas,
    card: colors.canvas,
    primary: colors.pink,
    text: colors.text,
    border: colors.line,
  },
};

type TabBarState = { index: number; routes: Array<{ key: string; name: string }> };
type TabBarNavigation = { navigate: (name: string) => void };
type TabDefinition = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  accent?: 'pink' | 'gold';
};

const tabItems: Record<string, TabDefinition> = {
  DiscoverTab: {
    label: 'Découvrir',
    icon: 'heart-outline',
    activeIcon: 'heart',
    accent: 'pink',
  },
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

function DiscoverStackScreen() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name='DiscoverHome' component={DiscoverScreen} />
      <DiscoverStack.Screen name='Home' component={HomeScreen} />
      <DiscoverStack.Screen name='Match' component={MatchScreen} />
      <DiscoverStack.Screen name='Invitation' component={InvitationFlowScreen} />
      <DiscoverStack.Screen name='ProfileDetail' component={ProfileDetailScreen} />
    </DiscoverStack.Navigator>
  );
}

function OutingsStackScreen() {
  return (
    <OutingsStack.Navigator screenOptions={{ headerShown: false }}>
      <OutingsStack.Screen name='OutingsHome' component={EventsScreen} />
      <OutingsStack.Screen name='Map' component={MapScreen} />
      <OutingsStack.Screen name='EveningStatus' component={EveningStatusScreen} />
      <OutingsStack.Screen name='Night' component={NightScreen} />
      <OutingsStack.Screen name='Pass' component={PassScreen} />
      <OutingsStack.Screen name='Friends' component={FriendsScreen} />
      <OutingsStack.Screen name='VenueDetail' component={VenueDetailScreen} />
      <OutingsStack.Screen name='Crew' component={CrewScreen} />
      <OutingsStack.Screen name='WhoLikedMe' component={WhoLikedMeScreen} />
    </OutingsStack.Navigator>
  );
}

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name='MessagesHome' component={ChatListScreen} />
      <MessagesStack.Screen name='Conversation' component={ChatScreen} />
      <MessagesStack.Screen name='IncomingRequest' component={IncomingRequestScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name='ProfileHome' component={ProfileScreen} />
      <ProfileStack.Screen name='Notifications' component={NotificationsScreen} />
      <ProfileStack.Screen name='Safety' component={SafetyScreen} />
    </ProfileStack.Navigator>
  );
}

function ShopStackScreen() {
  return (
    <ShopStack.Navigator screenOptions={{ headerShown: false }}>
      <ShopStack.Screen name='ShopHome' component={ShopScreen} />
    </ShopStack.Navigator>
  );
}

const tabScreens = {
  DiscoverTab: DiscoverStackScreen,
  OutingsTab: OutingsStackScreen,
  MessagesTab: MessagesStackScreen,
  ProfileTab: ProfileStackScreen,
  ShopTab: ShopStackScreen,
};

function TecapTabBar({ state, navigation }: { state: TabBarState; navigation: TabBarNavigation }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const localUnreadMessages = useAppStore(
    (appState) =>
      appState.messages.filter((message) => !message.read && message.sender === 'them').length,
  );
  const remoteUnreadCount = useQuery({
    queryKey: ['backend-unread-notifications'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
        .in('type', ['message', 'match']);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isBackendEnabled,
    staleTime: 15_000,
  });
  useEffect(() => {
    if (!isBackendEnabled) return;
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      channel = supabase
        .channel(`tecap-tab-notifications-${data.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${data.user.id}`,
          },
          () => void queryClient.invalidateQueries({ queryKey: ['backend-unread-notifications'] }),
        )
        .subscribe();
    });
    return () => {
      mounted = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const unreadMessages = isBackendEnabled ? (remoteUnreadCount.data ?? 0) : localUnreadMessages;
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route) => {
        const focusedRoute = state.routes[state.index]?.name;
        const active = focusedRoute === route.name;
        const item = tabItems[route.name] ?? tabItems.DiscoverTab!;
        const color = active
          ? item.accent === 'gold'
            ? colors.gold
            : colors.pink
          : 'rgba(255,255,255,0.62)';
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole='tab'
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.tab,
              active && (item.accent === 'gold' ? styles.tabActiveGold : styles.tabActive),
              pressed && styles.tabPressed,
            ]}
          >
            <View style={styles.iconWrap}>
              <NeonIcon
                name={active ? item.activeIcon : item.icon}
                size={active ? 22 : 20}
                color={color}
                tone={active ? (item.accent ?? 'pink') : 'none'}
              />
              {route.name === 'MessagesTab' && unreadMessages > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }, active && styles.tabLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName='DiscoverTab'
      tabBar={(props) => <TecapTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TECAP_TAB_ORDER.map(({ name }) => (
        <Tab.Screen key={name} name={name} component={tabScreens[name]} />
      ))}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        navigateFromNotification(
          typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {},
        );
      },
    );
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      navigateFromNotification(
        typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {},
      );
    });
    return () => responseSubscription.remove();
  }, [isAuthenticated]);
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={Platform.OS === 'web' ? linking : undefined}
      theme={navigationTheme}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name='Auth' component={AuthScreen} />
        ) : (
          <RootStack.Screen name='MainTabs' component={MainTabs} />
        )}
        <RootStack.Screen name='RennesWaitlist' component={RennesWaitlistScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: colors.lineBright,
    minHeight: 72,
    paddingHorizontal: 5,
    paddingTop: 7,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 16,
    marginHorizontal: 1,
  },
  tabActive: {
    borderColor: colors.hotPink,
    borderWidth: 1,
    backgroundColor: colors.pinkWash,
    shadowColor: colors.pinkElectric,
    shadowOpacity: 0.72,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 11,
  },
  tabActiveGold: {
    borderColor: colors.goldHot,
    borderWidth: 1,
    backgroundColor: colors.goldWash,
    shadowColor: colors.goldHot,
    shadowOpacity: 0.62,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  tabPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconWrap: { minHeight: 23, minWidth: 24, alignItems: 'center', justifyContent: 'center' },
  unreadBadge: {
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
  unreadText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  tabLabel: { fontSize: 9, includeFontPadding: false },
  tabLabelActive: { fontWeight: '800' },
});
