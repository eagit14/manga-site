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

const DUMMY_ADDR = {
  name: 'Test User', street1: '123 Main St',
  city: 'New York', state_code: 'NY',
  postcode: '10001', country_code: 'US',
  phone_number: '5555550100',
};

// Probe a single package ID — returns {pkg, ok, status, error}
async function probe(token: string, pkg: string) {
  const res = await fetch(`${LULU_API}/print-job-cost-calculations/`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items:       [{ page_count: 20, pod_package_id: pkg, quantity: 1 }],
      shipping_address: DUMMY_ADDR,
      shipping_option:  'MAIL',
    }),
  });
  const body = await res.json();
  return { pkg, ok: res.ok, status: res.status, error: res.ok ? null : JSON.stringify(body) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // GET → probe format hypotheses + also echo back a raw Lulu API test
  if (req.method === 'GET') {
    try {
      const token = await getLuluToken();

      // Build candidates covering multiple format hypotheses:
      // H1: uppercase X, with STD      → 0600X0900.BW.STD.PB.060UW444.GXX  (what we've been trying)
      // H2: lowercase x, with STD      → 0600x0900.BW.STD.PB.060UW444.GXX
      // H3: uppercase X, without STD   → 0600X0900.BW.PB.060UW444.GXX
      // H4: lowercase x, without STD   → 0600x0900.BW.PB.060UW444.GXX
      // H5: different paper codes entirely
      const baseSizes  = ['0600X0900', '0600x0900', '0550X0850', '0550x0850'];
      const paperCodes = ['060UW444', '060CW444', '060BW444', '070CW444'];
      const candidates: string[] = [];

      for (const sz of baseSizes) {
        for (const paper of paperCodes) {
          // with STD
          candidates.push(`${sz}.BW.STD.PB.${paper}.GXX`);
          candidates.push(`${sz}.FC.STD.PB.${paper}.GXX`);
          // without STD
          candidates.push(`${sz}.BW.PB.${paper}.GXX`);
          candidates.push(`${sz}.FC.PB.${paper}.GXX`);
        }
      }

      // Also probe the raw Lulu endpoint to see what it says about a dummy request
      const rawProbe = await fetch(`${LULU_API}/print-job-cost-calculations/`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items:       [{ page_count: 24, pod_package_id: '0600X0900.BW.STD.PB.060UW444.GXX', quantity: 1 }],
          shipping_address: DUMMY_ADDR,
          shipping_option:  'MAIL',
        }),
      });
      const rawBody = await rawProbe.json();

      const results = [];
      for (let i = 0; i < candidates.length; i += 5) {
        const batch = candidates.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(pkg => probe(token, pkg)));
        results.push(...batchResults);
      }

      const valid   = results.filter(r => r.ok);
      const invalid = results.filter(r => !r.ok);

      return new Response(JSON.stringify({
        valid,
        invalid_count: invalid.length,
        raw_probe: { status: rawProbe.status, body: rawBody },
        // Show a sample of invalid errors to see if they vary
        invalid_sample: invalid.slice(0, 3).map(r => ({ pkg: r.pkg, error: r.error })),
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST → cost calculation
  try {
    const { pageCount, shippingAddress, podPackage, shippingOption } = await req.json();

    const token = await getLuluToken();

    const luluRes = await fetch(`${LULU_API}/print-job-cost-calculations/`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_items:       [{ page_count: pageCount, pod_package_id: podPackage, quantity: 1 }],
        shipping_address: shippingAddress,
        shipping_option:  shippingOption ?? 'MAIL',
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
