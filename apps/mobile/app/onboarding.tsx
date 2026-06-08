import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import { useAppStore } from '../store/appStore';

const SCREENS = [
  {
    key: 'screen1',
    icon: 'earth' as const,
    backgroundColor: '#FDF2F2',
    iconBackgroundColor: '#F8DADA',
    iconColor: '#B85450',
  },
  {
    key: 'screen2',
    icon: 'sparkles' as const,
    backgroundColor: '#FDFBEE',
    iconBackgroundColor: '#F7EDC8',
    iconColor: '#C9954A',
  },
  {
    key: 'screen3',
    icon: 'checkmark-circle' as const,
    backgroundColor: '#EAFAF1',
    iconBackgroundColor: '#CFEFDC',
    iconColor: '#3D8B6A',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const router = useRouter();
  const setHasOnboarded = useAppStore((state) => state.setHasOnboarded);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const finish = () => {
    setHasOnboarded(true);
    router.replace('/(tabs)/home');
  };

  const goNext = () => {
    if (activeIndex === SCREENS.length - 1) {
      finish();
      return;
    }

    const nextIndex = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.scroll}
        scrollEventThrottle={16}
      >
        {SCREENS.map((screen) => (
          <View
            key={screen.key}
            style={[styles.screen, { width, backgroundColor: screen.backgroundColor }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: screen.iconBackgroundColor }]}>
              <Ionicons name={screen.icon} size={100} color={screen.iconColor} />
            </View>
            <Text style={styles.screenTitle}>{t(`onboarding.${screen.key}.title`)}</Text>
            <Text style={styles.screenBody}>{t(`onboarding.${screen.key}.body`)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SCREENS.map((screen, index) => (
            <View
              key={screen.key}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={finish}
            activeOpacity={0.82}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={goNext}
            activeOpacity={0.86}
          >
            <Text style={styles.nextText}>
              {activeIndex === SCREENS.length - 1
                ? t('onboarding.getStarted')
                : t('onboarding.next')}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  screenBody: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.bg,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  skipButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  nextButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
  },
  nextText: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.white,
  },
});
