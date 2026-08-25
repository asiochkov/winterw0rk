import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Habit } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button, EmptyState } from '../../components/ui';
import '../habits.css';

export default function HabitsList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [habits, setHabits] = useState<Habit[] | null>(null);

  useEffect(() => {
    api.get<{ habits: Habit[] }>('/habits').then((r) => setHabits(r.habits));
  }, []);

  if (!habits) return <Screen title={t('habitsTitle')} nav>{null}</Screen>;

  return (
    <Screen title={t('habitsTitle')} kicker={t('habitsActiveCount', { n: habits.length })} nav>
      {habits.length === 0 ? (
        <EmptyState
          title={t('habitsEmptyTitle')}
          body={t('habitsEmptyBody')}
          action={
            <Button onClick={() => navigate('/habits/new')} full>
              {t('habitsAddHabit')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="habit-cards">
            {habits.map((h) => (
              <button key={h.id} className="habit-card" onClick={() => navigate(`/habits/${h.id}`)}>
                <div className="habit-card-top">
                  <div>
                    <p className="habit-card-name">{h.name}</p>
                    <p className="habit-card-cat">{h.category}</p>
                  </div>
                  <div className="habit-card-streak">
                    <span className="habit-card-streak-n">{h.streak}</span>
                    <span className="habit-card-streak-l">{t('habitStreak').toUpperCase()}</span>
                  </div>
                </div>
                <div className="habit-week-strip">
                  {h.week.map((d) => (
                    <span
                      key={d.date}
                      className={`habit-week-dot ${!d.scheduled ? 'habit-week-off' : d.done ? 'habit-week-on' : 'habit-week-miss'}`}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
          <Button full variant="secondary" onClick={() => navigate('/habits/new')} style={{ marginTop: 24 }}>
            {t('habitsAddHabit')}
          </Button>
        </>
      )}
    </Screen>
  );
}
