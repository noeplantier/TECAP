import {
  createNavigationContainerRef,
  NavigationContainer,
  DarkTheme,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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
import { TecapFloatingTabBar } from '../components/TecapFloatingTabBar';
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

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName='DiscoverTab'
      tabBar={(props) => <TecapFloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
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
