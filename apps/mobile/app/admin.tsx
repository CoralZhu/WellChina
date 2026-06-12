import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type AgentToolCall = {
  id?: string;
  name: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
};

type AgentResponse = {
  reply?: string;
  tool_calls?: AgentToolCall[];
  error?: string;
};

type ConversationTurn = {
  id: string;
  userMessage: string;
  reply: string;
  toolCalls: AgentToolCall[];
  error?: string;
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

const EXAMPLE_PROMPTS = [
  '查看所有待审核的预约',
  '把张三的预约改成已确认',
  '三亚国际中医康养中心的预约情况',
];

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const [agentExpanded, setAgentExpanded] = useState(true);
  const [agentInput, setAgentInput] = useState('');
  const [agentSending, setAgentSending] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});

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

  const didUpdateBooking = (toolCalls: AgentToolCall[]) => (
    toolCalls.some((toolCall) => {
      if (toolCall.name !== 'update_booking_status' || !toolCall.result || typeof toolCall.result !== 'object') {
        return false;
      }

      const updated = (toolCall.result as { updated?: unknown }).updated;
      return typeof updated === 'number' && updated > 0;
    })
  );

  const sendAgentMessage = async () => {
    const trimmedMessage = agentInput.trim();
    if (!trimmedMessage || agentSending) return;

    if (!isSupabaseEnabled() || !supabase) {
      setAgentError('Supabase client is not configured.');
      return;
    }

    const turnId = `${Date.now()}`;
    setAgentSending(true);
    setAgentError(null);
    setAgentInput('');
    setConversation((current) => [
      ...current,
      {
        id: turnId,
        userMessage: trimmedMessage,
        reply: '',
        toolCalls: [],
      },
    ]);

    try {
      const { data, error } = await supabase.functions.invoke<AgentResponse>('agent-coordinator', {
        body: { message: trimmedMessage },
      });

      const nextTurn: ConversationTurn = {
        id: turnId,
        userMessage: trimmedMessage,
        reply: data?.reply ?? '',
        toolCalls: data?.tool_calls ?? [],
        error: error?.message ?? data?.error,
      };

      setConversation((current) => current.map((turn) => (turn.id === turnId ? nextTurn : turn)));

      if (nextTurn.error) {
        setAgentError(nextTurn.error);
      }

      if (!nextTurn.error && didUpdateBooking(nextTurn.toolCalls)) {
        await fetchBookings();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAgentError(message);
      setConversation((current) => current.map((turn) => (
        turn.id === turnId
          ? { ...turn, error: message }
          : turn
      )));
    } finally {
      setAgentSending(false);
    }
  };

  const toggleToolCall = (key: string) => {
    setExpandedToolCalls((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderToolCall = (turnId: string, toolCall: AgentToolCall, index: number) => {
    const key = `${turnId}-${toolCall.id ?? index}`;
    const expanded = !!expandedToolCalls[key];

    return (
      <TouchableOpacity
        key={key}
        style={styles.agentToolCall}
        onPress={() => toggleToolCall(key)}
        activeOpacity={0.84}
      >
        <View style={styles.agentToolHeader}>
          <Ionicons name="construct-outline" size={15} color={Colors.primary} />
          <Text style={styles.agentToolName}>{toolCall.name}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textMuted}
          />
        </View>
        {expanded && (
          <Text style={styles.agentToolJson}>
            {JSON.stringify(toolCall.arguments ?? {}, null, 2)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderAgentSection = () => (
    <View style={styles.agentSection}>
      <TouchableOpacity
        style={styles.agentHeader}
        onPress={() => setAgentExpanded((current) => !current)}
        activeOpacity={0.84}
      >
        <View style={styles.agentHeaderText}>
          <Text style={styles.agentTitle}>AI 协调员助手</Text>
          <Text style={styles.agentSubtitle}>用自然语言指挥AI助手管理预约</Text>
        </View>
        <Ionicons
          name={agentExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {agentExpanded && (
        <View style={styles.agentBody}>
          <Text style={styles.agentNote}>AI助手会自动调用工具查询和更新数据库，所有操作都基于真实数据</Text>

          <TextInput
            value={agentInput}
            onChangeText={setAgentInput}
            style={styles.agentInput}
            placeholder="例如：查看所有待审核的预约"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <View style={styles.agentActions}>
            <TouchableOpacity
              style={styles.agentClearButton}
              onPress={() => {
                setConversation([]);
                setAgentError(null);
                setExpandedToolCalls({});
              }}
              activeOpacity={0.84}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.agentClearText}>清空</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.agentSendButton, (!agentInput.trim() || agentSending) && styles.agentSendButtonDisabled]}
              onPress={sendAgentMessage}
              disabled={!agentInput.trim() || agentSending}
              activeOpacity={0.86}
            >
              {agentSending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={16} color={Colors.white} />
              )}
              <Text style={styles.agentSendText}>{agentSending ? '思考中' : '发送'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promptChips}>
            {EXAMPLE_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.promptChip}
                onPress={() => setAgentInput(prompt)}
                activeOpacity={0.84}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {agentError && (
            <View style={styles.agentErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.agentErrorText}>{agentError}</Text>
            </View>
          )}

          {conversation.length > 0 && (
            <View style={styles.conversation}>
              {conversation.map((turn) => (
                <View key={turn.id} style={styles.conversationTurn}>
                  <View style={styles.userMessageBubble}>
                    <Text style={styles.userMessageText}>{turn.userMessage}</Text>
                  </View>

                  {turn.toolCalls.length > 0 && (
                    <View style={styles.agentToolList}>
                      {turn.toolCalls.map((toolCall, index) => renderToolCall(turn.id, toolCall, index))}
                    </View>
                  )}

                  <View style={styles.aiMessageBubble}>
                    {turn.reply ? (
                      <Text style={styles.aiMessageText}>{turn.reply}</Text>
                    ) : turn.error ? (
                      <Text style={styles.agentErrorText}>{turn.error}</Text>
                    ) : (
                      <View style={styles.agentThinking}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.agentThinkingText}>AI 正在处理</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderAgentSection()}

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
          bookings.map((booking) => {
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
        })
        )}
      </ScrollView>
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
  agentSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  agentHeader: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  agentHeaderText: {
    flex: 1,
  },
  agentTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  agentSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: 3,
  },
  agentBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  agentNote: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    lineHeight: 18,
  },
  agentInput: {
    minHeight: 82,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textAlignVertical: 'top',
  },
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  agentClearButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  agentClearText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  agentSendButton: {
    minHeight: 42,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
  },
  agentSendButtonDisabled: {
    opacity: 0.55,
  },
  agentSendText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  promptChip: {
    borderRadius: Radius.full,
    backgroundColor: '#FFF4F2',
    borderWidth: 1,
    borderColor: '#F3CCC6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  promptChipText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  agentErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#F3CCC6',
    backgroundColor: '#FFF4F2',
    padding: Spacing.sm,
  },
  conversation: {
    gap: Spacing.md,
  },
  conversationTurn: {
    gap: Spacing.sm,
  },
  userMessageBubble: {
    maxWidth: '88%',
    alignSelf: 'flex-end',
    borderRadius: Radius.sm,
    backgroundColor: '#FADBD7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  userMessageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
    lineHeight: 20,
  },
  aiMessageBubble: {
    maxWidth: '92%',
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  aiMessageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    lineHeight: 21,
  },
  agentToolList: {
    width: '88%',
    alignSelf: 'flex-end',
    gap: Spacing.xs,
  },
  agentToolCall: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  agentToolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  agentToolName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  agentToolJson: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 17,
    fontFamily: 'monospace',
  },
  agentThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  agentThinkingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  agentErrorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '700',
    lineHeight: 20,
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
