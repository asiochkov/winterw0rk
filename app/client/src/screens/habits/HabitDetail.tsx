import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBack } from '../../hooks/useBack';
import { categoryLabel, HABIT_CATEGORIES } from '../../lib/habitCategories';
import { api, ApiError } from '../../api/client';
import type { Habit, HabitHistoryEntry } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { Screen } from '../../components/Shell';
import { FullBleedHero } from '../../components/Hero';
import { Button, Field, Input } from '../../components/ui';
import { useMutation } from '../../hooks/useAsyncData';
import { ErrorState, LoadingRows } from '../../components/states';
import '../habits.css';

/** v6 draws eight weeks on this screen — 56 cells, seven to a row. */
const GRID_DAYS = 56;

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const back = useBack('/habits');
  const { t } = useLanguage();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [history, setHistory] = useState<HabitHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftSchedule, setDraftSchedule] = useState<number[]>([]);
  const edit = useMutation();

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api.get<{ habit: Habit; history: HabitHistoryEntry[] }>(`/habits/${id}`);
      setHabit(r.habit);
      setHistory(r.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const DAYS = [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')];

  function openEditor(h: Habit) {
    setDraftName(h.name);
    setDraftCategory(h.category);
    setDraftSchedule(h.schedule);
    setEditing(true);
  }

  function toggleDraftDay(i: number) {
    setDraftSchedule((days) => (days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort()));
  }

  async function saveEdit() {
    const ok = await edit.run(
      () =>
        api.patch(`/habits/${id}`, {
          name: draftName.trim(),
          category: draftCategory,
          schedule: draftSchedule,
        }),
      { success: t('habitSaved') }
    );
    if (ok) {
      setEditing(false);
      load();
    }
  }

  async function archive() {
    await api.patch(`/habits/${id}/archive`, { archived: !habit?.archived });
    navigate('/habits');
  }

  if (error) {
    return (
      <Screen nav={false} back={back}>
        <ErrorState message={error} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }
  if (!habit) {
    return (
      <Screen nav={false} back={back}>
        <LoadingRows rows={3} />
      </Screen>
    );
  }

  const completed = (value: number) =>
    habit.type === 'bool' ? value >= 1 : habit.target != null ? value >= habit.target : value > 0;

  // The API returns the entries that exist, not one per day, so the calendar is
  // built from today backwards and looks each date up.
  const byDate = new Map(history.map((e) => [e.date, e]));
  const forgivenDays = new Set(habit.forgiven);
  const grid = Array.from({ length: GRID_DAYS }, (_, i) => {
    const date = new Date(Date.now() - (GRID_DAYS - 1 - i) * 86400000).toISOString().slice(0, 10);
    const entry = byDate.get(date);
    const dow = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
    return {
      date,
      scheduled: habit.schedule.includes(dow),
      done: entry ? completed(entry.value) : false,
      forgiven: forgivenDays.has(date),
    };
  });

  const freq =
    habit.schedule.length === 7 ? t('todayHabitDaily') : t('todayHabitPerWeek', { n: habit.schedule.length });

  return (
    <Screen nav={false} bleed back="self">
      <FullBleedHero height={300} washX="80%" washY="10%" onBack={back}>
        <div>
          <div className="hd-kicker">
            {categoryLabel(habit.category, t)} · {freq}
          </div>
          <h1 className="hd-title">{habit.name}</h1>
        </div>
      </FullBleedHero>

      <div className="hd-body">
        <div className="hd-stats">
          <div className="hd-stat is-current">
            <div className="hd-stat-label">{t('habitStreak')}</div>
            <div className="hd-stat-value">{habit.streak}</div>
            {habit.streak === 0 && habit.best > 0 && (
              <div className="hd-stat-note">{t('habitComeback', { n: habit.best })}</div>
            )}
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
                className={`hd-cell ${!c.scheduled ? 'is-off' : c.done ? 'is-done' : c.forgiven ? 'is-grace' : 'is-miss'}`}
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

        {/* v7 titles this group rather than leaving a bare destructive button
            at the foot of the screen. */}
        <div className="hd-settings-label">{t('habitSettings')}</div>
        <div className="hd-settings">
          {/* Until now the only thing that could be done to a habit was to
              archive it, so a schedule set wrong at onboarding cost the whole
              streak to correct. Editing keeps the marks. */}
          {editing ? (
            <div className="form-stack">
              <Field label={t('nameFieldLabel')}>
                <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              </Field>
              <Field label={t('categoryLabel')}>
                <select
                  className="ww-select"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                >
                  {HABIT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {t(c.labelKey)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('daysLabel')}>
                <div className="day-row">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`day-btn ${draftSchedule.includes(i) ? 'day-btn-on' : ''}`}
                      onClick={() => toggleDraftDay(i)}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </Field>
              <Button
                full
                disabled={!draftName.trim() || draftSchedule.length === 0 || edit.busy}
                onClick={saveEdit}
              >
                {edit.busy ? t('savingBtn') : t('save')}
              </Button>
              <Button full variant="ghost" onClick={() => setEditing(false)}>
                {t('cancel')}
              </Button>
            </div>
          ) : (
            <>
              <Button full variant="secondary" onClick={() => openEditor(habit)}>
                {t('habitEdit')}
              </Button>
              <Button full variant="danger" onClick={archive}>
                {habit.archived ? t('habitRestore') : t('habitArchive')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}
