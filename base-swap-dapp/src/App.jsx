import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, ConnectButton } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import SwapCard from './components/SwapCard';
import './styles/app.css';

const queryClient = new QueryClient();

const baseSwapTheme = darkTheme({
  accentColor: '#0052FF',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'medium',
  fontStack: 'system',
});

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={baseSwapTheme}>
          <div className="page">
            <header className="header">
              <div className="brand">
                <span className="brand-mark" aria-hidden="true" />
                <span className="brand-name">Base Swap</span>
              </div>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </header>

            <main className="page-main">
              <SwapCard />
            </main>

            <footer className="footer">
              <span>Routes priced and filled via 0x Swap API</span>
              <span className="dot">·</span>
              <a href="https://base.org" target="_blank" rel="noreferrer">
                Built on Base
              </a>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
