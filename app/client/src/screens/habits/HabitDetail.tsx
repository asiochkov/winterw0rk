import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Habit, HabitHistoryEntry } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, Section } from '../../components/ui';
import '../habits.css';

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [history, setHistory] = useState<HabitHistoryEntry[]>([]);

  async function load() {
    const r = await api.get<{ habit: Habit; history: HabitHistoryEntry[] }>(`/habits/${id}`);
    setHabit(r.habit);
    setHistory(r.history);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function archive() {
    await api.patch(`/habits/${id}/archive`, { archived: !habit?.archived });
    navigate('/habits');
  }

  if (!habit) return <Screen nav={false}>{null}</Screen>;

  return (
    <Screen kicker={habit.category} title={habit.name} nav={false}>
      <button className="auth-back" onClick={() => navigate('/habits')} style={{ marginBottom: 16 }}>
        ← {t('habitsTitle')}
      </button>

      <Section title={t('habitAnalysis')}>
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-n">{habit.streak}</span>
            <span className="detail-stat-l">{t('habitStreak')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{habit.best}</span>
            <span className="detail-stat-l">{t('habitBest')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{habit.rate}%</span>
            <span className="detail-stat-l">{t('habitRate')}</span>
          </div>
        </div>
      </Section>

      <Section title={t('habitHistory')}>
        {history.length === 0 ? (
          <p className="today-empty">{t('habitNoEntries')}</p>
        ) : (
          <div className="detail-history">
            {history.map((e) => (
              <div key={e.date} className="detail-history-row">
                <span className="detail-history-date">{e.date}</span>
                <span className="detail-history-value">
                  {habit.type === 'bool' ? (e.value >= 1 ? t('doneValue') : '—') : `${e.value} ${habit.unit || ''}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('habitSettings')}>
        <Button full variant="danger" onClick={archive}>
          {habit.archived ? t('habitRestore') : t('habitArchive')}
        </Button>
      </Section>
    </Screen>
  );
}
