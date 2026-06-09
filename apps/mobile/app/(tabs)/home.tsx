import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, FlatList, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SOSButton } from '../../components/ui/SOSButton';
import { InstitutionCard } from '../../components/home/InstitutionCard';
import { INSTITUTIONS, DESTINATIONS } from '../../data/mock';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

const SERVICE_CATEGORIES = [
  { key: 'tcm', icon: 'leaf-outline', color: '#27AE60', bg: '#EAFAF1' },
  { key: 'western', icon: 'medical-outline', color: '#2980B9', bg: '#EBF5FB' },
  { key: 'wellness', icon: 'sunny-outline', color: '#F39C12', bg: '#FDFBEE' },
  { key: 'companion', icon: 'people-outline', color: '#8E44AD', bg: '#F4ECF7' },
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentBooking, language, simpleMode } = useAppStore();
  const lang = language;
  const [searchText, setSearchText] = useState('');

  const hotPicks = INSTITUTIONS.slice(0, 3);

  const simpleActions = (
    <View style={styles.simpleActions}>
      <TouchableOpacity
        style={styles.simpleButton}
        onPress={() => router.push('/search')}
        activeOpacity={0.88}
      >
        <Ionicons name="search-outline" size={30} color={Colors.white} />
        <Text style={styles.simpleButtonText}>{t('home.searchInstitutions')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.simpleButton, styles.simpleButtonSecondary]}
        onPress={() => router.push('/chat')}
        activeOpacity={0.88}
      >
        <Ionicons name="sparkles-outline" size={30} color={Colors.primary} />
        <Text style={[styles.simpleButtonText, styles.simpleButtonTextSecondary]}>{t('home.startAIPrep')}</Text>
      </TouchableOpacity>

      {currentBooking && (
        <TouchableOpacity
          style={[styles.simpleButton, styles.simpleButtonDark]}
          onPress={() => router.push('/(tabs)/trip')}
          activeOpacity={0.88}
        >
          <Ionicons name="calendar-outline" size={30} color={Colors.white} />
          <Text style={styles.simpleButtonText}>{t('home.viewJourney')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting')} 👋</Text>
            <Text style={styles.brand}>栖康 WellChina</Text>
          </View>
          <SOSButton />
        </View>

        {simpleMode ? (
          simpleActions
        ) : (
          <>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.9}
        >
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t('common.search')}</Text>
        </TouchableOpacity>

        {/* AI Assistant Banner */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => router.push('/chat')} activeOpacity={0.9}>
          <View style={styles.aiLeft}>
            <View style={styles.aiIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.aiTitle}>{t('home.aiAssistant')}</Text>
              <Text style={styles.aiSub}>{t('home.aiSubtitle')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Service Categories */}
        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <View style={styles.categoriesGrid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryCard, { backgroundColor: cat.bg }]}
              onPress={() => router.push({ pathname: '/search', params: { type: cat.key } })}
              activeOpacity={0.85}
            >
              <Ionicons name={cat.icon} size={28} color={cat.color} />
              <Text style={[styles.categoryLabel, { color: cat.color }]}>{t(`services.${cat.key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Destinations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.destinations')}</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destRow}>
          {DESTINATIONS.map((dest) => (
            <TouchableOpacity
              key={dest.id}
              style={styles.destCard}
              onPress={() => router.push({ pathname: '/search', params: { city: dest.id } })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: dest.image }} style={styles.destImage} resizeMode="cover" />
              <View style={styles.destOverlay}>
                <Text style={styles.destName}>{dest.name[lang] || dest.name['en']}</Text>
                <Text style={styles.destCount}>{dest.count} {t('home.institutionCount')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hot Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.hotRecommend')}</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {hotPicks.map((item) => (
          <InstitutionCard key={item.id} item={item} />
        ))}
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
  brand: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  searchPlaceholder: { fontSize: FontSize.md, color: Colors.textMuted, flex: 1 },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  aiLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  aiSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  viewAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '47.5%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryLabel: { fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  destRow: { paddingBottom: Spacing.lg, gap: Spacing.sm },
  destCard: { width: 140, height: 100, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.card },
  destImage: { width: '100%', height: '100%' },
  destOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.sm,
  },
  destName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  destCount: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  simpleActions: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  simpleButton: {
    minHeight: 78,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Shadow.card,
  },
  simpleButtonSecondary: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  simpleButtonDark: {
    backgroundColor: Colors.navy,
  },
  simpleButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
  },
  simpleButtonTextSecondary: {
    color: Colors.primary,
  },
});
