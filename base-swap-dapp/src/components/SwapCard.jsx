import { useMemo, useState } from 'react';
import { useAccount, useBalance, useWriteContract, useSendTransaction, usePublicClient } from 'wagmi';
import { erc20Abi, parseUnits, formatUnits, maxUint256 } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { BASE_TOKENS, NATIVE_ETH_PSEUDO_ADDRESS } from '../lib/tokens';
import { fetchQuote } from '../lib/zeroEx';
import { useSwapPrice } from '../hooks/useSwapPrice';
import TokenSelect from './TokenSelect';
import RouteBreadcrumb from './RouteBreadcrumb';

const STATUS = {
  IDLE: 'idle',
  NEEDS_APPROVAL: 'needs_approval',
  APPROVING: 'approving',
  READY: 'ready',
  QUOTING: 'quoting',
  SWAPPING: 'swapping',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function SwapCard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [sellToken, setSellToken] = useState(BASE_TOKENS[0]); // ETH
  const [buyToken, setBuyToken] = useState(BASE_TOKENS[2]); // USDC
  const [sellAmount, setSellAmount] = useState('');
  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const isNativeSell = sellToken.address.toLowerCase() === NATIVE_ETH_PSEUDO_ADDRESS.toLowerCase();

  const { data: sellBalance } = useBalance({
    address,
    token: isNativeSell ? undefined : sellToken.address,
  });

  const sellAmountWei = useMemo(() => {
    if (!sellAmount || Number.isNaN(Number(sellAmount))) return '';
    try {
      return parseUnits(sellAmount, sellToken.decimals).toString();
    } catch {
      return '';
    }
  }, [sellAmount, sellToken.decimals]);

  const { price, isLoading: isPricing, error: priceError } = useSwapPrice({
    sellToken,
    buyToken,
    sellAmountWei,
    taker: address,
  });

  const buyAmountDisplay = useMemo(() => {
    if (!price?.buyAmount) return '';
    return formatUnits(BigInt(price.buyAmount), buyToken.decimals);
  }, [price, buyToken.decimals]);

  const needsAllowance = !isNativeSell && price?.issues?.allowance?.actual === '0';
  const spender = price?.issues?.allowance?.spender;
  const insufficientBalance =
    price?.issues?.balance && BigInt(price.issues.balance.actual) < BigInt(price.issues.balance.expected);

  function handleSwapDirection() {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount('');
    setStatus(STATUS.IDLE);
  }

  async function handleApprove() {
    if (!spender) return;
    setStatus(STATUS.APPROVING);
    setErrorMessage('');
    try {
      const hash = await writeContractAsync({
        address: sellToken.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, maxUint256],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(STATUS.READY);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMessage(err.shortMessage || err.message || 'Approval failed');
    }
  }

  async function handleSwap() {
    if (!address || !sellAmountWei) return;
    setStatus(STATUS.QUOTING);
    setErrorMessage('');
    try {
      const quote = await fetchQuote({
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: sellAmountWei,
        taker: address,
      });

      if (quote.issues?.allowance && quote.issues.allowance.actual === '0') {
        setStatus(STATUS.NEEDS_APPROVAL);
        return;
      }

      setStatus(STATUS.SWAPPING);
      const hash = await sendTransactionAsync({
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: quote.transaction.value ? BigInt(quote.transaction.value) : undefined,
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMessage(err.shortMessage || err.message || 'Swap failed');
    }
  }

  const primaryAction = () => {
    if (!isConnected) return null; // ConnectButton renders instead
    if (!sellAmount || Number(sellAmount) <= 0) {
      return (
        <button className="btn btn-primary" disabled>
          Enter an amount
        </button>
      );
    }
    if (insufficientBalance) {
      return (
        <button className="btn btn-primary" disabled>
          Insufficient {sellToken.symbol} balance
        </button>
      );
    }
    if (needsAllowance) {
      return (
        <button
          className="btn btn-primary"
          onClick={handleApprove}
          disabled={status === STATUS.APPROVING}
        >
          {status === STATUS.APPROVING ? 'Approving…' : `Approve ${sellToken.symbol}`}
        </button>
      );
    }
    return (
      <button
        className="btn btn-primary"
        onClick={handleSwap}
        disabled={!price || status === STATUS.QUOTING || status === STATUS.SWAPPING}
      >
        {status === STATUS.QUOTING && 'Fetching best route…'}
        {status === STATUS.SWAPPING && 'Confirm in wallet…'}
        {status !== STATUS.QUOTING && status !== STATUS.SWAPPING && 'Swap'}
      </button>
    );
  };

  return (
    <div className="swap-card">
      <div className="swap-card-head">
        <h1>Swap</h1>
        <span className="chain-pill">
          <span className="chain-dot" /> Base
        </span>
      </div>

      <div className="swap-field">
        <div className="swap-field-row">
          <input
            className="amount-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={sellAmount}
            onChange={(e) => {
              const v = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(v)) {
                setSellAmount(v);
                setStatus(STATUS.IDLE);
              }
            }}
          />
          <TokenSelect value={sellToken} onChange={setSellToken} exclude={buyToken.address} />
        </div>
        <div className="swap-field-meta">
          <span>You pay</span>
          {sellBalance && (
            <button
              className="balance-pill"
              type="button"
              onClick={() => setSellAmount(sellBalance.formatted)}
            >
              Balance: {Number(sellBalance.formatted).toFixed(4)}
            </button>
          )}
        </div>
      </div>

      <button className="swap-direction-btn" type="button" onClick={handleSwapDirection} aria-label="Reverse swap direction">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 6l4-4 4 4M8 2v9M12 10l-4 4-4-4M8 14V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="swap-field">
        <div className="swap-field-row">
          <input
            className="amount-input"
            type="text"
            placeholder="0"
            value={isPricing ? '' : buyAmountDisplay}
            readOnly
          />
          <TokenSelect value={buyToken} onChange={setBuyToken} exclude={sellToken.address} />
        </div>
        <div className="swap-field-meta">
          <span>You receive</span>
          {isPricing && <span className="pricing-indicator">finding best price…</span>}
        </div>
      </div>

      {price?.route?.fills?.length > 0 && (
        <RouteBreadcrumb fills={price.route.fills} sellSymbol={sellToken.symbol} buySymbol={buyToken.symbol} />
      )}

      {price?.estimatedPriceImpact && Number(price.estimatedPriceImpact) > 1 && (
        <div className="impact-warning">
          ⚠ Price impact ~{Number(price.estimatedPriceImpact).toFixed(2)}%
        </div>
      )}

      {priceError && <div className="error-banner">{priceError}</div>}
      {status === STATUS.ERROR && errorMessage && <div className="error-banner">{errorMessage}</div>}

      {status === STATUS.SUCCESS && txHash && (
        <div className="success-banner">
          Swap submitted —{' '}
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
            view on BaseScan
          </a>
        </div>
      )}

      <div className="swap-action">
        {isConnected ? primaryAction() : <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button className="btn btn-primary" onClick={openConnectModal}>
              Connect wallet
            </button>
          )}
        </ConnectButton.Custom>}
      </div>
    </div>
  );
}
