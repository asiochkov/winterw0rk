import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Section } from '../components/ui';

const GROUPS = [
  {
    titleKey: 'moreMind',
    items: [
      { labelKey: 'moodTitle', to: '/mood' },
      { labelKey: 'focusTitle', to: '/focus' },
      { labelKey: 'focusHistoryTitle', to: '/focus/history' },
    ],
  },
  {
    titleKey: 'moreBody',
    items: [
      { labelKey: 'stepsTitle', to: '/steps' },
      { labelKey: 'bodyTitle', to: '/body' },
      { labelKey: 'nutritionTitle', to: '/nutrition' },
      { labelKey: 'streetTitle', to: '/street' },
    ],
  },
  {
    titleKey: 'moreDiscipline',
    items: [
      { labelKey: 'plannerTitle', to: '/planner' },
      { labelKey: 'programsTitle', to: '/programs' },
    ],
  },
  {
    titleKey: 'moreTraining',
    items: [{ labelKey: 'libraryTitle', to: '/training/library' }],
  },
  {
    titleKey: 'moreAccount',
    items: [
      { labelKey: 'profileTitle', to: '/profile' },
      { labelKey: 'settingsTitle', to: '/settings' },
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
              <button
                key={item.to}
                className="tr-row"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                onClick={() => navigate(item.to)}
              >
                <p className="tr-name">{t(item.labelKey)}</p>
              </button>
            ))}
          </div>
        </Section>
      ))}
    </Screen>
  );
}
