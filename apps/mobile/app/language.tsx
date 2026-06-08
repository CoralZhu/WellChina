import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';

const LANGUAGES = [
  { code: 'zh', label: '中文', sublabel: 'Chinese', emoji: '🇨🇳' },
  { code: 'en', label: 'English', sublabel: 'English', emoji: '🇬🇧' },
  { code: 'ru', label: 'Русский', sublabel: 'Russian', emoji: '🇷🇺' },
] as const;

export default function LanguageScreen() {
  const router = useRouter();
  const { setLanguage } = useAppStore();

  const handleSelect = (code: 'zh' | 'en' | 'ru') => {
    setLanguage(code);
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>栖康</Text>
        <Text style={styles.logoEn}>WellChina</Text>
        <Text style={styles.tagline}>Your gateway to China healthcare</Text>
      </View>

      <View style={styles.languageSection}>
        <Text style={styles.title}>选择您的语言{'\n'}Choose Your Language{'\n'}Выберите язык</Text>

        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.langCard}
            onPress={() => handleSelect(lang.code)}
            activeOpacity={0.85}
          >
            <Text style={styles.emoji}>{lang.emoji}</Text>
            <View style={styles.langText}>
              <Text style={styles.langLabel}>{lang.label}</Text>
              <Text style={styles.langSub}>{lang.sublabel}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>您的隐私受到保护 · Privacy Protected · Ваши данные защищены</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  header: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  logo: { fontSize: 52, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  logoEn: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navyLight, marginTop: -4 },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  languageSection: { flex: 1 },
  title: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  emoji: { fontSize: 32, marginRight: Spacing.md },
  langText: { flex: 1 },
  langLabel: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  langSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 28, color: Colors.textMuted, fontWeight: '300' },
  footer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', paddingBottom: Spacing.lg },
});
