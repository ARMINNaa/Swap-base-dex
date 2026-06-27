import { useState, useRef, useEffect } from 'react';
import { BASE_TOKENS } from '../lib/tokens';

export default function TokenSelect({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="token-select" ref={rootRef}>
      <button
        type="button"
        className="token-select-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="token-logo" aria-hidden="true">
          {value.logo}
        </span>
        <span className="token-symbol">{value.symbol}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <ul className="token-select-menu" role="listbox">
          {BASE_TOKENS.filter((t) => t.address.toLowerCase() !== exclude?.toLowerCase()).map(
            (token) => (
              <li key={token.address}>
                <button
                  type="button"
                  className="token-option"
                  onClick={() => {
                    onChange(token);
                    setOpen(false);
                  }}
                >
                  <span className="token-logo" aria-hidden="true">
                    {token.logo}
                  </span>
                  <span className="token-option-text">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                  </span>
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
