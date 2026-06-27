// Client-side helper that calls OUR OWN serverless proxy routes
// (/api/price and /api/quote — see the /api folder) instead of hitting
// https://api.0x.org directly. This keeps the 0x API key server-side,
// since it's read from process.env.ZEROEX_API_KEY (no VITE_ prefix) inside
// those functions and never gets bundled into client JS.
//
// Locally: run `vercel dev` instead of `vite dev` so these /api routes
// actually exist (plain `vite dev` has no backend to serve them — see
// README for details). On Vercel, they work automatically once deployed.

const BASE_CHAIN_ID = 8453;

function buildQuery({ sellToken, buyToken, sellAmount, taker }) {
  const params = new URLSearchParams({
    chainId: String(BASE_CHAIN_ID),
    sellToken,
    buyToken,
    sellAmount,
    ...(taker ? { taker } : {}),
  });
  return params.toString();
}

/**
 * Get an indicative price (no transaction data, safe to call on every
 * keystroke / amount change). Use this to render the live quote preview.
 */
export async function fetchPrice({ sellToken, buyToken, sellAmount, taker }) {
  const query = buildQuery({ sellToken, buyToken, sellAmount, taker });
  const res = await fetch(`/api/price?${query}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Price request failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Get a firm, executable quote with transaction calldata. Call this only
 * right before the user confirms the swap, since quotes expire quickly.
 */
export async function fetchQuote({ sellToken, buyToken, sellAmount, taker }) {
  const query = buildQuery({ sellToken, buyToken, sellAmount, taker });
  const res = await fetch(`/api/quote?${query}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Quote request failed (${res.status}): ${body}`);
  }

  return res.json();
}
