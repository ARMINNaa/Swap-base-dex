// Renders the route.fills array from a 0x price/quote response as a
// small animated breadcrumb, e.g. "Aerodrome 70% → Uniswap V3 30%".
// This is the one place in the UI that visibly proves "aggregation" is
// happening, rather than just showing a number.

export default function RouteBreadcrumb({ fills, sellSymbol, buySymbol }) {
  if (!fills || fills.length === 0) return null;

  // Group by source name in case the same source appears in multiple fills.
  const bySource = new Map();
  for (const fill of fills) {
    const pct = Number(fill.proportionBps || 0) / 100;
    bySource.set(fill.source, (bySource.get(fill.source) || 0) + pct);
  }
  const sources = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="route-breadcrumb" role="status">
      <span className="route-token">{sellSymbol}</span>
      {sources.map(([source, pct]) => (
        <span className="route-hop" key={source}>
          <svg className="route-arrow" width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
            <path d="M0 5h11M8 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="route-source">
            {source}
            {sources.length > 1 ? <span className="route-pct"> {pct.toFixed(0)}%</span> : null}
          </span>
        </span>
      ))}
      <span className="route-hop">
        <svg className="route-arrow" width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
          <path d="M0 5h11M8 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="route-token">{buySymbol}</span>
      </span>
    </div>
  );
}
