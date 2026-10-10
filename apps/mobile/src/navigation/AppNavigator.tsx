import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { EveningStatusScreen } from '../screens/EveningStatusScreen';
import { MapScreen } from '../screens/MapScreen';
import { NightScreen } from '../screens/NightScreen';
import { PassScreen } from '../screens/PassScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { InvitationFlowScreen } from '../screens/InvitationFlowScreen';
import { useAppStore } from '../state/useAppStore';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0E0F1A',
    card: '#0E0F1A',
    primary: '#A47BFF',
    text: '#F8F7FA',
    border: '#303149',
  },
};
const tabItems: Record<string, { icon: string; label: string }> = {
  Discover: { icon: '◉', label: 'Découvrir' },
  Events: { icon: '⌖', label: 'Sorties' },
  Messages: { icon: '⌁', label: 'Messages' },
  Profile: { icon: '♙', label: 'Profil' },
  Shop: { icon: '♛', label: 'Boutique' },
};

type TabBarState = { index: number; routes: Array<{ key: string; name: string }> };
type TabBarNavigation = { navigate: (name: string) => void };

function TecapTabBar({ state, navigation }: { state: TabBarState; navigation: TabBarNavigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const item = tabItems[route.name] ?? tabItems.Home!;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{item.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      initialRouteName='Discover'
      tabBar={(props) => <TecapTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='Discover' component={DiscoverScreen} />
      <Tabs.Screen name='Events' component={EventsScreen} />
      <Tabs.Screen name='Messages' component={ChatScreen} />
      <Tabs.Screen name='Profile' component={ProfileScreen} />
      <Tabs.Screen name='Shop' component={ShopScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name='Auth' component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name='Main' component={MainTabs} />
            <Stack.Screen name='Home' component={HomeScreen} />
            <Stack.Screen name='Shop' component={ShopScreen} />
            <Stack.Screen name='Match' component={MatchScreen} />
            <Stack.Screen name='Chat' component={ChatScreen} />
            <Stack.Screen name='EveningStatus' component={EveningStatusScreen} />
            <Stack.Screen name='Map' component={MapScreen} />
            <Stack.Screen name='Night' component={NightScreen} />
            <Stack.Screen name='Pass' component={PassScreen} />
            <Stack.Screen name='Invitation' component={InvitationFlowScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E0F1A',
    borderTopWidth: 1,
    borderTopColor: '#24263B',
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { color: '#77798D', fontSize: 21 },
  tabIconActive: { color: '#F0D5B6' },
  tabLabel: { color: '#77798D', fontSize: 10 },
  tabLabelActive: { color: '#F0D5B6', fontWeight: '700' },
});
