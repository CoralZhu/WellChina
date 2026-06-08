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
  { label: '膝关节痛 / Knee Pain', query: 'knee pain' },
  { label: '心脏问题 / Cardiology', query: 'heart' },
  { label: '中医调理 / TCM', query: 'tcm' },
  { label: '失眠 / Insomnia', query: 'insomnia' },
  { label: '癌症 / Cancer', query: 'cancer' },
  { label: '慢性疼痛 / Chronic Pain', query: 'chronic pain' },
  { label: '减压养生 / Wellness', query: 'wellness' },
  { label: '肝脏问题 / Liver', query: 'liver' },
];

const TYPE_FILTERS = [
  { key: 'all', label: '全部 / All' },
  { key: 'western', label: '西医' },
  { key: 'tcm', label: '中医' },
  { key: 'wellness', label: '康养' },
];

export default function SearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { language } = useAppStore();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState((params.type as string) || 'all');

  const filtered = useMemo(() => {
    return INSTITUTIONS.filter((inst) => {
      const matchType = typeFilter === 'all' || inst.type === typeFilter;
      if (!query.trim()) return matchType;
      const q = query.toLowerCase();
      const lang = language;
      const nameMatch = (inst.name[lang] || inst.name['en']).toLowerCase().includes(q);
      const cityMatch = (inst.city[lang] || inst.city['en']).toLowerCase().includes(q);
      const symptomMatch = inst.symptoms.some((s) => s.toLowerCase().includes(q));
      return matchType && (nameMatch || cityMatch || symptomMatch);
    });
  }, [query, typeFilter, language]);

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
              <Text style={[styles.pillText, typeFilter === f.key && styles.pillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Symptom Quick-search */}
        {!query && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.searchSymptom')}</Text>
            <View style={styles.chipWrap}>
              {SYMPTOM_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.query}
                  style={styles.chip}
                  onPress={() => setQuery(chip.query)}
                >
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        <View style={styles.section}>
          {query || typeFilter !== 'all' ? (
            <>
              <Text style={styles.resultCount}>{filtered.length} 个结果</Text>
              {filtered.map((item) => (
                <InstitutionCard key={item.id} item={item} />
              ))}
              {filtered.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={48} color={Colors.border} />
                  <Text style={styles.emptyText}>暂无相关机构</Text>
                  <Text style={styles.emptySubtext}>请尝试其他关键词</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>全部机构</Text>
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
