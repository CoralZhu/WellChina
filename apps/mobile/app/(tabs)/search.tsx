import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { InstitutionCard } from '../../components/home/InstitutionCard';
import { INSTITUTIONS } from '../../data/mock';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

const SYMPTOM_CHIPS = [
  { labelKey: 'search.symptoms.kneePain', query: 'knee pain' },
  { labelKey: 'search.symptoms.cardiology', query: 'heart' },
  { labelKey: 'search.symptoms.tcm', query: 'tcm' },
  { labelKey: 'search.symptoms.insomnia', query: 'insomnia' },
  { labelKey: 'search.symptoms.cancer', query: 'cancer' },
  { labelKey: 'search.symptoms.chronicPain', query: 'chronic pain' },
  { labelKey: 'search.symptoms.wellness', query: 'wellness' },
  { labelKey: 'search.symptoms.liver', query: 'liver' },
];

const TYPE_FILTERS = [
  { key: 'all', labelKey: 'search.filters.all' },
  { key: 'western', labelKey: 'search.filters.western' },
  { key: 'tcm', labelKey: 'search.filters.tcm' },
  { key: 'wellness', labelKey: 'search.filters.wellness' },
];

export default function SearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { language } = useAppStore();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState((params.type as string) || 'all');
  const cityParam = typeof params.city === 'string' ? params.city.toLowerCase() : '';

  const filtered = useMemo(() => {
    return INSTITUTIONS.filter((inst) => {
      const matchType = typeFilter === 'all' || inst.type === typeFilter;
      const matchCity = !cityParam || Object.values(inst.city).some((city) => city.toLowerCase() === cityParam);
      if (!matchCity) return false;
      if (!query.trim()) return matchType;
      const q = query.toLowerCase();
      const lang = language;
      const nameMatch = (inst.name[lang] || inst.name['en']).toLowerCase().includes(q);
      const cityMatch = (inst.city[lang] || inst.city['en']).toLowerCase().includes(q);
      const symptomMatch = inst.symptoms.some((s) => s.toLowerCase().includes(q));
      return matchType && (nameMatch || cityMatch || symptomMatch);
    });
  }, [cityParam, query, typeFilter, language]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Type Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, typeFilter === f.key && styles.pillActive]}
              onPress={() => setTypeFilter(f.key)}
            >
              <Text style={[styles.pillText, typeFilter === f.key && styles.pillTextActive]}>{t(f.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Symptom Quick-search */}
        {!query && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('search.sectionTitle')}</Text>
            <View style={styles.chipWrap}>
              {SYMPTOM_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.query}
                  style={styles.chip}
                  onPress={() => setQuery(chip.query)}
                >
                  <Text style={styles.chipText}>{t(chip.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        <View style={styles.section}>
          {query || typeFilter !== 'all' || cityParam ? (
            <>
              <Text style={styles.resultCount}>{t('search.resultCount', { count: filtered.length })}</Text>
              {filtered.map((item) => (
                <InstitutionCard key={item.id} item={item} />
              ))}
              {filtered.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={48} color={Colors.border} />
                  <Text style={styles.emptyText}>{t('search.emptyTitle')}</Text>
                  <Text style={styles.emptySubtext}>{t('search.emptyBody')}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{t('search.allInstitutions')}</Text>
              {INSTITUTIONS.map((item) => (
                <InstitutionCard key={item.id} item={item} />
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  filterRow: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: Colors.white },
  section: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: Colors.primaryLight + '66',
  },
  chipText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  resultCount: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
});
