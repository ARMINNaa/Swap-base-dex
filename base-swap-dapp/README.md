# Base Swap

A minimal token-swap dApp for [Base](https://base.org), with wallet connection via
[RainbowKit](https://rainbowkit.com) and best-price routing across DEXs via the
[0x Swap API](https://0x.org/docs/api).

This isn't a custom DEX or a smart contract you deploy — it's a frontend that asks the
0x aggregator for the best route across many liquidity sources (Uniswap, Aerodrome, etc.)
and lets the user execute that route directly from their own wallet, by sending the
transaction straight to 0x's own audited contracts. **There is no contract of ours in
the middle** — we never hold funds, never act as a counterparty, and can't be "hacked" in
a way that puts user funds at risk, since the app only ever (a) asks 0x for a quote and
(b) asks the user's own wallet to sign it.

## Features

- Connect wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.) via RainbowKit
- Live price preview as you type, debounced against the 0x API
- Visual route breadcrumb showing which DEX(s) your swap fills against, and in what proportion
- Handles ERC-20 approvals automatically when needed
- Works with ETH, WETH, USDC, cbETH, and DAI on Base out of the box (easy to extend)
- 0x API key never reaches the browser — it's read server-side inside two small
  Netlify Functions (`/api/price`, `/api/quote`) that proxy the request

## Run it locally

The app depends on the `/api/price` and `/api/quote` functions, so plain `vite dev`
won't have a backend to call. Use the Netlify CLI instead — it runs the frontend *and*
the functions together, exactly like production:

```bash
npm install -g netlify-cli   # one-time
npm install
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `ZEROEX_API_KEY` | [dashboard.0x.org/apps](https://dashboard.0x.org/apps) (free) |
| `VITE_WALLETCONNECT_PROJECT_ID` | [cloud.walletconnect.com](https://cloud.walletconnect.com) (free) |

Then run:

```bash
netlify dev
```

It'll print a `localhost` URL — open that in your browser.

## Deploy a public link (Netlify)

1. Push this folder to a GitHub repo.
2. Go to [app.netlify.com/start](https://app.netlify.com/start) and import that repo.
   Netlify reads `netlify.toml` automatically — build command and functions folder
   are already configured, no manual setup needed.
3. Before the first deploy (or right after, then redeploy), go to
   **Site configuration → Environment variables** and add:
   - `ZEROEX_API_KEY` → your 0x key
   - `VITE_WALLETCONNECT_PROJECT_ID` → your WalletConnect project ID
4. Deploy. You'll get a public `https://your-site-name.netlify.app` link.

Netlify does **not** read your local `.env` file in production — environment variables
must be set in the dashboard (or via `netlify env:set`).

> **Signing up:** if Netlify's phone-verification step won't accept your number, try
> signing up with **"Continue with GitHub"** instead of email — this usually skips phone
> verification entirely, since GitHub has already verified your identity.

## Why the serverless proxy matters

Without it, a `VITE_ZEROEX_API_KEY` would get bundled straight into the JavaScript shipped
to every visitor's browser — anyone could open devtools, copy it, and burn through your
free-tier request quota (the key can't move funds on its own, but it can still be abused).
Routing through `/api/price` and `/api/quote` keeps the key server-side, where only your
own Netlify function can read it.

## Project structure

```
netlify.toml                  build config + /api → functions redirect
netlify/functions/
  price.js                     serverless proxy → 0x /swap/allowance-holder/price
  quote.js                       serverless proxy → 0x /swap/allowance-holder/quote
src/
  wagmi.js                      wagmi + RainbowKit config (Base mainnet only)
  lib/
    zeroEx.js                     calls our own /api/price and /api/quote
    tokens.js                       curated Base token list
  hooks/
    useSwapPrice.js                  debounced price-fetching hook
  components/
    SwapCard.jsx                       main swap UI + approval/execution logic
    TokenSelect.jsx                     token picker dropdown
    RouteBreadcrumb.jsx                  DEX routing visualization
  styles/app.css                      all styles
```

## Disclaimer

This is a demo/portfolio project, not audited, and not financial advice. You are
responsible for any transactions you sign with your own wallet. Always check the amounts
and destination address in your wallet's confirmation screen before approving a
transaction.
