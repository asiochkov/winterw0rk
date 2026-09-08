import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Section } from '../components/ui';
import { V6Icon } from '../components/V6Icon';
import './more.css';

/**
 * More, as thematic hubs with an icon each.
 *
 * It was a flat list of twelve text rows in five groups, with no icons at all
 * — and it duplicated about seventy per cent of the links Profile also
 * carried, so the same destination was reachable by two unrelated menus. It
 * also listed Planner, which was simultaneously a primary tab, so one world
 * reached it two ways and the other only one.
 *
 * Now that the navigation is one set of five, this is where everything else
 * lives, and it is the only place that lists it.
 */
const GROUPS = [
  {
    titleKey: 'moreMind',
    items: [
      { labelKey: 'moodTitle', to: '/mood', icon: 'people' },
      { labelKey: 'focusHistoryTitle', to: '/focus/history', icon: 'time' },
    ],
  },
  {
    titleKey: 'moreBody',
    items: [
      { labelKey: 'bodyTitle', to: '/body', icon: 'body' },
      { labelKey: 'nutritionTitle', to: '/nutrition', icon: 'food' },
      { labelKey: 'stepsTitle', to: '/steps', icon: 'street' },
      { labelKey: 'streetTitle', to: '/street', icon: 'street' },
    ],
  },
  {
    titleKey: 'morePlan',
    items: [
      { labelKey: 'plannerTitle', to: '/planner', icon: 'plan' },
      { labelKey: 'programsTitle', to: '/programs', icon: 'disc' },
      { labelKey: 'libraryTitle', to: '/training/library', icon: 'gym' },
    ],
  },
  {
    titleKey: 'moreAccount',
    items: [
      { labelKey: 'reportTitle', to: '/report', icon: 'progress' },
      { labelKey: 'profileTitle', to: '/profile', icon: 'people' },
      { labelKey: 'settingsTitle', to: '/settings', icon: 'wheel' },
    ],
  },
] as const;

export default function More() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Screen title={t('moreTitle')} nav>
      {GROUPS.map((g) => (
        <Section title={t(g.titleKey)} key={g.titleKey}>
          <div className="tr-list">
            {g.items.map((item) => (
              <button key={item.to} type="button" className="more-row" onClick={() => navigate(item.to)}>
                <span className="more-row-icon" aria-hidden="true">
                  <V6Icon name={item.icon} size={19} stroke="var(--mut)" strokeWidth={1.35} />
                </span>
                <span className="more-row-name">{t(item.labelKey)}</span>
                <span className="more-row-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
          </div>
        </Section>
      ))}
    </Screen>
  );
}
