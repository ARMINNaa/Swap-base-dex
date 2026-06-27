import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

// Get a free WalletConnect project ID at https://cloud.walletconnect.com
// Required for the "scan to connect" mobile flow in RainbowKit.
const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'Base Swap',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [base],
  ssr: false,
});
