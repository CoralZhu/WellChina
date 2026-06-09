import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { Button } from '../../components/ui/Button';
import { Colors, Radius, Shadow, Spacing } from '../../constants/theme';
import { INSTITUTIONS } from '../../data/mock';
import { useFontSize } from '../../hooks/useFontSize';
import { generateCarePreparation } from '../../lib/carePreparationGenerator';
import { useAppStore } from '../../store/appStore';
import type { BookingRequest } from '../../types/workflow';

const PACKAGES = [
  { key: 'basic', label: { zh: '基础套餐', en: 'Basic Package', ru: 'Базовый пакет' }, multiplier: 1 },
  { key: 'standard', label: { zh: '标准套餐（含陪诊）', en: 'Standard + Companion', ru: 'Стандарт + Сопровождение' }, multiplier: 1.35 },
  { key: 'premium', label: { zh: '全程豪华套餐', en: 'Full Premium Package', ru: 'Полный премиум' }, multiplier: 1.7 },
];

type FormErrors = {
  contactName?: string;
  contactMethod?: string;
  travelWindow?: string;
  symptomsSummary?: string;
};

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const FontSize = useFontSize();
  const styles = useMemo(() => createStyles(FontSize), [FontSize]);
  const {
    createBookingRequest,
    currentCareInput,
    currentCareResult,
    language,
  } = useAppStore();
  const lang = language;
  const localizedCareResult = useMemo(() => {
    if (!currentCareResult) return null;
    if (!currentCareInput || currentCareInput.preferredLanguage === language) return currentCareResult;

    return generateCarePreparation({
      ...currentCareInput,
      preferredLanguage: language,
    });
  }, [currentCareInput, currentCareResult, language]);

  const [selectedPkg, setSelectedPkg] = useState('standard');
  const [contactName, setContactName] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [travelWindow, setTravelWindow] = useState('');
  const [symptomsSummary, setSymptomsSummary] = useState(localizedCareResult?.situationSummary || '');
  const [hasEditedSymptomsSummary, setHasEditedSymptomsSummary] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasEditedSymptomsSummary) return;
    setSymptomsSummary(localizedCareResult?.situationSummary || '');
  }, [hasEditedSymptomsSummary, localizedCareResult]);

  const inst = INSTITUTIONS.find((item) => item.services.some((service) => service.id === serviceId));
  const service = inst?.services.find((item) => item.id === serviceId);

  const selectedPackage = useMemo(
    () => PACKAGES.find((item) => item.key === selectedPkg) || PACKAGES[0],
    [selectedPkg],
  );

  if (!inst || !service) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('booking.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={52} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t('booking.serviceNotFound')}</Text>
          <Button label={t('common.back')} onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const instName = inst.name[lang] || inst.name.en;
  const serviceName = service.name[lang as keyof typeof service.name] || service.name.en;
  const selectedPackageLabel = selectedPackage.label[lang as keyof typeof selectedPackage.label] || selectedPackage.label.en;

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!contactName.trim()) nextErrors.contactName = t('booking.errorRequired');
    if (!contactMethod.trim()) nextErrors.contactMethod = t('booking.errorRequired');
    if (!travelWindow.trim()) nextErrors.travelWindow = t('booking.errorRequired');
    if (!symptomsSummary.trim()) nextErrors.symptomsSummary = t('booking.errorRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      const booking: BookingRequest = {
        id: Date.now().toString(),
        institutionId: inst.id,
        serviceId,
        selectedPackage: selectedPkg,
        preferredLanguage: language,
        symptomsSummary: symptomsSummary.trim(),
        travelWindow: travelWindow.trim(),
        contactName: contactName.trim(),
        contactMethod: contactMethod.trim(),
        status: 'pending_review',
        carePreparation: localizedCareResult ?? currentCareResult ?? undefined,
        carePreparationInput: currentCareInput ?? undefined,
        createdAt: new Date().toISOString(),
      };

      createBookingRequest(booking);
      setLoading(false);
      router.push('/(tabs)/trip');
    }, 600);
  };

  const renderError = (message?: string) => (
    message ? <Text style={styles.errorText}>{message}</Text> : null
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="medical-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryName}>{instName}</Text>
              <Text style={styles.summaryService}>{serviceName}</Text>
              <Text style={styles.summaryPrice}>{t('institution.priceFrom')} ${service.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.package')}</Text>
          <View style={styles.packageRow}>
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPkg === pkg.key;
              const label = pkg.label[lang as keyof typeof pkg.label] || pkg.label.en;
              return (
                <TouchableOpacity
                  key={pkg.key}
                  style={[styles.packageChip, isSelected && styles.packageChipActive]}
                  onPress={() => setSelectedPkg(pkg.key)}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.packageChipText, isSelected && styles.packageChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.packageHint}>{selectedPackageLabel}</Text>
        </View>

        <View style={styles.section}>
          {localizedCareResult ? (
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles-outline" size={19} color={Colors.primary} />
                <Text style={styles.aiTitle}>{t('booking.aiPreparationAttached')}</Text>
              </View>
              {localizedCareResult.preparationChecklist.slice(0, 2).map((item) => (
                <View key={item} style={styles.aiPreviewRow}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
                  <Text style={styles.aiPreviewText}>{item}</Text>
                </View>
              ))}
              <Text style={styles.aiHelpText}>{t('booking.aiPreparationHelps')}</Text>
            </View>
          ) : (
            <View style={styles.aiPromptCard}>
              <Text style={styles.aiPromptText}>{t('booking.noAiPreparation')}</Text>
              <TouchableOpacity onPress={() => router.push('/chat')} activeOpacity={0.8}>
                <Text style={styles.aiPromptLink}>{t('booking.startAiPreparation')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.contactDetails')}</Text>

          <Text style={styles.fieldLabel}>{t('booking.contactName')}</Text>
          <TextInput
            style={[styles.input, errors.contactName && styles.inputError]}
            value={contactName}
            onChangeText={setContactName}
            placeholder={t('booking.contactNamePlaceholder')}
            placeholderTextColor={Colors.textMuted}
          />
          {renderError(errors.contactName)}

          <Text style={styles.fieldLabel}>{t('booking.contactMethod')}</Text>
          <TextInput
            style={[styles.input, errors.contactMethod && styles.inputError]}
            value={contactMethod}
            onChangeText={setContactMethod}
            placeholder={t('booking.contactMethodPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          <Text style={styles.hintText}>WhatsApp / WeChat / Telegram / Email</Text>
          {renderError(errors.contactMethod)}

          <Text style={styles.fieldLabel}>{t('booking.travelWindow')}</Text>
          <TextInput
            style={[styles.input, errors.travelWindow && styles.inputError]}
            value={travelWindow}
            onChangeText={setTravelWindow}
            placeholder={t('booking.travelWindowPlaceholder')}
            placeholderTextColor={Colors.textMuted}
          />
          {renderError(errors.travelWindow)}

          <Text style={styles.fieldLabel}>{t('booking.symptomsSummary')}</Text>
          <TextInput
            style={[styles.textArea, errors.symptomsSummary && styles.inputError]}
            value={symptomsSummary}
            onChangeText={(value) => {
              setHasEditedSymptomsSummary(true);
              setSymptomsSummary(value);
            }}
            placeholder={t('booking.symptomsSummaryPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          {renderError(errors.symptomsSummary)}

          <Text style={styles.fieldLabel}>{t('booking.preferredLanguage')}</Text>
          <View style={styles.readOnlyField}>
            <Ionicons name="language-outline" size={18} color={Colors.primary} />
            <Text style={styles.readOnlyText}>{language.toUpperCase()}</Text>
          </View>
        </View>

        <View style={{ height: 112 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={loading ? t('common.loading') : t('booking.submitRequest')}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          fullWidth
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.lg },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
  summaryName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.textPrimary },
  summaryService: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
  summaryPrice: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '800', marginTop: 5 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textPrimary },
  packageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  packageChip: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  packageChipActive: { borderColor: Colors.primary, backgroundColor: '#FDF2F2' },
  packageChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '800' },
  packageChipTextActive: { color: Colors.primary },
  packageHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  aiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  aiTitle: { fontSize: FontSize.md, fontWeight: '900', color: Colors.textPrimary },
  aiPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginTop: 4 },
  aiPreviewText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  aiHelpText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 18 },
  aiPromptCard: {
    backgroundColor: '#FDFBEE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  aiPromptText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  aiPromptLink: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '900', marginTop: Spacing.sm },
  fieldLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.danger },
  textArea: {
    minHeight: 128,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  hintText: { fontSize: FontSize.xs, color: Colors.textMuted },
  errorText: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: '700' },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#FDF2F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  readOnlyText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '900' },
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '800',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
