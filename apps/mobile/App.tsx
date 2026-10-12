import 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './src/lib/query-client';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  const [iconsLoaded, iconError] = useFonts(Ionicons.font);

  if (!iconsLoaded && !iconError) {
    return (
      <View style={styles.fontLoading}>
        <Text style={styles.loadingWordmark}>TÉCAP</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={Platform.OS === 'web' ? styles.webShell : styles.nativeShell}>
        <View style={Platform.OS === 'web' ? styles.webApp : styles.nativeApp}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <StatusBar style='light' />
              <AppNavigator />
            </SafeAreaProvider>
          </QueryClientProvider>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  loadingWordmark: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: colors.pinkElectric,
    textShadowRadius: 18,
  },
  nativeShell: { flex: 1, backgroundColor: colors.canvas },
  nativeApp: { flex: 1 },
  webShell: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  webApp: {
    width: '100%',
    maxWidth: 480,
    minHeight: '100%',
    backgroundColor: colors.canvas,
  },
});
