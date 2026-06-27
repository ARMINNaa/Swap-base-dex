import { useEffect, useRef, useState } from 'react';
import { fetchPrice } from '../lib/zeroEx';

/**
 * Debounces price lookups against the 0x API as the user types an amount.
 * Returns { price, isLoading, error }. `price` is the raw 0x API response
 * (or null) — includes route.fills, buyAmount, estimatedPriceImpact, issues.
 */
export function useSwapPrice({ sellToken, buyToken, sellAmountWei, taker, debounceMs = 450 }) {
  const [price, setPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setError(null);

    const noAmount = !sellAmountWei || sellAmountWei === '0';
    if (noAmount || sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      setPrice(null);
      setIsLoading(false);
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const result = await fetchPrice({
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount: sellAmountWei,
          taker,
        });
        // Ignore stale responses if a newer request has since been fired.
        if (requestIdRef.current === thisRequestId) {
          setPrice(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (requestIdRef.current === thisRequestId) {
          setError(err.message || 'Failed to fetch price');
          setPrice(null);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [sellToken.address, buyToken.address, sellAmountWei, taker, debounceMs]);

  return { price, isLoading, error };
}
