import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

interface Institution {
  id: string;
  name: Record<string, string>;
  city: Record<string, string>;
  type: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  image: string;
}

interface Props {
  item: Institution;
  horizontal?: boolean;
}

export function InstitutionCard({ item, horizontal }: Props) {
  const router = useRouter();
  const { language } = useAppStore();
  const lang = language as string;

  const name = item.name[lang] || item.name['en'];
  const city = item.city[lang] || item.city['en'];

  return (
    <TouchableOpacity
      style={[styles.card, horizontal && styles.cardHorizontal]}
      onPress={() => router.push(`/institution/${item.id}`)}
      activeOpacity={0.92}
    >
      <Image source={{ uri: item.image }} style={[styles.image, horizontal && styles.imageHorizontal]} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.tagRow}>
          {item.tags.includes('level3') && (
            <View style={styles.tag}><Text style={styles.tagText}>三甲</Text></View>
          )}
          {item.tags.includes('jci') && (
            <View style={[styles.tag, styles.tagGold]}><Text style={styles.tagText}>JCI</Text></View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.cityRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.city}>{city}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={Colors.gold} />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
          <Text style={styles.price}>
            <Text style={styles.priceLabel}>From </Text>
            <Text style={styles.priceValue}>${item.priceFrom.toLocaleString()}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHorizontal: {
    width: 220,
    marginBottom: 0,
    marginRight: Spacing.md,
  },
  image: { width: '100%', height: 140 },
  imageHorizontal: { height: 120 },
  body: { padding: Spacing.md },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagGold: { backgroundColor: Colors.gold },
  tagText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  city: { fontSize: FontSize.sm, color: Colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  reviewCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  price: {},
  priceLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  priceValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
});
