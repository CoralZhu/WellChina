import { useEffect, useState } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAppStore } from '../store/appStore';

export default function Entry() {
  const router = useRouter();
  const { hasOnboarded } = useAppStore();
  const rootNavigationState = useRootNavigationState();
  const [hasHydrated, setHasHydrated] = useState(useAppStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!rootNavigationState?.key || !hasHydrated) return;

    if (hasOnboarded) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/language');
    }
  }, [hasHydrated, hasOnboarded, rootNavigationState?.key, router]);

  return null;
}
