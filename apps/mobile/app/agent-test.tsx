import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../constants/theme';
import { isSupabaseEnabled, supabase } from '../lib/supabase';

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

type RunResult = {
  userMessage: string;
  reply: string;
  toolCalls: AgentToolCall[];
  error?: string;
};

export default function AgentTestScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('How many bookings are pending review?');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    if (!isSupabaseEnabled() || !supabase) {
      setResult({
        userMessage: trimmedMessage,
        reply: '',
        toolCalls: [],
        error: 'Supabase client is not configured.',
      });
      return;
    }

    setSending(true);
    setResult({
      userMessage: trimmedMessage,
      reply: '',
      toolCalls: [],
    });

    try {
      const { data, error } = await supabase.functions.invoke<AgentResponse>('agent-coordinator', {
        body: { message: trimmedMessage },
      });

      if (error) {
        setResult({
          userMessage: trimmedMessage,
          reply: '',
          toolCalls: [],
          error: error.message,
        });
        return;
      }

      setResult({
        userMessage: trimmedMessage,
        reply: data?.reply ?? '',
        toolCalls: data?.tool_calls ?? [],
        error: data?.error,
      });
    } catch (error) {
      setResult({
        userMessage: trimmedMessage,
        reply: '',
        toolCalls: [],
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSending(false);
    }
  };

  const renderToolCall = (toolCall: AgentToolCall, index: number) => (
    <View key={`${toolCall.id ?? toolCall.name}-${index}`} style={styles.toolCall}>
      <View style={styles.toolCallHeader}>
        <Ionicons name="construct-outline" size={18} color={Colors.primary} />
        <Text style={styles.toolCallName}>{toolCall.name}</Text>
      </View>
      <Text style={styles.metaLabel}>Params</Text>
      <Text style={styles.codeBlock}>{JSON.stringify(toolCall.arguments ?? {}, null, 2)}</Text>
      {toolCall.error ? (
        <>
          <Text style={styles.metaLabel}>Error</Text>
          <Text style={[styles.codeBlock, styles.errorText]}>{toolCall.error}</Text>
        </>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agent Test</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.panel}>
            <Text style={styles.label}>User message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={styles.input}
              placeholder="Ask about bookings"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!message.trim() || sending}
              activeOpacity={0.86}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={Colors.white} />
              )}
              <Text style={styles.sendButtonText}>{sending ? 'Sending' : 'Send'}</Text>
            </TouchableOpacity>
          </View>

          {result ? (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Run</Text>
              <Text style={styles.metaLabel}>User</Text>
              <Text style={styles.messageText}>{result.userMessage}</Text>

              <Text style={styles.metaLabel}>Tool calls</Text>
              {result.toolCalls.length > 0 ? (
                <View style={styles.toolList}>{result.toolCalls.map(renderToolCall)}</View>
              ) : (
                <Text style={styles.emptyText}>No tool calls returned.</Text>
              )}

              <Text style={styles.metaLabel}>Final AI response</Text>
              {result.error ? (
                <Text style={styles.errorText}>{result.error}</Text>
              ) : (
                <Text style={styles.replyText}>{result.reply || 'No reply returned.'}</Text>
              )}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F3F4F5',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  panel: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 96,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
  },
  sendButton: {
    minHeight: 48,
    marginTop: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  replyText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    lineHeight: 21,
  },
  toolList: {
    gap: Spacing.sm,
  },
  toolCall: {
    padding: Spacing.md,
    backgroundColor: '#FAFAFA',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toolCallName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  codeBlock: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F3F4',
    color: Colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
