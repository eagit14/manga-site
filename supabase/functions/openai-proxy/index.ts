import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API = 'https://api.openai.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENDPOINTS: Record<string, string> = {
  'chat':            `${OPENAI_API}/v1/chat/completions`,
  'image-generate':  `${OPENAI_API}/v1/images/generations`,
  'image-edit':      `${OPENAI_API}/v1/images/edits`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Require Supabase auth so only logged-in users can consume the API key
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY secret not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const url      = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint') ?? '';
  const openaiUrl = ENDPOINTS[endpoint];
  if (!openaiUrl) {
    return new Response(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Forward body and Content-Type as-is (handles both JSON and multipart/form-data)
    const contentType = req.headers.get('Content-Type') ?? '';
    const body = await req.arrayBuffer();

    const openaiRes = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body,
    });

    const resBody = await openaiRes.arrayBuffer();
    return new Response(resBody, {
      status: openaiRes.status,
      headers: {
        ...CORS,
        'Content-Type': openaiRes.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
