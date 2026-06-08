import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../store/appStore';

export default function Entry() {
  const router = useRouter();
  const { hasOnboarded } = useAppStore();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (hasOnboarded) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/onboarding');
    }
  }, [rootNavigationState?.key]);

  return null;
}
