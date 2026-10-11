import {
  createNavigationContainerRef,
  NavigationContainer,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useAppStore } from '../state/useAppStore';
import { colors } from '../theme';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const OutingsStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();

type RootParamList = {
  Auth: undefined;
  MainTabs: { screen: string; params?: object };
};
const navigationRef = createNavigationContainerRef<RootParamList>();

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
    icon: 'compass-outline',
    activeIcon: 'compass',
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

function TecapTabBar({ state, navigation }: { state: TabBarState; navigation: TabBarNavigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const item = tabItems[route.name] ?? tabItems.DiscoverTab!;
        const color = active ? (item.accent === 'gold' ? colors.gold : colors.pink) : colors.muted;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole='tab'
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Ionicons name={active ? item.activeIcon : item.icon} size={22} color={color} />
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
      <Tab.Screen name='DiscoverTab' component={DiscoverStackScreen} />
      <Tab.Screen name='OutingsTab' component={OutingsStackScreen} />
      <Tab.Screen name='MessagesTab' component={MessagesStackScreen} />
      <Tab.Screen name='ProfileTab' component={ProfileStackScreen} />
      <Tab.Screen name='ShopTab' component={ShopStackScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
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
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name='Auth' component={AuthScreen} />
        ) : (
          <RootStack.Screen name='MainTabs' component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.line,
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
    marginHorizontal: 2,
  },
  tabActive: { borderColor: colors.pinkSoft, borderWidth: 1, backgroundColor: colors.pinkWash },
  tabPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  tabLabel: { fontSize: 10 },
  tabLabelActive: { fontWeight: '800' },
});
