import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const bookingStatuses = [
  'pending_review',
  'coordinator_reviewing',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

const institutions = [
  { id: '1', name_zh: '北京协和医院' },
  { id: '2', name_zh: '三亚国际中医康养中心' },
  { id: '3', name_zh: '上海仁济医院国际部' },
  { id: '4', name_zh: '博鳌超级医院' },
  { id: '5', name_zh: '成都天府中医养生园' },
];

type BookingStatus = typeof bookingStatuses[number];

type AgentRequest = {
  message?: string;
};

type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: DeepSeekMessage;
  }>;
};

type QueryBookingsArgs = {
  status?: string;
  limit?: number;
};

type UpdateBookingStatusArgs = {
  identifier?: string;
  identifier_type?: 'id' | 'contact_name';
  new_status?: BookingStatus;
};

type GetInstitutionStatsArgs = {
  institution_name?: string;
  all?: boolean;
};

type SendReminderEmailArgs = {
  contact_name?: string;
  reminder_type?: 'follow_up' | 'missing_documents' | 'appointment_reminder';
};

type ToolResult = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
};

const tools = [
  {
    type: 'function',
    function: {
      name: 'query_bookings',
      description: 'Query individual booking records from the database with optional status filters. Do not use for institution aggregate statistics.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional booking status filter, such as pending_review or confirmed',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of bookings to return',
            default: 10,
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_booking_status',
      description: 'Update the status of a booking by ID or contact name',
      parameters: {
        type: 'object',
        required: ['identifier', 'identifier_type', 'new_status'],
        properties: {
          identifier: {
            type: 'string',
            description: 'Booking ID, or contact_name to look up',
          },
          identifier_type: {
            type: 'string',
            enum: ['id', 'contact_name'],
            description: 'Whether identifier is a booking ID or contact name',
          },
          new_status: {
            type: 'string',
            enum: bookingStatuses,
            description: 'New booking status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_institution_stats',
      description: 'Get aggregated booking statistics for an institution. Use this when the user asks about an institution name or institution booking situation.',
      parameters: {
        type: 'object',
        properties: {
          institution_name: {
            type: 'string',
            description: 'Optional partial match on Chinese institution name from the app data',
          },
          all: {
            type: 'boolean',
            description: 'If true, return stats for all institutions',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder_email',
      description: 'Send a reminder email to a patient (simulated, not actually sent)',
      parameters: {
        type: 'object',
        required: ['contact_name', 'reminder_type'],
        properties: {
          contact_name: {
            type: 'string',
            description: 'Patient contact name',
          },
          reminder_type: {
            type: 'string',
            enum: ['follow_up', 'missing_documents', 'appointment_reminder'],
            description: 'Reminder email type',
          },
        },
      },
    },
  },
] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function parseToolArguments(rawArguments: string): Record<string, unknown> {
  if (!rawArguments.trim()) return {};

  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function normalizeLimit(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && bookingStatuses.includes(value as BookingStatus);
}

function emptyStatusCounts() {
  return bookingStatuses.reduce<Record<BookingStatus, number>>((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<BookingStatus, number>);
}

async function callDeepSeek(apiKey: string, messages: DeepSeekMessage[], includeTools: boolean) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 1400,
      messages,
      ...(includeTools ? { tools } : {}),
    }),
  });

  const payload = await response.json() as DeepSeekResponse | Record<string, unknown>;

  if (!response.ok) {
    console.log('DeepSeek API error:', JSON.stringify(payload));
    throw new Error('DeepSeek API request failed');
  }

  return payload as DeepSeekResponse;
}

async function queryBookings(supabase: ReturnType<typeof createClient>, args: QueryBookingsArgs) {
  const status = typeof args.status === 'string' && args.status.trim() ? args.status.trim() : undefined;
  const limit = normalizeLimit(args.limit);

  let query = supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return {
    arguments: { ...(status ? { status } : {}), limit },
    result: { bookings: data ?? [], count: data?.length ?? 0 },
  };
}

async function updateBookingStatus(supabase: ReturnType<typeof createClient>, args: UpdateBookingStatusArgs) {
  const identifier = typeof args.identifier === 'string' ? args.identifier.trim() : '';
  const identifierType = args.identifier_type;
  const newStatus = args.new_status;

  if (!identifier || (identifierType !== 'id' && identifierType !== 'contact_name') || !isBookingStatus(newStatus)) {
    throw new Error('identifier, identifier_type, and valid new_status are required');
  }

  let matchQuery = supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (identifierType === 'id') {
    matchQuery = matchQuery.eq('id', identifier);
  } else {
    matchQuery = matchQuery.ilike('contact_name', `%${identifier}%`);
  }

  const { data: matches, error: matchError } = await matchQuery;
  if (matchError) throw new Error(matchError.message);

  if (!matches || matches.length === 0) {
    return {
      arguments: { identifier, identifier_type: identifierType, new_status: newStatus },
      result: { updated: 0, booking: null, message: 'No matching booking found' },
    };
  }

  if (identifierType === 'contact_name' && matches.length > 1) {
    return {
      arguments: { identifier, identifier_type: identifierType, new_status: newStatus },
      result: {
        updated: 0,
        ambiguous: true,
        matches,
        message: 'Multiple bookings matched this contact name. Ask the user which booking to update.',
      },
    };
  }

  const target = matches[0];
  const { data: updatedRows, error: updateError } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', target.id)
    .select('*');

  if (updateError) throw new Error(updateError.message);

  return {
    arguments: { identifier, identifier_type: identifierType, new_status: newStatus },
    result: {
      updated: updatedRows?.length ?? 0,
      booking: updatedRows?.[0] ?? null,
    },
  };
}

async function getInstitutionStats(supabase: ReturnType<typeof createClient>, args: GetInstitutionStatsArgs) {
  const searchName = typeof args.institution_name === 'string' ? args.institution_name.trim() : '';
  const matchedInstitutions = args.all || !searchName
    ? institutions
    : institutions.filter((institution) => institution.name_zh.includes(searchName));

  const stats = [];

  for (const institution of matchedInstitutions) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id,status,institution_id,mock_institution_id')
      .or(`institution_id.eq.${institution.id},mock_institution_id.eq.${institution.id}`);

    if (error) throw new Error(error.message);

    const byStatus = emptyStatusCounts();
    for (const booking of data ?? []) {
      const status = (booking as { status?: string }).status;
      if (isBookingStatus(status)) {
        byStatus[status] += 1;
      }
    }

    stats.push({
      institution_id: institution.id,
      name_zh: institution.name_zh,
      total: data?.length ?? 0,
      by_status: byStatus,
    });
  }

  return {
    arguments: { ...(searchName ? { institution_name: searchName } : {}), ...(args.all ? { all: true } : {}) },
    result: stats,
  };
}

async function sendReminderEmail(supabase: ReturnType<typeof createClient>, args: SendReminderEmailArgs) {
  const contactName = typeof args.contact_name === 'string' ? args.contact_name.trim() : '';
  const reminderType = args.reminder_type;

  if (!contactName || !reminderType) {
    throw new Error('contact_name and reminder_type are required');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .ilike('contact_name', `%${contactName}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    return {
      arguments: { contact_name: contactName, reminder_type: reminderType },
      result: { sent: false, to: contactName, type: reminderType, message: 'No matching booking found' },
    };
  }

  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    event: 'mock_reminder_email',
    simulated: true,
    to: contactName,
    type: reminderType,
    booking_id: data[0].id,
    timestamp,
  }));

  return {
    arguments: { contact_name: contactName, reminder_type: reminderType },
    result: {
      sent: true,
      simulated: true,
      to: contactName,
      type: reminderType,
      timestamp,
      booking: data[0],
      message: 'Demo only: reminder email was simulated and no email was actually sent.',
    },
  };
}

async function executeTool(
  supabase: ReturnType<typeof createClient>,
  toolCall: ToolCall,
): Promise<ToolResult> {
  const args = parseToolArguments(toolCall.function.arguments);
  const base = {
    id: toolCall.id,
    name: toolCall.function.name,
  };

  try {
    if (toolCall.function.name === 'query_bookings') {
      return { ...base, ...await queryBookings(supabase, args as QueryBookingsArgs) };
    }

    if (toolCall.function.name === 'update_booking_status') {
      return { ...base, ...await updateBookingStatus(supabase, args as UpdateBookingStatusArgs) };
    }

    if (toolCall.function.name === 'get_institution_stats') {
      return { ...base, ...await getInstitutionStats(supabase, args as GetInstitutionStatsArgs) };
    }

    if (toolCall.function.name === 'send_reminder_email') {
      return { ...base, ...await sendReminderEmail(supabase, args as SendReminderEmailArgs) };
    }

    throw new Error(`Unsupported tool: ${toolCall.function.name}`);
  } catch (error) {
    return {
      ...base,
      arguments: args,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');

  if (!deepSeekApiKey) {
    return jsonResponse({ error: 'DEEPSEEK_API_KEY is missing' }, 500);
  }

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: 'Supabase credentials are missing' }, 500);
  }

  let body: AgentRequest;
  try {
    body = await req.json();
  } catch (_error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return jsonResponse({ error: 'message is required' }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: [
        '你是 WellChina 的数字协调员助手。',
        '用户会用中文或英文要求你查询预约、更新预约状态、查看机构统计或发送提醒。',
        '只要涉及预约数据，就优先调用工具，不要凭空回答。',
        '如果用户提到具体机构名称，或询问某机构的预约情况/统计/状态分布，必须调用 get_institution_stats，不要用 query_bookings 替代。',
        'query_bookings 只用于按状态或数量查询单条/多条预约记录。',
        '最终回复必须使用自然、简洁的中文。',
        '状态中文含义：待审核=pending_review，协调员处理中=coordinator_reviewing，已确认=confirmed，进行中=in_progress，已完成=completed，已取消=cancelled。',
        '机构名称包括：北京协和医院、三亚国际中医康养中心、上海仁济医院国际部、博鳌超级医院、成都天府中医养生园。',
        '如果用户要求发送提醒邮件，并且给出了联系人姓名，请直接调用 send_reminder_email。',
        'send_reminder_email 是演示用模拟工具，最终回复必须明确说明没有真实发送邮件。',
        '如果 update_booking_status 返回 ambiguous=true，请让用户补充具体 booking ID，不要假装已更新。',
      ].join(' '),
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    const executedToolCalls: ToolResult[] = [];
    let finalMessage: DeepSeekMessage | undefined;

    for (let round = 0; round < 4; round += 1) {
      const deepSeekRound = await callDeepSeek(deepSeekApiKey, messages, true);
      const assistantMessage = deepSeekRound.choices?.[0]?.message;
      const toolCalls = assistantMessage?.tool_calls ?? [];

      if (!assistantMessage) {
        break;
      }

      messages.push(assistantMessage);

      if (toolCalls.length === 0) {
        finalMessage = assistantMessage;
        break;
      }

      for (const toolCall of toolCalls) {
        const executedToolCall = await executeTool(supabase, toolCall);
        executedToolCalls.push(executedToolCall);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(executedToolCall.error
            ? { error: executedToolCall.error }
            : executedToolCall.result),
        });
      }
    }

    if (!finalMessage) {
      const summaryRound = await callDeepSeek(deepSeekApiKey, messages, false);
      finalMessage = summaryRound.choices?.[0]?.message;
    }

    return jsonResponse({
      reply: finalMessage?.content ?? '',
      tool_calls: executedToolCalls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('agent-coordinator error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
