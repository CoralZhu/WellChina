import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';

const ADD_ONS = [
  {
    key: 'visa',
    icon: 'document-text-outline' as const,
    iconColor: '#8E44AD',
    iconBg: '#F4ECF7',
    price: 280,
    popular: false,
  },
  {
    key: 'flight',
    icon: 'airplane-outline' as const,
    iconColor: '#2980B9',
    iconBg: '#EBF5FB',
    price: 0,
    popular: false,
    note: { zh: '价格因航线而异', en: 'Price varies by route', ru: 'Цена зависит от маршрута' },
  },
  {
    key: 'hotel',
    icon: 'bed-outline' as const,
    iconColor: '#27AE60',
    iconBg: '#EAFAF1',
    price: 0,
    popular: false,
    note: { zh: '根据入住天数定价', en: 'Priced per night stay', ru: 'Стоимость за ночь' },
  },
  {
    key: 'transfer',
    icon: 'car-outline' as const,
    iconColor: Colors.gold,
    iconBg: '#FDFBEE',
    price: 120,
    popular: true,
  },
];

export default function CrossSellScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({ transfer: true });
  const [confirmed, setConfirmed] = useState(false);

  const toggleItem = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedTotal = ADD_ONS.reduce((sum, item) => {
    return selected[item.key] && item.price > 0 ? sum + item.price : sum;
  }, 0);

  const handleConfirm = () => setConfirmed(true);

  if (confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>{t('booking.orderConfirmed')}</Text>
          <Text style={styles.orderNum}>{t('booking.orderNumber')} WC-2026-8823</Text>
          <Text style={styles.successSub}>
            我们的客服将在24小时内联系您确认行程细节。{'\n'}
            请在"行程"页查看实时状态。
          </Text>
          <Button
            label="查看我的行程"
            onPress={() => router.replace('/(tabs)/trip')}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.xl }}
          />
          <Button
            label="返回首页"
            onPress={() => router.replace('/(tabs)/home')}
            variant="ghost"
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.successMini}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.successMiniText}>医疗服务已预订 ✓</Text>
        </View>
        <Text style={styles.title}>{t('booking.crossSellTitle')}</Text>
        <Text style={styles.subtitle}>{t('booking.crossSellSubtitle')}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {ADD_ONS.map((item) => {
          const isSelected = selected[item.key];
          const title = t(`booking.${item.key}`);
          const desc = t(`booking.${item.key}Desc`);

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.addonCard, isSelected && styles.addonCardActive]}
              onPress={() => toggleItem(item.key)}
              activeOpacity={0.85}
            >
              <View style={[styles.addonIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={26} color={item.iconColor} />
              </View>

              <View style={styles.addonContent}>
                <View style={styles.addonTitleRow}>
                  <Text style={[styles.addonTitle, isSelected && styles.addonTitleActive]}>{title}</Text>
                  {item.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>推荐</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addonDesc}>{desc}</Text>
                {item.note && (
                  <Text style={styles.addonNote}>{item.note['zh']}</Text>
                )}
                {item.price > 0 && (
                  <Text style={[styles.addonPrice, isSelected && styles.addonPriceActive]}>
                    +${item.price}
                  </Text>
                )}
              </View>

              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Skip option */}
        <TouchableOpacity style={styles.skipRow} onPress={handleConfirm}>
          <Text style={styles.skipText}>暂不需要，直接确认预订</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <View style={styles.ctaContent}>
          {selectedTotal > 0 && (
            <Text style={styles.ctaExtra}>增值服务 +${selectedTotal}</Text>
          )}
          <Button
            label={`确认全部预订`}
            onPress={handleConfirm}
            size="lg"
            fullWidth
          />
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  successMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  successMiniText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '700' },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  scroll: { paddingHorizontal: Spacing.lg },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  addonCardActive: { borderColor: Colors.primary, backgroundColor: '#FDF2F2' },
  addonIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addonContent: { flex: 1 },
  addonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addonTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  addonTitleActive: { color: Colors.primary },
  popularBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  popularText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  addonDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  addonNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  addonPrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textSecondary, marginTop: 4 },
  addonPriceActive: { color: Colors.primary },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.lg,
  },
  skipText: { fontSize: FontSize.sm, color: Colors.textMuted },
  cta: { backgroundColor: Colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  ctaContent: { padding: Spacing.md, gap: Spacing.sm },
  ctaExtra: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  orderNum: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm, fontFamily: 'monospace' },
  successSub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, marginTop: Spacing.lg },
});
