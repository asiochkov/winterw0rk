import paths from '../assets/icons.v6.json';

/**
 * The prototype's own icon set, lifted from `Winterwork v6.dc.html` unchanged.
 * Every icon is one `<path>` on a 24×24 grid, stroked rather than filled, so a
 * single component covers all fifty. Substituting another icon library here
 * would change the drawing, which is the one thing this must not do.
 */
export type IconName = keyof typeof paths;

export function V6Icon({
  name,
  size = 25,
  stroke = 'currentColor',
  strokeWidth = 1.25,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
