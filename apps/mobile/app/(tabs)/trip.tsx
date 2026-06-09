import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { Button } from '../../components/ui/Button';
import { Colors, Radius, Shadow, Spacing } from '../../constants/theme';
import { INSTITUTIONS } from '../../data/mock';
import { useFontSize } from '../../hooks/useFontSize';
import { generateCarePreparation } from '../../lib/carePreparationGenerator';
import { isSupabaseEnabled, supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/appStore';
import type { BookingRequestStatus } from '../../types/workflow';

const STATUS_STYLE: Record<BookingRequestStatus, {
  backgroundColor: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = {
  pending_review: {
    backgroundColor: '#FDF2F2',
    color: Colors.primary,
    icon: 'time-outline',
  },
  coordinator_reviewing: {
    backgroundColor: '#FFF4E5',
    color: '#C9954A',
    icon: 'eye-outline',
  },
  confirmed: {
    backgroundColor: '#E5F0FF',
    color: '#4A7CC9',
    icon: 'checkmark-circle-outline',
  },
  in_progress: {
    backgroundColor: '#E5F5EC',
    color: '#5BA678',
    icon: 'walk-outline',
  },
  completed: {
    backgroundColor: '#DCEBE0',
    color: '#3D8B6A',
    icon: 'checkmark-done-circle',
  },
  cancelled: {
    backgroundColor: '#FBE5E5',
    color: '#C95450',
    icon: 'close-circle-outline',
  },
};

const PACKAGE_LABELS: Record<string, Record<string, string>> = {
  basic: { zh: '基础套餐', en: 'Basic Package', ru: 'Базовый пакет' },
  standard: { zh: '标准套餐（含陪诊）', en: 'Standard + Companion', ru: 'Стандарт + Сопровождение' },
  premium: { zh: '全程豪华套餐', en: 'Full Premium Package', ru: 'Полный премиум' },
};

export default function TripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const FontSize = useFontSize();
  const styles = useMemo(() => createStyles(FontSize), [FontSize]);
  const { currentBooking, currentCareInput, language, updateBookingStatus } = useAppStore();
  const lang = language;
  const [checkedPreparation, setCheckedPreparation] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!currentBooking || !isSupabaseEnabled() || !supabase) return;

    const supabaseClient = supabase;
    let cancelled = false;

    const syncBookingStatus = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('bookings')
          .select('status')
          .eq('id', currentBooking.id)
          .single();

        if (cancelled || error || !data?.status) return;

        const nextStatus = data.status as BookingRequestStatus;
        if (nextStatus !== currentBooking.status) {
          updateBookingStatus(nextStatus);
        }
      } catch (error) {
        console.error('Failed to sync booking status from Supabase:', error);
      }
    };

    void syncBookingStatus();

    return () => {
      cancelled = true;
    };
  }, [currentBooking, updateBookingStatus]);

  const institution = INSTITUTIONS.find((item) => item.id === currentBooking?.institutionId);
  const service = institution?.services.find((item) => item.id === currentBooking?.serviceId);
  const selectedPackageLabel = currentBooking?.selectedPackage
    ? PACKAGE_LABELS[currentBooking.selectedPackage]?.[lang] || currentBooking.selectedPackage
    : t('trip.notProvided');
  const carePreparation = useMemo(() => {
    if (!currentBooking?.carePreparation) return undefined;
    if (currentBooking.preferredLanguage === language) return currentBooking.carePreparation;

    const sourceInput = currentBooking.carePreparationInput ?? currentCareInput;
    if (!sourceInput) return currentBooking.carePreparation;

    return generateCarePreparation({
      ...sourceInput,
      preferredLanguage: language,
    });
  }, [currentBooking, currentCareInput, language]);

  const togglePreparation = (index: number) => {
    setCheckedPreparation((current) => ({ ...current, [index]: !current[index] }));
  };

  const formattedDate = currentBooking?.createdAt
    ? new Date(currentBooking.createdAt).toLocaleDateString()
    : '';

  if (!currentBooking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('trip.title')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={46} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('trip.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('trip.emptyBody')}</Text>
          <View style={styles.emptyActions}>
            <Button
              label={t('trip.browseInstitutions')}
              onPress={() => router.push('/(tabs)/search')}
              size="lg"
              fullWidth
            />
            <Button
              label={t('trip.startAiPreparation')}
              onPress={() => router.push('/chat')}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_STYLE[currentBooking.status];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('trip.title')}</Text>
          <Text style={styles.subtitle}>{t('trip.bookingRequest')}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.backgroundColor }]}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={statusStyle.icon}
              size={24}
              color={statusStyle.color}
            />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusBadge, { color: statusStyle.color }]}>
              {t(`status.${currentBooking.status}`)}
            </Text>
            <Text style={styles.statusSubtitle}>{t(`trip.subtitle.${currentBooking.status}`)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('trip.bookingSummary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('trip.institution')}</Text>
            <Text style={styles.summaryValue}>{institution?.name[lang] || institution?.name.en || t('trip.unknownInstitution')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('trip.service')}</Text>
            <Text style={styles.summaryValue}>{service?.name[lang as keyof typeof service.name] || service?.name.en || t('trip.unknownService')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('trip.selectedPackage')}</Text>
            <Text style={styles.summaryValue}>{selectedPackageLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('trip.travelWindow')}</Text>
            <Text style={styles.summaryValue}>{currentBooking.travelWindow}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('trip.preferredLanguage')}</Text>
            <Text style={styles.summaryValue}>{currentBooking.preferredLanguage.toUpperCase()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Text style={styles.summaryLabel}>{t('trip.createdAt')}</Text>
            <Text style={styles.summaryValue}>{formattedDate}</Text>
          </View>
        </View>

        {carePreparation && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('trip.preparationChecklist')}</Text>
            {carePreparation.preparationChecklist.map((item, index) => {
              const isChecked = checkedPreparation[index];
              return (
                <TouchableOpacity
                  key={item}
                  style={styles.checkRow}
                  onPress={() => togglePreparation(index)}
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
        )}

        {carePreparation && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('trip.questionsForDoctor')}</Text>
            {carePreparation.questionsForDoctor.map((question, index) => (
              <View key={question} style={styles.questionRow}>
                <Text style={styles.questionNumber}>{index + 1}</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>
        )}

        {carePreparation && (
          <View style={styles.nextStepCard}>
            <Text style={styles.sectionTitle}>{t('trip.nextStep')}</Text>
            <Text style={styles.nextStepText}>{carePreparation.recommendedNextStep}</Text>
          </View>
        )}

        <Button
          label={t('visitSummary.title')}
          onPress={() => router.push('/visit-summary')}
          size="lg"
          fullWidth
        />

        <View style={{ height: 96 }} />
      </ScrollView>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F2',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
  },
  emptyActions: { width: '100%', gap: Spacing.md, marginTop: Spacing.xl },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  statusTextWrap: { flex: 1 },
  statusBadge: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  statusSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3, lineHeight: 20 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '800',
  },
  summaryValue: {
    flex: 1.35,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 20,
  },
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
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  questionNumber: {
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
  questionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  nextStepCard: {
    backgroundColor: '#FDFBEE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  nextStepText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontWeight: '700',
  },
});
