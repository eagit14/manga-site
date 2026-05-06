import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API = 'https://api.openai.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Require Supabase auth
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
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY secret is not configured in this Edge Function' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const url      = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint') ?? '';

  try {
    let openaiRes: Response;

    if (endpoint === 'chat') {
      const body = await req.json();
      openaiRes = await fetch(`${OPENAI_API}/v1/chat/completions`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

    } else if (endpoint === 'image-generate') {
      const body = await req.json();
      openaiRes = await fetch(`${OPENAI_API}/v1/images/generations`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

    } else if (endpoint === 'image-edit') {
      // Parse the incoming multipart FormData and rebuild it for OpenAI.
      // Forwarding the raw body risks boundary corruption through the Supabase gateway.
      const incoming = await req.formData();
      const outgoing = new FormData();
      for (const [key, value] of incoming.entries()) {
        outgoing.append(key, value);
      }
      openaiRes = await fetch(`${OPENAI_API}/v1/images/edits`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${openaiKey}` }, // let Deno set Content-Type + boundary
        body:    outgoing,
      });

    } else {
      return new Response(JSON.stringify({ error: `Unknown endpoint: "${endpoint}"` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Surface the full OpenAI response (including error bodies) to the client
    const resBody = await openaiRes.arrayBuffer();
    return new Response(resBody, {
      status: openaiRes.status,
      headers: {
        ...CORS,
        'Content-Type': openaiRes.headers.get('Content-Type') ?? 'application/json',
      },
    });

  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.error('[openai-proxy] error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
