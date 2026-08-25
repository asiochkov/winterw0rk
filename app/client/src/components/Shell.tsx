import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { HabitsIcon, MoreIcon, QuitIcon, TodayIcon, TrainIcon } from './icons';
import './Shell.css';

export function Screen({
  title,
  kicker,
  children,
  nav = true,
  rail,
}: {
  title?: string;
  kicker?: string;
  children: ReactNode;
  nav?: boolean;
  /** Optional secondary content shown as a right-hand rail on desktop only. */
  rail?: ReactNode;
}) {
  return (
    <div className="app-shell">
      {nav && <SidebarNav />}
      <div className={`app-body ${nav ? 'app-body-with-sidebar' : ''}`}>
        <div className={`app-content ${rail ? 'app-content-with-rail' : ''}`}>
          <main className={`app-main ${nav ? 'app-main-tabbed' : ''}`}>
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

function useTabs() {
  const { t } = useLanguage();
  return [
    { to: '/today', label: t('navToday'), Icon: TodayIcon },
    { to: '/habits', label: t('navHabits'), Icon: HabitsIcon },
    { to: '/quit', label: t('navQuit'), Icon: QuitIcon },
    { to: '/training', label: t('navTrain'), Icon: TrainIcon },
    { to: '/more', label: t('navMore'), Icon: MoreIcon },
  ];
}

function BottomNav() {
  const tabs = useTabs();
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
          <tab.Icon className="nav-icon" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarNav() {
  const tabs = useTabs();
  return (
    <nav className="side-nav">
      <div className="side-nav-mark">WW</div>
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `side-nav-item ${isActive ? 'side-nav-item-active' : ''}`}>
          <tab.Icon className="nav-icon" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
