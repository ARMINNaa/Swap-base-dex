// A small, curated list of well-known tokens on Base mainnet.
// Addresses verified against official sources (Base docs / Circle / token issuers).
// Extend this list as needed — the 0x API will price anything with sufficient
// liquidity, this list just drives the picker UI.

export const NATIVE_ETH_PSEUDO_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const BASE_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ether',
    address: NATIVE_ETH_PSEUDO_ADDRESS,
    decimals: 18,
    logo: '🔷',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    logo: '🔶',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    logo: '💵',
  },
  {
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    decimals: 18,
    logo: '🔵',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
    logo: '🟡',
  },
];

export function getToken(address) {
  return BASE_TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
}
