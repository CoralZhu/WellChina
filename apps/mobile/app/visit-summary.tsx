import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Colors, Radius, Shadow, Spacing } from '../constants/theme';
import { useFontSize } from '../hooks/useFontSize';
import { generateVisitSummary } from '../lib/visitSummaryGenerator';
import { useAppStore } from '../store/appStore';

type SummaryTab = 'patient' | 'chinese' | 'family';

export default function VisitSummaryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const FontSize = useFontSize();
  const styles = useMemo(() => createStyles(FontSize), [FontSize]);
  const {
    currentBooking,
    setVisitSummary,
    visitSummary,
  } = useAppStore();

  const [doctorNotes, setDoctorNotes] = useState('');
  const [activeTab, setActiveTab] = useState<SummaryTab>('patient');
  const currentVisitSummary = visitSummary?.bookingId === currentBooking?.id ? visitSummary : null;

  const handleGenerate = () => {
    if (!currentBooking || !doctorNotes.trim()) return;
    setVisitSummary(generateVisitSummary(doctorNotes, currentBooking));
  };

  const familyLanguage = currentBooking?.preferredLanguage === 'ru' ? 'ru' : 'en';
  const familySummary = currentVisitSummary?.familyShareSummary[familyLanguage] || currentVisitSummary?.familyShareSummary.en || '';

  if (!currentBooking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Ionicons name="document-text-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t('visitSummary.noBookingTitle')}</Text>
          <Text style={styles.emptyBody}>{t('visitSummary.noBookingBody')}</Text>
          <Button
            label={t('visitSummary.backToTrip')}
            onPress={() => router.push('/(tabs)/trip')}
            style={{ marginTop: Spacing.lg }}
          />
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
        <Text style={styles.headerTitle}>{t('visitSummary.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!currentVisitSummary ? (
        <View style={styles.inputWrap}>
          <Text style={styles.title}>{t('visitSummary.title')}</Text>
          <Text style={styles.subtitle}>{t('visitSummary.inputSubtitle')}</Text>
          <TextInput
            style={styles.textArea}
            value={doctorNotes}
            onChangeText={setDoctorNotes}
            placeholder={t('visitSummary.inputPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Button
            label={t('visitSummary.generateButton')}
            onPress={handleGenerate}
            disabled={!doctorNotes.trim()}
            size="lg"
            fullWidth
          />
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {([
              { key: 'patient', label: t('visitSummary.tabPatient') },
              { key: 'chinese', label: t('visitSummary.tabChinese') },
              { key: 'family', label: t('visitSummary.tabFamily') },
            ] as const).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'patient' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('visitSummary.doctorAdviceSummary')}</Text>
                <Text style={styles.bodyText}>{currentVisitSummary.doctorAdviceSummary}</Text>

                {currentVisitSummary.medicationNotes && (
                  <>
                    <Text style={styles.sectionTitle}>{t('visitSummary.medicationNotes')}</Text>
                    <Text style={styles.bodyText}>{currentVisitSummary.medicationNotes}</Text>
                  </>
                )}

                {currentVisitSummary.recoveryNotes && (
                  <>
                    <Text style={styles.sectionTitle}>{t('visitSummary.recoveryNotes')}</Text>
                    <Text style={styles.bodyText}>{currentVisitSummary.recoveryNotes}</Text>
                  </>
                )}

                {currentVisitSummary.followUpRecommendation && (
                  <>
                    <Text style={styles.sectionTitle}>{t('visitSummary.followUpRecommendation')}</Text>
                    <Text style={styles.bodyText}>{currentVisitSummary.followUpRecommendation}</Text>
                  </>
                )}
              </View>
            )}

            {activeTab === 'chinese' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('visitSummary.tabChinese')}</Text>
                <Text style={styles.bodyText}>{currentVisitSummary.familyShareSummary.zh}</Text>
              </View>
            )}

            {activeTab === 'family' && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('visitSummary.tabFamily')}</Text>
                <Text style={styles.bodyText}>{familySummary}</Text>
              </View>
            )}

            <View style={{ height: 96 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={t('visitSummary.done')}
              onPress={() => router.push('/(tabs)/trip')}
              size="lg"
              fullWidth
            />
          </View>
        </>
      )}
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
  inputWrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  textArea: {
    flex: 1,
    minHeight: 240,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    ...Shadow.card,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bodyText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 24 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
  },
});
