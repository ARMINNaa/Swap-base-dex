// Netlify Function — proxies indicative-price requests to the 0x API so
// the API key stays server-side and never reaches the browser.
//
// The client calls /api/price?sellToken=...&buyToken=...&sellAmount=...&taker=...
// (redirected to this function — see netlify.toml) and this forwards it to
// https://api.0x.org/swap/allowance-holder/price with the secret key attached.
//
// Set ZEROEX_API_KEY (no VITE_ prefix!) in Netlify's Site settings →
// Environment variables — that keeps it out of the client bundle entirely.

const BASE_CHAIN_ID = 8453;
const ALLOWED_PARAMS = ['sellToken', 'buyToken', 'sellAmount', 'taker'];

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ZEROEX_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is missing ZEROEX_API_KEY' }) };
  }

  const query = event.queryStringParameters || {};
  const params = new URLSearchParams({ chainId: String(BASE_CHAIN_ID) });
  for (const key of ALLOWED_PARAMS) {
    if (query[key]) params.set(key, query[key]);
  }

  if (!params.get('sellToken') || !params.get('buyToken') || !params.get('sellAmount')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'sellToken, buyToken, and sellAmount are required' }),
    };
  }

  try {
    const upstream = await fetch(`https://api.0x.org/swap/allowance-holder/price?${params}`, {
      headers: {
        '0x-api-key': apiKey,
        '0x-version': 'v2',
      },
    });

    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Upstream request to 0x failed', detail: err.message }),
    };
  }
};
