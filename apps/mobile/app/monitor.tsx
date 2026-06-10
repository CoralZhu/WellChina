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

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const completedCount = bookings.filter((booking) => booking.status === 'completed').length;
    const activeInstitutions = new Set(bookings.map(getInstitutionKey).filter((value) => value !== 'unknown')).size;
    const totalUsers = new Set(bookings.map((booking) => booking.contact_name).filter(Boolean)).size;

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
});
