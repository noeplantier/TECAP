import 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './src/lib/query-client';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
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
  );
}

const styles = StyleSheet.create({
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
