import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Habit, HabitHistoryEntry } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { Button } from '../../components/ui';
import { ErrorState, LoadingRows } from '../../components/states';
import '../habits.css';

/** v6 draws eight weeks on this screen — 56 cells, seven to a row. */
const GRID_DAYS = 56;

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [history, setHistory] = useState<HabitHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api.get<{ habit: Habit; history: HabitHistoryEntry[] }>(`/habits/${id}`);
      setHabit(r.habit);
      setHistory(r.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this habit.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function archive() {
    await api.patch(`/habits/${id}/archive`, { archived: !habit?.archived });
    navigate('/habits');
  }

  if (error) {
    return (
      <Screen nav={false}>
        <ErrorState message={error} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }
  if (!habit) {
    return (
      <Screen nav={false}>
        <LoadingRows rows={3} />
      </Screen>
    );
  }

  const completed = (value: number) =>
    habit.type === 'bool' ? value >= 1 : habit.target != null ? value >= habit.target : value > 0;

  // The API returns the entries that exist, not one per day, so the calendar is
  // built from today backwards and looks each date up.
  const byDate = new Map(history.map((e) => [e.date, e]));
  const grid = Array.from({ length: GRID_DAYS }, (_, i) => {
    const date = new Date(Date.now() - (GRID_DAYS - 1 - i) * 86400000).toISOString().slice(0, 10);
    const entry = byDate.get(date);
    const dow = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
    return {
      date,
      scheduled: habit.schedule.includes(dow),
      done: entry ? completed(entry.value) : false,
    };
  });

  const freq =
    habit.schedule.length === 7 ? t('todayHabitDaily') : t('todayHabitPerWeek', { n: habit.schedule.length });

  return (
    <Screen nav={false} bleed>
      <div className="hd-hero">
        <div className="hd-hero-wash" />
        <div className="hd-hero-inner">
          <button type="button" className="hd-back" onClick={() => navigate('/habits')} aria-label={t('back')}>
            ←
          </button>
          <div>
            <div className="hd-kicker">
              {habit.category} · {freq}
            </div>
            <h1 className="hd-title">{habit.name}</h1>
          </div>
        </div>
      </div>

      <div className="hd-body">
        <div className="hd-stats">
          <div className="hd-stat is-current">
            <div className="hd-stat-label">{t('habitStreak')}</div>
            <div className="hd-stat-value">{habit.streak}</div>
          </div>
          <div className="hd-stat">
            <div className="hd-stat-label">{t('habitBest')}</div>
            <div className="hd-stat-value">{habit.best}</div>
          </div>
          <div className="hd-stat">
            <div className="hd-stat-label">{t('habitRate')}</div>
            <div className="hd-stat-value">{habit.rate}%</div>
          </div>
        </div>

        <div className="hd-section">
          <div className="hd-section-head">
            <span className="hd-section-label">{t('habitLastWeeks', { weeks: GRID_DAYS / 7 })}</span>
          </div>
          <div className="hd-grid">
            {grid.map((c) => (
              <div
                key={c.date}
                className={`hd-cell ${!c.scheduled ? 'is-off' : c.done ? 'is-done' : 'is-miss'}`}
                title={c.date}
              />
            ))}
          </div>
        </div>

        <div className="hd-section">
          <div className="hd-section-head">
            <span className="hd-section-label">{t('habitHistory')}</span>
          </div>
          {history.length === 0 ? (
            <p className="today-empty">{t('habitNoEntries')}</p>
          ) : (
            <div className="detail-history">
              {history.slice(0, 14).map((e) => (
                <div key={e.date} className="detail-history-row">
                  <span className="detail-history-date">{e.date}</span>
                  <span className="detail-history-value">
                    {habit.type === 'bool'
                      ? e.value >= 1
                        ? t('doneValue')
                        : '—'
                      : `${e.value} ${habit.unit || ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hd-section">
          <Button full variant="danger" onClick={archive}>
            {habit.archived ? t('habitRestore') : t('habitArchive')}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
