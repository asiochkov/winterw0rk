import type { ReactNode } from 'react';
import './ContextRail.css';

export interface ContextMetric {
  label: string;
  value: string;
  /** Short delta such as "71%" or "+3"; omitted when there is nothing to compare. */
  delta?: string;
  direction?: 'up' | 'down';
  meaning: string;
}

export interface ContextAction {
  label: string;
  hint?: string;
  onClick: () => void;
}

/**
 * v7's context panel, which fills the right-hand side of a wide screen.
 *
 * Without it the desktop layout reserved 300px and put nothing in it, so a
 * laptop showed a phone column against a band of empty black. Transcribed
 * from v7's <sc-if value="{{ showContext }}"> block.
 */
export function ContextRail({
  kicker,
  title,
  body,
  metrics = [],
  nextLabel,
  actions = [],
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  metrics?: ContextMetric[];
  nextLabel?: string;
  actions?: ContextAction[];
  children?: ReactNode;
}) {
  return (
    <div className="ctx">
      <div className="ctx-kicker">{kicker}</div>
      <h3 className="ctx-title">{title}</h3>
      <p className="ctx-body">{body}</p>

      {metrics.length > 0 && (
        <div className="ctx-metrics">
          {metrics.map((m) => (
            <div className="ctx-metric" key={m.label}>
              <div className="ctx-metric-label">{m.label}</div>
              <div className="ctx-metric-row">
                <span className="ctx-metric-value">{m.value}</span>
                {m.delta && (
                  <span className={`ctx-metric-delta ${m.direction === 'down' ? 'is-down' : 'is-up'}`}>
                    {m.delta}
                  </span>
                )}
              </div>
              <div className="ctx-metric-meaning">{m.meaning}</div>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && nextLabel && <div className="ctx-kicker ctx-next">{nextLabel}</div>}
      {actions.length > 0 && (
        <div className="ctx-actions">
          {actions.map((a) => (
            <button type="button" className="ctx-action" key={a.label} onClick={a.onClick}>
              <span className="ctx-action-label">{a.label}</span>
              {a.hint && <span className="ctx-action-hint">{a.hint}</span>}
            </button>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
