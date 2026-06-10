import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
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
  travel_window?: string | null;
  preferred_language?: string | null;
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

type TrendPoint = {
  dateKey: string;
  label: string;
  count: number;
};

type InstitutionRow = {
  institutionKey: string;
  institutionName: string;
  total: number;
  confirmed: number;
  completed: number;
  lastBooking: string | null;
  bookings: BookingRow[];
};

type UserProfile = {
  userKey: string;
  name: string;
  country: string;
  total: number;
  preferredLanguage: string;
  firstBooking: string | null;
  lastBooking: string | null;
  bookings: BookingRow[];
  servicePrefs: CountItem[];
  destinationPrefs: CountItem[];
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
    label: '待审核',
    backgroundColor: '#FDF2F2',
    color: Colors.primary,
  },
  coordinator_reviewing: {
    label: '协调员审核中',
    backgroundColor: '#FFF4E5',
    color: '#C9954A',
  },
  confirmed: {
    label: '已确认',
    backgroundColor: '#E5F0FF',
    color: '#4A7CC9',
  },
  in_progress: {
    label: '进行中',
    backgroundColor: '#E5F5EC',
    color: '#5BA678',
  },
  completed: {
    label: '已完成',
    backgroundColor: '#DCEBE0',
    color: '#3D8B6A',
  },
  cancelled: {
    label: '已取消',
    backgroundColor: '#FBE5E5',
    color: '#C95450',
  },
};

const METRIC_TINTS = ['#FDECEC', '#EAF3FF', '#EAF7EF', '#FFF6DD'];
const CHART_HEIGHT = 240;
const HEATMAP_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HEATMAP_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const INSTITUTION_NAME_BY_ID = INSTITUTIONS.reduce<Record<string, string>>((acc, institution) => {
  acc[institution.id] = institution.name.zh;
  return acc;
}, {});

const SERVICE_TYPE_LABELS: Record<string, string> = {
  advanced_treatment: '高端诊疗',
  oncology_screening: '肿瘤筛查',
  wellness_residency: '康养驻留',
  tcm_rehabilitation: '中医康复',
  cardiology_checkup: '心脏检查',
  orthopedic_surgery: '骨科手术',
  tcm_wellness: '中医养生',
  unknown: '未分类',
};

const DESTINATION_LABELS: Record<string, string> = {
  Beijing: '北京',
  Sanya: '三亚',
  Shanghai: '上海',
  Chengdu: '成都',
  Boao: '博鳌',
  Unknown: '未分类',
  unknown: '未分类',
};

const COUNTRY_LABELS: Record<string, string> = {
  Russia: '俄罗斯',
  Germany: '德国',
  France: '法国',
  Canada: '加拿大',
  Brazil: '巴西',
  Japan: '日本',
  UK: '英国',
  USA: '美国',
  'United Kingdom': '英国',
  'United States': '美国',
};

const COUNTRY_FLAGS: Record<string, string> = {
  Russia: '🇷🇺',
  俄罗斯: '🇷🇺',
  Germany: '🇩🇪',
  德国: '🇩🇪',
  France: '🇫🇷',
  法国: '🇫🇷',
  Canada: '🇨🇦',
  加拿大: '🇨🇦',
  Brazil: '🇧🇷',
  巴西: '🇧🇷',
  Japan: '🇯🇵',
  日本: '🇯🇵',
  UK: '🇬🇧',
  英国: '🇬🇧',
  USA: '🇺🇸',
  美国: '🇺🇸',
  'United Kingdom': '🇬🇧',
  'United States': '🇺🇸',
  'Hong Kong': '🇭🇰',
  香港: '🇭🇰',
  Ireland: '🇮🇪',
  爱尔兰: '🇮🇪',
  Italy: '🇮🇹',
  意大利: '🇮🇹',
  Kazakhstan: '🇰🇿',
  哈萨克斯坦: '🇰🇿',
  Singapore: '🇸🇬',
  新加坡: '🇸🇬',
  Malaysia: '🇲🇾',
  马来西亚: '🇲🇾',
  Switzerland: '🇨🇭',
  瑞士: '🇨🇭',
};

const LANGUAGE_LABELS: Record<string, string> = {
  zh: '中文 🇨🇳',
  en: '英语 🇺🇸',
  ru: '俄语 🇷🇺',
};

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatDaysAgo = (value: string | null) => {
  if (!value) return '无日期';

  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return '无日期';

  const diffDays = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
  if (diffDays === 0) return '今天';
  return `${diffDays} 天前`;
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

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTrendLabel = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

const getHeatmapCellColor = (count: number) => {
  if (count === 0) return '#F5F5F5';
  if (count === 1) return '#FBD9D7';
  if (count === 2) return '#F5A8A4';
  return '#C95450';
};

const getInstitutionKey = (booking: BookingRow) => {
  if (booking.mock_institution_id) return String(booking.mock_institution_id);
  return booking.institution_id || 'unknown';
};

const getInstitutionName = (booking: BookingRow) => {
  const key = getInstitutionKey(booking);
  return INSTITUTION_NAME_BY_ID[key] || (booking.institution_id ? `机构 ${booking.institution_id}` : '未知机构');
};

const translateValue = (value: string, dictionary?: Record<string, string>) => {
  if (!dictionary) return value === 'Unknown' ? '未分类' : value;
  const normalizedKey = value.toLowerCase().replace(/\s+/g, '_');
  return dictionary[value] || dictionary[value.toLowerCase()] || dictionary[normalizedKey] || value;
};

const formatCountry = (value?: string | null) => {
  if (!value) return '未分类';
  const translated = COUNTRY_LABELS[value] || value;
  const flag = COUNTRY_FLAGS[value] || COUNTRY_FLAGS[translated];
  return flag ? `${translated} ${flag}` : translated;
};

const formatLanguage = (value?: string | null) => {
  if (!value) return '-';
  return LANGUAGE_LABELS[value.toLowerCase()] || value.toUpperCase();
};

const getMostCommonValue = (bookings: BookingRow[], key: keyof BookingRow) => {
  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    const value = booking[key] as string | null | undefined;
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || '-';
};

const getPreferenceItems = (
  bookings: BookingRow[],
  key: keyof BookingRow,
  dictionary: Record<string, string>,
) => {
  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    const rawLabel = normalizeLabel(booking[key] as string | null | undefined);
    const label = translateValue(rawLabel, dictionary);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const getCountItems = (
  bookings: BookingRow[],
  key: keyof BookingRow,
  limit?: number,
  dictionary?: Record<string, string>,
): CountItem[] => {
  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    const rawLabel = normalizeLabel(booking[key] as string | null | undefined);
    const label = translateValue(rawLabel, dictionary);
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
  const windowWidth = Dimensions.get('window').width;
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trendCardWidth, setTrendCardWidth] = useState(0);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionRow | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!isSupabaseEnabled() || !supabase) {
      setBookings([]);
      setErrorMessage('当前环境未配置 Supabase。');
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
      setErrorMessage(error instanceof Error ? error.message : '预约数据加载失败。');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const userProfiles = useMemo<UserProfile[]>(() => {
    const users = bookings.reduce<Record<string, {
      name: string;
      bookings: BookingRow[];
    }>>((acc, booking) => {
      const name = booking.contact_name?.trim();
      if (!name) return acc;

      const userKey = name.toLowerCase();
      if (!acc[userKey]) {
        acc[userKey] = { name, bookings: [] };
      }
      acc[userKey].bookings.push(booking);
      return acc;
    }, {});

    return Object.entries(users)
      .map(([userKey, user]) => {
        const sortedBookings = [...user.bookings].sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        const oldestBooking = sortedBookings[sortedBookings.length - 1];
        const latestBooking = sortedBookings[0];

        return {
          userKey,
          name: user.name,
          country: getMostCommonValue(sortedBookings, 'user_country'),
          total: sortedBookings.length,
          preferredLanguage: getMostCommonValue(sortedBookings, 'preferred_language'),
          firstBooking: oldestBooking?.created_at || null,
          lastBooking: latestBooking?.created_at || null,
          bookings: sortedBookings,
          servicePrefs: getPreferenceItems(sortedBookings, 'preferred_service_type', SERVICE_TYPE_LABELS),
          destinationPrefs: getPreferenceItems(sortedBookings, 'preferred_destination_city', DESTINATION_LABELS),
        };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [bookings]);

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const completedCount = bookings.filter((booking) => booking.status === 'completed').length;
    const activeInstitutions = new Set(bookings.map(getInstitutionKey).filter((value) => value !== 'unknown')).size;
    const totalUsers = userProfiles.length;

    return [
      {
        label: '总预约数',
        value: String(totalBookings),
        icon: 'calendar-outline' as const,
        tint: METRIC_TINTS[0],
      },
      {
        label: '活跃机构',
        value: String(activeInstitutions),
        icon: 'business-outline' as const,
        tint: METRIC_TINTS[1],
      },
      {
        label: '总用户数',
        value: String(totalUsers),
        icon: 'people-outline' as const,
        tint: METRIC_TINTS[2],
      },
      {
        label: '完成率',
        value: totalBookings ? formatPercent((completedCount / totalBookings) * 100) : '0%',
        icon: 'trending-up-outline' as const,
        tint: METRIC_TINTS[3],
      },
    ];
  }, [bookings, userProfiles.length]);

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

  const trendData = useMemo<TrendPoint[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
      if (!booking.created_at) return acc;
      const createdAt = new Date(booking.created_at);
      if (Number.isNaN(createdAt.getTime())) return acc;

      createdAt.setHours(0, 0, 0, 0);
      const daysAgo = Math.floor((today.getTime() - createdAt.getTime()) / 86400000);
      if (daysAgo < 0 || daysAgo > 29) return acc;

      const dateKey = getDateKey(createdAt);
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const dateKey = getDateKey(date);

      return {
        dateKey,
        label: index % 5 === 0 || index === 29 ? formatTrendLabel(date) : '',
        count: counts[dateKey] || 0,
      };
    });
  }, [bookings]);

  const trendTotal = useMemo(
    () => trendData.reduce((total, point) => total + point.count, 0),
    [trendData],
  );

  const trendChartWidth = Math.max(
    640,
    trendCardWidth ? trendCardWidth - Spacing.lg * 2 : windowWidth - Spacing.xl * 4,
  );

  const maxTrendCount = Math.max(1, ...trendData.map((point) => point.count));

  const trendChartData = useMemo(() => ({
    labels: trendData.map((point) => point.label),
    datasets: [
      {
        data: trendData.map((point) => point.count),
        color: () => Colors.primary,
        strokeWidth: 3,
      },
    ],
  }), [trendData]);

  const institutionRows = useMemo(() => {
    const rows = bookings.reduce<Record<string, InstitutionRow>>((acc, booking) => {
      const key = getInstitutionKey(booking);
      if (!acc[key]) {
        acc[key] = {
          institutionKey: key,
          institutionName: getInstitutionName(booking),
          total: 0,
          confirmed: 0,
          completed: 0,
          lastBooking: null,
          bookings: [],
        };
      }

      acc[key].total += 1;
      acc[key].bookings.push(booking);
      if (booking.status === 'confirmed') acc[key].confirmed += 1;
      if (booking.status === 'completed') acc[key].completed += 1;
      if (!acc[key].lastBooking || (booking.created_at && new Date(booking.created_at) > new Date(acc[key].lastBooking))) {
        acc[key].lastBooking = booking.created_at;
      }

      return acc;
    }, {});

    return Object.values(rows)
      .map((row) => ({
        ...row,
        bookings: [...row.bookings].sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        }),
      }))
      .sort((a, b) => b.total - a.total || a.institutionName.localeCompare(b.institutionName));
  }, [bookings]);

  const countryRows = useMemo(() => getCountItems(bookings, 'user_country', 5, COUNTRY_LABELS), [bookings]);
  const serviceRows = useMemo(() => getCountItems(bookings, 'preferred_service_type', undefined, SERVICE_TYPE_LABELS), [bookings]);
  const destinationRows = useMemo(() => getCountItems(bookings, 'preferred_destination_city', undefined, DESTINATION_LABELS), [bookings]);

  const maxInsightCount = Math.max(
    1,
    ...countryRows.map((item) => item.count),
    ...serviceRows.map((item) => item.count),
    ...destinationRows.map((item) => item.count),
  );

  const bookingTimeHeatmap = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    bookings.forEach((booking) => {
      if (!booking.created_at) return;
      const createdAt = new Date(booking.created_at);
      if (Number.isNaN(createdAt.getTime())) return;

      const dayIndex = (createdAt.getDay() + 6) % 7;
      const hour = createdAt.getHours();
      matrix[dayIndex][hour] += 1;
    });

    return matrix;
  }, [bookings]);

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
          <Text style={styles.emptyPanelText}>暂无数据</Text>
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
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>WellChina 运营监控</Text>
            <Text style={styles.subtitle}>实时业务数据</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>正在加载业务数据...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Ionicons name="warning-outline" size={44} color={Colors.danger} />
            <Text style={styles.errorTitle}>无法加载预约数据</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricGrid}>
              {metrics.map((metric) => {
                const isUserMetric = metric.label === '总用户数';
                const cardContent = (
                  <>
                    <View>
                      <Text style={styles.metricValue}>{metric.value}</Text>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                    </View>
                    <Ionicons name={metric.icon} size={32} color={Colors.textSecondary} style={styles.metricIcon} />
                    {isUserMetric ? <Text style={styles.metricHint}>点击查看详情 ›</Text> : null}
                  </>
                );

                return isUserMetric ? (
                  <TouchableOpacity
                    key={metric.label}
                    style={[styles.metricCard, styles.clickableMetricCard, { backgroundColor: metric.tint }]}
                    onPress={() => {
                      setSelectedUser(null);
                      setIsUserListOpen(true);
                    }}
                    activeOpacity={0.82}
                  >
                    {cardContent}
                  </TouchableOpacity>
                ) : (
                  <View key={metric.label} style={[styles.metricCard, { backgroundColor: metric.tint }]}>
                    {cardContent}
                  </View>
                );
              })}
            </View>

            <View
              style={styles.trendPanel}
              onLayout={(event) => setTrendCardWidth(event.nativeEvent.layout.width)}
            >
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelTitle}>近30天预约趋势</Text>
                  <Text style={styles.panelSubtitle}>近30天共 {trendTotal} 条预约</Text>
                </View>
              </View>
              <View style={styles.chartWrap}>
                <LineChart
                  data={trendChartData}
                  width={trendChartWidth}
                  height={CHART_HEIGHT}
                  bezier
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  withShadow
                  withVerticalLabels
                  withHorizontalLabels
                  fromZero
                  segments={Math.min(4, maxTrendCount)}
                  chartConfig={{
                    backgroundGradientFrom: Colors.bgCard,
                    backgroundGradientTo: Colors.bgCard,
                    decimalPlaces: 0,
                    color: () => Colors.primary,
                    labelColor: () => Colors.textMuted,
                    propsForBackgroundLines: {
                      stroke: Colors.border,
                      strokeDasharray: '4 8',
                      strokeWidth: 0.5,
                    },
                    propsForLabels: {
                      fontSize: 11,
                      fontWeight: '700',
                    },
                    fillShadowGradientFrom: Colors.primary,
                    fillShadowGradientFromOpacity: 0.18,
                    fillShadowGradientTo: Colors.primary,
                    fillShadowGradientToOpacity: 0.02,
                    propsForDots: {
                      r: '3',
                      strokeWidth: '2',
                      stroke: Colors.primary,
                    },
                  }}
                  style={styles.lineChart}
                />
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.panel, styles.statusPanel]}>
                <Text style={styles.panelTitle}>预约状态分布</Text>
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
                <Text style={styles.panelTitle}>最近5条预约</Text>
                <View style={styles.latestList}>
                  {latestBookings.length === 0 ? (
                    <Text style={styles.emptyPanelText}>暂无预约</Text>
                  ) : latestBookings.map((booking) => (
                    <View key={booking.id} style={styles.latestRow}>
                      <View style={styles.latestTextWrap}>
                        <Text style={styles.latestName} numberOfLines={1}>{booking.contact_name || '未知联系人'}</Text>
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
              <Text style={styles.panelTitle}>机构运营表现</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableHeaderText, styles.institutionColumn]}>机构名称</Text>
                  <Text style={styles.tableHeaderText}>总预约数</Text>
                  <Text style={styles.tableHeaderText}>已确认数</Text>
                  <Text style={styles.tableHeaderText}>完成率</Text>
                  <Text style={styles.tableHeaderText}>最近预约日期</Text>
                  <View style={styles.chevronColumn} />
                </View>
                {institutionRows.length === 0 ? (
                  <Text style={styles.emptyPanelText}>暂无机构数据</Text>
                ) : institutionRows.map((row) => (
                  <TouchableOpacity
                    key={row.institutionKey}
                    style={[styles.tableRow, styles.clickableTableRow]}
                    onPress={() => setSelectedInstitution(row)}
                    activeOpacity={0.78}
                  >
                    <Text style={[styles.tableCellText, styles.institutionColumn]} numberOfLines={1}>{row.institutionName}</Text>
                    <Text style={styles.tableCellText}>{row.total}</Text>
                    <Text style={styles.tableCellText}>{row.confirmed}</Text>
                    <Text style={styles.tableCellText}>{formatPercent((row.completed / Math.max(row.total, 1)) * 100)}</Text>
                    <Text style={styles.tableCellText}>{formatDate(row.lastBooking)}</Text>
                    <View style={styles.chevronColumn}>
                      <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.threeColumnRow}>
              {renderInsightChart('用户国家分布', countryRows)}
              {renderInsightChart('热门服务类型', serviceRows)}
              {renderInsightChart('热门目的地', destinationRows)}
            </View>

            <View style={styles.heatmapPanel}>
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelTitle}>预约时段热力图</Text>
                  <Text style={styles.panelSubtitle}>按星期 × 小时分布</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.heatmapContent}>
                  <View style={styles.heatmapHeaderRow}>
                    <View style={styles.heatmapDayLabelSpacer} />
                    {HEATMAP_HOURS.map((hour) => (
                      <Text key={hour} style={styles.heatmapHourLabel}>
                        {hour % 3 === 0 ? hour : ''}
                      </Text>
                    ))}
                  </View>

                  {bookingTimeHeatmap.map((dayCounts, dayIndex) => (
                    <View key={HEATMAP_DAYS[dayIndex]} style={styles.heatmapRow}>
                      <Text style={styles.heatmapDayLabel}>{HEATMAP_DAYS[dayIndex]}</Text>
                      {dayCounts.map((count, hour) => (
                        <View
                          key={`${HEATMAP_DAYS[dayIndex]}-${hour}`}
                          style={[
                            styles.heatmapCell,
                            { backgroundColor: getHeatmapCellColor(count) },
                          ]}
                        >
                          {count > 0 ? <Text style={styles.heatmapCellText}>{count}</Text> : null}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.heatmapLegend}>
                {[0, 1, 2, 3].map((count) => (
                  <View key={count} style={styles.heatmapLegendItem}>
                    <View style={[styles.heatmapLegendSwatch, { backgroundColor: getHeatmapCellColor(count) }]} />
                    <Text style={styles.heatmapLegendText}>{count === 3 ? '3+' : count}</Text>
                  </View>
                ))}
                <Text style={styles.heatmapLegendText}>预约</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedInstitution)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedInstitution(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedInstitution(null)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedInstitution?.institutionName} - 全部预约
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedInstitution(null)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {selectedInstitution?.bookings.map((booking) => (
                <View key={booking.id} style={styles.modalBookingRow}>
                  <View style={styles.modalContactColumn}>
                    <Text style={styles.modalContactName} numberOfLines={1}>
                      {booking.contact_name || '未知联系人'}
                    </Text>
                    <Text style={styles.modalTravelWindow} numberOfLines={1}>
                      {booking.travel_window || '未填写出行时间'}
                    </Text>
                  </View>
                  <View style={styles.modalStatusColumn}>
                    {renderStatusBadge(booking.status)}
                  </View>
                  <Text style={styles.modalDateText}>{formatDaysAgo(booking.created_at)}</Text>
                  <Text style={styles.modalLanguageText}>
                    {(booking.preferred_language || '-').toUpperCase()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isUserListOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUserListOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsUserListOpen(false)}
        >
          <TouchableOpacity
            style={styles.userListModalCard}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>全部用户 ({userProfiles.length})</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsUserListOpen(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userListScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.userGrid}>
                {userProfiles.map((user) => (
                  <TouchableOpacity
                    key={user.userKey}
                    style={styles.userCard}
                    activeOpacity={0.82}
                    onPress={() => {
                      setIsUserListOpen(false);
                      setSelectedUser(user);
                    }}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.userCardText}>
                      <Text style={styles.userCardName} numberOfLines={1}>{user.name}</Text>
                      <Text style={styles.userCardCountry} numberOfLines={1}>{formatCountry(user.country)}</Text>
                      <Text style={styles.userCardMeta}>预约数: {user.total}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={Boolean(selectedUser)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUser(null)}
        >
          <TouchableOpacity
            style={styles.userDetailModalCard}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.userDetailHeader}>
              <TouchableOpacity
                style={styles.backToUsersButton}
                onPress={() => {
                  setSelectedUser(null);
                  setIsUserListOpen(true);
                }}
                activeOpacity={0.82}
              >
                <Ionicons name="chevron-back" size={18} color={Colors.primary} />
                <Text style={styles.backToUsersText}>返回</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedUser?.name} 的偏好档案
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedUser(null)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser ? (
              <ScrollView style={styles.userDetailScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.userProfileColumns}>
                  <View style={styles.userStatsColumn}>
                    <View style={styles.profileStatRow}>
                      <Text style={styles.profileStatLabel}>国家</Text>
                      <Text style={styles.profileStatValue}>{formatCountry(selectedUser.country)}</Text>
                    </View>
                    <View style={styles.profileStatRow}>
                      <Text style={styles.profileStatLabel}>总预约数</Text>
                      <Text style={styles.profileStatValue}>{selectedUser.total}</Text>
                    </View>
                    <View style={styles.profileStatRow}>
                      <Text style={styles.profileStatLabel}>偏好语言</Text>
                      <Text style={styles.profileStatValue}>{formatLanguage(selectedUser.preferredLanguage)}</Text>
                    </View>
                    <View style={styles.profileStatRow}>
                      <Text style={styles.profileStatLabel}>第一次预约</Text>
                      <Text style={styles.profileStatValue}>{formatDate(selectedUser.firstBooking)}</Text>
                    </View>
                    <View style={styles.profileStatRow}>
                      <Text style={styles.profileStatLabel}>最近预约</Text>
                      <Text style={styles.profileStatValue}>{formatDate(selectedUser.lastBooking)}</Text>
                    </View>
                  </View>

                  <View style={styles.userPrefsColumn}>
                    <View style={styles.preferenceBlock}>
                      <Text style={styles.preferenceTitle}>偏好服务类型</Text>
                      {selectedUser.servicePrefs.map((item) => (
                        <View key={item.label} style={styles.preferenceRow}>
                          <Text style={styles.preferenceLabel}>{item.label}</Text>
                          <Text style={styles.preferenceCount}>{item.count}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.preferenceBlock}>
                      <Text style={styles.preferenceTitle}>偏好目的地</Text>
                      {selectedUser.destinationPrefs.map((item) => (
                        <View key={item.label} style={styles.preferenceRow}>
                          <Text style={styles.preferenceLabel}>{item.label}</Text>
                          <Text style={styles.preferenceCount}>{item.count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.userBookingHistory}>
                  <Text style={styles.preferenceTitle}>全部预约 ({selectedUser.total})</Text>
                  {selectedUser.bookings.map((booking) => (
                    <View key={booking.id} style={styles.userHistoryRow}>
                      <View style={styles.userHistoryMain}>
                        <Text style={styles.userHistoryInstitution} numberOfLines={1}>
                          {getInstitutionName(booking)}
                        </Text>
                        <Text style={styles.userHistoryTravel} numberOfLines={1}>
                          {booking.travel_window || '未填写出行时间'}
                        </Text>
                      </View>
                      {renderStatusBadge(booking.status)}
                      <Text style={styles.userHistoryDate}>{formatDaysAgo(booking.created_at)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  clickableMetricCard: {
    cursor: 'pointer',
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
  metricHint: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: Spacing.sm,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  metricIcon: { opacity: 0.45 },
  trendPanel: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  panelSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '800',
    marginTop: -Spacing.sm,
  },
  chartWrap: {
    height: CHART_HEIGHT,
    overflow: 'hidden',
  },
  lineChart: {
    marginLeft: -Spacing.md,
  },
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
  heatmapPanel: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
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
  clickableTableRow: {
    cursor: 'pointer',
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
  chevronColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  heatmapContent: {
    alignSelf: 'flex-start',
  },
  heatmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  heatmapDayLabelSpacer: {
    width: 42,
    marginRight: Spacing.sm,
  },
  heatmapHourLabel: {
    width: 24,
    marginRight: 2,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textAlign: 'center',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heatmapDayLabel: {
    width: 42,
    marginRight: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  heatmapCell: {
    width: 24,
    height: 24,
    marginRight: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCellText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '900',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  heatmapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heatmapLegendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  heatmapLegendText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,37,47,0.42)',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 700,
    maxHeight: '78%',
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.strong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  modalList: {
    marginTop: Spacing.sm,
  },
  modalBookingRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalContactColumn: {
    flex: 1.4,
    minWidth: 0,
  },
  modalContactName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalTravelWindow: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 3,
  },
  modalStatusColumn: {
    width: 124,
    alignItems: 'flex-start',
  },
  modalDateText: {
    width: 74,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textAlign: 'right',
  },
  modalLanguageText: {
    width: 42,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '900',
    textAlign: 'right',
  },
  userListModalCard: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '82%',
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.strong,
  },
  userListScroll: {
    marginTop: Spacing.md,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  userCard: {
    width: '31.8%',
    minWidth: 240,
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
    cursor: 'pointer',
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  userAvatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  userCardText: {
    flex: 1,
    minWidth: 0,
  },
  userCardName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  userCardCountry: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    marginTop: 4,
  },
  userCardMeta: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '900',
    marginTop: 6,
  },
  userDetailModalCard: {
    width: '100%',
    maxWidth: 800,
    maxHeight: '84%',
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.strong,
  },
  userDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backToUsersButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
  },
  backToUsersText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  userDetailScroll: {
    marginTop: Spacing.md,
  },
  userProfileColumns: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  userStatsColumn: {
    flex: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  userPrefsColumn: {
    flex: 6,
    gap: Spacing.md,
  },
  profileStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  profileStatLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  profileStatValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '900',
    textAlign: 'right',
  },
  preferenceBlock: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  preferenceTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '900',
    marginBottom: Spacing.sm,
  },
  preferenceRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  preferenceLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  preferenceCount: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  userBookingHistory: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  userHistoryRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  userHistoryMain: {
    flex: 1,
    minWidth: 0,
  },
  userHistoryInstitution: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  userHistoryTravel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 3,
  },
  userHistoryDate: {
    width: 76,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textAlign: 'right',
  },
});
