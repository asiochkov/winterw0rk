import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorld, type World } from '../context/WorldContext';
import { V6Icon, type IconName } from './V6Icon';
import './Shell.css';

export function Screen({
  title,
  kicker,
  children,
  nav = true,
  rail,
  bleed = false,
}: {
  title?: string;
  kicker?: string;
  children: ReactNode;
  nav?: boolean;
  /** Drop the main padding so a screen can lay itself out edge to edge, the
   *  way v6's Today does with its full-bleed hero. */
  bleed?: boolean;
  /** Optional secondary content shown as a right-hand rail on desktop only. */
  rail?: ReactNode;
}) {
  return (
    <div className="app-shell">
      {nav && <SidebarNav />}
      <div className={`app-body ${nav ? 'app-body-with-sidebar' : ''}`}>
        <div className={`app-content ${rail ? 'app-content-with-rail' : ''}`}>
          <main className={`app-main ${nav ? 'app-main-tabbed' : ''} ${bleed ? 'app-main-bleed' : ''}`}>
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
 * The two navigation sets v6 defines. Which one is showing depends on the
 * world, not the route — switching worlds swaps all five tabs at once.
 */
const NAV_SETS: Record<World, { to: string; key: string; icon: IconName; label: string }[]> = {
  disc: [
    { to: '/today', key: 'today', icon: 'today', label: 'navToday' },
    { to: '/planner', key: 'planner', icon: 'plan', label: 'navPlanner' },
    { to: '/habits', key: 'habits', icon: 'habits', label: 'navHabits' },
    { to: '/focus', key: 'focus', icon: 'focus', label: 'navFocus' },
    { to: '/progress', key: 'progress', icon: 'progress', label: 'navProgress' },
  ],
  fit: [
    { to: '/today', key: 'today', icon: 'today', label: 'navToday' },
    { to: '/training', key: 'train', icon: 'train', label: 'navTrain' },
    { to: '/body', key: 'body', icon: 'body', label: 'navBody' },
    { to: '/nutrition', key: 'food', icon: 'food', label: 'navFood' },
    { to: '/progress', key: 'progress', icon: 'progress', label: 'navProgress' },
  ],
};

/** v6 shows the quick-action button on these screens only. */
const FAB_ROUTES = ['/today', '/training'];

function useTabs() {
  const { world } = useWorld();
  return NAV_SETS[world];
}

/**
 * The floating bar from v6: a world switch, a more button and an optional
 * quick action on the top row, five icon-only tabs below with a pill that
 * slides to whichever is active.
 */
function BottomNav() {
  const { t } = useLanguage();
  const { world, setWorld } = useWorld();
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
          <div className="ww-world">
            {(['disc', 'fit'] as World[]).map((w) => {
              const on = world === w;
              return (
                <button
                  key={w}
                  type="button"
                  className={`ww-world-tab ${on ? 'is-on' : ''}`}
                  onClick={() => setWorld(w)}
                >
                  <span className={`ww-world-dot ${on ? (w === 'fit' ? 'is-fit' : 'is-disc') : ''}`} />
                  {t(w === 'fit' ? 'worldFitness' : 'worldDiscipline')}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="ww-nav-round"
            aria-label={t('navMore')}
            onClick={() => navigate('/more')}
          >
            <V6Icon name="more" size={19} stroke="var(--mut)" strokeWidth={1.35} />
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

function SidebarNav() {
  const { t } = useLanguage();
  const tabs = useTabs();
  return (
    <nav className="side-nav">
      <div className="side-nav-mark">WW</div>
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={({ isActive }) => `side-nav-item ${isActive ? 'side-nav-item-active' : ''}`}
        >
          <V6Icon name={tab.icon} size={22} />
          <span>{t(tab.label as never)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
