import type { ReportRow } from '../lib/report';

/**
 * The report's rows, drawn the same way wherever they appear — the markup and
 * classes are the ones the block in Progress used, so moving it changed how it
 * is reached, not how it looks.
 */
export function ReportRows({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="pr-report-rows">
      {rows.map((r) => (
        <div className="pr-report-row" key={r.dim}>
          <span className="pr-report-dim">{r.dim}</span>
          <span className="pr-report-nums">
            <span className="pr-report-before">{r.before}</span>
            <span className="pr-report-arrow" aria-hidden="true">
              →
            </span>
            <span className="pr-report-now">{r.now}</span>
          </span>
          <span className={`pr-report-delta ${r.muted ? 'is-muted' : r.up ? 'is-up' : 'is-down'}`}>
            {r.text}
          </span>
          <span className="pr-report-read">{r.read}</span>
        </div>
      ))}
    </div>
  );
}
