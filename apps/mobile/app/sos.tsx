import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';

const SOS_ACTIONS = [
  {
    key: 'call',
    icon: 'call-outline' as const,
    color: Colors.white,
    bg: Colors.primary,
    onPress: () => Linking.openURL('tel:+8640010001'),
  },
  {
    key: 'location',
    icon: 'location-outline' as const,
    color: Colors.primary,
    bg: Colors.bgCard,
    onPress: () => Alert.alert('位置已发送', '您的实时位置已发送给客服人员'),
  },
  {
    key: 'translate',
    icon: 'language-outline' as const,
    color: Colors.primary,
    bg: Colors.bgCard,
    onPress: () => Alert.alert('紧急翻译', '正在连接翻译员...'),
  },
  {
    key: 'hospital',
    icon: 'medical-outline' as const,
    color: Colors.primary,
    bg: Colors.bgCard,
    onPress: () => Alert.alert('最近医院', '北京协和医院急诊\n距离您约 2.3km'),
  },
  {
    key: 'embassy',
    icon: 'flag-outline' as const,
    color: Colors.primary,
    bg: Colors.bgCard,
    onPress: () => Alert.alert('使馆联系', '俄罗斯驻华使馆\n+86 10 6532 1381\n美国驻华使馆\n+86 10 8531 4000'),
  },
];

export default function SOSScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pulsing, setPulsing] = useState(false);

  const handleMainSOS = () => {
    setPulsing(true);
    Linking.openURL('tel:+8640010001');
    setTimeout(() => setPulsing(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={Colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{t('sos.title')}</Text>
        <Text style={styles.subtitle}>{t('sos.subtitle')}</Text>
      </View>

      {/* Big SOS Button */}
      <TouchableOpacity style={styles.bigSOSWrap} onPress={handleMainSOS} activeOpacity={0.9}>
        <View style={[styles.bigSOSRing2]}>
          <View style={styles.bigSOSRing1}>
            <View style={styles.bigSOSBtn}>
              <Text style={styles.bigSOSText}>SOS</Text>
              <Text style={styles.bigSOSSubtext}>{t('sos.callNow')}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Grid */}
      <View style={styles.actionsGrid}>
        {SOS_ACTIONS.filter((a) => a.key !== 'call').map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionCard, { backgroundColor: action.bg }]}
            onPress={action.onPress}
            activeOpacity={0.85}
          >
            <Ionicons name={action.icon} size={28} color={action.color} />
            <Text style={[styles.actionLabel, { color: action.color }]}>{t(`sos.${action.key}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          中国紧急电话：120（急救）· 110（警察）· 119（消防）
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  closeBtn: { alignSelf: 'flex-end', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  bigSOSWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  bigSOSRing2: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigSOSRing1: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigSOSBtn: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.strong,
  },
  bigSOSText: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.white, letterSpacing: 2 },
  bigSOSSubtext: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '47.5%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  actionLabel: { fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.card,
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
});
