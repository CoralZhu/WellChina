import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontScale, FontSize, Radius, Shadow, Spacing, getFontSize } from '../constants/theme';
import { useAppStore } from '../store/appStore';

const FONT_SCALE_OPTIONS: FontScale[] = ['small', 'medium', 'large'];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const fontScale = useAppStore((state) => state.fontScale);
  const setFontScale = useAppStore((state) => state.setFontScale);
  const simpleMode = useAppStore((state) => state.simpleMode);
  const setSimpleMode = useAppStore((state) => state.setSimpleMode);
  const previewFontSize = getFontSize(fontScale);
  const simpleModeThumbLeft = useRef(new Animated.Value(simpleMode ? 27 : 3)).current;

  useEffect(() => {
    Animated.timing(simpleModeThumbLeft, {
      toValue: simpleMode ? 27 : 3,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [simpleMode, simpleModeThumbLeft]);

  const getOptionLabel = (scale: FontScale) => {
    if (scale === 'small') return t('settings.fontSizeSmall');
    if (scale === 'large') return t('settings.fontSizeLarge');
    return t('settings.fontSizeMedium');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('settings.accessibility')}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.fontSize')}</Text>
          <View style={styles.optionRow}>
            {FONT_SCALE_OPTIONS.map((scale) => {
              const isSelected = fontScale === scale;

              return (
                <TouchableOpacity
                  key={scale}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => setFontScale(scale)}
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {getOptionLabel(scale)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.previewBox}>
            <Text style={[styles.previewText, { fontSize: previewFontSize.md, lineHeight: previewFontSize.md * 1.45 }]}>
              {t('settings.previewText')}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t('settings.simpleMode')}</Text>
          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => setSimpleMode(!simpleMode)}
            activeOpacity={0.86}
            accessibilityRole="switch"
            accessibilityState={{ checked: simpleMode }}
          >
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>{t('settings.simpleModeLabel')}</Text>
              <Text style={styles.switchSubtitle}>{t('settings.simpleModeDescription')}</Text>
            </View>
            <View style={[styles.toggleTrack, simpleMode && styles.toggleTrackActive]}>
              <Animated.View style={[styles.toggleThumb, { left: simpleModeThumbLeft }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FDF2F2',
  },
  optionText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  previewBox: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  previewText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  switchTextWrap: { flex: 1 },
  switchLabel: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
  },
});
