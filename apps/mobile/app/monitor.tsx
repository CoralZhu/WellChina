import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';
import { INSTITUTIONS } from '../data/mock';
import { isSupabaseEnabled, supabase } from '../lib/supabase';
import type { BookingRequestStatus } from '../types/workflow';

type BookingRow = {
  id: string;
  institution_id: string | null;
  status: BookingRequestStatus | string | null;
  created_at: string | null;
  contact_name: string | null;
  user_country?: string | null;
  preferred_service_type?: string | null;
  preferred_destination_city?: string | null;
  mock_institution_id?: number | null;
};

type StatusConfig = {
  label: string;
  backgroundColor: string;
  color: string;
};

type CountItem = {
  label: string;
  count: number;
};

const BOOKING_STATUSES: BookingRequestStatus[] = [
  'pending_review',
  'coordinator_reviewing',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

const STATUS_STYLE: Record<BookingRequestStatus, StatusConfig> = {
  pending_review: {
    label: 'Pending review',
    backgroundColor: '#FDF2F2',
    color: Colors.primary,
  },
  coordinator_reviewing: {
    label: 'Coordinator reviewing',
    backgroundColor: '#FFF4E5',
    color: '#C9954A',
  },
  confirmed: {
    label: 'Confirmed',
    backgroundColor: '#E5F0FF',
    color: '#4A7CC9',
  },
  in_progress: {
    label: 'In progress',
    backgroundColor: '#E5F5EC',
    color: '#5BA678',
  },
  completed: {
    label: 'Completed',
    backgroundColor: '#DCEBE0',
    color: '#3D8B6A',
  },
  cancelled: {
    label: 'Cancelled',
    backgroundColor: '#FBE5E5',
    color: '#C95450',
  },
};

const METRIC_TINTS = ['#FDECEC', '#EAF3FF', '#EAF7EF', '#FFF6DD'];

const INSTITUTION_NAME_BY_ID = INSTITUTIONS.reduce<Record<string, string>>((acc, institution) => {
  acc[institution.id] = institution.name.en;
  return acc;
}, {});

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatDaysAgo = (value: string | null) => {
  if (!value) return 'No date';

  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return 'No date';

  const diffDays = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const normalizeLabel = (value?: string | null) => {
  if (!value) return 'Unknown';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getInstitutionKey = (booking: BookingRow) => {
  if (booking.mock_institution_id) return String(booking.mock_institution_id);
  return booking.institution_id || 'unknown';
};

const getInstitutionName = (booking: BookingRow) => {
  const key = getInstitutionKey(booking);
  return INSTITUTION_NAME_BY_ID[key] || (booking.institution_id ? `Institution ${booking.institution_id}` : 'Unknown institution');
};

const getCountItems = (bookings: BookingRow[], key: keyof BookingRow, limit?: number): CountItem[] => {
  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    const label = normalizeLabel(booking[key] as string | null | undefined);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
};

export default function MonitorScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!isSupabaseEnabled() || !supabase) {
      setBookings([]);
      setErrorMessage('Supabase is not configured for this environment.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setBookings([]);
        return;
      }

      setBookings((data ?? []) as BookingRow[]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch bookings.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const completedCount = bookings.filter((booking) => booking.status === 'completed').length;
    const activeInstitutions = new Set(bookings.map(getInstitutionKey).filter((value) => value !== 'unknown')).size;
    const totalUsers = new Set(bookings.map((booking) => booking.contact_name).filter(Boolean)).size;

    return [
      {
        label: 'Total Bookings',
        value: String(totalBookings),
        icon: 'calendar-outline' as const,
        tint: METRIC_TINTS[0],
      },
      {
        label: 'Active Institutions',
        value: String(activeInstitutions),
        icon: 'business-outline' as const,
        tint: METRIC_TINTS[1],
      },
      {
        label: 'Total Users',
        value: String(totalUsers),
        icon: 'people-outline' as const,
        tint: METRIC_TINTS[2],
      },
      {
        label: 'Completion Rate',
        value: totalBookings ? formatPercent((completedCount / totalBookings) * 100) : '0%',
        icon: 'trending-up-outline' as const,
        tint: METRIC_TINTS[3],
      },
    ];
  }, [bookings]);

  const statusRows = useMemo(() => {
    const total = Math.max(bookings.length, 1);
    return BOOKING_STATUSES.map((status) => {
      const count = bookings.filter((booking) => booking.status === status).length;
      return {
        status,
        count,
        percent: (count / total) * 100,
      };
    });
  }, [bookings]);

  const latestBookings = useMemo(() => bookings.slice(0, 5), [bookings]);

  const institutionRows = useMemo(() => {
    const rows = bookings.reduce<Record<string, {
      institutionName: string;
      total: number;
      confirmed: number;
      completed: number;
      lastBooking: string | null;
    }>>((acc, booking) => {
      const key = getInstitutionKey(booking);
      if (!acc[key]) {
        acc[key] = {
          institutionName: getInstitutionName(booking),
          total: 0,
          confirmed: 0,
          completed: 0,
          lastBooking: null,
        };
      }

      acc[key].total += 1;
      if (booking.status === 'confirmed') acc[key].confirmed += 1;
      if (booking.status === 'completed') acc[key].completed += 1;
      if (!acc[key].lastBooking || (booking.created_at && new Date(booking.created_at) > new Date(acc[key].lastBooking))) {
        acc[key].lastBooking = booking.created_at;
      }

      return acc;
    }, {});

    return Object.values(rows).sort((a, b) => b.total - a.total || a.institutionName.localeCompare(b.institutionName));
  }, [bookings]);

  const countryRows = useMemo(() => getCountItems(bookings, 'user_country', 5), [bookings]);
  const serviceRows = useMemo(() => getCountItems(bookings, 'preferred_service_type'), [bookings]);
  const destinationRows = useMemo(() => getCountItems(bookings, 'preferred_destination_city'), [bookings]);

  const maxInsightCount = Math.max(
    1,
    ...countryRows.map((item) => item.count),
    ...serviceRows.map((item) => item.count),
    ...destinationRows.map((item) => item.count),
  );

  const renderStatusBadge = (statusValue: string | null) => {
    const status = BOOKING_STATUSES.includes(statusValue as BookingRequestStatus)
      ? statusValue as BookingRequestStatus
      : 'pending_review';
    const statusStyle = STATUS_STYLE[status];

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
        <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
      </View>
    );
  };

  const renderInsightChart = (title: string, data: CountItem[]) => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.insightList}>
        {data.length === 0 ? (
          <Text style={styles.emptyPanelText}>No data yet</Text>
        ) : data.map((item) => (
          <View key={item.label} style={styles.insightRow}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.insightCount}>{item.count}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.insightBarFill, { width: `${Math.max(8, (item.count / maxInsightCount) * 100)}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>WellChina 运营监控 / Operations Dashboard</Text>
            <Text style={styles.subtitle}>Real-time business metrics</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Ionicons name="warning-outline" size={44} color={Colors.danger} />
            <Text style={styles.errorTitle}>Unable to load bookings</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricGrid}>
              {metrics.map((metric) => (
                <View key={metric.label} style={[styles.metricCard, { backgroundColor: metric.tint }]}>
                  <View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                  <Ionicons name={metric.icon} size={32} color={Colors.textSecondary} style={styles.metricIcon} />
                </View>
              ))}
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.panel, styles.statusPanel]}>
                <Text style={styles.panelTitle}>Booking Status Distribution</Text>
                <View style={styles.statusStack}>
                  {statusRows.map((row) => {
                    const statusStyle = STATUS_STYLE[row.status];
                    return (
                      <View
                        key={row.status}
                        style={[
                          styles.statusSegment,
                          {
                            flexGrow: Math.max(row.count, 0.35),
                            backgroundColor: statusStyle.color,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.statusList}>
                  {statusRows.map((row) => {
                    const statusStyle = STATUS_STYLE[row.status];
                    return (
                      <View key={row.status} style={styles.statusRow}>
                        <View style={styles.statusLabelWrap}>
                          <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                          <Text style={styles.statusLabel}>{statusStyle.label}</Text>
                        </View>
                        <Text style={styles.statusCount}>{row.count} · {formatPercent(row.percent)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.panel, styles.recentPanel]}>
                <Text style={styles.panelTitle}>Latest 5 Bookings</Text>
                <View style={styles.latestList}>
                  {latestBookings.length === 0 ? (
                    <Text style={styles.emptyPanelText}>No bookings yet</Text>
                  ) : latestBookings.map((booking) => (
                    <View key={booking.id} style={styles.latestRow}>
                      <View style={styles.latestTextWrap}>
                        <Text style={styles.latestName} numberOfLines={1}>{booking.contact_name || 'Unknown contact'}</Text>
                        <Text style={styles.latestInstitution} numberOfLines={1}>{getInstitutionName(booking)}</Text>
                      </View>
                      {renderStatusBadge(booking.status)}
                      <Text style={styles.daysAgo}>{formatDaysAgo(booking.created_at)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Institution Performance</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableHeaderText, styles.institutionColumn]}>Institution name</Text>
                  <Text style={styles.tableHeaderText}>Total bookings</Text>
                  <Text style={styles.tableHeaderText}>Confirmed bookings</Text>
                  <Text style={styles.tableHeaderText}>Completion rate</Text>
                  <Text style={styles.tableHeaderText}>Last booking date</Text>
                </View>
                {institutionRows.length === 0 ? (
                  <Text style={styles.emptyPanelText}>No institution activity yet</Text>
                ) : institutionRows.map((row) => (
                  <View key={row.institutionName} style={styles.tableRow}>
                    <Text style={[styles.tableCellText, styles.institutionColumn]} numberOfLines={1}>{row.institutionName}</Text>
                    <Text style={styles.tableCellText}>{row.total}</Text>
                    <Text style={styles.tableCellText}>{row.confirmed}</Text>
                    <Text style={styles.tableCellText}>{formatPercent((row.completed / Math.max(row.total, 1)) * 100)}</Text>
                    <Text style={styles.tableCellText}>{formatDate(row.lastBooking)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.threeColumnRow}>
              {renderInsightChart('User Country Distribution', countryRows)}
              {renderInsightChart('Preferred Service Types', serviceRows)}
              {renderInsightChart('Top Destination Cities', destinationRows)}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    minWidth: 1040,
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  backButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  headerCopy: { flex: 1 },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  centerState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  errorTitle: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  errorText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Shadow.card,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '900',
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '900',
    marginTop: Spacing.xs,
  },
  metricIcon: { opacity: 0.45 },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'stretch',
  },
  threeColumnRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'stretch',
  },
  panel: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  statusPanel: { flex: 6 },
  recentPanel: { flex: 4 },
  panelTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '900',
    marginBottom: Spacing.md,
  },
  statusStack: {
    height: 18,
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
    marginBottom: Spacing.lg,
  },
  statusSegment: {
    minWidth: 8,
  },
  statusList: { gap: Spacing.sm },
  statusRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statusLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  statusCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  latestList: { gap: Spacing.sm },
  latestRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  latestTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  latestName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  latestInstitution: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  daysAgo: {
    width: 76,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textAlign: 'right',
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  tableRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tableHeader: {
    backgroundColor: Colors.bg,
  },
  tableHeaderText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '900',
    paddingHorizontal: Spacing.md,
  },
  tableCellText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
    paddingHorizontal: Spacing.md,
  },
  institutionColumn: {
    flex: 2,
  },
  insightList: { gap: Spacing.md },
  insightRow: { gap: Spacing.xs },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  insightLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  insightCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  barTrack: {
    height: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
  },
  insightBarFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    opacity: 0.72,
  },
  emptyPanelText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '800',
    paddingVertical: Spacing.sm,
  },
});
