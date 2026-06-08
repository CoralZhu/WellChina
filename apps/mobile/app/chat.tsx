import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing } from '../constants/theme';
import { useFontSize } from '../hooks/useFontSize';
import { useAppStore } from '../store/appStore';
import type { CarePreparationInput } from '../types/workflow';

type SelectionStep = 'symptomCategory' | 'city' | 'travelWindow';

type Option = {
  value: string;
  labelKey: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const TOTAL_STEPS = 6;

const SYMPTOM_OPTIONS: Option[] = [
  { value: 'orthopedics_rehabilitation', labelKey: 'care.symptom.orthopedicsRehabilitation', icon: 'body-outline' },
  { value: 'traditional_chinese_medicine', labelKey: 'care.symptom.traditionalChineseMedicine', icon: 'leaf-outline' },
  { value: 'cancer_screening', labelKey: 'care.symptom.cancerScreening', icon: 'scan-outline' },
  { value: 'cardiology', labelKey: 'care.symptom.cardiology', icon: 'heart-outline' },
  { value: 'general_wellness', labelKey: 'care.symptom.generalWellness', icon: 'sunny-outline' },
  { value: 'other', labelKey: 'care.symptom.other', icon: 'ellipsis-horizontal-circle-outline' },
];

const CITY_OPTIONS: Option[] = [
  { value: 'beijing', labelKey: 'care.city.beijing', icon: 'business-outline' },
  { value: 'shanghai', labelKey: 'care.city.shanghai', icon: 'business-outline' },
  { value: 'guangzhou', labelKey: 'care.city.guangzhou', icon: 'business-outline' },
  { value: 'sanya', labelKey: 'care.city.sanya', icon: 'partly-sunny-outline' },
  { value: 'not_sure_yet', labelKey: 'care.city.notSureYet', icon: 'help-circle-outline' },
];

const TRAVEL_WINDOW_OPTIONS: Option[] = [
  { value: 'within_1_month', labelKey: 'care.travel.withinOneMonth', icon: 'calendar-outline' },
  { value: '1_3_months', labelKey: 'care.travel.oneToThreeMonths', icon: 'calendar-number-outline' },
  { value: '3_6_months', labelKey: 'care.travel.threeToSixMonths', icon: 'calendar-clear-outline' },
  { value: 'just_exploring', labelKey: 'care.travel.justExploring', icon: 'compass-outline' },
];

const MEDICAL_RECORD_OPTIONS = [
  { value: true, labelKey: 'care.records.yes', icon: 'document-text-outline' as const },
  { value: false, labelKey: 'care.records.no', icon: 'close-circle-outline' as const },
];

export default function ChatScreen() {
  const router = useRouter();
  const { institutionId } = useLocalSearchParams<{ institutionId?: string }>();
  const { t } = useTranslation();
  const FontSize = useFontSize();
  const {
    currentCareInput,
    language,
    simpleMode,
    setCareInput,
  } = useAppStore();
  const styles = useMemo(() => createStyles(FontSize, simpleMode), [FontSize, simpleMode]);

  const [step, setStep] = useState(1);
  const [symptomCategory, setSymptomCategory] = useState(currentCareInput?.symptomCategory || '');
  const [city, setCity] = useState(currentCareInput?.city || '');
  const [travelWindow, setTravelWindow] = useState(currentCareInput?.travelWindow || '');
  const [hasMedicalReports, setHasMedicalReports] = useState<boolean | null>(
    currentCareInput?.hasMedicalReports ?? null,
  );
  const [symptomDescription, setSymptomDescription] = useState(currentCareInput?.symptomDescription || '');
  const [generating, setGenerating] = useState(false);

  const progressWidth = useMemo<`${number}%`>(() => `${(step / TOTAL_STEPS) * 100}%`, [step]);

  const goBack = () => setStep((current) => Math.max(1, current - 1));
  const goNext = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));

  const handleSelection = (field: SelectionStep, value: string) => {
    if (field === 'symptomCategory') setSymptomCategory(value);
    if (field === 'city') setCity(value);
    if (field === 'travelWindow') setTravelWindow(value);
  };

  const buildCareInput = (): CarePreparationInput => ({
    symptomCategory,
    city,
    travelWindow,
    hasMedicalReports: hasMedicalReports ?? false,
    preferredLanguage: language,
    selectedInstitutionId: institutionId || undefined,
    ...(symptomDescription.trim() ? { symptomDescription: symptomDescription.trim() } : {}),
  });

  const handleGenerate = () => {
    setGenerating(true);
    setCareInput(buildCareInput());
    router.push('/care-result');
  };

  const renderOptionCards = (
    options: Option[],
    selectedValue: string,
    field: SelectionStep,
  ) => (
    <View style={styles.optionList}>
      {options.map((option) => {
        const selected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.optionCard, selected && styles.optionCardActive]}
            onPress={() => handleSelection(field, option.value)}
            activeOpacity={0.86}
          >
            <View style={[styles.optionIcon, selected && styles.optionIconActive]}>
              <Ionicons
                name={option.icon}
                size={22}
                color={selected ? Colors.white : Colors.primary}
              />
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextActive]}>
              {t(option.labelKey)}
            </Text>
            {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBooleanCards = () => (
    <View style={styles.optionList}>
      {MEDICAL_RECORD_OPTIONS.map((option) => {
        const selected = hasMedicalReports === option.value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.optionCard, selected && styles.optionCardActive]}
            onPress={() => setHasMedicalReports(option.value)}
            activeOpacity={0.86}
          >
            <View style={[styles.optionIcon, selected && styles.optionIconActive]}>
              <Ionicons
                name={option.icon}
                size={22}
                color={selected ? Colors.white : Colors.primary}
              />
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextActive]}>
              {t(option.labelKey)}
            </Text>
            {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSummaryRow = (labelKey: string, value: string) => (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{t(labelKey)}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const canContinue =
    (step === 1 && symptomCategory) ||
    (step === 2 && city) ||
    (step === 3 && travelWindow) ||
    (step === 4 && hasMedicalReports !== null) ||
    step === 5;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('care.title')}</Text>
          {!simpleMode && (
            <>
              <Text style={styles.progressText}>{step} / {TOTAL_STEPS}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <View>
              <Text style={styles.title}>{t('care.step1.title')}</Text>
              {renderOptionCards(SYMPTOM_OPTIONS, symptomCategory, 'symptomCategory')}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>{t('care.step2.title')}</Text>
              {renderOptionCards(CITY_OPTIONS, city, 'city')}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.title}>{t('care.step3.title')}</Text>
              {renderOptionCards(TRAVEL_WINDOW_OPTIONS, travelWindow, 'travelWindow')}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.title}>{t('care.step4.title')}</Text>
              {renderBooleanCards()}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.title}>{t('care.step5.title')}</Text>
              <TextInput
                style={styles.textArea}
                value={symptomDescription}
                onChangeText={setSymptomDescription}
                placeholder={t('care.step5.placeholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={800}
              />
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={styles.title}>{t('care.step6.title')}</Text>
              <View style={styles.summaryCard}>
                {renderSummaryRow(
                  'care.review.symptomCategory',
                  t(SYMPTOM_OPTIONS.find((option) => option.value === symptomCategory)?.labelKey || 'care.review.notSelected'),
                )}
                {renderSummaryRow(
                  'care.review.city',
                  t(CITY_OPTIONS.find((option) => option.value === city)?.labelKey || 'care.review.notSelected'),
                )}
                {renderSummaryRow(
                  'care.review.travelWindow',
                  t(TRAVEL_WINDOW_OPTIONS.find((option) => option.value === travelWindow)?.labelKey || 'care.review.notSelected'),
                )}
                {renderSummaryRow(
                  'care.review.hasMedicalReports',
                  t(hasMedicalReports ? 'care.records.yes' : 'care.records.no'),
                )}
                {renderSummaryRow(
                  'care.review.symptomDescription',
                  symptomDescription.trim() || t('care.review.noDescription'),
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={18} color={Colors.primary} />
              <Text style={styles.backText}>{t('care.actions.back')}</Text>
            </TouchableOpacity>
          )}

          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.nextButton, !canContinue && styles.nextButtonDisabled]}
              onPress={goNext}
              disabled={!canContinue}
              activeOpacity={0.86}
            >
              <Text style={styles.nextText}>{t('care.actions.next')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleGenerate}
              disabled={generating}
              activeOpacity={0.86}
            >
              {generating ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.nextText}>{t('care.actions.generatePlan')}</Text>
                  <Ionicons name="sparkles-outline" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (FontSize: ReturnType<typeof useFontSize>, simpleMode: boolean) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
  },
  kicker: {
    fontSize: simpleMode ? FontSize.xl : FontSize.sm,
    fontWeight: simpleMode ? '900' : '700',
    color: Colors.primary,
    marginBottom: simpleMode ? 0 : Spacing.xs,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: simpleMode ? FontSize.xxxl : FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: simpleMode ? FontSize.xxxl * 1.25 : 34,
    marginBottom: simpleMode ? Spacing.xl : Spacing.lg,
  },
  optionList: { gap: simpleMode ? Spacing.lg : Spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    minHeight: simpleMode ? 78 : undefined,
    padding: simpleMode ? Spacing.lg : Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FDF2F2',
  },
  optionIcon: {
    width: simpleMode ? 52 : 42,
    height: simpleMode ? 52 : 42,
    borderRadius: simpleMode ? 26 : 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F2',
  },
  optionIconActive: { backgroundColor: Colors.primary },
  optionText: {
    flex: 1,
    fontSize: simpleMode ? FontSize.lg : FontSize.md,
    fontWeight: simpleMode ? '900' : '700',
    color: Colors.textPrimary,
    lineHeight: simpleMode ? FontSize.lg * 1.35 : 22,
  },
  optionTextActive: { color: Colors.primary },
  textArea: {
    minHeight: 180,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: simpleMode ? Spacing.lg : Spacing.md,
    fontSize: simpleMode ? FontSize.lg : FontSize.md,
    color: Colors.textPrimary,
    lineHeight: simpleMode ? FontSize.lg * 1.35 : 22,
    ...Shadow.card,
  },
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  summaryRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: simpleMode ? Spacing.lg : Spacing.md,
    backgroundColor: Colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minHeight: simpleMode ? 64 : undefined,
    paddingVertical: simpleMode ? Spacing.lg : Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    minHeight: simpleMode ? 72 : undefined,
    paddingVertical: simpleMode ? Spacing.lg : Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  nextButtonDisabled: { backgroundColor: Colors.border },
  nextText: {
    fontSize: simpleMode ? FontSize.lg : FontSize.md,
    fontWeight: '800',
    color: Colors.white,
  },
});
