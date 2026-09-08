import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { V6Icon, type IconName } from './V6Icon';
import { BackButton } from './BackButton';
import './Shell.css';

interface ScreenBase {
  title?: string;
  kicker?: string;
  children: ReactNode;
  /** Drop the main padding so a screen can lay itself out edge to edge, the
   *  way v7's Today does with its full-bleed hero. */
  bleed?: boolean;
  /** Optional secondary content shown as a right-hand rail on desktop only. */
  rail?: ReactNode;
}

/**
 * Hiding the navigation obliges a screen to say how it is left.
 *
 * Eight screens had `nav={false}` and no way back — including Body, Nutrition
 * and Planner, which are primary tabs, so the bar that brought the user there
 * vanished on arrival and the only exit was the browser's own back gesture,
 * which is not always available in a standalone PWA. Splitting the props into
 * a union means TypeScript now refuses a screen that hides the navigation
 * without providing an exit; `back="self"` is the deliberate opt-out for
 * screens that draw their own, like the active session and a running focus
 * block.
 */
type ScreenProps = ScreenBase &
  ({ nav?: true; back?: never } | { nav: false; back: (() => void) | 'self' });

export function Screen({ title, kicker, children, nav = true, rail, bleed = false, back }: ScreenProps) {
  return (
    <div className="app-shell">
      {nav && <SidebarNav />}
      <div className={`app-body ${nav ? 'app-body-with-sidebar' : ''}`}>
        <div className={`app-content ${rail ? 'app-content-with-rail' : ''}`}>
          <main className={`app-main ${nav ? 'app-main-tabbed' : ''} ${bleed ? 'app-main-bleed' : ''}`}>
            {typeof back === 'function' && <BackButton onClick={back} />}
            {(title || kicker) && (
              <header className="page-head">
                {kicker && <p className="page-kicker">{kicker}</p>}
                {title && <h1 className="page-title">{title}</h1>}
              </header>
            )}
            {children}
          </main>
          {rail && <aside className="app-rail">{rail}</aside>}
        </div>
      </div>
      {nav && <BottomNav />}
    </div>
  );
}

/**
 * One set of tabs.
 *
 * There were two, swapped by a "world" switch: discipline showed Today,
 * Planner, Habits, Focus, Progress; fitness showed Today, Training, Body,
 * Nutrition, Progress. Only two tabs were common to both, which made this two
 * applications sharing a login — and it contradicted the product's own claim
 * that discipline and fitness are parts of one system, because you could not
 * see one while standing in the other.
 *
 * Habits and quitting already share a screen behind a segmented control, and
 * that screen is the Actions tab. Everything the fitness set carried that is
 * not training — body, nutrition, steps, street — is reached from More, where
 * planner and programs already were.
 */
/** The quick-action button only appears where there is an obvious next thing
 *  to create: a habit from Today, an exercise from Training. */
const FAB_ROUTES = ['/today', '/training'];

const NAV_TABS: { to: string; key: string; icon: IconName; label: string }[] = [
  { to: '/today', key: 'today', icon: 'today', label: 'navToday' },
  { to: '/habits', key: 'actions', icon: 'habits', label: 'navActions' },
  { to: '/training', key: 'train', icon: 'train', label: 'navTrain' },
  { to: '/focus', key: 'focus', icon: 'focus', label: 'navFocus' },
  { to: '/progress', key: 'progress', icon: 'progress', label: 'navProgress' },
];

function useTabs() {
  return NAV_TABS;
}

/**
 * The floating bar from v6: a world switch, a more button and an optional
 * quick action on the top row, five icon-only tabs below with a pill that
 * slides to whichever is active.
 */
function BottomNav() {
  const { t } = useLanguage();
  const tabs = useTabs();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeIndex = tabs.findIndex((tab) => pathname === tab.to || pathname.startsWith(tab.to + '/'));
  const showFab = FAB_ROUTES.includes(pathname);
  const n = tabs.length;

  return (
    <div className="ww-nav-wrap">
      <div className="ww-nav">
        <div className="ww-nav-top">
          <button
            type="button"
            className="ww-nav-round"
            aria-label={t('navMore')}
            onClick={() => navigate('/more')}
          >
            {/* v7 draws the more glyph at 2, heavier than every other nav icon. */}
            <V6Icon name="more" size={19} stroke="var(--mut)" strokeWidth={2} />
          </button>

          {showFab && (
            <button
              type="button"
              className="ww-nav-round ww-nav-fab"
              aria-label={t('navQuickAction')}
              onClick={() => navigate(pathname === '/training' ? '/training/library' : '/habits/new')}
            >
              <V6Icon name="plus" size={19} stroke="var(--ac)" strokeWidth={1.35} />
            </button>
          )}
        </div>

        <div className="ww-nav-tabs">
          <div
            className="ww-nav-pill"
            style={{
              left: `calc(${(Math.max(activeIndex, 0) * 100) / n}% + ${(Math.max(activeIndex, 0) * 4) / n}px)`,
              width: `calc(${100 / n}% - ${((n - 1) * 4) / n}px)`,
              opacity: activeIndex > -1 ? 1 : 0,
            }}
          />
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              className="ww-nav-tab"
              aria-label={t(tab.label as never)}
              title={t(tab.label as never)}
              aria-current={i === activeIndex ? 'page' : undefined}
              onClick={() => navigate(tab.to)}
            >
              <V6Icon
                name={tab.icon}
                size={25}
                stroke={i === activeIndex ? 'var(--ac2)' : 'var(--mut)'}
                style={{ transform: i === activeIndex ? 'scale(1.08)' : 'none' }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * v7's rail, which replaces the bottom bar from 760px up. It has two shapes:
 * a 196px icon-only column on tablet, centred and wordless, and a 232px column
 * with labels on desktop. Transcribed from v7's isRailNav block.
 */
function SidebarNav() {
  const { t } = useLanguage();
  const tabs = useTabs();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showFab = FAB_ROUTES.includes(pathname);

  return (
    <nav className="side-nav">
      {/* v7 sets the rail's logo as type, shortened to WW on tablet. */}
      <div className="side-nav-logo" aria-label="Winterwork">
        <span className="side-nav-wide" aria-hidden="true">
          WINTERWORK
        </span>
        <span className="side-nav-narrow" aria-hidden="true">
          WW
        </span>
      </div>

      <div className="side-nav-sections side-nav-wide">{t('navSections')}</div>

      <div className="side-nav-items">
        {tabs.map((tab) => {
          const on = pathname === tab.to || pathname.startsWith(tab.to + '/');
          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              title={t(tab.label as never)}
              className={`side-nav-item ${on ? 'is-on' : ''}`}
            >
              <V6Icon
                name={tab.icon}
                size={20}
                strokeWidth={1.35}
                stroke={on ? 'var(--ac2)' : 'var(--mut)'}
              />
              <span className="side-nav-label side-nav-wide">{t(tab.label as never)}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="side-nav-spacer" />

      {showFab && (
        <button
          type="button"
          className="side-nav-fab"
          onClick={() => navigate(pathname === '/training' ? '/training/library' : '/habits/new')}
        >
          <V6Icon name="plus" size={20} stroke="var(--ac)" strokeWidth={1.35} />
          <span className="side-nav-label side-nav-wide">{t('navQuickAction')}</span>
        </button>
      )}

      <button type="button" className="side-nav-more" onClick={() => navigate('/more')}>
        <V6Icon name="more" size={20} stroke="var(--mut)" strokeWidth={2} />
        <span className="side-nav-label side-nav-more-label side-nav-wide">{t('navMore')}</span>
        <span className="side-nav-key side-nav-wide">⌘K</span>
      </button>
    </nav>
  );
}
