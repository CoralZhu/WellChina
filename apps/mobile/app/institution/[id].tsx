import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Dimensions, Share,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INSTITUTIONS } from '../../data/mock';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

const { width } = Dimensions.get('window');

const TABS = ['about', 'services', 'doctors', 'reviews', 'mustRead'] as const;

const REVIEW_ITEMS = [
  { author: 'Anna V.', flag: '🇷🇺', rating: 5, textKey: 'institution.mockReviews.anna', date: '2026-03' },
  { author: 'Robert C.', flag: '🇺🇸', rating: 5, textKey: 'institution.mockReviews.robert', date: '2026-02' },
  { author: 'Margaret W.', flag: '🇬🇧', rating: 4, textKey: 'institution.mockReviews.margaret', date: '2026-01' },
];

const MUST_READ_ITEMS = [
  { icon: 'document-text-outline', titleKey: 'institution.mustReadItems.visa.title', bodyKey: 'institution.mustReadItems.visa.body' },
  { icon: 'medkit-outline', titleKey: 'institution.mustReadItems.medication.title', bodyKey: 'institution.mustReadItems.medication.body' },
  { icon: 'card-outline', titleKey: 'institution.mustReadItems.payment.title', bodyKey: 'institution.mustReadItems.payment.body' },
  { icon: 'shield-outline', titleKey: 'institution.mustReadItems.guarantee.title', bodyKey: 'institution.mustReadItems.guarantee.body' },
  { icon: 'refresh-outline', titleKey: 'institution.mustReadItems.refund.title', bodyKey: 'institution.mustReadItems.refund.body' },
] as const;

export default function InstitutionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { language } = useAppStore();
  const lang = language;

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('about');

  const inst = INSTITUTIONS.find((i) => i.id === id);
  if (!inst) return null;

  const name = inst.name[lang] || inst.name['en'];
  const city = inst.city[lang] || inst.city['en'];
  const description = inst.description[lang as keyof typeof inst.description] || inst.description['en'];
  const matchingInstitutions = INSTITUTIONS.filter((item) => (
    item.id !== inst.id && (item.city.en === inst.city.en || item.type === inst.type)
  ));
  const fillInstitutions = INSTITUTIONS.filter((item) => (
    item.id !== inst.id && !matchingInstitutions.some((match) => match.id === item.id)
  ));
  const similarInstitutions = INSTITUTIONS.length > 1
    ? [...matchingInstitutions, ...fillInstitutions].slice(0, 3)
    : [];

  const handleShare = async () => {
    await Share.share({
      title: name,
      message: `${name} · ${city}\n\n${description}\n\n${t('institution.shareSuffix')}`,
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>
          <View style={styles.backRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stickyTitle} numberOfLines={1}>{name}</Text>
          </View>

          <View style={styles.tabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {t(`institution.${tab}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Hero Image */}
        <View>
          <Image source={{ uri: inst.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <View style={styles.tagRow}>
              {inst.tags.includes('level3') && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('institution.tier3')}</Text>
                </View>
              )}
              {inst.tags.includes('jci') && (
                <View style={[styles.tag, styles.tagGold]}>
                  <Text style={styles.tagText}>{t('institution.jci')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroName}>{name}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroCity}>{city}</Text>
              <Ionicons name="star" size={14} color={Colors.goldLight} style={{ marginLeft: 12 }} />
              <Text style={styles.heroRating}>{inst.rating} ({inst.reviewCount})</Text>
            </View>
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'about' && (
            <View>
              <Text style={styles.sectionTitle}>{t('institution.about')}</Text>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{inst.rating}</Text>
                  <Text style={styles.statLabel}>{t('institution.rating')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{inst.reviewCount}</Text>
                  <Text style={styles.statLabel}>{t('institution.reviewCount')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>${inst.priceFrom.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>{t('institution.priceFrom')}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>{t('institution.share')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/chat')}>
                  <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>{t('institution.contactUs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert(t('institution.exportQuote'), t('institution.quotePreparing'))}>
                  <Ionicons name="document-outline" size={20} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>{t('institution.exportQuote')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'services' && (
            <View>
              <Text style={styles.sectionTitle}>{t('institution.services')}</Text>
              {inst.services.map((svc) => {
                const svcName = svc.name[lang as keyof typeof svc.name] || svc.name['en'];
                return (
                  <View key={svc.id} style={styles.serviceCard}>
                    <View style={styles.serviceTop}>
                      <Text style={styles.serviceName}>{svcName}</Text>
                      <Text style={styles.servicePrice}>${svc.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.includesRow}>
                      {svc.includes.map((item) => (
                        <View key={item} style={styles.includeChip}>
                          <Ionicons name="checkmark" size={11} color={Colors.success} />
                          <Text style={styles.includeText}>{t(`institution.includes.${item}`)}</Text>
                        </View>
                      ))}
                    </View>
                    <Button
                      label={t('institution.bookNow')}
                      onPress={() => router.push(`/booking/${svc.id}`)}
                      size="sm"
                      style={{ marginTop: Spacing.sm }}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'doctors' && (
            <View>
              <Text style={styles.sectionTitle}>{t('institution.doctors')}</Text>
              {inst.doctors.length === 0 && (
                <Text style={styles.description}>{t('institution.doctorInfoPending')}</Text>
              )}
              {inst.doctors.map((doc, i) => {
                const docName = doc.name[lang as keyof typeof doc.name] || doc.name['en'];
                const specialty = doc.specialty[lang as keyof typeof doc.specialty] || doc.specialty['en'];
                return (
                  <View key={i} style={styles.doctorCard}>
                    <View style={styles.doctorAvatar}>
                      <Ionicons name="person-outline" size={28} color={Colors.primary} />
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{docName}</Text>
                      <Text style={styles.doctorSpecialty}>{specialty}</Text>
                      <Text style={styles.doctorYears}>{doc.years} {t('institution.yearsExperience')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              <Text style={styles.sectionTitle}>{t('institution.reviews')}</Text>
              {REVIEW_ITEMS.map((review, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewFlag}>{review.flag}</Text>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Ionicons key={j} name="star" size={12} color={Colors.gold} />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <Text style={styles.reviewText}>{t(review.textKey)}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'mustRead' && (
            <View>
              <Text style={styles.sectionTitle}>{t('institution.mustRead')}</Text>
              {MUST_READ_ITEMS.map((item, i) => (
                <View key={i} style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.infoBody}>
                    <Text style={styles.infoTitle}>{t(item.titleKey)}</Text>
                    <Text style={styles.infoText}>{t(item.bodyKey)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {similarInstitutions.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>{t('institution.similarInstitutions')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarRow}
            >
              {similarInstitutions.map((item) => {
                const similarName = item.name[lang] || item.name.en;
                const similarCity = item.city[lang] || item.city.en;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.similarCard}
                    onPress={() => router.push(`/institution/${item.id}`)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: item.image }} style={styles.similarImage} resizeMode="cover" />
                    <View style={styles.similarBody}>
                      <Text style={styles.similarName} numberOfLines={2}>{similarName}</Text>
                      <View style={styles.similarMeta}>
                        <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.similarCity} numberOfLines={1}>{similarCity}</Text>
                        <Ionicons name="star" size={13} color={Colors.gold} style={{ marginLeft: Spacing.sm }} />
                        <Text style={styles.similarRating}>{item.rating}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Book Button */}
      <SafeAreaView edges={['bottom']} style={styles.bookBar}>
        <TouchableOpacity
          style={styles.prepareAiButton}
          onPress={() => router.push({ pathname: '/chat', params: { institutionId: id } })}
          activeOpacity={0.86}
        >
          <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
          <Text style={styles.prepareAiText}>{t('institution.prepareWithAI')}</Text>
        </TouchableOpacity>
        <View style={styles.bookBarInner}>
          <View>
            <Text style={styles.bookPriceLabel}>{t('institution.priceFrom')}</Text>
            <Text style={styles.bookPrice}>${inst.priceFrom.toLocaleString()}</Text>
          </View>
          <Button
            label={t('institution.bookNow')}
            onPress={() => router.push(`/booking/${inst.services[0]?.id || 's1'}`)}
            size="lg"
            style={{ flex: 1, marginLeft: Spacing.md }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  stickyHeader: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.bgCard,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    ...Shadow.card,
  },
  stickyTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  heroImage: { width, height: 280 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingTop: 48,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  tagGold: { backgroundColor: Colors.gold },
  tagText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  heroName: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white, lineHeight: 34 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  heroCity: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.9)', marginLeft: 4 },
  heroRating: { fontSize: FontSize.sm, color: Colors.goldLight, marginLeft: 4 },
  tabBar: { backgroundColor: Colors.bgCard },
  tabScroll: { paddingHorizontal: Spacing.md },
  tabItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, marginRight: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  content: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 26, marginBottom: Spacing.lg },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  serviceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  serviceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  serviceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  servicePrice: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary, marginLeft: Spacing.sm },
  includesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  includeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAFAF1',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  includeText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  doctorAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FDF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },
  doctorYears: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  reviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  reviewFlag: { fontSize: 18 },
  reviewAuthor: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  reviewText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  infoIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FDF2F2',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoBody: { flex: 1 },
  infoTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  similarSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  similarRow: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  similarCard: {
    width: 280,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  similarImage: { width: '100%', height: 132 },
  similarBody: { padding: Spacing.md },
  similarName: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  similarMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarCity: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 3,
    maxWidth: 140,
  },
  similarRating: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginLeft: 3,
  },
  bookBar: { backgroundColor: Colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  prepareAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.white,
  },
  prepareAiText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  bookBarInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  bookPriceLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  bookPrice: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.primary },
});
