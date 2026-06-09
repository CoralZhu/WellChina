import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';
import { isSupabaseEnabled, supabase } from '../lib/supabase';
import type { BookingRequestStatus } from '../types/workflow';

type BookingRow = {
  id: string;
  institution_id: string | null;
  status: BookingRequestStatus;
  travel_window: string | null;
  preferred_language: string | null;
  created_at: string | null;
  contact_name: string | null;
  contact_method: string | null;
};

const BOOKING_STATUSES: BookingRequestStatus[] = [
  'pending_review',
  'coordinator_reviewing',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

const STATUS_STYLE: Record<BookingRequestStatus, {
  backgroundColor: string;
  selectedBackgroundColor: string;
  color: string;
}> = {
  pending_review: {
    backgroundColor: '#F5F5F5',
    selectedBackgroundColor: '#E9E9E9',
    color: '#4F4F4F',
  },
  coordinator_reviewing: {
    backgroundColor: '#FFF4E5',
    selectedBackgroundColor: '#F8E8CC',
    color: '#A66F1F',
  },
  confirmed: {
    backgroundColor: '#E5F0FF',
    selectedBackgroundColor: '#D7E7FB',
    color: '#3F73A8',
  },
  in_progress: {
    backgroundColor: '#E5F5EC',
    selectedBackgroundColor: '#D8ECDD',
    color: '#4B8B63',
  },
  completed: {
    backgroundColor: '#DCEBE0',
    selectedBackgroundColor: '#CCDEC9',
    color: '#2F6F45',
  },
  cancelled: {
    backgroundColor: '#FBE5E5',
    selectedBackgroundColor: '#F2D8D8',
    color: '#B15B5B',
  },
};

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!isSupabaseEnabled() || !supabase) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch bookings:', error);
        setBookings([]);
        return;
      }

      setBookings((data ?? []) as BookingRow[]);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId: string, newStatus: BookingRequestStatus) => {
    if (!isSupabaseEnabled() || !supabase) return;

    setUpdatingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Failed to update booking status:', error);
        return;
      }

      setOpenBookingId(null);
      await fetchBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  const renderStatusBadge = (status: BookingRequestStatus) => {
    const statusStyle = STATUS_STYLE[status];

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
        <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
          {t(`status.${status}`)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableOpacity
        style={styles.dashboardLink}
        onPress={() => router.push('/monitor')}
        activeOpacity={0.84}
      >
        <Text style={styles.dashboardLinkText}>View full dashboard</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('admin.loading')}</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="folder-open-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{t('admin.empty')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {bookings.map((booking) => {
            const isOpen = openBookingId === booking.id;
            const isUpdating = updatingId === booking.id;

            return (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.metaLabel}>{t('admin.bookingId')}</Text>
                    <Text style={styles.bookingId}>#{booking.id.slice(-6)}</Text>
                  </View>
                  {renderStatusBadge(booking.status)}
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.metaLabel}>{t('trip.institution')}</Text>
                    <Text style={styles.detailText}>{booking.institution_id || '-'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.metaLabel}>{t('trip.travelWindow')}</Text>
                    <Text style={styles.detailText}>{booking.travel_window || '-'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.metaLabel}>{t('trip.preferredLanguage')}</Text>
                    <Text style={styles.detailText}>{booking.preferred_language?.toUpperCase() || '-'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.metaLabel}>{t('trip.createdAt')}</Text>
                    <Text style={styles.detailText}>{formatDate(booking.created_at)}</Text>
                  </View>
                </View>

                <View style={styles.contactBox}>
                  <Text style={styles.metaLabel}>{t('admin.contact')}</Text>
                  <Text style={styles.detailText}>
                    {[booking.contact_name, booking.contact_method].filter(Boolean).join(' - ') || '-'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setOpenBookingId(isOpen ? null : booking.id)}
                  activeOpacity={0.84}
                  disabled={isUpdating}
                >
                  <Text style={[styles.dropdownButtonText, { color: STATUS_STYLE[booking.status].color }]}>
                    {isUpdating ? t('common.loading') : t(`status.${booking.status}`)}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={STATUS_STYLE[booking.status].color}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.dropdownMenu}>
                    {BOOKING_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.dropdownOption,
                          status === booking.status && styles.dropdownOptionActive,
                        ]}
                        onPress={() => updateStatus(booking.id, status)}
                        activeOpacity={0.82}
                        disabled={isUpdating}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            status === booking.status && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {t(`status.${status}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  dashboardLink: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.card,
  },
  dashboardLinkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '800',
    marginBottom: 3,
  },
  bookingId: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailItem: {
    width: '48%',
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
    padding: Spacing.sm,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  contactBox: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dropdownButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  dropdownButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  dropdownMenu: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dropdownOptionActive: {
    backgroundColor: '#FDF2F2',
  },
  dropdownOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dropdownOptionTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
});
