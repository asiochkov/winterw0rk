import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Habit, QuitCounter } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { ScreenHead, Segmented } from '../../components/ScreenHead';
import { ErrorState, LoadingRows } from '../../components/states';
import { useMutation } from '../../hooks/useAsyncData';
import { HabitRow } from './HabitRow';
import { CleanRuns } from '../TodayBlocks';
import '../habits.css';

type Tab = 'list' | 'quit';

/**
 * v6 puts habits and quit counters behind one segmented control on this
 * screen rather than giving quitting its own tab in the navigation.
 */
export default function HabitsList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [counters, setCounters] = useState<QuitCounter[]>([]);
  const [tab, setTab] = useState<Tab>('list');
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [h, q] = await Promise.all([
        api.get<{ habits: Habit[] }>('/habits'),
        api.get<{ counters: QuitCounter[] }>('/quit'),
      ]);
      setHabits(h.habits);
      setCounters(q.counters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load habits.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(habit: Habit) {
    const value = habit.doneToday ? 0 : 1;
    if (await mutation.run(() => api.post(`/habits/${habit.id}/complete`, { value }))) load();
  }

  async function step(habit: Habit, delta: number) {
    const value = Math.max(0, habit.todayValue + delta);
    if (await mutation.run(() => api.post(`/habits/${habit.id}/complete`, { value }))) load();
  }

  if (error) {
    return (
      <Screen nav>
        <ErrorState message={error} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }
  if (!habits) {
    return (
      <Screen nav>
        <LoadingRows rows={4} />
      </Screen>
    );
  }

  return (
    <Screen nav bleed>
      <ScreenHead chip={t('habitsConsistency')} title={t('habitsTitle')} />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'list', label: t('habitsTabList') },
          { key: 'quit', label: t('habitsTabQuit') },
        ]}
      />

      {tab === 'list' ? (
        <>
          <div className="hb-list">
            {mutation.error && <p className="inline-error">{mutation.error}</p>}
            {habits.length === 0 && <p className="today-empty">{t('habitsEmptyBody')}</p>}
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onOpen={() => navigate(`/habits/${h.id}`)}
                onToggle={() => toggle(h)}
                onStep={(d) => step(h, d)}
              />
            ))}
          </div>
          <button type="button" className="hb-add" onClick={() => navigate('/habits/new')}>
            {t('habitsAddHabit')}
          </button>
        </>
      ) : (
        <div className="hb-list">
          {counters.length === 0 ? (
            <p className="today-empty">{t('quitEmptyBody')}</p>
          ) : (
            <CleanRuns counters={counters} onOpen={(c) => navigate(`/quit/${c.id}`)} />
          )}
          <button type="button" className="hb-add" onClick={() => navigate('/quit/new')}>
            {t('quitAddCounterTitle')}
          </button>
        </div>
      )}
    </Screen>
  );
}
