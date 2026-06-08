import '../i18n';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="language" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="institution/[id]" options={{ headerShown: true, headerTitle: '', headerBackTitle: '', headerTintColor: Colors.primary, headerTransparent: true }} />
          <Stack.Screen name="booking/[serviceId]" options={{ headerShown: true, headerTitle: '', headerBackTitle: '', headerTintColor: Colors.primary }} />
          <Stack.Screen name="crosssell" options={{ headerShown: true, headerTitle: '', headerBackTitle: '', headerTintColor: Colors.primary }} />
          <Stack.Screen name="chat" options={{ headerShown: true, headerTitle: 'AI Assistant', headerTintColor: Colors.primary }} />
          <Stack.Screen name="sos" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
