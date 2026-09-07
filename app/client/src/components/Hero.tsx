import type { ReactNode } from 'react';
import { BackButton } from './BackButton';
import './Hero.css';

/**
 * The full-bleed detail hero, once.
 *
 * Four screens opened with a hero built four ways: `.q-hero` (378px, wash at
 * 78%/6%), `.hd-hero` (300px, 80%/10% — the same code copied and nudged by
 * eye), `.pr-hero` (a rounded card, a different grammar altogether) and
 * `.sum-head` (no hero treatment at all, just padding). Going Quit → back →
 * Progress → back → Session summary in half a minute showed three visual
 * grammars in a row.
 *
 * This is the full-bleed one. The height and the wash origin stay props
 * because they are the prototype's own measurements per screen and rounding
 * them together would change what the screens look like; everything else —
 * the gradient recipe, the padding, the back control — is shared.
 *
 * `.card-hero`, in progress.css, is the deliberate second pattern: an inline
 * card rather than full bleed. Two named patterns, not four ad-hoc blocks.
 */
export function FullBleedHero({
  height,
  washX = '78%',
  washY = '6%',
  onBack,
  children,
}: {
  height: number;
  washX?: string;
  washY?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="ww-hero"
      style={
        {
          '--hero-h': `${height}px`,
          '--hero-wash-x': washX,
          '--hero-wash-y': washY,
        } as React.CSSProperties
      }
    >
      <div className="ww-hero-wash" />
      {onBack && <BackButton onClick={onBack} variant="overlay" />}
      <div className="ww-hero-inner">{children}</div>
    </div>
  );
}

/**
 * The dotted accent chip. There were four byte-identical copies of this —
 * `.sh-chip`, `.q-hero-chip`, `.pr-chip`, `.sum-chip` — same gap, same
 * 8px 14px 8px 10px padding, same inset highlight.
 */
export function HeroChip({ children }: { children: ReactNode }) {
  return (
    <div className="ww-chip">
      <span className="ww-chip-dot" aria-hidden="true" />
      {children}
    </div>
  );
}
