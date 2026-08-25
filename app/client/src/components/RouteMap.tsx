interface Point {
  lat: number;
  lon: number;
}

/**
 * Draws the recorded track as an equirectangular projection scaled to the box.
 * Longitude is compressed by cos(latitude) so the shape isn't stretched east-west.
 */
export function RouteMap({ points, height = 180 }: { points: Point[]; height?: number }) {
  if (points.length < 2) return null;

  const midLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lonScale = Math.cos((midLat * Math.PI) / 180);

  const xs = points.map((p) => p.lon * lonScale);
  const ys = points.map((p) => -p.lat);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const pad = 0.08;
  const span = Math.max(spanX, spanY) * (1 + pad * 2);

  // Centre the smaller axis so the route keeps its true proportions.
  const offsetX = minX - (span - spanX) / 2;
  const offsetY = minY - (span - spanY) / 2;

  const coords = points.map((_, i) => ({
    x: ((xs[i] - offsetX) / span) * 100,
    y: ((ys[i] - offsetY) / span) * 100,
  }));

  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  const first = coords[0];
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height, background: 'var(--sf1)', border: 'var(--edge)', borderRadius: 'var(--r-lg)' }}
      role="img"
      aria-label="Recorded route"
    >
      <path d={d} fill="none" stroke="var(--ac)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={first.x} cy={first.y} r="2" fill="var(--ok)" />
      <circle cx={last.x} cy={last.y} r="2" fill="var(--am)" />
    </svg>
  );
}
