import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppStore } from '../state/useAppStore';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#08080b',
    card: '#111116',
    primary: '#ff4fd8',
    text: '#fff',
    border: '#252530',
  },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff4fd8',
        tabBarInactiveTintColor: '#777784',
        tabBarStyle: {
          backgroundColor: '#111116',
          borderTopColor: '#252530',
          height: 66,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name='Ce soir' component={HomeScreen} />
      <Tabs.Screen name='Découvrir' component={DiscoverScreen} />
      <Tabs.Screen name='Events' component={EventsScreen} />
      <Tabs.Screen name='Profil' component={ProfileScreen} />
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
          <Stack.Screen name='Main' component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
