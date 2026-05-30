
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { setupErrorLogging } from '../../admin/utils/errorLogger';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    setupErrorLogging();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'default',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="user-management" />
          <Stack.Screen name="verification-management" />
          <Stack.Screen name="settings" />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
