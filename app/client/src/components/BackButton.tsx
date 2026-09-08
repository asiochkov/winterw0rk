import { useLanguage } from '../context/LanguageContext';
import './BackButton.css';

/**
 * The one way back, drawn one way.
 *
 * There were four families of this control: `.auth-back` (a text link on the
 * auth screens), `.hd-back` (a 42×44 square on the habit hero), `.ss-exit` (a
 * 46×46 square on the active session), and `.q-back`, plus the plain
 * `.screen-back` the shell had grown. Four hitboxes, four positions, four
 * pieces of CSS for one job. This is the only one now.
 *
 * Two placements, one control: `inline` sits in the flow above a screen's
 * heading and carries the word; `overlay` sits on a full-bleed hero, where a
 * label would land on a gradient, and shows the arrow alone with the same
 * 44px target and an accessible name.
 */
export function BackButton({
  onClick,
  variant = 'inline',
}: {
  onClick: () => void;
  variant?: 'inline' | 'overlay';
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      className={`ww-back ww-back-${variant}`}
      onClick={onClick}
      aria-label={t('back')}
    >
      <span className="ww-back-arrow" aria-hidden="true">
        ←
      </span>
      {variant === 'inline' && <span className="ww-back-label">{t('back')}</span>}
    </button>
  );
}
