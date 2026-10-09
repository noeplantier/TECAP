import 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './src/lib/query-client';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style='light' />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
