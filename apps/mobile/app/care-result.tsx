import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Colors, Radius, Shadow, Spacing } from '../constants/theme';
import { INSTITUTIONS } from '../data/mock';
import { useFontSize } from '../hooks/useFontSize';
import { generateCarePlan } from '../lib/carePlanApi';
import { useAppStore } from '../store/appStore';
import type { CarePreparationResult } from '../types/workflow';

type ChecklistKind = 'preparation' | 'travel';
type CarePlanSource = 'claude' | 'mock';

export default function CareResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const FontSize = useFontSize();
  const styles = useMemo(() => createStyles(FontSize), [FontSize]);
  const {
    currentCareInput,
    currentCareResult,
    setCareResult,
  } = useAppStore();

  const [checkedPreparation, setCheckedPreparation] = useState<Record<number, boolean>>({});
  const [checkedTravel, setCheckedTravel] = useState<Record<number, boolean>>({});
  const [generatedResult, setGeneratedResult] = useState<CarePreparationResult | null>(currentCareResult);
  const [carePlanSource, setCarePlanSource] = useState<CarePlanSource | null>(null);
  const [loadingCarePlan, setLoadingCarePlan] = useState(false);

  useEffect(() => {
    if (currentCareResult) {
      setGeneratedResult(currentCareResult);
      return;
    }

    if (!currentCareInput) return;

    let cancelled = false;

    const loadCarePlan = async () => {
      setLoadingCarePlan(true);
      const { result: nextResult, source } = await generateCarePlan(currentCareInput);

      if (cancelled) return;

      setGeneratedResult(nextResult);
      setCarePlanSource(source);
      setCareResult(nextResult);
      setLoadingCarePlan(false);
    };

    loadCarePlan();

    return () => {
      cancelled = true;
    };
  }, [currentCareInput, currentCareResult, setCareResult]);

  const result = useMemo<CarePreparationResult | null>(() => {
    return generatedResult;
  }, [generatedResult]);

  const toggleChecklistItem = (kind: ChecklistKind, index: number) => {
    if (kind === 'preparation') {
      setCheckedPreparation((current) => ({ ...current, [index]: !current[index] }));
      return;
    }
    setCheckedTravel((current) => ({ ...current, [index]: !current[index] }));
  };

  const handleContinue = () => {
    const selectedInstitution = INSTITUTIONS.find((item) => item.id === currentCareInput?.selectedInstitutionId);
    const bookingTargetId = selectedInstitution?.services[0]?.id ?? INSTITUTIONS[0]?.services[0]?.id ?? 's1';
    router.push(`/booking/${bookingTargetId}`);
  };

  const renderChecklist = (
    items: string[],
    checked: Record<number, boolean>,
    kind: ChecklistKind,
  ) => (
    <View style={styles.checklist}>
      {items.map((item, index) => {
        const isChecked = checked[index];
        return (
          <TouchableOpacity
            key={`${kind}-${item}`}
            style={styles.checkRow}
            onPress={() => toggleChecklistItem(kind, index)}
            activeOpacity={0.82}
          >
            <Ionicons
              name={isChecked ? 'checkbox' : 'square-outline'}
              size={22}
              color={isChecked ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.checkText, isChecked && styles.checkTextDone]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!currentCareInput && !currentCareResult) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('careResult.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.errorTitle}>{t('careResult.errorTitle')}</Text>
          <Text style={styles.errorText}>{t('careResult.errorBody')}</Text>
          <Button
            label={t('careResult.backToCarePrep')}
            onPress={() => router.replace('/chat')}
            size="lg"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadingCarePlan || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('careResult.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('careResult.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {carePlanSource && (
          <View style={[
            styles.sourceBadge,
            carePlanSource === 'claude' ? styles.sourceBadgeClaude : styles.sourceBadgeMock,
          ]}>
            <Text style={[
              styles.sourceBadgeText,
              carePlanSource === 'claude' ? styles.sourceBadgeTextClaude : styles.sourceBadgeTextMock,
            ]}>
              {carePlanSource === 'claude' ? 'Generated by AI' : 'Demo mode'}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('careResult.situationSummary')}</Text>
          <Text style={styles.bodyText}>{result.situationSummary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('careResult.preparationChecklist')}</Text>
          {renderChecklist(result.preparationChecklist, checkedPreparation, 'preparation')}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('careResult.questionsForDoctor')}</Text>
          <View style={styles.numberedList}>
            {result.questionsForDoctor.map((question, index) => (
              <View key={question} style={styles.numberedRow}>
                <Text style={styles.numberBadge}>{index + 1}</Text>
                <Text style={styles.numberedText}>{question}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('careResult.travelChecklist')}</Text>
          {renderChecklist(result.travelChecklist, checkedTravel, 'travel')}
        </View>

        <Text style={styles.disclaimer}>{result.riskDisclaimer}</Text>

        <View style={{ height: 112 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('careResult.editAnswers')}
          onPress={() => router.back()}
          variant="secondary"
          size="lg"
          style={styles.footerButton}
        />
        <Button
          label={t('careResult.continueToBooking')}
          onPress={handleContinue}
          size="lg"
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (FontSize: ReturnType<typeof useFontSize>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    ...Shadow.card,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sourceBadgeClaude: { backgroundColor: '#EAFAF1' },
  sourceBadgeMock: { backgroundColor: Colors.border },
  sourceBadgeText: { fontSize: FontSize.xs, fontWeight: '900' },
  sourceBadgeTextClaude: { color: Colors.success },
  sourceBadgeTextMock: { color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  checklist: { gap: Spacing.xs },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  checkText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  checkTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  numberedList: { gap: Spacing.sm },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FDF2F2',
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 24,
  },
  numberedText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footerButton: { flex: 1 },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F2',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButton: { marginTop: Spacing.xl },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
});
