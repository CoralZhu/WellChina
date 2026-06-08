const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CarePreparationInput = {
  symptomCategory: string;
  symptomDescription?: string;
  city: string;
  travelWindow: string;
  hasMedicalReports: boolean;
  preferredLanguage: 'zh' | 'en' | 'ru';
  selectedInstitutionId?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function logCaughtError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`Error caught: ${message}`);

  if (error instanceof Error && error.stack) {
    console.log(error.stack);
  }
}

function buildPrompt(input: CarePreparationInput) {
  return `You are helping an international older adult prepare for 
healthcare in China. 

Rules:
- Do NOT diagnose any condition
- Do NOT prescribe or recommend medication
- Do NOT claim any treatment is appropriate
- Only help with: preparation checklist, questions to ask 
  the doctor, travel logistics, and situation summary
- Respond in the same language as preferredLanguage field:
  zh = Chinese, ru = Russian, en = English
- Return JSON only, no explanation text

User input:
${JSON.stringify(input, null, 2)}

Return exactly this JSON shape:
{
  "situationSummary": "2-3 sentence summary of the user's 
    situation and travel intent",
  "institutionSummary": "1-2 sentences for the institution 
    to understand the patient's needs",
  "preparationChecklist": ["item1", "item2", ...],
  "questionsForDoctor": ["question1", "question2", ...],
  "travelChecklist": ["item1", "item2", ...],
  "riskDisclaimer": "one sentence safety disclaimer",
  "recommendedNextStep": "one sentence next action"
}`;
}

function extractTextFromDeepSeekResponse(response: unknown) {
  const choices = (response as { choices?: Array<{ message?: { content?: string } }> }).choices;
  return choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  console.log('Received request');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  console.log(`API key present: ${!!apiKey}`);

  if (!apiKey) {
    return jsonResponse({ error: 'DEEPSEEK_API_KEY is missing' }, 500);
  }

  let input: CarePreparationInput;
  try {
    input = await req.json();
  } catch (error) {
    logCaughtError(error);
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  console.log('Calling DeepSeek API');

  const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  console.log(`DeepSeek response status: ${deepseekResponse.status}`);

  if (!deepseekResponse.ok) {
    const errorText = await deepseekResponse.clone().text();
    console.log(`DeepSeek error: ${errorText}`);
  }

  const deepseekPayload = await deepseekResponse.json();

  if (!deepseekResponse.ok) {
    return jsonResponse({ error: 'DeepSeek API request failed', details: deepseekPayload }, 500);
  }

  const rawText = extractTextFromDeepSeekResponse(deepseekPayload);

  try {
    const parsed = JSON.parse(rawText);
    console.log('Successfully parsed JSON');
    return jsonResponse(parsed);
  } catch (error) {
    logCaughtError(error);
    return jsonResponse({ error: 'DeepSeek returned non-JSON text', rawText }, 500);
  }
});
