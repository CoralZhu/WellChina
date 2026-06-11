import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

const queryBookingsTool = {
  type: 'function',
  function: {
    name: 'query_bookings',
    description: 'Query bookings from the database with optional filters',
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
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function parseToolArguments(rawArguments: string): QueryBookingsArgs {
  if (!rawArguments.trim()) return {};

  try {
    const parsed = JSON.parse(rawArguments) as QueryBookingsArgs;
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

async function callDeepSeek(apiKey: string, messages: DeepSeekMessage[], includeTools: boolean) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 1200,
      messages,
      ...(includeTools ? { tools: [queryBookingsTool] } : {}),
    }),
  });

  const payload = await response.json() as DeepSeekResponse | Record<string, unknown>;

  if (!response.ok) {
    console.log('DeepSeek API error:', JSON.stringify(payload));
    throw new Error('DeepSeek API request failed');
  }

  return payload as DeepSeekResponse;
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
        'You are an AI coordinator for WellChina bookings.',
        'Use query_bookings when the user asks about bookings, counts, statuses, or recent booking records.',
        'Always answer the final user-facing response in natural language Chinese.',
        'Known booking statuses include pending_review, coordinator_reviewing, confirmed, in_progress, completed, and cancelled.',
      ].join(' '),
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    const firstRound = await callDeepSeek(deepSeekApiKey, messages, true);
    const assistantMessage = firstRound.choices?.[0]?.message;
    const toolCalls = assistantMessage?.tool_calls ?? [];
    const executedToolCalls: Array<{
      id: string;
      name: string;
      arguments: QueryBookingsArgs;
      result?: unknown;
      error?: string;
    }> = [];

    if (assistantMessage) {
      messages.push(assistantMessage);
    }

    for (const toolCall of toolCalls) {
      const args = parseToolArguments(toolCall.function.arguments);
      const status = typeof args.status === 'string' && args.status.trim() ? args.status.trim() : undefined;
      const limit = normalizeLimit(args.limit);

      if (toolCall.function.name !== 'query_bookings') {
        const error = `Unsupported tool: ${toolCall.function.name}`;
        executedToolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: args,
          error,
        });
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error }),
        });
        continue;
      }

      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      const result = error ? { error: error.message } : { bookings: data ?? [], count: data?.length ?? 0 };

      executedToolCalls.push({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: { ...(status ? { status } : {}), limit },
        ...(error ? { error: error.message } : { result }),
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    if (toolCalls.length === 0) {
      return jsonResponse({
        reply: assistantMessage?.content ?? '',
        tool_calls: executedToolCalls,
      });
    }

    const secondRound = await callDeepSeek(deepSeekApiKey, messages, false);
    const finalMessage = secondRound.choices?.[0]?.message;

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
