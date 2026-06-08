import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

const LANG_LABELS: Record<string, string> = { zh: '中文', en: 'English', ru: 'Русский' };
const LANG_FLAGS: Record<string, string> = { zh: '🇨🇳', en: '🇬🇧', ru: '🇷🇺' };

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  badge?: string;
}

function MenuItem({ icon, label, value, color = Colors.textPrimary, onPress, badge }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, isGuest } = useAppStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        {/* Login / User card */}
        {isGuest ? (
          <TouchableOpacity style={styles.loginCard} activeOpacity={0.9}>
            <View style={styles.loginAvatar}>
              <Ionicons name="person-outline" size={32} color={Colors.primary} />
            </View>
            <View style={styles.loginText}>
              <Text style={styles.loginTitle}>{t('profile.login')}</Text>
              <Text style={styles.loginDesc}>{t('profile.loginDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>A</Text>
            </View>
            <View>
              <Text style={styles.userName}>Anna Volkova</Text>
              <View style={styles.vipRow}>
                <Ionicons name="star" size={14} color={Colors.gold} />
                <Text style={styles.vipText}>{t('profile.vip')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Referral Banner */}
        <View style={styles.referralBanner}>
          <View>
            <Text style={styles.referralTitle}>{t('profile.referral')}</Text>
            <Text style={styles.referralDesc}>{t('profile.referralDesc')}</Text>
          </View>
          <View style={styles.referralGift}>
            <Text style={{ fontSize: 28 }}>🎁</Text>
          </View>
        </View>

        {/* Menu Groups */}
        <View style={styles.menuGroup}>
          <MenuItem icon="receipt-outline" label={t('profile.orders')} color={Colors.primary} onPress={() => {}} />
          <MenuItem icon="heart-outline" label={t('profile.health')} color="#E74C3C" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label={t('profile.records')} color="#2980B9" onPress={() => {}} />
          <MenuItem icon="star-outline" label={t('profile.reviews')} color={Colors.gold} onPress={() => {}} />
        </View>

        <View style={styles.menuGroup}>
          <MenuItem
            icon="globe-outline"
            label={t('profile.language')}
            value={`${LANG_FLAGS[language]} ${LANG_LABELS[language]}`}
            color="#27AE60"
            onPress={() => router.push('/language')}
          />
          <MenuItem icon="settings-outline" label={t('profile.settings')} color={Colors.textSecondary} onPress={() => {}} />
        </View>

        {!isGuest && (
          <View style={styles.menuGroup}>
            <MenuItem icon="log-out-outline" label={t('profile.logout')} color={Colors.danger} onPress={() => {}} />
          </View>
        )}

        <Text style={styles.version}>WellChina v1.0.0 · 栖康</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  loginAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { flex: 1 },
  loginTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  loginDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  userAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  userName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  vipRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vipText: { fontSize: FontSize.sm, color: Colors.goldLight, fontWeight: '600' },
  referralBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FDFBEE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  referralTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.navyLight },
  referralDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, maxWidth: 240 },
  referralGift: { marginLeft: Spacing.sm },
  menuGroup: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  badge: { backgroundColor: Colors.danger, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.lg },
});
