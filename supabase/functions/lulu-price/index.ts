import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const LULU_API = 'https://api.lulu.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getLuluToken(): Promise<string> {
  const clientId     = Deno.env.get('LULU_CLIENT_ID');
  const clientSecret = Deno.env.get('LULU_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('LULU_CLIENT_ID / LULU_CLIENT_SECRET secrets not set');

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(
    `${LULU_API}/auth/realms/glasstree/protocol/openid-connect/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body },
  );
  if (!res.ok) throw new Error(`Lulu auth failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { pageCount, shippingAddress, podPackage, shippingLevel } = await req.json();

    const token = await getLuluToken();

    const luluRes = await fetch(`${LULU_API}/print-jobs/v1/costs/`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_items: [{ page_count: pageCount, pod_package_id: podPackage, quantity: 1 }],
        shipping_address: shippingAddress,
        shipping_level:   shippingLevel ?? 'GROUND',
      }),
    });

    const payload = await luluRes.json();
    if (!luluRes.ok) throw new Error(`Lulu costs error (${luluRes.status}): ${JSON.stringify(payload)}`);

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
