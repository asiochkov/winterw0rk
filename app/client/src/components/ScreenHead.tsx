import './ScreenHead.css';

/**
 * The header v6 puts on its list screens: a dotted accent chip over a 40px
 * title. Progress and Habits both use it, so it lives here rather than being
 * written twice with two sets of numbers.
 */
export function ScreenHead({ chip, title }: { chip: string; title: string }) {
  return (
    <div className="sh">
      <div className="sh-chip">
        <span className="sh-chip-dot" aria-hidden="true" />
        {chip}
      </div>
      <h1 className="sh-title">{title}</h1>
    </div>
  );
}

/**
 * v6's two-way segmented control: a pill track holding equal buttons, the
 * active one filled with the text colour.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (key: T) => void;
}) {
  return (
    <div className="sh-seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          className={`sh-seg-btn ${value === o.key ? 'is-on' : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
